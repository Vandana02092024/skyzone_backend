import CommonFunction from "../../../helper/common.js";
import logService from "../models/logs.js";
import { body, validationResult } from 'express-validator';

const createLogs = async (req, res) => {

    // Input validation and sanitization
    await body('log')
        .notEmpty().withMessage('Log data is required.')
        .trim().escape() // Sanitize by trimming and escaping special characters
        .run(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(CommonFunction.errMessage('Invalid input', errors.array()));
    }

    const data = req.body.log;
    // Mandatory fields validation
    if (!data) return res.status(400).json(CommonFunction.errMessage("log data is required."));

    try {
      const createLog = await logService.createMenualLogs(data);
      if(createLog){
        res.status(200).json(CommonFunction.succsMessage("Logs create successfully.", []));
      }  
    } catch (error) {
        console.log("Error in createLogs", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const getLogs = async (req, res) => {
    try {
      const customer_id = CommonFunction.getCustomerId(req, res);
      const getList = await logService.getLog();
      if(customer_id===2){
        res.status(200).json(CommonFunction.succsMessage("success", getList));
      } else {
        return res.status(200).json(CommonFunction.errMessage("Invalid User"));
      }  
    } catch (error) {
        console.log("Error in getLogs", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export { createLogs , getLogs};