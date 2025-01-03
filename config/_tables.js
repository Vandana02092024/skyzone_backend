import { DataTypes } from "sequelize";
import sequelize from "./db.js";

// TABLES //
const MobileCustomers = sequelize.define(
  "mobile_customers",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    fname: { type: DataTypes.STRING, allowNull: true },
    lname: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    profile_picture: { type: DataTypes.TEXT, allowNull: true },
    dob: { type: DataTypes.DATE, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
    created: { type: DataTypes.DATE },
  },
  { 
    timestamps: false,
    tableName: "mobile_customers_tbl",
  }
);

const CustomerLoyaltyPoints = sequelize.define(
  "tbl_customer_loyalty_points",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    transaction_id: { type: DataTypes.STRING, allowNull: true },
    create_date: { type: DataTypes.DATE },
    customer_id: { type: DataTypes.STRING, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
    total_payment: { type: DataTypes.FLOAT, allowNull: true },
    point_earn: { type: DataTypes.INTEGER, allowNull: true },
    point_used: { type: DataTypes.FLOAT, allowNull: true },
    point_remaining: { type: DataTypes.FLOAT, allowNull: true },
    expire_date: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: false }
);

const LoyaltyEarningPoint = sequelize.define(
  "loyalty_earning_point",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    points_category: { type: DataTypes.INTEGER, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
    pointEarned: { type: DataTypes.INTEGER, allowNull: true },
    amountSpent: { type: DataTypes.INTEGER, allowNull: true },
    uptoPoint: { type: DataTypes.INTEGER, allowNull: true },
    earnBy: { type: DataTypes.TINYINT(4), allowNull: true },
    expiryType: { type: DataTypes.TINYINT(4), allowNull: true },
    expire_date: { type: DataTypes.DATE },
    created: { type: DataTypes.DATE },
    updated: { type: DataTypes.DATE },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "loyalty_earning_point",
  }
);

const CategoryCard = sequelize.define(
  "category_cards",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    name: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    thumbnail: { type: DataTypes.STRING, allowNull: true },
    header_img: { type: DataTypes.INTEGER, allowNull: true },
    product_type: { type: DataTypes.FLOAT, allowNull: true },
    type: { type: DataTypes.INTEGER, allowNull: true },
    rep_cat: { type: DataTypes.FLOAT, allowNull: true },
    p_sub_type: { type: DataTypes.FLOAT, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { timestamps: false }
);

const RollerAuth = sequelize.define(
  "RollerAuth",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    location: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    client_secret: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.STRING(5000),
      allowNull: false,
    },
    token_ref_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "roller_auth",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const MobileCustomerMemberships = sequelize.define(
  "mobile_customer_memberships",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mebership_qr: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: "0000-00-00 00:00:00",
      onUpdate: DataTypes.NOW,
    },
  },
  {
    tableName: "mobile_customer_memberships",
    timestamps: false, // We are using custom timestamps
  }
);

const MobileCustomerChildren = sequelize.define(
  "MobileCustomerChildren",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fname: DataTypes.STRING,
    lname: DataTypes.STRING,
    age: DataTypes.INTEGER,
    dob: DataTypes.DATE,
    customer_id: DataTypes.INTEGER,
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // other fields as necessary
  },
  {
    tableName: "mobile_customer_children",
    timestamps: false,
  }
);

const PushNotifications = sequelize.define(
  "push_notifictions",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    date_to_notify: { type: DataTypes.DATEONLY, allowNull: true },
    time_to_notify: { type: DataTypes.STRING, allowNull: true },
    cust_timezone: { type: DataTypes.STRING, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    redirection: { type: DataTypes.STRING, allowNull: true },
    client_ids: { type: DataTypes.STRING, allowNull: true },
    notified: { type: DataTypes.ENUM("0", "1"), defaultValue: '0'},
    status: { type: DataTypes.ENUM("0", "1"), defaultValue: '1' },
    created_at: { type: DataTypes.DATE },
  },
  { timestamps: false, freezeTableName: true, tableName: "push_notifictions" }
);

const ClientMaster = sequelize.define(
  "clientmaster",
  {
    client_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    client_name: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    latitude: { type: DataTypes.STRING },
    longitude: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    Client_Code: { type: DataTypes.INTEGER },
    LastSynchedOn: { type: DataTypes.DATE },
    client_email: { type: DataTypes.STRING },
    order_email: { type: DataTypes.STRING },
    reply_to: { type: DataTypes.STRING },
    humanity_key: { type: DataTypes.STRING },
    humanity_username: { type: DataTypes.STRING },
    humanity_password: { type: DataTypes.STRING },
    stripe_account_id: { type: DataTypes.STRING },
    DbType: { type: DataTypes.INTEGER },
    country_type: { type: DataTypes.ENUM("0", "1") },
    version: { type: DataTypes.STRING },
    can_access: { type: DataTypes.ENUM("0", "1") },
    waiver_text: { type: DataTypes.TEXT },
    phone_number: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM("0", "1") },
    on_boarding: { type: DataTypes.ENUM("0", "1") },
    client_timezone: { type: DataTypes.STRING },
  },
  { timestamps: false, freezeTableName: true, tableName: "ClientMaster" }
);

const RestProducts = sequelize.define(
  "rest_products",
  {
    Pid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,
    },
    parent_id: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    cost: { type: DataTypes.DECIMAL, allowNull: true },
    tax: { type: DataTypes.DECIMAL, allowNull: true },
    isTaxInclusive: { type: DataTypes.TINYINT, allowNull: true },
    groupSize: { type: DataTypes.STRING, allowNull: true },
    minPurchase: { type: DataTypes.STRING, allowNull: true },
    forceMinPurchase: { type: DataTypes.TINYINT, allowNull: true },
    hasUserDefinedCost: { type: DataTypes.TINYINT, allowNull: true },
    fee: { type: DataTypes.DECIMAL, allowNull: true },
    sessionDiscounts: { type: DataTypes.STRING, allowNull: true },
    maxUserDefinedCost: { type: DataTypes.DECIMAL, allowNull: true },
    minUserDefinedCost: { type: DataTypes.DECIMAL, allowNull: true },
    paymentFrequencyId: { type: DataTypes.STRING, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, freezeTableName: true, tableName: "rest_products" }
);

const RestProductParent = sequelize.define(
  "rest_product_parent",
  {
    Pid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,
    },
    parentProductId: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    parentProductName: { type: DataTypes.STRING, allowNull: true },
    shortDescription: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.STRING, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    depositPercentage: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },
    isWaiverRequired: { type: DataTypes.STRING, allowNull: true },
    captureTicketHolderName: { type: DataTypes.STRING, allowNull: true },
    hideSessionDuration: { type: DataTypes.STRING, allowNull: true },
    depositAmount: { type: DataTypes.STRING, allowNull: true },
    termsAndConditionsText: { type: DataTypes.STRING, allowNull: true },
    validDaysFromRedemption: { type: DataTypes.STRING, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    modified_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: false, freezeTableName: true, tableName: "rest_product_parent" }
);

const RestProductPackageItem = sequelize.define(
  "RestProductPackageItem",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    packageProductId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentProductId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT(10, 3),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    packageRequirement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "rest_product_packageitems",
    timestamps: false,
  }
);

const LatestOfferings = sequelize.define(
  "latest_offerings",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    camp_type: { type: DataTypes.ENUM(["1", "2", "3"]) },
    image: { type: DataTypes.STRING },
    camp_start_date: { type: DataTypes.DATEONLY },
    camp_end_date: { type: DataTypes.DATEONLY },
    discount_code: { type: DataTypes.STRING },
    discount_type: { type: DataTypes.ENUM(["0", "1"]) },
    discount_amount: { type: DataTypes.FLOAT },
    discount_percent: { type: DataTypes.FLOAT },
    reward_points: { type: DataTypes.INTEGER },
    offer_type: { type: DataTypes.ENUM(["0", "1", "2"]) },
    display_to: { type: DataTypes.ENUM(["0", "1"]) },
    client_id: { type: DataTypes.INTEGER },
    status: { type: DataTypes.ENUM(["0", "1", "2"]) },
    created: { type: DataTypes.DATE },
    modified: { type: DataTypes.DATE },
  },
  { timestamps: false, freezeTableName: true, tableName: "latest_offerings" }
);

const AddOns = sequelize.define(
  "add_ons",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    parent_id: { type: DataTypes.INTEGER },
    pid: { type: DataTypes.STRING },
    card_id: { type: DataTypes.INTEGER },
    client_id: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "add_ons",
  }
);

const LatestOfferProducts = sequelize.define(
  "latest_offer_products",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    offer_id: { type: DataTypes.INTEGER },
    parent_product_id: { type: DataTypes.INTEGER },
    product_id: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "latest_offer_products",
  }
);

const MobileCustomerChildMemberships = sequelize.define(
  "mobile_customer_child_memberships",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mebership_qr: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: "0000-00-00 00:00:00",
      onUpdate: DataTypes.NOW,
    },
  },
  {
    tableName: "mobile_customer_child_memberships",
    timestamps: false, // We are using custom timestamps
  }
);

const MobileBookings = sequelize.define(
  "MobileBookings",
  {
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    roller_bookingReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roller_uniqueId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_cost: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_discount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    total_tax: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    capacity_reservation_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    offer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    camp_type: {
      type: DataTypes.ENUM("0", "1", "2", "3"),
      allowNull: false,
      defaultValue: "0",
      comment:
        "0: Normal Booking, 1: Rewards program, 2: Discount offer, 3: Special products",
    },
    reward_points: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("0", "1"),
      allowNull: false,
      defaultValue: "0",
      comment: "0: Booking, 1: Membership",
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "0: Draft, 1: Successful, 2: Payment Failed, 3: Canceled",
      defaultValue: 0,
    },
    booking_qr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: "0000-00-00 00:00:00",
    },
    booking_payload: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "mobile_bookings",
    timestamps: false,
    hooks: {
      beforeUpdate: (booking) => {
        booking.modified = new Date();
      },
    },
  }
);

const MobileBookingTickets = sequelize.define(
  "MobileBookingTickets",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    child_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ticket_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    child_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    booking_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    self_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: "0000-00-00 00:00:00",
    },
  },
  {
    tableName: "mobile_booking_tickets",
    timestamps: false,
    hooks: {
      beforeUpdate: (ticket) => {
        ticket.modified = new Date();
      },
    },
  }
);

const MobileBookingItems = sequelize.define(
  "MobileBookingItems",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    package_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tickets: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "mobile_booking_items",
    timestamps: false,
  }
);

const MobileBookingPayment = sequelize.define(
  "MobileBookingPayment",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fee: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mobile_booking_payments",
    timestamps: false,
  }
);

const MobileBookingMembershipSigned = sequelize.define(
  "MobileBookingMembershipSigned",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mobile_booking_membership_signed",
    timestamps: false,
  }
);

const MobileBookingDiscounts = sequelize.define(
  "MobileBookingDiscounts",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discount_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    percentage: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "mobile_booking_discounts",
    timestamps: false,
  }
);

const MobileCustomerStripeKeys = sequelize.define(
  "MobileCustomerStripeKeys",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    mob_customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mobile_customer_stripe_keys",
    timestamps: false,
  }
);

const CustomerLoyaltyPointsRedeemed = sequelize.define(
  "CustomerLoyaltyPointsRedeemed",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    discount_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    discount_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    point_redeemed: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: false,
    },
    qr_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    generated_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    redemeed_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("0", "1"),
      allowNull: false,
      defaultValue: "0",
    },
  },
  {
    tableName: "tbl_customer_loyalty_points_reedemed",
    timestamps: false,
  }
);

const Ticket = sequelize.define(
  "Ticket",
  {
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productSubType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recurringPaymentFrequency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    record_created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tickets",
    timestamps: false,
  }
);

const SignedWaiver = sequelize.define(
  "SignedWaiver",
  {
    signedWaiverId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    waiverId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isForMinor: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    parentSignedWaiverId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "signed_waivers",
    timestamps: false,
  }
);

const MobileDiscountProduct = sequelize.define(
  "MobileDiscountProduct",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    discount_code: DataTypes.STRING,
    title: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    category_id: DataTypes.INTEGER,
    client_id: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    points: DataTypes.FLOAT,
  },
  {
    tableName: "mobile_discount_products",
    timestamps: false,
  }
);

const Category = sequelize.define(
  "Category",
  {
    CatNo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    Description: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    pRange: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minRange: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxRange: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EnableCategory: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    CatID: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Categories",
    timestamps: false,
  }
);

const MobileCustomerDeviceIds = sequelize.define(
  "MobileCustomerDeviceIds",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: DataTypes.INTEGER,
    device_id: DataTypes.STRING,
    client_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
  },
  {
    tableName: "mobile_customer_device_ids",
    timestamps: false,
  }
);

// Restaurent Tables

const RestaurantMenuItem = sequelize.define(
  "RestaurantMenuItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(5000),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "restaurant_menu_items",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const RestaurantOfferBanners = sequelize.define(
  "RestaurantOfferBanners",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "restaurant_offer_banners",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const RestaurantPopularItems = sequelize.define(
  "RestaurantPopularItems",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "restaurant_popular_items",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

// user table for kitchen app

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contact_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    auth_secret_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

const RestaurantOrder = sequelize.define(
  "RestaurantOrder",
  {
    order_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_cost: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_discount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    total_tax: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    capacity_reservation_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_fee: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    payment_amount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    reward_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("0", "1", "2", "3"),
      allowNull: false,
      defaultValue: "0",
      comment: "0: Draft, 1: Successful, 2: Payment Failed, 3: Canceled",
    },
    order_qr: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    kitchen_status: {
      type: DataTypes.ENUM(
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "COMPLETED",
        "DONE"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
    roller_booking_status: {
      type: DataTypes.ENUM("0", "1"),
      allowNull: true,
      defaultValue: "0",
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "restaurant_orders",
    timestamps: false,
  }
);

const RestaurantOrderItem = sequelize.define(
  "RestaurantOrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    menu_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    cost: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      charset: "latin1",
      collate: "latin1_swedish_ci",
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    extra: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "restaurant_order_items",
    timestamps: false,
  }
);

const MobileTransactionFee = sequelize.define(
  "MobileTransactionFee",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fee: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "mobile_transaction_fee",
    timestamps: false,
  }
);

const AdditionalBookingForm = sequelize.define(
  "AdditionalBookingForm",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    search_term: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "additional_booking_form",
    timestamps: false,
  }
);

const MetaDatas = sequelize.define(
  "MetaDatas",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    meta_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    meta_value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "meta_datas",
    timestamps: false,
  }
);

const MobileCustomerQueries = sequelize.define(
  "MobileCustomerQueries",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("0", "1", "2"),
      defaultValue: "0",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "mobile_customer_queries",
    timestamps: false,
  }
);

const MobileGeneralQueries = sequelize.define(
  "MobileGeneralQueries",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    user: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "mobile_general_queries",
    timestamps: false,
  }
);

const RollerAvailableProducts = sequelize.define(
  "RollerAvailableProducts",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    online_sale: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    availability_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "roller_available_products",
    timestamps: false,
  }
);

const Customers = sequelize.define(
  "Customers",
  {
    customerId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mobile_cust_mapping: {
      type: DataTypes.ENUM("0", "1"),
      allowNull: false,
      defaultValue: "1",
    },
    contactNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    acceptMarketing: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    suburb: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    postcode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdByMode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "customers_tbl",
    timestamps: false,
  }
);

const Discounts = sequelize.define(
  "Discounts",
  {
    discountId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    codeGenerationMode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    percentOff: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    isSingleUseCode: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
    },
    amountOff: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    maxApplicableAmount: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usageLimitNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usageLimitType: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bookingRestrictionsStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    bookingRestrictionsEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    bookingRestrictionsDaysNum: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingRestrictionsDateNum: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bookingRestrictionsType: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingRuleNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bookingRuleType: {
      type: DataTypes.ENUM("0", "1", "2", "3", "4", "5", "6", "7"),
      defaultValue: "0",
      comment:
        "0: Per code, 1: Per user, 2:  For each selected product (regardless of quantity purchased), 3: Across selected products (quantity purchased counts towards uses),4: Per code per day,5 : Per code per week, 6: Per code per month, 7: Per code per year",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "discounts",
    timestamps: false,
  }
);

const DiscountProducts = sequelize.define(
  "DiscountProducts",
  {
    discountId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    // created: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
  },
  {
    tableName: "discount_products",
    timestamps: false,
  }
);

const DiscountCodes = sequelize.define(
  "DiscountCodes",
  {
    discountId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    // created: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
  },
  {
    tableName: "discount_codes",
    timestamps: false,
  }
);

const BookingItems = sequelize.define(
  "BookingItems",
  {
    bookingReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingItemId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    bookingCustomerId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bookingStatus: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    productId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bookingNotes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    groupSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    bookingCreatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    bookingModifiedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    bookingCreatedByStaffId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    discountAmount: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    cost: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: true,
    },
    sessionStart: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sessionEnd: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "booking_items",
    timestamps: false,
  }
);

const BookingItemMetas = sequelize.define(
  "BookingItemMetas",
  {
    bookingItemId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    attribute: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "booking_item_metas",
    timestamps: false,
  }
);

const BookingItemDiscounts = sequelize.define(
  "BookingItemDiscounts",
  {
    bookingItemId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    bookingDiscountId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    bookingDiscountCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "booking_item_discounts",
    timestamps: false,
  }
);

const BookingItemModifiers = sequelize.define(
  "BookingItemModifiers",
  {
    bookingItemId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    modifierId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "booking_item_modifiers",
    timestamps: false,
  }
);

const RestProductLocations = sequelize.define(
  "RestProductLocations",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "id",
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "product_id",
    },
    location_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "location_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_locations",
    timestamps: false,
  }
);

const RestProductLocationtimes = sequelize.define(
  "RestProductLocationtimes",
  {
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "product_id",
    },
    startMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "startMinutes",
    },
    endMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "endMinutes",
    },
    locationIds: {
      type: DataTypes.TEXT,
      allowNull: true, // Assuming locationIds can be null
      field: "locationIds",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_locationtimes",
    timestamps: false,
  }
);

const RestProductAddons = sequelize.define(
  "RestProductAddons",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    addon_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "addon_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_addons",
    timestamps: false,
  }
);

const RestProductRestrictedaddons = sequelize.define(
  "RestProductRestrictedaddons",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    addon_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "addon_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_restrictedaddons",
    timestamps: false,
  }
);

const RestProductStockperiods = sequelize.define(
  "RestProductStockperiods",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    stockperiod_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "stockperiod_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_stockperiods",
    timestamps: false,
  }
);

const RestProductModifiers = sequelize.define(
  "RestProductModifiers",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    modifier_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "modifier_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_modifiers",
    timestamps: false,
  }
);

const RestProductModifiergroups = sequelize.define(
  "RestProductModifiergroups",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    modifiergroups_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "modifiergroups_value",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_modifiergroups",
    timestamps: false,
  }
);

const RestProductGiftcard = sequelize.define(
  "RestProductGiftcard",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    canSendDigital: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "canSendDigital",
    },
    canSendPhysical: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "canSendPhysical",
    },
    supportsVideoMessage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "supportsVideoMessage",
    },
    supportsWrittenMessage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "supportsWrittenMessage",
    },
    productPostages: {
      type: DataTypes.STRING(500),
      allowNull: false,
      primaryKey: true,
      field: "productPostages",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_giftcard",
    timestamps: false,
    freezeTableName: true,
  }
);

const RestProductAgreement = sequelize.define(
  "RestProductAgreement",
  {
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "parent_id",
    },
    bookingAgreementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "bookingAgreementId",
    },
    formIdentifier: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "formIdentifier",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "rest_product_agreement",
    timestamps: false,
    freezeTableName: true,
  }
);

const MobileRolleCustomerMapping = sequelize.define(
  "MobileRolleCustomerMapping",
  {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "id",
    },
    mobile_customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "mobile_customer_id",
    },
    roller_customer_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "roller_customer_id",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "mobile_roller_customer_mapping",
    timestamps: false,
  }
);

const TicketDiscounts = sequelize.define(
  "TicketDiscounts",
  {
    ticketId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "ticketId",
    },
    discountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "discountId",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "client_id",
    },
  },
  {
    tableName: "ticket_discounts",
    timestamps: false,
  }
);

const Webhooks = sequelize.define(
  "Webhooks",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "id",
    },
    webhook_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "webhook_response",
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "type",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "webhooks",
    timestamps: false,
  }
);

const MembershipRedemptions = sequelize.define(
  "MembershipRedemptions",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "id",
    },
    redemptionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "redemptionDate",
    },
    bookingReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "bookingReference",
    },
    ticketId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "ticketId",
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "client_id",
    },
  },
  {
    tableName: "membership_redemptions",
    timestamps: false,
  }
);

const AccountDeleteRequests = sequelize.define(
  "AccountDeleteRequests",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "id",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "email",
    },
    status: {
      type: DataTypes.ENUM("0", "1"), 
      defaultValue: '0',
      allowNull: true,
      field: "status",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "account_delete_requests",
    timestamps: false,
  }
);

const ApiLog = sequelize.define('ApiLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "id",
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "user_id",
  },
  apiName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "apiName",
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "comment",
  },
  user_request: {
    type: DataTypes.TEXT, // Store the JSON as a string
    allowNull: true,
    field: "user_request",
    get() {
      const value = this.getDataValue('user_request');
      return value ? JSON.parse(value) : null; // Parse back to JSON on retrieval
    },
    set(value) {
      this.setDataValue('user_request', JSON.stringify(value)); // Store as JSON string
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'api_logs',
  timestamps: false // Since we are handling timestamps manually
});

const PushNotificationLogs = sequelize.define('PushNotificationLogs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "id",
  },
  notify_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "notify_id",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "title",
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "message",
  },
  notify_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'push_notification_logs',
  timestamps: false // Since we are handling timestamps manually
});

const ApiTextLogs = sequelize.define('ApiTextLogs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "id",
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "user_id",
  },
  log: {
    type: DataTypes.TEXT, // Store the JSON as a string
    allowNull: true,
    field: "log",
    get() {
      const value = this.getDataValue('log');
      return value ? JSON.parse(value) : null; // Parse back to JSON on retrieval
    },
    set(value) {
      this.setDataValue('log', JSON.stringify(value)); // Store as JSON string
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'api_text_logs',
  timestamps: false // Since we are handling timestamps manually
});

const Sample_tbl = sequelize.define('Sample_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "id",
  },
  text1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: "text1",
  },
  text2: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "text2",
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'sample_tbl',
  timestamps: false // Since we are handling timestamps manually
});

// ASSOCIATIONS //
// REST PRODUCTS //
RestProductParent.hasMany(RestProducts, {
  foreignKey: {
    name: "parent_id",
  },
});
RestProducts.belongsTo(RestProductParent, {
  foreignKey: {
    name: "parent_id",
  },
});

// LATEST OFFERINGS
LatestOfferings.hasMany(LatestOfferProducts, {
  foreignKey: {
    name: "offer_id",
  },
});
LatestOfferProducts.belongsTo(LatestOfferings, {
  foreignKey: {
    name: "offer_id",
  },
});
RestProducts.hasMany(LatestOfferProducts, {
  foreignKey: {
    name: "product_id",
  },
});
LatestOfferProducts.belongsTo(RestProducts, {
  foreignKey: {
    name: "product_id",
  },
});

RestaurantOrder.hasMany(RestaurantOrderItem, { foreignKey: "order_id" });
RestaurantOrder.belongsTo(ClientMaster, { foreignKey: "client_id" });

RestaurantOrderItem.belongsTo(RestaurantOrder, { foreignKey: "order_id" });
RestaurantOrderItem.belongsTo(RestProducts, { foreignKey: "product_id" });

ClientMaster.hasMany(RestaurantOrder, { foreignKey: "client_id" });

RestProducts.hasMany(RestaurantOrderItem, { foreignKey: "product_id" });

User.belongsTo(ClientMaster, { foreignKey: "client_id" });
ClientMaster.hasMany(User, { foreignKey: "client_id" });
ClientMaster.hasMany(RestaurantOrder, { foreignKey: "client_id" });

// end here

// Restaurent Tables end

Ticket.belongsTo(BookingItems, { foreignKey: "bookingReference" });

// Define associations
AddOns.belongsTo(RestProducts, { foreignKey: "pid", targetKey: "Pid" });
AddOns.belongsTo(RestProductParent, { foreignKey: "pid", targetKey: "Pid" });
// RestProducts.belongsTo(RestProductParent, { foreignKey: 'parent_id', targetKey: 'Pid' });
RestProducts.hasOne(AddOns, { foreignKey: "pid" });

// Associations
MobileCustomers.hasMany(SignedWaiver, {
  foreignKey: "customerId",
  sourceKey: "id",
});

SignedWaiver.belongsTo(MobileCustomers, {
  foreignKey: "customerId",
  targetKey: "id",
});

MobileCustomers.hasMany(MobileCustomerChildren, {
  foreignKey: "customer_id",
  sourceKey: "id",
});

MobileCustomerChildren.belongsTo(MobileCustomers, {
  foreignKey: "customer_id",
  targetKey: "id",
});

MobileCustomers.hasMany(MobileCustomerMemberships, {
  foreignKey: "customer_id",
  sourceKey: "id",
});

MobileCustomerMemberships.belongsTo(MobileCustomers, {
  foreignKey: "customer_id",
  targetKey: "id",
});

MobileCustomerMemberships.belongsTo(Ticket, {
  foreignKey: "ticketId",
  targetKey: "ticketId",
});

MobileCustomerChildren.hasMany(SignedWaiver, {
  foreignKey: "customerId",
  sourceKey: "id",
});

SignedWaiver.belongsTo(MobileCustomerChildren, {
  foreignKey: "customerId",
  targetKey: "id",
});

SignedWaiver.belongsTo(MobileRolleCustomerMapping, {
  foreignKey: "customerId",
  targetKey: "roller_customer_id",
});

MobileRolleCustomerMapping.belongsTo(MobileCustomers, {
  foreignKey: "mobile_customer_id",
  targetKey: "id",
});

Ticket.belongsTo(MobileCustomerMemberships, {
  foreignKey: "ticketId",
  targetKey: "ticketId",
});

Ticket.belongsTo(RestProducts, { foreignKey: "productId" });
Ticket.hasMany(MobileCustomerMemberships, { foreignKey: "ticketId" });
Ticket.hasMany(MobileCustomerChildMemberships, { foreignKey: "ticketId" });
MobileCustomerChildMemberships.belongsTo(Ticket, {
  foreignKey: "ticketId",
  targetKey: "ticketId",
});

RestProducts.hasMany(Ticket, { foreignKey: "productId" });
// MobileCustomerMemberships.belongsTo(Ticket, { foreignKey: 'ticketId', targetKey: 'ticketId' });

Category.hasMany(MobileDiscountProduct, { foreignKey: "category_id" });
MobileDiscountProduct.belongsTo(Category, { foreignKey: "category_id" });

MobileDiscountProduct.belongsTo(RestProducts, { foreignKey: "product_id" });

MobileBookings.hasMany(MobileBookingItems, { foreignKey: "booking_id" });
MobileBookings.belongsTo(ClientMaster, { foreignKey: "client_id" });
MobileBookings.hasMany(MobileBookingPayment, { foreignKey: "booking_id" });

MobileBookingItems.belongsTo(MobileBookings, { foreignKey: "booking_id" });
MobileBookingItems.belongsTo(RestProducts, { foreignKey: "product_id" });
RestProducts.hasMany(MobileBookingItems, { foreignKey: "product_id" });
MobileBookingPayment.belongsTo(MobileBookings, { foreignKey: "booking_id" });
ClientMaster.hasMany(MobileBookings, { foreignKey: "client_id" });
CustomerLoyaltyPointsRedeemed.belongsTo(MobileDiscountProduct, {
  foreignKey: "discount_id",
});
MobileDiscountProduct.hasMany(CustomerLoyaltyPointsRedeemed, {
  foreignKey: "discount_id",
});
// CustomerLoyaltyPointsRedeemed Model
CustomerLoyaltyPointsRedeemed.belongsTo(ClientMaster, {
  foreignKey: 'client_id', // Assuming client_id is the foreign key
  targetKey: 'client_id'    // Targeting the primary key of ClientMaster
});

// ClientMaster Model
ClientMaster.hasMany(CustomerLoyaltyPointsRedeemed, {
  foreignKey: 'client_id'
});
MobileDiscountProduct.belongsTo(RestProducts, {
  foreignKey: "product_id",
  targetKey: "Pid",
  as: "DisountedProducts",
});
RestProducts.hasMany(MobileDiscountProduct, {
  foreignKey: "product_id",
  as: "ProdcutsDiscount",
});

RestProducts.belongsTo(RestProductParent, {
  foreignKey: "parent_id",
  as: "parentProduct",
});

RestProducts.hasMany(RestaurantMenuItem, {
  foreignKey: "product_id",
  as: "restaurantMenuItems",
});

RestaurantMenuItem.belongsTo(RestProducts, {
  foreignKey: "product_id",
  as: "restProduct",
});

RestaurantMenuItem.belongsTo(RestProductParent, {
  foreignKey: "parent_product_id",
  as: "restProductParent",
});

RestProductParent.hasMany(RestaurantMenuItem, {
  foreignKey: "parent_product_id",
  as: "menuItems",
});

RestaurantPopularItems.belongsTo(RestaurantMenuItem, {
  foreignKey: "id",
  as: "restaurantMenuItem",
});

RestaurantPopularItems.belongsTo(RestaurantMenuItem, { foreignKey: "id" });

RestProductPackageItem.belongsTo(RestProducts, {
  foreignKey: "productId",
  as: "product",
});

RestProducts.hasOne(RestProductPackageItem, {
  foreignKey: "productId",
  as: "packageItems",
});

RestProductPackageItem.belongsTo(RestProducts, {
  foreignKey: "packageProductId",
  as: "packageProduct",
});

RestProducts.belongsTo(RestProductParent, {
  foreignKey: "parent_id",
  as: "parent",
});

// RestaurantPopularItems.belongsTo(RestaurantMenuItem, { foreignKey: 'id' });
RestaurantMenuItem.belongsTo(RestProducts, { foreignKey: "product_id" });
RestProducts.belongsTo(RestProductParent, { foreignKey: "parent_id" });

RestaurantMenuItem.belongsTo(RestaurantPopularItems, { foreignKey: "id" });

MobileCustomers.hasOne(MobileCustomerStripeKeys, {
  foreignKey: "mob_customer_id",
  as: "MobileCustomerStripeKey", // alias
});

MobileCustomerStripeKeys.belongsTo(MobileCustomers, {
  foreignKey: "mob_customer_id",
  as: "MobileCustomer", // alias
});

MobileBookingItems.hasMany(MobileBookingTickets, {
  foreignKey: "booking_item_id",
  sourceKey: "id", // Assuming 'id' is the primary key in MobileBookingItems
  as: "bookingtickets", // Optional: Alias for the association
});

MobileBookingTickets.belongsTo(MobileBookingItems, {
  foreignKey: "booking_item_id",
  targetKey: "id", // Assuming 'id' is the primary key in MobileBookingItems
});

RollerAvailableProducts.belongsTo(RestProductParent, {
  foreignKey: 'product_id',
  targetKey: 'Pid'
});

RestProductParent.hasMany(RollerAvailableProducts, {
  foreignKey: 'product_id',
  sourceKey: 'Pid'
});

export {
  MobileCustomers,
  CustomerLoyaltyPoints,
  LoyaltyEarningPoint,
  PushNotifications,
  ClientMaster,
  CategoryCard,
  RollerAuth,
  RestProducts,
  RestProductParent,
  RestProductPackageItem,
  LatestOfferProducts,
  LatestOfferings,
  MobileCustomerMemberships,
  MobileCustomerChildMemberships,
  AddOns,
  MobileCustomerChildren,
  MobileBookings,
  MobileBookingTickets,
  MobileBookingItems,
  MobileBookingPayment,
  MobileBookingMembershipSigned,
  MobileBookingDiscounts,
  CustomerLoyaltyPointsRedeemed,
  MobileCustomerStripeKeys,
  Ticket,
  SignedWaiver,
  MobileDiscountProduct,
  Category,
  MobileCustomerDeviceIds,
  RestaurantMenuItem,
  RestaurantOfferBanners,
  RestaurantPopularItems,
  User,
  RestaurantOrder,
  RestaurantOrderItem,
  MobileTransactionFee,
  AdditionalBookingForm,
  MetaDatas,
  MobileCustomerQueries,
  MobileGeneralQueries,
  RollerAvailableProducts,
  Customers,
  Discounts,
  DiscountProducts,
  DiscountCodes,
  BookingItems,
  BookingItemMetas,
  BookingItemDiscounts,
  BookingItemModifiers,
  RestProductLocations,
  RestProductLocationtimes,
  RestProductAddons,
  RestProductRestrictedaddons,
  RestProductStockperiods,
  RestProductModifiers,
  RestProductModifiergroups,
  RestProductGiftcard,
  RestProductAgreement,
  MobileRolleCustomerMapping,
  TicketDiscounts,
  Webhooks,
  MembershipRedemptions,
  ApiLog,
  AccountDeleteRequests,
  PushNotificationLogs,
  ApiTextLogs,
  Sample_tbl,
};