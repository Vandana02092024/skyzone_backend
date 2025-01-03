import { MobileCustomers, Customers , Sample_tbl } from "../../../config/tables.js";
import CommonFunction from "../../../helper/common.js";
import axios from "axios";

// create test api for create user

export const createData = async (req, res) => {
    try {
        const data = req.body;
       const createData = await Sample_tbl.create(data);

       if(createData) {
        return res.status(200).json(CommonFunction.succsMessage('success', createData));
       } else {
        return res.status(200).json(CommonFunction.errMessage('somthing went wrong'));
       }
    
    } catch (err) {
        res.status(500).json({ code: false, message: err.message });
    }
};

export const getData = async (req, res) => {
    try {
        const { select } = req.query;
       const selectColumns = select ? select.split(',').map(col => col.trim()) : [
        'id',
        'text1',
        'text2',
        'created_at'
        ];

        const listData = await Sample_tbl.findAll({
            attributes: selectColumns,
        });

       if(listData) {
        return res.status(200).json(CommonFunction.succsMessage('success', listData));
       } else {
        return res.status(200).json(CommonFunction.errMessage('somthing went wrong'));
       }
    
    } catch (err) {
        res.status(500).json({ code: false, message: err.message });
    }
};

export const listUser = async (req, res) => {
    try {
        const encrypt_data = CommonFunction.encrypt("text");
        const decrypt_data = CommonFunction.decrypt("test");
        const data = {
            encrypt_data: encrypt_data,
            decrypt_data: decrypt_data,
        };

        return res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ code: false, message: err.message });
    }
};

// Encryption and Decrption

export const MobileCustomerEncryption = async (req, res) => {
    const url = "";

    try {
        const response = await axios.get(url);
        const customers = response.data;

        // Process encryption and update in parallel
        const updatePromises = customers.map(async (customer) => {
            const updateData = {
                email: CommonFunction.encrypt(customer.email),
                phone: CommonFunction.encrypt(customer.phone),
                profile_picture: CommonFunction.encrypt(customer.profile_picture),
            };
            await MobileCustomers.update(updateData, {
                where: { id: customer.id },
            });
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        return res.status(200).json(CommonFunction.succsMessage("success", {})); // Consider returning an appropriate success message
    } catch (error) {
        console.error("Error during encryption:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error", error.message));
    }
};

export const CustomerEncryption = async (req, res) => {
    const url = "";

    try {
        const response = await axios.get(url);
        const customers = response.data;

        // Process encryption and update in parallel
        const updatePromises = customers.map(async (customer) => {
            const updateData = {
                email: CommonFunction.encrypt(customer.email),
                contactNumber: CommonFunction.encrypt(customer.contactNumber),
                status: 1,
            };
            await Customers.update(updateData, {
                where: { customerId: customer.customerId },
            });
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        return res.status(200).json(CommonFunction.succsMessage("success", {})); // Consider returning an appropriate success message
    } catch (error) {
        console.error("Error during encryption:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error", error.message));
    }
};

// DEFAULT EXPORT
export default MobileCustomers;