import { ClientMaster, RestProducts, RestProductParent, AddOns } from "../../../config/tables.js";
import CommonFunction from "../../../helper/common.js";
import productService from "../models/products.js";
import rollerUtils from "../../../helper/roller.js";

// API function to get addons
export const getAddons = async (req, res) => {
    const { client_id, card_id } = req.query;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
    }

    if (!card_id) {
        return res.status(400).json(CommonFunction.errMessage("Card ID is required"));
    }

    try {
        const addons = await AddOns.findAll({
            where: {
                client_id,
                card_id,
            },
            include: [
                {
                    model: RestProducts,
                    include: [
                        {
                            model: RestProductParent,
                            attributes: ["name", "imageUrl", "description"],
                        },
                    ],
                    attributes: ["Pid", "parent_id", "name", "description", "imageUrl", "cost", "tax", "isTaxInclusive", "minPurchase", "fee"],
                },
            ],
        });

        const finalResponse = {};
        const productAry = {};
        const categoryAry = {};

        addons.forEach((addon) => {
            const product = addon?.rest_product;
            const parent = addon?.rest_product?.rest_product_parent;
            const parentId = addon?.parent_id;

            if (!productAry[parentId]) {
                productAry[parentId] = [];
            }

            productAry[parentId].push({
                id: product.Pid,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                cost: product.cost,
                tax: product.tax,
                isTaxInclusive: product.isTaxInclusive,
                minPurchase: product.minPurchase,
                fee: product.fee,
            });

            categoryAry[parentId] = {
                id: parentId,
                name: parent.name,
                description: parent.description,
                imageUrl: parent.imageUrl,
                products: productAry[parentId],
            };

            finalResponse[parentId] = categoryAry[parentId];
        });

        res.status(200).json(CommonFunction.succsMessage("success", Object.values(finalResponse)));
    } catch (error) {
        console.error("Error fetching addons:", error);
        res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
};

export const getSingalCard = async (req, res) => {
    const { client_id, card_id, date } = req.query;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
    }

    if (!card_id) {
        return res.status(400).json(CommonFunction.errMessage("Card ID is required"));
    }
    try {
        let cardDetails = await productService.getCardDetails(card_id, client_id);
        const result = cardDetails.dataValues;

        const productDt = await productService.getAvailableProducts(client_id);

        let availabilityDate = date ? date : new Date().toISOString().split("T")[0];
        const final_response = [];

        productDt?.forEach(async (value) => {
            if (value?.type === result?.product_type || (result?.product_type === "memberships" && value?.type === "membership")) {
                let clonedValue = { ...value.dataValues };

                clonedValue.rawdesc = value?.dataValues?.description;
                clonedValue.description = value?.dataValues?.description ? value?.dataValues?.description.replace(/<\/?[^>]+(>|$)/g, "") : "";
                clonedValue.onlineSalesOpen = value?.dataValues?.onlineSalesOpen;

                // Push the cloned object to final_response
                final_response.push(clonedValue);
            }
        });

        const response = {
            title: result.name,
            description: result?.description.replace(/<\/?[^>]+(>|$)/g, ""),
            rawdesc: result.description,
            thumbnail: result.header_img,
            date: availabilityDate,
            plans: final_response,
        };

        if (response.plans && response.plans.length > 0) {
            res.status(200).json(CommonFunction.succsMessage("success", response));
        } else {
            res.status(402).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        console.error("Error fetching getSingalCard:", error);
        res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
};

export const CheckProductAvailability = async (req, res) => {
    const { client_id, card_id, product_id, date, type } = req.query;
    let cardId = false;
    if (card_id && card_id !== undefined) {
        cardId = parseInt(card_id);
    }

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
    }

    if (!product_id) {
        return res.status(400).json(CommonFunction.errMessage("Product ID is required"));
    }
    try {
        const roller = await rollerUtils.getTokenDetails(client_id);

        let availabilityDate = date ? date : new Date().toISOString().split("T")[0];

        const endpoint = "/product-availability?date=" + availabilityDate + "&productIds=" + product_id;

        const roller_response = await rollerUtils.getRequest(endpoint, roller.accessToken);

        if (roller_response) {
            const pack_prd_type = type ? type : "sessionpass";
            let include_prods = false;
            if (roller_response[0]?.type === "package") {
                include_prods = await productService.packageIds(roller_response[0]?.products, client_id);
            }
            const transactionFee = await productService.getTransactionFee();

            const response = {
                id: product_id,
                parentProductId: roller_response[0]?.parentProductId,
                name: roller_response[0]?.name,
                transactionFee: transactionFee?.fee,
                parentProductName: roller_response[0]?.parentProductName,
                type: roller_response[0]?.type,
                description: roller_response[0]?.description.replace(/<\/?[^>]+(>|$)/g, ""),
                rawdesc: roller_response[0]?.description,
                imageUrl: roller_response[0]?.imageUrl,
                ...(await rollerUtils.PackageProcess(roller_response, pack_prd_type, client_id, include_prods, cardId)),
            };

            if (response) {
                res.status(200).json(CommonFunction.succsMessage("success", response));
            } else {
                res.status(402).json(CommonFunction.errMessage("No data available"));
            }
        } else {
            return res.status(400).json(CommonFunction.errMessage("No data avaiable"));
        }
    } catch (error) {
        console.error("Error fetching CheckProductAvailability:", error);
        res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
};

export const CalculateDiscount = async (req, res) => {
    const { offer_id,client_id, items } = req.body;
    if (!offer_id) {
        return res.status(400).json(CommonFunction.errMessage("Offer ID is required"));
    }
    if (!items) {
        return res.status(400).json(CommonFunction.errMessage("Items are required"));
    }
    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
    }
    try {
        const offer = await productService.getOfferDiscount(offer_id,client_id);
        if (!offer) {
            return res.status(404).json(CommonFunction.errMessage("Offer not found"));
        }
        if(!offer.discount_code) {
            return res.status(400).json(CommonFunction.errMessage("Offer has no discount code"));
        }
        const discount_code = offer.discount_code;
        // Define the payload as `data` using the variables
        const data = {
            items, // directly use items from request body
            discounts: [
            {
                code: discount_code // use discount_code variable
            }
            ]
        };
        const roller = await rollerUtils.getTokenDetails(client_id);
        const endpoint = "/discounts/validate";
        const method = "POST";
        const roller_response = await rollerUtils.sendRequest(method,endpoint, roller.accessToken, { data });
        const final_response = {
            discounts: roller_response?.discounts,
            total: roller_response?.bookingCosts?.total,
            discount: roller_response?.bookingCosts?.discount,
            tax: roller_response?.bookingCosts?.tax,
        }
        return res.status(200).json(CommonFunction.succsMessage('success', final_response));
    } catch (err) {
        console.error("Error fetching offer:", err);
        return res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
}

export default ClientMaster;