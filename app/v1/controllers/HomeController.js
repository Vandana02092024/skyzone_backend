import { ClientMaster, CategoryCard, MobileCustomerMemberships, MobileCustomerChildMemberships, LatestOfferings, LatestOfferProducts, RestProducts, RestProductParent } from "../../../config/tables.js";
import { Sequelize, Op } from "sequelize";
import CommonFunction from "../../../helper/common.js";
import geolib from "geolib";
import NodeGeocoder from "node-geocoder";
import fetch from "node-fetch";
import { encode, decode } from "html-entities";
import dotenv from "dotenv";

dotenv.config();

// CRAETE A NEW USER //

const isNull = (value) => value === null || value === undefined || value === "";

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
};

const sanitizeInput = (input) => {
    if (typeof input === "string") {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return input;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return geolib.getDistance({ latitude: lat1, longitude: lon1 }, { latitude: lat2, longitude: lon2 }) * 0.000621371; // Convert meters to miles
};

const options = {
    provider: "openstreetmap",
    fetch: async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HttpError: ${response.statusText}`);
        }
        return response.json();
    },
};

const geocoder = NodeGeocoder(options);

const getLatLong = async (address) => {
    try {
        const res = await geocoder.geocode(address);
        if (res && res.length > 0) {
            return { latitude: res[0].latitude, longitude: res[0].longitude };
        }
        return null;
    } catch (error) {
        console.error("Error fetching lat/long:", error);
        throw error;
    }
};

const searchLocations = async (search, limit, getAddress = false) => {
    let whereClauses = [];
    let address = "";

    if (search.city) {
        whereClauses.push({ address: { [Op.like]: `%${search.city}%` } });
        address += `${search.city} `;
    }

    if (search.state) {
        whereClauses.push({ address: { [Op.like]: `%${search.state}%` } });
        address += `${search.state} `;
    }

    if (search.zipcode) {
        whereClauses.push({ address: { [Op.like]: `%${search.zipcode}%` } });
        address += `${search.zipcode}`;
    }

    const results = await ClientMaster.findAll({
        where: {
            [Op.and]: [...whereClauses, { can_access: "1", status: "1" }],
        },
        limit: limit,
        attributes: ["client_id", "client_name", "location", "latitude", "longitude", "address"],
        raw: true,
    });
    return results;
};

export const searchNearbyLocations = async (req, res) => {
    let { latitude, longitude, city, state, zipcode, limit = 5 } = req.query;
    let results;

    try {
        if (!(latitude && longitude) || latitude === "undefined" || longitude === "undefined") {
            results = await searchLocations({ city, state, zipcode }, limit, false);
        } else if (latitude && longitude) {
            results = await ClientMaster.findAll({
                attributes: [
                    "client_id",
                    "client_name",
                    "location",
                    "latitude",
                    "longitude",
                    "address",
                    [
                        Sequelize.literal(`ROUND(
            6371 * 0.621371 *
            acos(
              cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(${longitude}) - radians(longitude)) +
              sin(radians(${latitude})) * sin(radians(latitude))
            ), 2
          )`),
                        "distance",
                    ],
                ],
                where: {
                    latitude: { [Op.ne]: null },
                    longitude: { [Op.ne]: null },
                    status: "1",
                    on_boarding: "1",
                },
                order: Sequelize.literal("distance ASC"),
                limit: parseInt(limit),
                raw: true,
            });
        }

        if (results.length > 0) {
            res.status(200).json(CommonFunction.succsMessage("success", results));
        } else {
            res.status(404).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        console.error("Error fetching nearby locations:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const getCategories = async (req, res) => {
    try {
        const cards = await CategoryCard.findAll({
            attributes: [[Sequelize.literal("id"), "card_id"], "name", "description", "thumbnail"],
            where: {
                /* conditions can be added here */
            },
        });

        if (cards.length > 0) {
            res.status(200).json({ status: "success", message: "success", data: cards });
        } else {
            res.status(404).json({ message: "No data available" });
        }
    } catch (error) {
        console.error("Error fetching category cards:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const getClientDetails = async (req, res) => {
    try {
        const { client_id } = req.query;
        if (!client_id) {
            return res.status(400).json(CommonFunction.errMessage("Please Provide client Id"));
        }

        // Fetch client details
        const clientDetails = await ClientMaster.findOne({
            attributes: ["client_id", "client_name", "location", "latitude", "longitude", "address", "phone_number", [Sequelize.literal("''"), "time"], "stripe_account_id"],
            where: { client_id },
        });

        if (clientDetails) {
            res.status(200).json({ message: "success", data: clientDetails });
        } else {
            res.status(404).json({ message: "No data available" });
        }
    } catch (error) {
        console.error("Error fetching client details:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const getOfferings = async (req, res) => {
    const client_id = req.query.client_id;
    const customer_id = CommonFunction.getCustomerId(req, res);

    if (!client_id || !customer_id) {
        return res.status(400).json({ message: "Client ID and Customer ID are required" });
    }

    try {
        // Parent membership count
        const parentMembershipCount = await MobileCustomerMemberships.count({
            where: {
                customer_id,
                client_id,
                expiry_date: {
                    [Op.gte]: new Date(),
                },
            },
        });

        // Child membership count
        const childMembershipCount = await MobileCustomerChildMemberships.count({
            where: {
                customer_id,
                client_id,
                expiry_date: {
                    [Op.gte]: new Date(),
                },
            },
        });

        let displayCondition = { display_to: "0" };
        if (parentMembershipCount > 0 || childMembershipCount > 0) {
            displayCondition = {};
        }

        // Fetch offerings
        const offerings = await LatestOfferings.findAll({
            attributes: [
                "id",
                ["title", "name"],
                ["image", "thumbnail"],
                [
                    Sequelize.literal(`
          CASE
            WHEN offer_type = 1 THEN 'Membership'
            WHEN offer_type = 2 THEN 'Ticket Purchase'
            ELSE 'Packages'
          END
        `),
                    "category",
                ],
            ],
            where: {
                client_id,
                camp_end_date: {
                    [Op.gte]: new Date(),
                },
                status: "1",
                ...displayCondition,
            },
            order: [["id", "DESC"]],
            limit: 10,
        });

        if (offerings.length > 0) {
            return res.status(200).json(CommonFunction.succsMessage("success", offerings));
        } else {
            return res.status(404).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        console.error("Error fetching offerings:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const getAllOfferings = async (req, res) => {
    const { client_id } = req.query;

    if (!client_id) {
        return res.status(400).json({ message: "Client ID is required" });
    }

    try {
        const offerings = await LatestOfferings.findAll({
            attributes: ["id", "title", "image", "offer_type"],
            where: {
                client_id,
                camp_end_date: {
                    [Op.gte]: new Date(),
                },
                status: "1",
                display_to: "0",
            },
            order: [["id", "DESC"]],
            limit: 10,
        });
        const baseUrl = process.env.RIVETTE_IMAGE_BUCKET;

        if (offerings.length > 0) {
            // Using Promise.all to map the offerings correctly
            const data = await Promise.all(
                offerings.map(async (offering) => {
                    let image = offering?.image || "";
                    let pathToEncode = image.replace(baseUrl, "");
                    let encodedPath = encodeURIComponent(pathToEncode);
                    return {
                        id: offering.id,
                        name: offering.title,
                        thumbnail: baseUrl + encodedPath,
                        category: offering?.offer_type === "1" ? "Membership" : offering?.offer_type === "2" ? "Ticket Purchase" : "Packages",
                    };
                })
            );

            return res.status(200).json(CommonFunction.succsMessage("success", data));
        } else {
            res.status(404).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        console.error("Error fetching offerings:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const getOffersProducts = async (req, res) => {
    const { offer_id } = req.query;

    if (!offer_id) {
        return res.status(400).json(CommonFunction.errMessage("Offer ID is required"));
    }

    try {
        const offer = await LatestOfferings.findOne({
            attributes: [
                "id",
                "title",
                "image",
                "description",
                "camp_end_date",
                "offer_type",
                [
                    Sequelize.literal(`
              CASE
                WHEN offer_type = '1' THEN 'Membership'
                WHEN offer_type = '2' THEN 'Ticket Purchase'
                ELSE 'Packages'
              END
            `),
                    "type",
                ],
                "camp_type",
                "discount_type",
                "discount_amount",
                "discount_percent",
                "discount_code",
                "reward_points",
            ],
            where: {
                id: offer_id,
            },
        });

        if (!offer) {
            return res.status(404).json(CommonFunction.errMessage("Offer not found"));
        }

        // Fetch offer products
        const offerProducts = await LatestOfferProducts.findAll({
            attributes: ["parent_product_id", "product_id"],
            where: {
                offer_id,
            },
            include: [
                {
                    model: RestProducts,
                    attributes: ["Pid", "imageUrl", "description"],
                    include: [
                        {
                            model: RestProductParent,
                            attributes: ["Pid", "name", "type", "description"],
                        },
                    ],
                },
            ],
        });

        // Transform the offer products into the desired format
        const products = offerProducts.map((op) => ({
            id: op.rest_product?.rest_product_parent.Pid,
            parentProductId: op.rest_product?.rest_product_parent.Pid,
            name: op.rest_product?.rest_product_parent.name,
            type: op.rest_product?.rest_product_parent.type,
            imageUrl: op.rest_product?.imageUrl,
            description: op.rest_product?.rest_product_parent?.description ? decode(op.rest_product?.rest_product_parent?.description.replace(/<\/?[^>]+(>|$)/g, "")) : "",
            rawdesc: op.rest_product?.rest_product_parent?.description ? decode(op.rest_product?.rest_product_parent?.description) : "",
            onlineSalesOpen: true,
        }));

        // Construct the final response
        const finalResponse = {
            title: offer.title,
            description: offer?.description ? decode(offer?.description.replace(/<\/?[^>]+(>|$)/g, "")) : "",
            rawdesc: offer?.description ? decode(offer?.description) : "",
            thumbnail: offer.image,
            campaign_type: offer.camp_type,
            date: offer.camp_end_date,
            reward_points: offer.camp_type === "1" ? offer.reward_points : undefined,
            discounts:
                offer.camp_type === "2"
                    ? [
                          {
                              code: offer.discount_code,
                              ...(offer.discount_type === "0" ? { amount: offer.discount_amount } : { percentage: offer.discount_percent }),
                          },
                      ]
                    : undefined,
            plans: products,
        };

        res.status(200).json(CommonFunction.succsMessage("success", finalResponse));
    } catch (error) {
        console.error("Error fetching offer:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export default ClientMaster;