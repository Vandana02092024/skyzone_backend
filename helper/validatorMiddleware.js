import { check, validationResult , body, param, query } from 'express-validator';
import CommonFunction from './common.js';

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    return res.status(200).json(CommonFunction.errMessage(errorMessages));
    }
    next();
};

// A dynamic validation generator based on the fields needed for each API
// Body validation function
export const bodyValidation = [
  async (req, res, next) => {
    const data = req.body || {}; // Get request body data
    const rules = [];

    // Add validation rules dynamically based on body fields
    if ('id' in data) {
      rules.push(body('id').notEmpty().isInt().withMessage('Please enter a valid id').escape());
    }
    if ('client_id' in data) {
      rules.push(body('client_id').notEmpty().withMessage('client id is required')
      .isInt().withMessage('Please enter valid client id').escape());
    }

    if ('card_id' in data) {
      rules.push(body('card_id').notEmpty().withMessage('card id is required')
      .isInt().withMessage('Please enter valid card id').escape());
    }
    
    if ('otp' in data) {
      rules.push(
        body('otp')
          .notEmpty().withMessage('OTP is required')
          .isLength({ min: 3, max: 6 }).withMessage('OTP must be exactly 3 to 6 digits')
          .isNumeric().withMessage('OTP must be a number')
          .escape() // This escapes special characters
      );
    }
    if ('name' in data) {
      rules.push(body('name').notEmpty().withMessage('name is required').escape());
    }
    if ('first_name' in data) {
      rules.push(body('first_name').notEmpty().withMessage('First name is required').escape());
    }
    if ('last_name' in data) {
      rules.push(body('last_name').notEmpty().withMessage('Last name is required').escape());
    }
    if ('fname' in data) {
      rules.push(body('fname').notEmpty().withMessage('First name is required').escape());
    }
    if ('lname' in data) {
      rules.push(body('lname').notEmpty().withMessage('Last name is required').escape());
    }
    // if ('email' in data) {
    //   rules.push(body('email').isEmail().withMessage('Please enter a valid email').trim());
    // }
    if ('username' in data) {
      rules.push(
        body('username')
          .notEmpty().withMessage('Username is required')
          // .custom(value => {
          //   // Check if the value is a valid email or a valid phone number
          //   if (isEmail()(value) || isMobilePhone()(value, 'any', { strictMode: true })) {
          //     return true; // Passes validation if it is an email or phone number
          //   }
          //   throw new Error('Username must be a valid email or phone number');
          // })
      );
    }
    // if ('phone' in data) {
    //   rules.push(
    //     check('phone')
    //       .isMobilePhone('any', { strictMode: true })
    //       .withMessage('Enter a valid phone number')
    //   );
    // }

    // date validation
    // if ('date_of_birth' in data) {
    //   rules.push(body('date').notEmpty().withMessage('date is required')
    //   .isDate().withMessage('Please enter a valid date').escape());
    // }

    // if ('booking_date' in data) {
    //   rules.push(body('booking_date').notEmpty().withMessage('booking date is required').escape());
    // }
    // if ('payment_date' in data) {
    //   rules.push(body('payment_date').notEmpty().withMessage('payment date is required').escape());
    // }

    // order and payments api validations
    if ('order_id' in data) {
      rules.push(body('order_id').notEmpty().withMessage('order id is required').escape());
    }
    // if ('booking_id' in data) {
    //   rules.push(body('booking_id').notEmpty().withMessage('booking id is required').escape());
    // }
    if ('payment_status' in data) {
      rules.push(body('payment_status').notEmpty().withMessage('payment_status is required').escape());
    }
    if ('isFood' in data) {
      rules.push(body('isFood').isBoolean().withMessage('must be true or false').escape());
    }
    if ('order_status' in data) {
      rules.push(body('order_status').notEmpty().withMessage('order status is required').escape());
    }

    if ('total_cost' in data) {
      rules.push(body('total_cost').notEmpty().withMessage('total cost is required').escape());
    }

    if ('total_quantity' in data) {
      rules.push(body('total_quantity').notEmpty().withMessage('total quantity is required')
      .isInt().withMessage('Please enter valid quantity').escape());
    }

    if ('total_discount' in data) {
      rules.push(body('total_discount').isInt().withMessage('Please enter valid discount').escape());
    }

    if ('total_tax' in data) {
      rules.push(body('total_tax').notEmpty().withMessage('Please enter valid tax').escape());
    }
    if ('campaign_type' in data) {
      rules.push(body('campaign_type').isInt().withMessage('Please enter valid campaign type').escape());
    }
    if ('reward_points' in data) {
      rules.push(body('reward_points').isInt().withMessage('Please enter valid reward points').escape());
    }

    if ('android_version' in data) {
      rules.push(body('android_version').notEmpty().withMessage('android version is required')
      .isInt().withMessage('Please enter valid android version').escape());
    }

    if ('ios_version' in data) {
      rules.push(body('ios_version').notEmpty().withMessage('ios version is required')
      .isInt().withMessage('Please enter valid ios version').escape());
    }

    if ('force' in data) {
      rules.push(body('force').isBoolean().withMessage('must be true or false').escape());
    }

    // Add password validation
    // if ('password' in data) {
    //   rules.push(
    //     body('password')
    //       .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    //       .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    //       .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    //       .matches(/[0-9]/).withMessage('Password must contain at least one number')
    //       // .matches(/[\W]/).withMessage('Password must contain at least one special character')
    //   );
    // }

    if ('comments' in data) {
      rules.push(body('comments').escape());
    }

    // web Application validators

    if ('type' in data) {
      rules.push(body('type').notEmpty().withMessage('type is required').escape());
    }

    if ('title' in data) {
      rules.push(body('title').notEmpty().withMessage('title is required').escape());
    }

    if ('parent_id' in data) {
      rules.push(body('parent_id').notEmpty().withMessage('parent id is required')
      .isInt().withMessage('Please enter valid parent id').escape());
    }
    if ('product_id' in data) {
      rules.push(body('product_id').notEmpty().withMessage('product id is required')
      .isInt().withMessage('Please enter valid product id').escape());
    }
    if ('points' in data) {
      rules.push(body('points').notEmpty().withMessage('points is required')
      .isInt().withMessage('Please enter valid points').escape());
    }
    if ('discount_code' in data) {
      rules.push(body('discount_code').notEmpty().withMessage('discount code is required').escape());
    }

    // Execute the validation rules
    await Promise.all(rules.map(validation => validation.run(req)));
    return next();
  }
];

export const queryValidation = [
  async (req, res, next) => {
    const data = req.query || {}; // Get request query data
    const rules = [];

    // Add validation rules dynamically based on query fields
    if ('city' in data) {
      rules.push(query('city').notEmpty().withMessage('city is required').escape());
    }
    if ('latitude' in data) {
      rules.push(query('latitude').notEmpty().withMessage('latitude is required').escape());
    }
    if ('longitude' in data) {
      rules.push(query('longitude').notEmpty().withMessage('longitude is required').escape());
    }

    if ('client_id' in data) {
      rules.push(query('client_id').notEmpty().withMessage('client id is required')
      .isInt().withMessage('Please enter valid client id').escape());
    }
    if ('client' in data) {
      rules.push(query('client').notEmpty().withMessage('client id is required')
      .isInt().withMessage('Please enter valid client id').escape());
    }
    if ('location_id' in data) {
      rules.push(query('location_id').notEmpty().withMessage('location id is required')
      .isInt().withMessage('Please enter valid location id').escape());
    }
    if ('customer_id' in data) {
      rules.push(query('customer_id').notEmpty().withMessage('customer id is required')
      .isInt().withMessage('Please enter valid customer id').escape());
    }

    if ('offer_id' in data) {
      rules.push(query('offer_id').notEmpty().withMessage('offer id is required')
      .isInt().withMessage('Please enter valid offer id').escape());
    }
    if ('card_id' in data) {
      rules.push(query('card_id').notEmpty().withMessage('card id is required')
      .isInt().withMessage('Please enter valid card id').escape());
    }
    
    if ('product_id' in data) {
      rules.push(query('product_id').notEmpty().withMessage('product id is required')
      .isInt().withMessage('Please enter valid product id').escape());
    }

    if ('order_id' in data) {
      rules.push(query('order_id').notEmpty().withMessage('order id is required').escape());
    }

    if ('category' in data) {
      rules.push(query('category').notEmpty().withMessage('category id is required')
      .isInt().withMessage('Please enter valid category id').escape());
    }
    if ('device_id' in data) {
      rules.push(query('device_id').notEmpty().withMessage('device id is required').escape());
    }
    if ('date' in data) {
      rules.push(query('date').notEmpty().withMessage('date is required')
      .isDate().withMessage('Please enter a valid date').escape());
    }

    if ('items_per_page' in data) {
      rules.push(query('items_per_page').notEmpty().withMessage('items per page is required')
      .isInt().withMessage('Please enter valid number').escape());
    }

    if ('page' in data) {
      rules.push(query('page').notEmpty().withMessage('page number is required')
      .isInt().withMessage('Please enter valid number').escape());
    }

    // Execute the validation rules
    await Promise.all(rules.map(validation => validation.run(req)));
    return next();
  }
];

export const paramsValidation = [
  async (req, res, next) => {
    const data = req.params || {}; // Get request param data
    const rules = [];

    // Add validation rules dynamically based on param fields
    if ('id' in data) {
      rules.push(param('id').isUUID().withMessage('Invalid ID format').escape());
    }

    // Execute the validation rules
    await Promise.all(rules.map(validation => validation.run(req)));
    return next();
  }
];