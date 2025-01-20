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

        // console.log('roller_response',roller_response[0]);
        // console.log('roller_response availabilities',roller_response[0]?.availabilities);
        // console.log('roller_response availabilities allocations',roller_response[0]?.availabilities[0]?.allocations);

        if (roller_response) {
            const pack_prd_type = type ? type : "sessionpass";
            let include_prods = false;
            let packageProductId =false;
            if (roller_response[0]?.type === "package") {
                include_prods = await productService.packageIds(roller_response[0]?.products, client_id);
                packageProductId = roller_response[0]?.products[0]?.id;
            }
            const transactionFee = await productService.getTransactionFee();

            const response = {
                id: product_id,
                parentProductId: roller_response[0]?.parentProductId,
                name: roller_response[0]?.name,
                transactionFee: transactionFee?.fee,
                parentProductName: roller_response[0]?.parentProductName,
                type: roller_response[0]?.type,
                packageProductId,
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
    const { offer_id,client_id, items , pre_data, fullPay } = req.body;

    console.log('payload',req.body);
    console.log('products',pre_data.products);
    try {

    if (!items) {
        return res.status(400).json(CommonFunction.errMessage("Items are required"));
    }
    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
    }
    if (!pre_data) {
        return res.status(400).json(CommonFunction.errMessage("Pre_data key is required"));
    }
    let offer;
    if(offer_id) {
         offer = await productService.getOfferDiscount(offer_id,client_id);
        if (!offer) {
            return res.status(404).json(CommonFunction.errMessage("Offer not found"));
        }
    }

    // calculate minDeposite amount
    const products = pre_data.products;
    const totalminDeposit = items.reduce((total, item) => {
        // Find the corresponding product from the products array
        const product = products.find((p) => p.id === String(item.productId));
      
        if (product) {
          let deposit = 0;
          if (product.depositPercentage !== null) {
            deposit = (product.cost * product.depositPercentage) / 100;
          } else if (product.depositAmount !== null) {
            deposit = product.depositAmount;
          }
          return total + deposit;
        }
      
        return total;
      }, null);

    let modifiedItems = items;

    // Check if type is 'package'
    if (pre_data.type === 'package' && pre_data.packageProductId) {
        // Update items array
         modifiedItems = items.map(item => {
            const checkProduct = pre_data.products.find(p => p.id === String(item.productId));
            if (checkProduct) {
                // Replace productId with pre_data.id
                return {
                    ...item,
                    productId: parseInt(pre_data.packageProductId, 10), // Ensure productId is a number
                };
            }
            return item; // Keep the original item if no match is found
        });
    }
        let EarnedPoints=0;
        let discount_code;
        let offerName;
        let rewardPoints;
        var message = false;
        if (!offer_id) {
            discount_code = 'NO_OFFER';
        } else if(!offer.discount_code) {
            discount_code = 'NO_OFFER';
            if(offer.camp_type==='1') {
                EarnedPoints = offer.reward_points;
                offerName = offer.title;
                rewardPoints = offer.reward_points;
            }
        } else {
            message = true;
            discount_code = offer.discount_code;
        }
        // Define the payload as `data` using the variables
        const data = {
            items: modifiedItems, // directly use items from request body
            discounts: [
            {
                code: discount_code // use discount_code variable
            }
            ]
        };
        console.log('data',data);
        const roller = await rollerUtils.getTokenDetails(client_id);
        const endpoint = "/discounts/validate";
        const method = "POST";
        const roller_response = await rollerUtils.sendRequest(method,endpoint, roller.accessToken, { data });
        console.log('roller_response',roller_response);
        const transactionFee = await productService.getTransactionFee();
        const totalAmt = roller_response?.bookingCosts?.total + transactionFee?.fee;
        const subtotalAmt = roller_response?.bookingCosts?.total + roller_response?.bookingCosts?.discount;
        const minDeposit = totalminDeposit ? totalminDeposit + transactionFee?.fee : totalAmt;
        let points = Math.ceil(minDeposit+EarnedPoints);
        const offerN = roller_response?.discounts[0]?.name ?roller_response?.discounts[0]?.name : offer?.title;
        const offerDetails = {
            offer:offerN,
            type: offer?.camp_type === '1' ? 'Rewards' : offer?.camp_type === '2' ? 'Discount' : offer?.camp_type === '3' ? 'Special' : '',
            value: offer?.camp_type === '1' ? `${rewardPoints} Points` : offer?.camp_type === '2' ? roller_response?.discounts[0]?.percentOff && `${roller_response?.discounts[0]?.percentOff}% OFF` : offer?.camp_type === '3' ? '' : '', 
        }
        if(fullPay) {
            points = Math.ceil(totalAmt+EarnedPoints);
        }
        const final_response = {
            subtotal: Math.floor(subtotalAmt * 100) / 100,
            offerDetails,
            // discount:  roller_response?.discounts[0]?.percentOff && `${roller_response?.discounts[0]?.percentOff}% OFF`,
            transactionFee: transactionFee?.fee,
            minDeposit: Math.floor(minDeposit * 100) / 100,
            total: Math.floor(totalAmt * 100) / 100,
            // discountAmt: Math.floor(roller_response?.bookingCosts?.discount * 100) / 100,
            points,
            // rewardPoints
        }
        if(message){
            var final_res = {...final_response, message: roller_response.discounts[0]?.validationMessage}
        }            
        else{
            var final_res = final_response;
        }
        return res.status(200).json(CommonFunction.succsMessage('success', final_res));
    } catch (err) {
        console.error("Error fetching offer:", err);
        return res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
}

export default ClientMaster;