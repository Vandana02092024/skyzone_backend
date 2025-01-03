import CommonFunction from "../../../helper/common.js";
import { ResolveBooking } from "../controllers/BookingController.js";
import { getPaymentIntent } from "../controllers/PaymentController.js";
import cronService from "../models/crons.js";
import { Sequelize, Op } from "sequelize";
import s3 from "../../../helper/aws.js";
import QRCode from "qrcode";
import rollerUtils from "../../../helper/roller.js";
import moment from "moment";
import firebaseService from "../models/firebase.js";
import {
    RollerAvailableProducts,
    Customers,
    Discounts,
    DiscountProducts,
    DiscountCodes,
    BookingItems,
    BookingItemMetas,
    BookingItemDiscounts,
    BookingItemModifiers,
    RestProductParent,
    RestProducts,
    RestProductLocations,
    RestProductLocationtimes,
    RestProductPackageItem,
    RestProductAddons,
    RestProductRestrictedaddons,
    RestProductStockperiods,
    RestProductModifiers,
    RestProductModifiergroups,
    RestProductGiftcard,
    RestProductAgreement,
    ClientMaster,
    MobileCustomers,
    PushNotifications,
    SignedWaiver,
    Ticket,
    TicketDiscounts,
    RestaurantPopularItems,
    MobileCustomerDeviceIds,
    MobileCustomerMemberships,
    MobileCustomerChildMemberships,
    MobileRolleCustomerMapping,
    PushNotificationLogs
} from "../../../config/tables.js";

const AvailableProducts = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        for (let client of activeClients) {
            const location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);

            // FIND AVAILABILITY FOR LAST 7 DAYS
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
                const endpoint = `/product-availability?date=${formattedDate}`;

                const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

                for (let response of responses) {
                    if (!response.products || response.products.length === 0) {
                        continue;
                    }

                    let onlineSalesOpen = null;
                    if (response.availabilities && response.availabilities[0]?.onlineSalesOpen) {
                        onlineSalesOpen = response.availabilities[0].onlineSalesOpen;
                    }

                    const id = `${response.parentProductId}-${response.id}-${response.type}-${location}`;

                    // UPSERT (INSERT OR UPDATE) RECORD IN roller_available_products TABLE
                    await RollerAvailableProducts.upsert({
                        id: id,
                        parent_id: response.parentProductId,
                        product_id: response.id,
                        type: response.type,
                        client_id: location,
                        availability_date: formattedDate,
                        onlineSalesOpen: onlineSalesOpen,
                    });
                }
            }
        }

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error fetching and processing availability:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const InsertCustomers = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        activeClients.map(async (client) => {
            const location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);
            const inc = req.query.inc ? parseInt(req.query.inc) : 0;
            const currentDate = new Date();
            const endDate = new Date(currentDate.setDate(currentDate.getDate() - inc)).toISOString().split("T")[0];
            const startDate = new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1)).toISOString().split("T")[0];

            const endpoint = `/data/customers?pageSize=500&pageNumber=1&startDate=${startDate}&endDate=${endDate}`;
            const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                let customers = responses.items;
                const totalPages = responses.totalPages;

                for (let i = 0; i <= totalPages; i++) {
                    if (i > 1) {
                        const endpoint = `/data/customers?pageSize=500&pageNumber=${i}&startDate=${startDate}&endDate=${endDate}`;
                        const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);
                        customers = responses.items;
                    }
                    for (let customer of customers) {
                        const exCustomer = await Customers.findOne({
                            attributes: ["customerId"],
                            where: {
                                customerId: customer.customerId,
                                client_id: location,
                            },
                        });
                        if (exCustomer) {
                            await Customers.destroy({
                                where: {
                                    customerId: customer.customerId,
                                    client_id: location,
                                },
                            });
                        }
                        // UPSERT (INSERT OR UPDATE) RECORD IN roller_available_products TABLE
                        await Customers.create({
                            customerId: customer.customerId,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                            email: CommonFunction.encrypt(customer.email),
                            contactNumber: CommonFunction.encrypt(customer.contactNumber),
                            dateOfBirth: customer.dateOfBirth,
                            acceptMarketing: customer.acceptMarketing,
                            createdDate: customer.createdDate,
                            modifiedDate: customer.modifiedDate,
                            country: customer.country,
                            client_id: location,
                        });
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error fetching and processing availability:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const InsertDiscounts = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        activeClients.map(async (client) => {
            const location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);

            const endpoint = `/data/discounts?pageNumber=1`;
            const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                let discounts = responses.items;
                const totalPages = responses.totalPages;
                let startDate;
                let endDate;

                for (let i = 0; i <= totalPages; i++) {
                    if (i > 1) {
                        const endpoint = `/data/discounts?pageSize=500&pageNumber=${i}&startDate=${startDate}&endDate=${endDate}`;
                        const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);
                        discounts = responses.items;
                        if (!responses) {
                            continue;
                        }
                    }
                    for (let discount of discounts) {
                        const exDiscount = await Discounts.findOne({
                            attributes: ["discountId"],
                            where: {
                                discountId: discount.discountId,
                                client_id: location,
                            },
                        });
                        if (exDiscount) {
                            await Discounts.destroy({
                                where: {
                                    discountId: discount.discountId,
                                    client_id: location,
                                },
                            });
                        }

                        startDate = discount.startDate ? moment(discount.startDate).format("YYYY-MM-DD HH:mm:ss") : "";
                        endDate = discount.endDate ? moment(discount.endDate).format("YYYY-MM-DD HH:mm:ss") : "";

                        // Prepare the data object
                        let discountData = {
                            discountId: discount.discountId,
                            name: discount.name,
                            codeGenerationMode: discount?.codeGenerationMode,
                            percentOff: discount?.percentOff,
                            isSingleUseCode: discount?.isSingleUseCode,
                            amountOff: discount?.amountOff,
                            maxApplicableAmount: discount?.maxApplicableAmount,
                            startDate: startDate,
                            endDate: endDate,
                            client_id: location, // Assuming location is already defined
                        };

                        // Conditionally add fields
                        if (discount?.usageLimits && discount?.usageLimits?.numberOfUses !== undefined) {
                            discountData.usageLimitNumber = discount?.usageLimits?.numberOfUses;
                        }

                        if (discount?.usageLimits && discount?.usageLimits?.type !== undefined) {
                            discountData.usageLimitType = discount?.usageLimits?.type;
                        }

                        if (discount?.BookingDateRestrictions && discount?.BookingDateRestrictions?.dateRange !== undefined && discount?.BookingDateRestrictions?.dateRange?.startDate !== undefined) {
                            discountData.bookingRestrictionsStartDate = moment(discount?.BookingDateRestrictions?.dateRange?.startDate).format("YYYY-MM-DD");
                        }

                        if (discount?.BookingDateRestrictions && discount?.BookingDateRestrictions?.dateRange !== undefined && discount?.BookingDateRestrictions?.dateRange?.endtDate !== undefined) {
                            discountData.bookingRestrictionsEndDate = moment(discount?.BookingDateRestrictions?.dateRange?.endtDate).format("YYYY-MM-DD");
                        }

                        if (discount?.BookingDateRestrictions && discount?.BookingDateRestrictions?.dateRange !== undefined && discount?.BookingDateRestrictions?.dateRange?.days !== undefined) {
                            discountData.bookingRestrictionsDaysNum = discount?.BookingDateRestrictions?.dateRange?.days;
                        }

                        if (discount?.BookingDateRestrictions && discount?.BookingDateRestrictions?.from !== undefined && discount?.BookingDateRestrictions?.from?.number !== undefined) {
                            discountData.bookingRestrictionsDateNum = discount?.BookingDateRestrictions?.from?.number;
                        }

                        if (discount?.BookingDateRestrictions && discount?.BookingDateRestrictions?.from !== undefined && discount?.BookingDateRestrictions?.from?.type !== undefined) {
                            discountData.bookingRestrictionsType = discount?.BookingDateRestrictions?.from?.type;
                        }

                        if (discount?.BookingRule && discount?.BookingRule?.numberOfUses !== undefined) {
                            discountData.bookingRuleNumber = discount?.BookingRule?.numberOfUses;
                        }

                        if (discount?.BookingRule && discount?.BookingRule?.type !== undefined) {
                            discountData.bookingRuleType = discount?.BookingRule?.type;
                        }

                        const newDiscount = await Discounts.create(discountData);
                        const discount_id = newDiscount.discountId;

                        if (discount?.productIds !== undefined && discount?.productIds?.length > 0 && discount_id) {
                            discount?.productIds.map(async (productId) => {
                                await DiscountProducts.create({
                                    discountId: discount_id,
                                    productId: productId,
                                    client_id: location,
                                });
                            });
                        }

                        if (discount?.codes !== undefined && discount?.codes?.length > 0 && discount_id) {
                            discount?.codes.map(async (codes) => {
                                await DiscountCodes.create({
                                    discountId: discount_id,
                                    code: codes,
                                    client_id: location,
                                });
                            });
                        }
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error fetching and processing availability:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const getBookingByLocation = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        activeClients.map(async (client) => {
            let location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);
            const inc = req.query.inc ? parseInt(req.query.inc) : 0;
            const currentDate = new Date();
            const endDate = new Date(currentDate.setDate(currentDate.getDate() - inc)).toISOString().split("T")[0];
            const startDate = new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1)).toISOString().split("T")[0];

            let endpoint = `/data/bookingitems?pageSize=500&pageNumber=1&startDate=${startDate}&endDate=${endDate}`;
            let responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                let bookingitems = responses.items;
                const totalPages = responses.totalPages;

                for (let i = 0; i <= totalPages; i++) {
                    if (i > 1) {
                        endpoint = `/data/bookingitems?pageSize=500&pageNumber=${i}&startDate=${startDate}&endDate=${endDate}`;
                        responses = await rollerUtils.getRequest(endpoint, roller.accessToken);
                        bookingitems = responses.items;
                    }
                    for (let item of bookingitems) {
                        const exTicket = await BookingItems.findOne({
                            attributes: ["bookingItemId"],
                            where: {
                                bookingItemId: item.bookingItemId,
                                client_id: location,
                            },
                        });
                        if (exTicket) {
                            await BookingItems.destroy({
                                where: {
                                    bookingItemId: item.bookingItemId,
                                    client_id: location,
                                },
                            });
                        }

                        // Prepare the data object
                        let bookingData = {
                            bookingReference: item.bookingReference,
                            bookingItemId: item.bookingItemId,
                            bookingCustomerId: item.bookingCustomerId,
                            bookingDate: item.bookingDate,
                            bookingStatus: item.bookingStatus,
                            bookingLocation: item.bookingLocation,
                            productId: item.productId,
                            bookingNotes: item.bookingNotes,
                            quantity: item.quantity,
                            groupSize: item.groupSize,
                            createdDate: item.createdDate,
                            bookingCreatedDate: item.bookingCreatedDate,
                            bookingModifiedDate: item.bookingModifiedDate,
                            bookingCreatedByStaffId: item.bookingCreatedByStaffId,
                            discountAmount: item.discountAmount,
                            cost: item.cost,
                            sessionStart: item.sessionStart,
                            sessionEnd: item.sessionEnd,
                            deviceId: item.deviceId,
                            client_id: location,
                        };

                        const newBooking = await BookingItems.create(bookingData);
                        const booking_item_id = newBooking.bookingItemId;

                        if (item?.meta !== undefined && item?.meta?.length > 0 && booking_item_id) {
                            item?.meta.map(async (mdata) => {
                                await BookingItemMetas.create({
                                    bookingItemId: booking_item_id,
                                    attribute: mdata.attribute,
                                    value: mdata.value,
                                    client_id: location,
                                });
                            });
                        }

                        if (item?.bookingDiscountIds !== undefined && item?.bookingDiscountIds?.length > 0 && booking_item_id) {
                            item?.bookingDiscountIds.map(async (bookingDiscountId, index) => {
                                await BookingItemDiscounts.create({
                                    bookingItemId: booking_item_id,
                                    bookingDiscountId: bookingDiscountId,
                                    bookingDiscountCode: item.bookingDiscountCodes[index],
                                    client_id: location,
                                });
                            });
                        }

                        if (item?.modifiers !== undefined && item?.modifiers?.length > 0 && booking_item_id) {
                            item?.modifiers.map(async (modify, index) => {
                                await BookingItemModifiers.create({
                                    bookingItemId: booking_item_id,
                                    modifierId: modify.modifierId,
                                    amount: item.modify.amount,
                                    client_id: location,
                                });
                            });
                        }
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error fetching and processing availability:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const getProductsByLocation = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        activeClients.map(async (client) => {
            const location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);
            let endpoint = `/products`;
            let responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                responses.map(async (product) => {
                    const rec_count = await RestProductParent.count({
                        where: {
                            Pid: product.id,
                        },
                    });

                    const resCount = rec_count;
                    if (resCount >= 1) {
                        await RestProductParent.destroy({
                            where: {
                                Pid: product.id,
                            },
                        });
                    }

                    // Prepare the data object
                    let productData = {
                        Pid: product?.id,
                        parentProductId: product?.parentProductId,
                        name: product?.name,
                        parentProductName: product?.parentProductName,
                        shortDescription: product?.shortDescription,
                        description: product?.description,
                        imageUrl: product?.imageUrl,
                        depositPercentage: product?.depositPercentage,
                        type: product?.type,
                        isWaiverRequired: product?.isWaiverRequired,
                        captureTicketHolderName: product?.captureTicketHolderName,
                        hideSessionDuration: product?.hideSessionDuration,
                        depositAmount: product?.depositAmount,
                        termsAndConditionsText: product?.termsAndConditionsText,
                        validDaysFromRedemption: product?.validDaysFromRedemption,
                        client_id: location,
                    };

                    const newProduct = await RestProductParent.create(productData);
                    const parent_id = product?.id;

                    if (product?.products !== undefined && product?.products?.length > 0 && parent_id) {
                        product?.products.map(async (item) => {
                            const productItem = await RestProducts.create({
                                parent_id: parent_id,
                                Pid: item?.id,
                                name: item?.name,
                                description: item?.description,
                                imageUrl: item?.imageUrl,
                                cost: item?.cost,
                                tax: item?.tax,
                                isTaxInclusive: item?.isTaxInclusive,
                                groupSize: item?.groupSize,
                                minPurchase: item?.minPurchase,
                                forceMinPurchase: item?.forceMinPurchase,
                                hasUserDefinedCost: item?.hasUserDefinedCost,
                                fee: item?.fee,
                                sessionDiscounts: JSON.stringify(item?.sessionDiscounts),
                                maxUserDefinedCost: item?.maxUserDefinedCost,
                                minUserDefinedCost: item?.minUserDefinedCost,
                                paymentFrequencyId: item?.paymentFrequencyId,
                                client_id: location,
                            });

                            const productId = item?.id;
                            if (item?.locations !== undefined && item?.locations?.length > 0 && productId) {
                                item?.locations.map(async (item_location, index) => {
                                    await RestProductLocations.create({
                                        product_id: productId,
                                        location_value: JSON.stringify(item_location),
                                        client_id: location,
                                    });
                                });
                            }

                            if (item?.locationTimes !== undefined && item?.locationTimes?.length > 0 && productId) {
                                item?.locationTimes.map(async (locationTime, index) => {
                                    await RestProductLocationtimes.create({
                                        product_id: productId,
                                        startMinutes: locationTime.startMinutes,
                                        endMinutes: locationTime.endMinutes,
                                        locationIds: JSON.stringify(locationTime.locationIds),
                                        client_id: location,
                                    });
                                });
                            }

                            if (item?.packageItems !== undefined && item?.packageItems?.length > 0 && productId) {
                                item?.packageItems.map(async (packageItem, index) => {
                                    await RestProductPackageItem.create({
                                        product_id: productId,
                                        packageProductId: packageItem.packageProductId,
                                        parentProductId: packageItem.parentProductId,
                                        productId: packageItem.productId,
                                        cost: packageItem.cost,
                                        quantity: packageItem.quantity,
                                        quantityType: packageItem.quantityType,
                                        packageRequirement: packageItem.packageRequirement,
                                        client_id: location,
                                    });
                                });
                            }
                        });
                    }

                    if (product?.addOns !== undefined && product?.addOns?.length > 0 && parent_id) {
                        product?.addOns.map(async (addon, index) => {
                            await RestProductAddons.create({
                                parent_id: parent_id,
                                addon_value: addon,
                                client_id: location,
                            });
                        });
                    }

                    if (product?.restrictedAddOns !== undefined && product?.restrictedAddOns?.length > 0 && parent_id) {
                        product?.restrictedAddOns.map(async (addon, index) => {
                            await RestProductRestrictedaddons.create({
                                parent_id: parent_id,
                                addon_value: addon,
                                client_id: location,
                            });
                        });
                    }

                    if (product?.stockPeriods !== undefined && product?.stockPeriods?.length > 0 && parent_id) {
                        product?.stockPeriods.map(async (dt, index) => {
                            await RestProductStockperiods.create({
                                parent_id: parent_id,
                                stockperiod_value: dt,
                                client_id: location,
                            });
                        });
                    }

                    if (product?.modifiers !== undefined && product?.modifiers?.length > 0 && parent_id) {
                        product?.modifiers.map(async (dt, index) => {
                            await RestProductModifiers.create({
                                parent_id: parent_id,
                                modifier_value: dt,
                                client_id: location,
                            });
                        });
                    }

                    if (product?.modifierGroups !== undefined && product?.modifierGroups?.length > 0 && parent_id) {
                        product?.modifierGroups.map(async (dt, index) => {
                            await RestProductModifiergroups.create({
                                parent_id: parent_id,
                                modifiergroups_value: dt,
                                client_id: location,
                            });
                        });
                    }

                    if (product?.giftcard !== undefined && product?.giftcard?.length > 0 && parent_id) {
                        let vData = product?.giftcard;
                        await RestProductGiftcard.create({
                            parent_id: parent_id,
                            canSendDigital: vData?.canSendDigital,
                            canSendPhysical: vData?.canSendPhysical,
                            supportsVideoMessage: vData?.supportsVideoMessage,
                            supportsWrittenMessage: vData?.supportsWrittenMessage,
                            productPostages: JSON.stringify(vData?.productPostages),
                            client_id: location,
                        });
                    }

                    if (product?.agreement !== undefined && product?.giftcard?.agreement > 0 && parent_id) {
                        let vData = product?.agreement;
                        await RestProductAgreement.create({
                            parent_id: parent_id,
                            bookingAgreementId: vData?.bookingAgreementId,
                            formIdentifier: vData?.formIdentifier,
                            client_id: location,
                        });
                    }
                });
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error fetching and processing getProductsByLocation:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const MapCustomerId = async (req, res) => {
    try {
        // FETCH NON-MAPPED CUSTOMERS
        const customerDt = await MobileCustomers.findAll({
            attributes: ["id", "fname", "lname", "email", "phone"],
            where: {
                mapping_status: { [Op.ne]: 1 },
            },
        });

        // LOOP THROUGH EACH NON-MAPPED CUSTOMER
        for (const customer of customerDt) {
            const rollerCustomerDt = await Customers.findAll({
                attributes: ["customerId", "client_id"],
                where: {
                    [Op.or]: [{ email: customer.email }, { contactNumber: customer.phone }],
                    lastName: customer.lname.trim().toLowerCase(),
                    firstName: customer.fname.trim().toLowerCase(),
                    mobile_cust_mapping: "0",
                },
            });

            // LOOP THROUGH EACH MATCHED CUSTOMER
            for (const rollerCustomer of rollerCustomerDt) {
                // INSERT INTO `mobile_roller_customer_mapping`
                await MobileRolleCustomerMapping.create({
                    mobile_customer_id: customer.id,
                    roller_customer_id: rollerCustomer.customerId,
                    client_id: rollerCustomer.client_id,
                });

                // UPDATE `customers` SET mobile_cust_mapping = '1'
                await Customers.update({ mobile_cust_mapping: "1" }, { where: { customerId: rollerCustomer.customerId } });

                // UPDATE `mobile_customers` SET mapping_status = '1'
                await MobileCustomers.update({ mapping_status: "1" }, { where: { id: customer.id } });
            }
        }

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error mapping customers:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const Memberships = async (req, res) => {
    try {
        const bucket = process.env.AWS_QRCODE_BUCKET_NAME;
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        // LOOP THROUGH EACH CLIENT (LOCATION)
        activeClients.map(async (client) => {
            let location = client.client_id;

            let customerDt = await MobileCustomers.findAll({
                attributes: ["id", [Sequelize.fn("REPLACE", Sequelize.fn("TRIM", Sequelize.fn("LOWER", Sequelize.fn("CONCAT", Sequelize.col("fname"), " ", Sequelize.col("lname")))), " ", "_"), "customer_name"]],
            });

            for (const customer of customerDt) {
                const customer_id = customer.id;
                let CustomerMemberships = await cronService.getCustomerMemberships(customer_id, location);

                for (const customer_mem of CustomerMemberships) {
                    if (customer_mem.customer_name === customer.customer_name) {
                        const existsRecord = await MobileCustomerMemberships.findOne({
                            where: {
                                customer_id: customer_id,
                                bookingReference: customer_mem?.bookingReference,
                                ticketId: customer_mem?.ticketId,
                            },
                        });

                        if (!existsRecord) {
                            const code = customer_mem?.ticketId;
                            let qrCodeBuffer = await QRCode.toBuffer(code, { width: 100 });
                            const filename = `${customer_mem?.ticketId}.png`;
                            const result = await s3
                                .upload({
                                    Bucket: process.env.AWS_QRCODE_BUCKET_NAME,
                                    Key: filename,
                                    Body: qrCodeBuffer,
                                    ContentType: "image/png", // MIME type
                                    ACL: "public-read",
                                })
                                .promise();
                            let mebership_qr = `${process.env.AWS_QRCODE_BUCKET_URL}${filename}`;

                            await MobileCustomerMemberships.create({
                                customer_id: customer_id,
                                bookingReference: customer_mem?.bookingReference,
                                ticketId: customer_mem?.ticketId,
                                product_id: customer_mem?.Pid,
                                bookingDate: customer_mem?.bookingDate,
                                mebership_qr: mebership_qr,
                                expiry_date: customer_mem?.expiryDate,
                                client_id: location,
                            });
                        }
                    } else {
                        // CHECK ALREADY EXISTING DATA //
                        const existsRecord = await MobileCustomerChildMemberships.findOne({
                            where: {
                                customer_id: customer_id,
                                bookingReference: customer_mem?.bookingReference,
                                ticketId: customer_mem?.ticketId,
                            },
                        });

                        if (!existsRecord) {
                            const code = customer_mem?.ticketId;
                            let qrCodeBuffer = await QRCode.toBuffer(code, { width: 100 });
                            const filename = `${customer_mem?.ticketId}.png`;
                            const result = await s3
                                .upload({
                                    Bucket: process.env.AWS_QRCODE_BUCKET_NAME,
                                    Key: filename,
                                    Body: qrCodeBuffer,
                                    ContentType: "image/png", // MIME type
                                    ACL: "public-read",
                                })
                                .promise();
                            let mebership_qr;
                            if (result) {
                                mebership_qr = `${process.env.AWS_QRCODE_BUCKET_URL}${filename}`;
                            }

                            await MobileCustomerChildMemberships.create({
                                customer_id: customer_id,
                                bookingReference: customer_mem?.bookingReference,
                                ticketId: customer_mem?.ticketId,
                                product_id: customer_mem?.Pid,
                                bookingDate: customer_mem?.bookingDate,
                                mebership_qr: mebership_qr,
                                expiry_date: customer_mem?.expiryDate,
                                client_id: location,
                            });
                        }
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error mapping customers:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const PushNotification = async (req, res) => {
    try {
        const notificationDt = await PushNotifications.findAll({
            where: {
                status: "1",
                notified: "0",
            },
        });

        if (notificationDt.length === 0) {
            return res.status(200).json({ status: true, message: "No notifications to process" });
        }
        await Promise.all(
            notificationDt.map(async (data) => {
                try {
                    // Current time in the user's timezone
                    let timezoneDate = moment().tz(data.cust_timezone).format("YYYY-MM-DD hh:mm A");
                    let currentTime = moment(timezoneDate, "YYYY-MM-DD hh:mm A").valueOf();

                    // Notification time
                    let notificationTime = moment(`${data.date_to_notify} ${data.time_to_notify}`, "YYYY-MM-DD hh:mm A").valueOf();

                    // If current time >= notification time, send notification
                    if (currentTime >= notificationTime) {
                        const notify = await PushNotificationLogs.create({
                        notify_id: data.id,
                        title: data.title,
                        message: data.message,
                        notify_datetime: moment().format('YYYY-MM-DD HH:mm:ss')
                        
                        });
                        if(notify){
                            let topic = 'userRegistration';
                            await firebaseService.notifyMessagetoMultiDevices(data.title, data.message, topic);
                            await PushNotifications.update(
                                {
                                    notified: '1',
                                    current_time_str: currentTime.toString(),
                                    notification_time_str: notificationTime.toString()
                                },
                                { where: { id: data.id } }
                            );
                        }
                    }
                } catch (innerError) {
                    console.error(`Error sending notification`, innerError);
                }
            })
        );

        res.status(200).json({ status: true, message: "Notifications processed successfully" });
    } catch (error) {
        console.error("Error in PushNotification:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const getRestaurantPopularItems = async (req, res) => {
    try {
        const clients = await ClientMaster.findAll({
            attributes: ["client_id"],
            where: {
                status: "1",
                on_boarding: "1",
            },
        });

        for (const client of clients) {
            let clientId = client.client_id;

            // Construct and execute the REPLACE INTO query
            await RestaurantPopularItems.sequelize.query(
                `
            REPLACE INTO restaurant_popular_items (id, product_id, quantity, cost)
            SELECT mi.id, bk.productId as product_id, SUM(bk.quantity) as quantity, SUM(bk.cost) as cost
            FROM restaurant_menu_items mi
            INNER JOIN booking_items bk ON mi.product_id = bk.productId AND bk.client_id = mi.client_id
            WHERE mi.client_id = :clientId
            GROUP BY bk.productId
          `,
                {
                    replacements: { clientId },
                    type: Sequelize.QueryTypes.REPLACE,
                }
            );
        }

        res.status(200).json({ message: "Popular items updated successfully" });
    } catch (error) {
        console.error("Error updating popular items:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const SignedWaivers = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        activeClients.map(async (client) => {
            let location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);
            const inc = req.query.inc ? parseInt(req.query.inc) : 0;
            const currentDate = new Date();
            const endDate = new Date(currentDate.setDate(currentDate.getDate() - inc)).toISOString().split("T")[0];
            const startDate = new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1)).toISOString().split("T")[0];

            let endpoint = `/data/signedwaivers?pageNumber=1&startDate=${startDate}&endDate=${endDate}`;
            let responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                let signedwaivers = responses.items;
                const totalPages = responses.totalPages;

                for (let i = 0; i <= totalPages; i++) {
                    if (i > 1) {
                        const endpoint = `/data/signedwaivers?pageNumber=${i}&startDate=${startDate}&endDate=${endDate}`;
                        const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);
                        signedwaivers = responses.items;

                        if (!responses) {
                            continue;
                        }
                    }
                    for (let data of signedwaivers) {
                        const exWaiver = await SignedWaiver.findOne({
                            attributes: ["signedWaiverId"],
                            where: {
                                signedWaiverId: data.signedWaiverId,
                                client_id: location,
                            },
                        });
                        if (exWaiver) {
                            await SignedWaiver.destroy({
                                where: {
                                    signedWaiverId: data.signedWaiverId,
                                    client_id: location,
                                },
                            });
                        }

                        // UPSERT (INSERT OR UPDATE) RECORD IN roller_available_products TABLE
                        await SignedWaiver.create({
                            signedWaiverId: data.signedWaiverId,
                            waiverId: data.waiverId,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            customerId: data.customerId,
                            dateOfBirth: data.dateOfBirth,
                            email: data.email,
                            contactNumber: data.contactNumber,
                            isForMinor: data.isForMinor,
                            expiryDate: data.expiryDate,
                            modifiedDate: data.modifiedDate,
                            createdDate: data.createdDate,
                            parentSignedWaiverId: data.parentSignedWaiverId,
                            client_id: location,
                        });
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in SignedWaivers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const Tickets = async (req, res) => {
    try {
        // FOR SELECTED LOCATION
        let whereClause = {};
        if (req.query.client) {
            whereClause.client_id = req.query.client;
        }

        // FETCH ACTIVE CLIENTS (LOCATION)
        const activeClients = await cronService.getActiveClients(whereClause);

        activeClients.map(async (client) => {
            let location = client.client_id;

            // CONNECT ROLLER API BY CLIENT (LOCATION)
            const roller = await rollerUtils.getTokenDetails(location);
            const inc = req.query.inc ? parseInt(req.query.inc) : 0;
            const currentDate = new Date();
            let endDate = new Date(currentDate.setDate(currentDate.getDate() - inc)).toISOString().split("T")[0];
            let startDate = new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1)).toISOString().split("T")[0];

            let endpoint = `/data/tickets?pageSize=500&pageNumber=1&startDate=${startDate}&endDate=${endDate}`;
            let responses = await rollerUtils.getRequest(endpoint, roller.accessToken);

            if (responses) {
                let tickets = responses.items;
                const totalPages = responses.totalPages;

                for (let i = 0; i <= totalPages; i++) {
                    if (i > 1) {
                        const endpoint = `/data/tickets?pageSize=500&pageNumber=${i}&startDate=${startDate}&endDate=${endDate}`;
                        const responses = await rollerUtils.getRequest(endpoint, roller.accessToken);
                        tickets = responses.items;
                    }
                    for (let data of tickets) {
                        let exTicket = await Ticket.findOne({
                            attributes: ["ticketId"],
                            where: {
                                ticketId: data.ticketId,
                                client_id: location,
                            },
                        });
                        if (exTicket) {
                            await Ticket.destroy({
                                where: {
                                    ticketId: data.ticketId,
                                    client_id: location,
                                },
                            });
                        }

                        // UPSERT (INSERT OR UPDATE) RECORD IN roller_available_products TABLE
                        let insertTicket = await Ticket.create({
                            bookingReference: data.bookingReference,
                            ticketId: data.ticketId,
                            name: data.name,
                            customerId: data.customerId,
                            productId: data.productId,
                            createdDate: data.createdDate,
                            bookingDate: data.bookingDate,
                            expiryDate: data.expiryDate,
                            productType: data.productType,
                            productSubType: data.productSubType,
                            recurringPaymentFrequency: data.recurringPaymentFrequency,
                            client_id: location,
                        });

                        const ticket_id = insertTicket.id;
                        if (data?.discountIds !== undefined) {
                            data?.discountIds.map(async (item, index) => {
                                await TicketDiscounts.create({
                                    ticketId: data.ticketId,
                                    discountId: item,
                                    client_id: location,
                                });
                            });
                        }
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in SignedWaivers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const UpcomingEvent = async (req, res) => {
    try {
        // FETCH ACTIVE CLIENTS (LOCATION)
        const bookingData = await cronService.getActiveClientsUpcomingEvent();

        bookingData.map(async (booking) => {
            const items = await Sequelize.query(
                `SELECT start_time, CONCAT(:c_date, ' ', start_time) as sttime, 
            IF(TIMESTAMPDIFF(MINUTE, :dateTime, CONCAT(:c_date, ' ', start_time)) <= 60, '1', '0') AS time_comparison 
            FROM mobile_booking_items 
            WHERE booking_id = :booking_id 
            AND start_time IS NOT NULL 
            AND start_time != ''`,
                {
                    replacements: {
                        c_date: booking.c_date,
                        dateTime: `${booking.c_date} ${booking.c_time.slice(0, -1)}`,
                        booking_id: booking.booking_id,
                    },
                    type: QueryTypes.SELECT,
                }
            );

            // Fetch customer device ids
            const devices = await MobileCustomerDeviceIds.findAll({
                where: {
                    customer_id: booking.customer_id,
                },
                attributes: ["device_id"],
                raw: true,
            });

            for (const item of items) {
                if (item.time_comparison === "1") {
                    for (const dv of devices) {
                        if (dv.device_id != "") {
                            const title = "Upcoming Event Alert!";
                            const body = "Exciting news! You have an upcoming event. Be sure to stay tuned for more details.";
                            await firebaseService.sendNotifyMessage(dv.device_id, title, body);
                        }
                    }
                }
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in SignedWaivers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const UpdateUnResolveBooking = async (req, res) => {
    try {
        // FETCH UNRESOLVED BOOKINGS //
        const bookingDt = await cronService.getUnresolvedBooking();
        const clientInfo = {};

        bookingDt.map(async (booking) => {
            const clientId = booking.client_id;
            let connectedAccount;
            if (!clientInfo[clientId]) {
                // FETCH CLIENT (LOCATION) INFO //
                const clientDt = await ClientMaster.findOne({
                    attributes: ["stripe_account_id"],
                    where: { client_id: clientId },
                    raw: true,
                });

                if (clientDt) {
                    connectedAccount = clientDt?.stripe_account_id;
                    clientInfo[clientId] = clientDt;
                }
            }

            let paymentStatus = await getPaymentIntent(booking?.payment_id, connectedAccount);
            if (paymentStatus && paymentStatus.status === "succeeded") {
                await ResolveBooking(booking?.payment_id, booking?.customer_id, "1");
            }
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in UpdateUnResolveBooking:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export {
    AvailableProducts,
    InsertCustomers,
    InsertDiscounts,
    getBookingByLocation,
    getProductsByLocation,
    MapCustomerId,
    Memberships,
    PushNotification,
    getRestaurantPopularItems,
    SignedWaivers,
    Tickets,
    UpcomingEvent,
    UpdateUnResolveBooking,
};