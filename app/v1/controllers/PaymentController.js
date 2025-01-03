import  CommonFunction from "../../../helper/common.js";
import paymentService from '../models/payment.js';
import stripe from "../../../helper/stripe.js";
import moment from 'moment';

import dotenv from 'dotenv';
dotenv.config();

const apiversion = process.env.STRIPE_API_VERSION;

const PaymentForBooking = async (req, res) => {
  const data = req.body;
  const customer_id = CommonFunction.getCustomerId(req, res);

  // REQUIRED FIELDS //
  if (!data.total_cost) return res.status(400).json(CommonFunction.errMessage("Amount is required"));
  if (!data.client_id) return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
  if (!data.items) return res.status(400).json(CommonFunction.errMessage("Items are required"));
  if (!data.booking_date) return res.status(400).json(CommonFunction.errMessage("Booking date is required"));

  // Sanitize input
  data.total_cost = String(data.total_cost).trim();
  data.client_id = String(data.client_id).trim();
  data.booking_date = String(data.booking_date).trim();

  // CHECK FOR MULTIPLE BOOKINGS WITHIN A MINUTE //
  const continueBooking = await paymentService.checkBookingThrottle(customer_id);
  if (!continueBooking) return res.status(400).json(CommonFunction.errMessage("Multiple bookings detected within a minute."));

  // Get Stripe credentials
  const clientInfo = await paymentService.getClientInfo(data.client_id);

  const amount = Math.round(data.total_cost * 100);
  const connectedAccount = clientInfo.stripe_account_id;

  let bkId;
  if (data.booking_id) {
    bkId = data.booking_id;
    const bookingDetail = await paymentService.getBookingDetail(bkId);
    try {
      const paymentStatus = await stripe.paymentIntents.retrieve(bookingDetail.payment_id, { stripeAccount: connectedAccount });
      if (paymentStatus.status === 'succeeded') {
        const dt ={booking_id: bkId};
        return res.status(200).json(CommonFunction.succsMessage("The payment has already been made.",dt));
      } else {
        await paymentService.deleteBookingItems(bkId);
        await paymentService.deleteBookingPayments(bkId);
      }
    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
    }
  } else {
    // Generate draft booking ID
    bkId = await paymentService.generateBookingId(data.client_id);
  }

  // Create new reservation
  const endpoint = '/capacity-reservation';
  const timestamp = new Date(data.booking_date + ' ' + new Date().toLocaleTimeString()).getTime();
  const bookingDate = new Date(timestamp).toISOString().split('T')[0];

  const items = data.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    bookingDate: bookingDate,
    startTime: item.startTime,
    priceOverride: item.priceOverride,
    packageProductId: item.packageProductId !== "0" ? item.packageProductId : undefined,
  }));

  const rollerResponse ={};

  if (rollerResponse.errors) {
    return res.status(500).send(`Capacity Reservation Error: ${JSON.stringify(rollerResponse.errors)}`);
  } else if (rollerResponse) {
    // Get customer information
    const customerData = await paymentService.getCustomerData(customer_id, data.client_id);
    // Create Stripe customer if not exists
    let customerKey;
    if (customerData.stripe_customer_id) {
      customerKey = customerData.stripe_customer_id;
    } else {
      try {
        const customer = await stripe.customers.create({
          name: `${customerData.fname} ${customerData.lname}`,
          email: customerData.email,
        }, { stripeAccount: connectedAccount });
        customerKey = customer.id;
        await paymentService.insertDetails(customer_id,customerKey,data.client_id);
      } catch (error) {
        return res.status(500).json(CommonFunction.errMessage(error.message));
      }
    }
    // Create ephemeral key
    let ephemeralKey;
    try {
      ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerKey }, { apiVersion: apiversion, stripeAccount: connectedAccount });
    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage(error.message));
    }

    // Create payment intent
    try {
      const transactionFee = await paymentService.getTransactionFee();
      const createIntent = {
        amount: amount,
        currency: 'usd',
        customer: customerKey,
        automatic_payment_methods: { enabled: true },
        description: bkId,
      };

      if (transactionFee.fee > 0) {
        createIntent.application_fee_amount = transactionFee.fee * 100;
      }
      const pi = await stripe.paymentIntents.create(createIntent, { stripeAccount: connectedAccount });

      const piArray = {
        paymentIntent: pi.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerKey,
        publishableKey: process.env.STRIPE_SECRET_KEY, // replace with your publishable key
        clientSecret: process.env.STRIPE_PUBLISHER_KEY, // replace with your secret key
        expressAccount: connectedAccount,
        bookingref: bkId,
      };

      if (data.booking_id) {
        // Update booking
        const updates = {
          capacity_reservation_id: rollerResponse.uniqueId,
          payment_id: pi.id,
          total_cost: data.total_cost,
          total_quantity: data.total_quantity,
          total_discount: data.total_discount,
          total_tax: data.total_tax,
          booking_date: data.booking_date,
        };
        await paymentService.updateBooking(updates, { booking_id: bkId });
        await paymentService.createBookingItems(bkId, data);
        await paymentService.createBookingPayment(bkId, data);
      } else {
        // Create new booking
        data.capacity_reservation_id = rollerResponse.uniqueId;
        data.payment_id = pi.id;
        data.type = 'CreditCard';
        data.amount = amount;
        data.fee = pi.application_fee_amount / 100;
        data.customer_id = customer_id;
        data.booking_id = bkId;

        await paymentService.createBooking(data, customerData);
      }

      return res.status(200).json(CommonFunction.succsMessage('success',piArray));

    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage(error.message));
    }
  }
}

// Membership booking
const MembershipBooking = async (req, res) => {
  const data = req.body;
  const customer_id = CommonFunction.getCustomerId(req, res);
  // REQUIRED FIELDS
  if (!data.total_cost) return res.status(400).json(CommonFunction.errMessage('Amount is required'));
  if (!data.client_id) return res.status(400).json(CommonFunction.errMessage('Client ID is required'));
  if (!data.items) return res.status(400).json(CommonFunction.errMessage('Items are required'));
  if (!data.booking_date) return res.status(400).json(CommonFunction.errMessage('Booking date is required'));

  // Sanitize input
  data.total_cost = String(data.total_cost).trim();
  data.client_id = String(data.client_id).trim();
  data.booking_date = String(data.booking_date).trim();

  // CHECK FOR MULTIPLE BOOKINGS WITHIN A MINUTE
  const continueBooking = await paymentService.checkBookingThrottle(customer_id);
  if (!continueBooking) return res.status(400).json(CommonFunction.errMessage('Multiple bookings detected within a minute.'));

  // Get Stripe credentials
  const clientInfo = await paymentService.getClientInfo(data.client_id);
  const amount = Math.round(data.total_cost * 100);
  const connectedAccount = clientInfo.stripe_account_id;

  // VALIDATE BOOKING DATE
  const currentDate = new Date();
  if (currentDate > data.booking_date) {
    return res.status(400).json(CommonFunction.errMessage('Booking date must be a future date.'));
  }
  const timeformat = moment(data.booking_date).set({
    hour: moment().hour(),
    minute: moment().minute(),
    second: moment().second()
  });
  data.booking_date = timeformat.format('YYYY-MM-DD');

  // FETCH / CREATE CUSTOMER FOR CONNECTED ACCOUNT
  const customerData = await paymentService.getCustomerData(customer_id, data.client_id);
  let customerKey = customerData.stripe_customer_id;

  if (!customerKey) {
    try {
      const customer = await stripe.customers.create({
        name: `${customerData.fname} ${customerData.lname}`,
        email: CommonFunction.decrypt(customerData.email),
      }, { stripeAccount: connectedAccount });
      customerKey = customer.id;
      await paymentService.insertDetails(customer_id, customerKey, data.client_id);
    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage(error.message));
    }
  }

  // CHECK FOR MEMBERSHIP PLAN
  let fl = false;
  for (const item of data.items) {
    const product = await paymentService.getProduct(item?.productId, data.client_id);
    if (product?.name.includes('pass')) {
      fl = true;
      break;
    }
  }

  // CREATE SUBSCRIPTION FOR THE MEMBERSHIP PLAN
  let bkId = await paymentService.generateBookingId(data.client_id);
  let ephemeralKey, paymentIntent;

  if (fl) {
    try {
      ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerKey },
        { apiVersion: apiversion, stripeAccount: connectedAccount }
      );
      const createIntent = {
        amount,
        currency: 'usd',
        customer: customerKey,
        automatic_payment_methods: { enabled: true },
        description: bkId,
      };

      paymentIntent = await stripe.paymentIntents.create(createIntent, { stripeAccount: connectedAccount });
      data.capacity_reservation_id = paymentIntent.id;
      data.payment_id = paymentIntent.id;
      data.type = 'CreditCard';
      data.amount = amount / 100;
      data.fee = paymentIntent.application_fee_amount / 100;
      data.customer_id = customer_id;
      data.booking_id = bkId;

      const booking = await paymentService.createBooking(data, customerData);
      if (booking) {
        return res.status(200).send({
          message: 'success',
          data: {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerKey,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            clientSecret: process.env.STRIPE_SECRET_KEY,
            expressAccount: connectedAccount,
            bookingref: bkId,
            isPaymentRequired: true,
          }
        });
      } else {
        return res.status(400).json(CommonFunction.errMessage('Booking Error: There is some issue while creating your order.'));
      }
    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage(error.message));
    }
  } else {
    data.capacity_reservation_id = "";
    data.payment_id = "";
    data.type = 'CreditCard';
    data.amount = amount / 100;
    data.fee = 0;
    data.customer_id = customer_id;
    data.booking_id = bkId;

    const booking = await paymentService.createBooking(data, customerData);
    if (booking) {
      return res.status(200).send({
        status: 'success',
        message: 'success',
        data: {
          paymentIntent: 'No payment intent required',
          ephemeralKey: '',
          customer: customerKey,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          clientSecret: process.env.STRIPE_SECRET_KEY,
          expressAccount: connectedAccount,
          bookingref: bkId,
          isPaymentRequired: false,
        }
      });
    } else {
      return res.status(400).json(CommonFunction.errMessage('Booking Error: There is some issue while creating your order.'));
    }
  }
};

// Restaurent Order Payment Api
// API endpoint to handle order creation
const PaymentForRestaurentOrders = async (req, res) => {
  const data = req.body;

  // REQUIRED FIELDS
  if (!data.client_id) return res.status(400).json(CommonFunction.errMessage('Client ID is required.'));
  if (!data.items || !data.items.length) return res.status(400).json(CommonFunction.errMessage('Items are required.'));
  if (!data.booking_date) return res.status(400).json(CommonFunction.errMessage('Booking date is required.'));

  const customer_id = CommonFunction.getCustomerId(req,res);

  data.client_id = data.client_id;
  data.order_date = data.booking_date;

  let ord_id;
  let orderDetail;
  
  try {
    if (data.order_id) {
      ord_id = data.order_id;
      orderDetail = await paymentService.getOrderDetail(ord_id);
      await paymentService.deleteOrderItems(ord_id); // DELETE ITEMS IF ALREADY EXISTS
    } else {
      ord_id = paymentService.generateOrderId(data.client_id);
    }

    const clientDt = await paymentService.getClientInfo(data.client_id, 'stripe_account_id');
    const amount = Math.round(data.total_cost * 100);
    const connectedAccount = clientDt.stripe_account_id;

    const customerDt = await paymentService.getCustomerData(customer_id,data.client_id);

    let customerKey;
    if (customerDt.stripe_customer_id) {
      customerKey = customerDt.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        name: `${customerDt.fname} ${customerDt.lname}`,
        email: CommonFunction.decrypt(customerDt.email)
      }, { stripeAccount: connectedAccount });
      customerKey = customer.id;
      await paymentService.insertDetails(customer_id, customerKey, data.client_id);
    }

    const ephemeralKey = await stripe.ephemeralKeys.create({
      customer: customerKey
    }, {
      apiVersion: apiversion,
      stripeAccount: connectedAccount
    });
    let orderDetail;
    if (data.order_id) {
      orderDetail = await paymentService.createOrderItems(ord_id, data.items);
    } else {
      data.order_id = ord_id;
      orderDetail = await paymentService.createOrder(data, customerDt);
    }
    const transactionFee = await paymentService.getTransactionFee();
    const createIntent = {
      currency: 'usd',
      customer: customerKey,
      automatic_payment_methods: { enabled: true },
      description: ord_id
    };

    

    if (transactionFee.fee > 0) {
      createIntent.application_fee_amount = Math.round(transactionFee.fee * 100);
      orderDetail.total_cost += transactionFee.fee;
      createIntent.amount = Math.round(orderDetail.total_cost * 100);
    }

    const paymentIntent = await stripe.paymentIntents.create(createIntent, { stripeAccount: connectedAccount });
    await paymentService.updateOrder({
      payment_id: paymentIntent.id,
      payment_type: 'CreditCard',
      payment_amount: createIntent.amount,
      payment_fee: createIntent.application_fee_amount,
      total_cost:(createIntent.amount/100)
    }, { order_id: ord_id });

    const response = {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerKey,
      publishableKey: process.env.STRIPE_PUBLISHER_KEY,
      clientSecret: process.env.STRIPE_SECRET_KEY,
      expressAccount: connectedAccount,
      bookingref: ord_id
    };

    return res.status(200).json(CommonFunction.succsMessage('success',response));
  } catch (error) {
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
}

const getPaymentIntent = async (payment_id, connectedAccount) => {

  try {
    const paymentStatus = await stripe.paymentIntents.retrieve(payment_id, { stripeAccount: connectedAccount });
    return paymentStatus;
  } catch (error) {
    console.log('error in getPaymentIntent',error);
    return {error};
  }
}

const PaymentForBookingTemClose = async (req, res) => {
  return res.status(400).json(CommonFunction.errMessage('Please upgrade the Sky Zone app to continue with your purchases.'));
}

export {
  PaymentForBooking,
  MembershipBooking,
  PaymentForRestaurentOrders,
  getPaymentIntent,
  PaymentForBookingTemClose
}