import Stripe from 'stripe';

import dotenv from 'dotenv';
dotenv.config();

const apiversion = process.env.STRIPE_API_VERSION;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: apiversion, // Specify the API version you want to use
});

export default stripe;