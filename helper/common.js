import dotenv from 'dotenv';
import { decodeToken } from '../config/jwt.js';
import CryptoJS from 'crypto-js';

dotenv.config();


const CommonFunction = {};

CommonFunction.infoMessage = (message, data = {}) => {
  return {
    status: "Info",
    message: message,
    data: data,
  };
};

CommonFunction.warningMessage = (message, data = {}) => {
  return {
    status: "Warning",
    message: message,
    data: data,
  };
};

CommonFunction.errMessage = (message, data = {}, errorInformation='') => {
    return { 
        status: 'failed', 
        message: message,
        data:data
    };
  };

CommonFunction.succsMessage = (message = '', data = {}, totalCounter = '', customID = '') => {
    const empty = (value) => {
      return (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (Array.isArray(value) && value.length === 0)
      );
    };
  
    try {
      const result = {
        status: 'success',
        message: message,
        data: data,
      };
      if (!empty(totalCounter)) {
        result.counts = totalCounter;
      }
      if (!empty(customID)) {
        result.customerID = customID;
      }
      return result;
    } catch (error) {
      console.error('Error in succsMessage:', error);
      return { code: false, message: error.message };
    }
};

CommonFunction.getCustomerId = (req, res) => {
  const authHeader = req.headers.authorization;

  if(authHeader){
    const token = authHeader.replace("Bearer ", "");
    const decodedToken = decodeToken(token);
    const customer_id = decodedToken.customer_id;
    return customer_id;
  } else {
    return '';
  }
}

CommonFunction.getDecodeToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if(!authHeader){
    return res.status(401).json({ message: 'Unauthorized - Token missing' });
  }
  const token = authHeader.replace("Bearer ", "");
  const decodedToken = decodeToken(token);
  return decodedToken;

}

const key = CryptoJS.enc.Utf8.parse(process.env.RIVETTE_KEY); // 16 bytes key for AES-128
const iv = CryptoJS.enc.Utf8.parse(process.env.SECRET_IV); // 16 bytes IV for AES

CommonFunction.encrypt = (data) => {
  try {
    if(data==='' || data===null || data===undefined) {
      return '';
    }
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
  });
  return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw error; // Re-throw the error if needed
  }
}

CommonFunction.decrypt = (encryptedData) => {
  try {
    if(encryptedData==='' || encryptedData===null || encryptedData===undefined) {
      return '';
    }
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
  });
  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    try {
      return decryptedText;
    } catch (error) {
      return error;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw error; // Re-throw the error if necessary
  }
}

export default CommonFunction;