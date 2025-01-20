import CommonFunction from "../../../helper/common.js";
import restaurantService from "../models/restaurant.js";
import firebaseService from "../models/firebase.js";
import { generateToken } from "../../../config/jwt.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove } from "firebase/database";
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
    databaseURL: process.env.FIREBASE_DB,
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);

// INITIALIZE REALTIME DATABASE
const database = getDatabase(app);

const CreateOrderInFirebase = async (req, res, data) => {
    try {
        await set(ref(database, data.order_path), data.order_detail);
        return { status: "true", message: "Data saved successfully!", data: data.order_detail.id };
    } catch (error) {
        res.status(400).json({ message: error.message, data: [] });
    }
};

const DeleteOrderInFirebase = async (req, res, order_path) => {
    try {
        await remove(ref(database, order_path));
        return { status: "true", message: "Deleted successfully!", data: order_path };
    } catch (error) {
        // return { status: "false", message: error.message, data: [] };
        res.status(400).json({ message: error, data: [] });
    }
};

const searchMenuItems = async (req, res) => {
    const { client_id, category_id } = req.query;
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
    }

    try {
        const clientId = parseInt(client_id, 10);
        const categoryId = category_id ? parseInt(category_id, 10) : null;

        const items = await restaurantService.getMenuItems(clientId, categoryId, page, items_per_page);

        let finalResponse = [];
        let categoryAry = {};

        items.forEach((item) => {
            const parentId = item.dataValues?.parent_id;

            if (parentId !== undefined && !categoryAry[parentId]) {
                categoryAry[parentId] = {
                    category_id: parentId,
                    name: item.dataValues.parent_name, // Access parent_name from dataValues
                };
            }

            if (parentId !== undefined) {
                finalResponse[parentId] = categoryAry[parentId];
            }
        });

        finalResponse = Object.values(finalResponse);

        if (finalResponse.length > 0) {
            return res.status(200).json(CommonFunction.succsMessage("success", finalResponse));
        } else {
            return res.status(404).json(CommonFunction.succsMessage("No data available", finalResponse));
        }
    } catch (error) {
        console.error("Error searching menu items:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getCategoryItems = async (req, res) => {
    const { client_id, category } = req.query;

    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
    }

    try {
        const clientId = parseInt(client_id, 10);
        const categoryId = category ? category : null;

        const items = await restaurantService.getMenuItems1(clientId, categoryId, page, items_per_page);

        let finalResponse = [];
        let categoryAry = {};
        const productAry = {};

        items?.items.forEach((item) => {
            const parentId = item.parent_id;

            if (!categoryAry[parentId]) {
                categoryAry[parentId] = {
                    category_id: parentId,
                    name: item.parent_name,
                    products: [],
                };
            }

            categoryAry[parentId].products.push({
                id: item.id,
                name: item.title,
                imageUrl: item.thumbnail || item.imageUrl,
                cost: item.price,
                description: item.description,
            });

            finalResponse[parentId] = categoryAry[parentId];
        });

        finalResponse = Object.values(finalResponse);

        const total_pages = Math.ceil(items.total / items_per_page);
        const response = {
            page: page,
            total_pages: total_pages,
            data: finalResponse,
        };

        if (response.data) {
            return res.status(200).json(CommonFunction.succsMessage("success", response));
        } else {
            return res.status(404).json(CommonFunction.errMessage("No data available", response));
        }
    } catch (error) {
        console.error("Error searching menu items:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getOffersBanner = async (req, res) => {
    const client_id = req.query.client_id;

    try {
        const clientId = 0;

        const items = await restaurantService.getOffersBanner(clientId);

        if (items) {
            return res.status(200).json(CommonFunction.succsMessage("success", items));
        } else {
            return res.status(404).json(CommonFunction.errMessage("No data available", items));
        }
    } catch (error) {
        console.error("Error searching items:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getPopularItems = async (req, res) => {
    const { client_id, category, search } = req.query;
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
    }

    try {
        const clientId = parseInt(client_id, 10);
        const categoryId = category ? category : null;
        const searchTerm = search ? search : null;

        const items = await restaurantService.getPopularItems(clientId, categoryId, searchTerm, page, items_per_page);

        let finalResponse = [];

        items?.items?.forEach((item) => {
            finalResponse.push({
                id: item.dataValues?.id,
                name: item.dataValues?.title,
                category_id: item.dataValues?.parent_id,
                category_name: item.dataValues?.parent_name,
                imageUrl: item.dataValues?.thumbnail || item.dataValues?.imageUrl,
                cost: item.dataValues?.cost,
                description: item.dataValues?.description,
                rating: (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1), // Generate a random rating between 3.0 and 5.0
            });
        });

        finalResponse = Object.values(finalResponse);
        const total_pages = Math.ceil(items.total / items_per_page);

        const response = {
            page: page,
            total_pages: total_pages,
            data: finalResponse,
        };

        if (response) {
            return res.status(200).json(CommonFunction.succsMessage("success", response));
        } else {
            return res.status(404).json(CommonFunction.succsMessage("No data available", response));
        }
    } catch (error) {
        console.error("Error searching popular items:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
};

// Login for Kitchen app portal

const sanitizeInput = (input) => {
    if (typeof input === "string") {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return input;
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data"));
    }

    const sanitizedUsername = sanitizeInput(username);
    const sanitizedpassword = sanitizeInput(password);

    try {
        const user = await restaurantService.checkUser(sanitizedUsername, sanitizedpassword);

        if (user.status === "true") {
            const token = generateToken({ id: user.data.dataValues.id, username: user.data.dataValues.username, customer_id: user.data.dataValues.client_id });
            return res.status(200).json(CommonFunction.succsMessage("success", { id: user.data.id, username: user.data.username, token: token }));
        } else {
            return res.status(404).json(CommonFunction.errMessage(user.message));
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

const OrdersStatusUpdate = async (req, res) => {
    const { order_id, order_status } = req.body;

    const client_id = CommonFunction.getCustomerId(req, res);

    if (!order_id || !order_status) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data"));
    }

    try {
        const order = await restaurantService.getOrder(order_id);
        let order_schema;
        if (order.status === "false") {
            return res.status(404).json(CommonFunction.errMessage("This order does not exist in our system. : " + order_id));
        }

        if (!client_id) {
            return res.status(400).json(CommonFunction.errMessage("Not a valid request."));
        }

        if (order.status === "true") {
            const orderDetails = order.data.dataValues;

            order_schema = await restaurantService.realtimeOrderSchema(orderDetails, order_status);

            if (order_schema.schema.order_detail.status) {
                let data = order_schema.schema;
                let ordert_path = data.order_path;
                // console.log('firebase data',data);

                const insertIntoFirebase = await CreateOrderInFirebase(req, res, data);
                if(order_status==='DONE' || order_status==='Done') {
                    await DeleteOrderInFirebase(req, res, ordert_path);
                }
                if (insertIntoFirebase.status === "true") {
                    const orderUpdate = await restaurantService.OrderUpdate({ kitchen_status: order_status }, order_id);
                    if (orderUpdate.status === "true") {
                        const device_ids = await firebaseService.getCustomerDeviceIds(orderDetails.customer_id, orderDetails.client_id);

                        if (device_ids.length > 0) {
                            for (const item of device_ids) {
                                let device_id = item?.dataValues?.device_id;
                                if(device_id) {
                                    await firebaseService.notifyMessage(device_id, order_status);
                                }
                            }
                            
                        }
                        return res.status(200).json(CommonFunction.succsMessage("success", order.data));
                    } else {
                        return res.status(404).json(CommonFunction.errMessage("There is some issue while updating order. Please contact your service provider."));
                    }
                } else {
                    return res.status(404).json(CommonFunction.errMessage("Can't udpate order status!"));
                }
            } else {
                return res.status(404).json(CommonFunction.errMessage(order_schema.status.message));
            }
        }
    } catch (error) {
        console.error("Error in OrdersStatusUpdate api:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

const filterOrders = async (req, res) => {
    const { order_id, customer_id } = req.query;
    const client_id = CommonFunction.getCustomerId(req, res);
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Not a valid request."));
    }

    try {
        let getorders = await restaurantService.searchOrders(client_id, customer_id, order_id,page, items_per_page);
        let orderDetails = getorders?.items;

        if (orderDetails.length === 0) {
            return res.status(404).json(CommonFunction.errMessage(`No data available for client_id: ${client_id}`));
        }

        let finalResponse = [];
        let productAry = {};
        let categoryAry = {};

        orderDetails.forEach((order) => {
            const orderData = order.toJSON();
            const orderId = orderData.order_id;

            productAry[orderId] = productAry[orderId] || [];
            productAry[orderId].push({
                name: orderData?.RestaurantOrderItems[0]?.RestProduct?.name,
                imageUrl: orderData?.RestaurantOrderItems[0]?.RestProduct?.imageUrl,
                cost: orderData?.RestaurantOrderItems[0]?.cost,
                tax: orderData?.RestaurantOrderItems[0]?.tax,
                quantity: orderData?.RestaurantOrderItems[0]?.quantity,
                comments: orderData?.RestaurantOrderItems[0]?.comments,
            });

            categoryAry[orderId] = {
                order_id: orderData?.order_id,
                name: orderData?.title,
                total_cost: orderData?.total_cost,
                total_quantity: orderData?.total_quantity,
                total_discount: orderData?.total_discount,
                order_date: orderData?.order_date,
                order_date_tm: orderData?.orderdatetime,
                status: orderData?.status,
                payment_date: orderData?.payment_date,
                products: productAry[orderId],
            };

            finalResponse[orderId] = categoryAry[orderId];
        });

        finalResponse = Object.values(finalResponse);
        finalResponse.client_id = client_id;

        const total_pages = Math.ceil(getorders?.total / items_per_page);

        const response = {
            page: page,
            total_pages: total_pages,
            data: finalResponse,
        };

        res.status(200).json(CommonFunction.succsMessage("success", response));
    } catch (error) {
        console.error("Error in getOrderDetails API:", error);
        res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const filterOrdersByCustomer = async (req, res) => {
    const { order_id, client_id } = req.query;

    const customer_id = CommonFunction.getCustomerId(req, res);
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Not a valid request."));
    }

    try {
        let getorders = await restaurantService.searchOrders(client_id, customer_id, order_id,page, items_per_page);
        let orderDetails = getorders?.items;

        if (orderDetails.length === 0) {
            return res.status(404).json(CommonFunction.errMessage(`No data available for client_id: ${client_id}`));
        }

        let finalResponse = [];
        let productAry = {};
        let categoryAry = {};

        orderDetails.forEach((order) => {
            const orderData = order.toJSON();
            const orderId = orderData.order_id;

            productAry[orderId] = productAry[orderId] || [];
            productAry[orderId].push({
                name: orderData.RestaurantOrderItems[0].RestProduct?.name,
                imageUrl: orderData.RestaurantOrderItems[0].RestProduct?.imageUrl,
                cost: orderData.RestaurantOrderItems[0].cost,
                tax: orderData.RestaurantOrderItems[0].tax,
                quantity: orderData.RestaurantOrderItems[0].quantity,
                start_time: 0,
                end_time: 0,
                comments: orderData.RestaurantOrderItems[0].comments,
            });

            categoryAry[orderId] = {
                order_id: orderData.order_id,
                name: orderData.title,
                total_cost: orderData.total_cost,
                total_quantity: orderData.total_quantity,
                total_discount: orderData.total_discount,
                order_date: orderData.order_date,
                order_date_tm: orderData.orderdatetime,
                status: orderData.status,
                payment_date: orderData.payment_date,
                products: productAry[orderId],
            };

            finalResponse[orderId] = categoryAry[orderId];
        });

        finalResponse = Object.values(finalResponse);

        finalResponse.client_id = client_id;

        const total_pages = Math.ceil(getorders?.total / items_per_page);

        const response = {
            page: page,
            total_pages: total_pages,
            data: finalResponse,
        };

        res.status(200).json(CommonFunction.succsMessage("success", response));
    } catch (error) {
        console.error("Error in getOrderDetails API:", error);
        res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const getProfileDetails = async (req, res) => {
    const decodeToken = CommonFunction.getDecodeToken(req, res);
    const client_id = decodeToken.customer_id;
    const id = decodeToken.id;

    if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Not a valid request."));
    }

    try {
        const userProfile = await restaurantService.getUserProfile(id);

        if (!userProfile) {
            return res.status(404).json(CommonFunction.errMessage("User profile not found!"));
        }

        let finalResponse = {
            client_id,
            name: userProfile.first_name,
            location: userProfile?.clientmaster?.location,
            address: userProfile?.clientmaster?.address,
            email: userProfile?.clientmaster?.reply_to,
            phone: userProfile?.clientmaster?.phone_number,
        };

        const orderStatus = await restaurantService.getOrderStatusCount(client_id);

        if (orderStatus) {
            finalResponse.completed_orders = parseInt(orderStatus.completed_count, 10);
            finalResponse.pending_orders = parseInt(orderStatus.pending_count, 10);
            finalResponse.total_orders = parseInt(orderStatus.total_orders, 10);
            finalResponse.inprocess_orders = parseInt(orderStatus.inprocess_count, 10);
        }

        res.status(200).json(CommonFunction.succsMessage("success", finalResponse));
    } catch (error) {
        console.error("Error in getProfileDetails API:", error);
        res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

// Reminder API

const CustomerReminder = async (req, res) => {
    const { order_id } = req.body;

    const client_id = CommonFunction.getCustomerId(req, res);

    if (!order_id) {
        return res.status(400).json(CommonFunction.errMessage("orderId is required"));
    }

    try {
        const order = await restaurantService.getOrder(order_id);
        let order_schema;
        if (order.status === "false") {
            return res.status(404).json(CommonFunction.errMessage("This order does not exist in our system. : " + order_id));
        }

        if (!client_id) {
            return res.status(400).json(CommonFunction.errMessage("Not a valid request."));
        }

        if (order.status === "true") {
            const orderDetails = order.data.dataValues;

            const device_ids = await firebaseService.getCustomerDeviceIds(orderDetails.customer_id, orderDetails.client_id);
            if (device_ids.length > 0) {
               let order_status = 'REMINDERS'; 
                for (const item of device_ids) {
                    let device_id = item?.dataValues?.device_id;
                    console.log('device_id',device_id);
                    if(device_id) {
                        await firebaseService.notifyMessage(device_id, order_status);
                    }
                }
                return res.status(200).json(CommonFunction.succsMessage("success", order.data));  
            }
            else {
                return res.status(404).json(CommonFunction.errMessage('Device id not found'));
            }
        }
    } catch (error) {
        console.error("Error in OrdersStatusUpdate api:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

export { searchMenuItems, getCategoryItems, getOffersBanner, getPopularItems, login, OrdersStatusUpdate, filterOrders, getProfileDetails, filterOrdersByCustomer, CreateOrderInFirebase , CustomerReminder };