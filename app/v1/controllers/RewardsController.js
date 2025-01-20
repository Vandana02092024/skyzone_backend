import  CommonFunction from "../../../helper/common.js";
import rewardService from '../models/rewards.js';
import fs from 'fs/promises';
import QRCode  from 'qrcode';
import s3 from '../../../helper/aws.js';

const getDiscountProducts = async (req, res) => {

    
    const client_id = req.query.client_id;
    if (!client_id) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
  
    try {

        const productDt = await rewardService.getDiscountProducts(client_id);
  
      if (productDt.length > 0) {
        return res.status(200).json(CommonFunction.succsMessage('success',productDt));
      } else {
        return res.status(404).json(CommonFunction.errMessage('No data available'));
      }
    } catch (error) {
      console.error('Error fetching discount products:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
    }
};

const generateDiscount = async (req, res) => {
  const { client_id, id } = req.body;
  const customer_id = CommonFunction.getCustomerId(req, res);
  
  if (!customer_id) {
      return res.status(400).json({ message: 'Customer ID is required.' });
  }
  
  if (!client_id) return res.status(400).json({ message: 'Client ID is required.' });
  if (!id) return res.status(400).json({ message: 'ID is required.' });

  try {
      let productDt = await rewardService.getDiscountProduct(client_id, id);
      if (!productDt) return res.status(404).json({ message: 'No discount products found.' });

      let product = { discount_id: productDt?.id, points: productDt?.points };
      productDt = await rewardService.getRedeemProduct(product, client_id, customer_id);

      if (productDt===null) {
          productDt = await rewardService.getDiscountProduct(client_id, id);
          if (productDt && productDt.discount_code) {
              let code = productDt?.discount_code;
              let qrCodeBuffer =   await QRCode.toBuffer(code, { width: 100 });
      
              const filename = `${code}.png`;
              const result = await s3.upload({
                Bucket: process.env.AWS_QRCODE_BUCKET_NAME,
                Key: filename,
                Body: qrCodeBuffer,
                ContentType: 'image/png', // MIME type
                ACL: 'public-read'
              }).promise();
          
              const qrcode = `${process.env.AWS_QRCODE_BUCKET_URL}${filename}`;
              let redeem_prds = {
                  discount_id: productDt.id,
                  product_id: productDt.product_id,
                  product_name: productDt.title,
                  discount_code: productDt.discount_code,
                  point_redeemed: productDt.points,
                  qr_url: qrcode
              };
              let id = await rewardService.redeemRewards(redeem_prds, client_id, customer_id);
              redeem_prds.id = id;
              redeem_prds.status = '0';
              productDt = redeem_prds;
          } else {
              return res.status(404).json(CommonFunction.errMessage('No discount code available.'));
          }
      }
      return res.status(200).json(CommonFunction.succsMessage('success',productDt));
  } catch (error) {
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const QrScanned = async (req, res) => {

  const { client_id, id } = req.body;

  const customer_id = CommonFunction.getCustomerId(req, res);
  if (!customer_id) {
    return res.status(400).json({ message: 'Customer ID is required.' });
  }

  if (!client_id) return res.status(400).json({ message: 'Client ID is required.' });
  if (!id) return res.status(400).json({ message: 'ID is required.' });

  try {
    const result = await rewardService.QrScanned(customer_id, client_id, id);

    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json(CommonFunction.succsMessage('success',result));
  } catch (error) {
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const listScannedQrs = async (req, res) => {
  const client_id  = req.query.client_id;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;
  const customer_id = CommonFunction.getCustomerId(req, res);

  if (!customer_id) {
    return res.status(400).json(CommonFunction.errMessage('Customer ID is required.'));
  }

  if (!client_id) {
    return res.status(400).json(CommonFunction.errMessage('Client ID is required.'));
  }

  try {
    const results = await rewardService.listScannedQrs(client_id, customer_id,items_per_page, page);
    const final_response = results.res;
    const total_pages = Math.ceil(results.total / items_per_page);
    const responseData = {
      page: page,
      total_pages: total_pages,
      data: final_response,
  };
    if (responseData) {
      return res.json(CommonFunction.succsMessage('success',responseData));
    } else {
      return res.json(CommonFunction.errMessage('No data available'));
    }
  } catch (error) {
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

export {
  getDiscountProducts,
  generateDiscount,
  QrScanned,
  listScannedQrs
};