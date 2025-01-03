import axios from 'axios';
import moment from 'moment';
import dotenv from 'dotenv';

import {
    RollerAuth,
    AdditionalBookingForm,
    RestProductPackageItem,
    RestProducts,
    RestProductParent
  } from '../config/tables.js';

dotenv.config();

const rollerUtils = {};

let accessToken = null;
const url = process.env.ROLLER_URL;

const getAccessToken = async (clientId, clientSecret, tokenEndpoint) => {
  const data = {
    client_id: clientId,
    client_secret: clientSecret,
  };

  try {
    const response = await axios.post(`${url}${tokenEndpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      return accessToken;
    } else {
      throw new Error('Unable to retrieve access token.');
    }
  } catch (error) {
    console.error('Error getting access token:', error.message);
    return false;
  }
};

rollerUtils.getRequest = async (endpoint,accessToken) => {
  try {
    const response = await axios.get(`${url}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in GET request:', error.message);
    return null;
  }
};

rollerUtils.deleteRequest = async (endpoint,accessToken) => {
  try {
    const response = await axios.delete(`${url}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in DELETE request:', error.message);
    return null;
  }
};

rollerUtils.postRequest = async (endpoint,accessToken, data) => {
   const bookingData =data.booking_data;
  try {
    const response = await axios.post(`${url}${endpoint}`, bookingData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in POST request:', error.message);
    return null;
  }
};

rollerUtils.sendRequest = async (method, endpoint,accessToken, data = {}) => {
  const postdata = data ? data.data : null;
  if (!accessToken) {
    throw new Error('Access token is missing. Call getAccessToken() first.');
  }

  try {
    const response = await axios({
      method,
      url: `${url}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: postdata,
    });

    return response.data;
  } catch (error) {
    console.error(`Error :`, error);
    return null;
  }
};

rollerUtils.getTokenDetails = async (location) => {
    try {

     const credentl = await RollerAuth.findOne({
        attributes: ['client_id', 'client_secret', 'refresh_token', 'token_ref_on'],
        where: { location: location }, 
      });
  
      if (!credentl) {
        throw new Error('Credentials not found.');
      }
  
      const clientId = Buffer.from(credentl.client_id, 'base64').toString('ascii');
      const clientSecret = Buffer.from(credentl.client_secret, 'base64').toString('ascii');
      const refToken = credentl.refresh_token;
      const tokenRefOn = credentl.token_ref_on;
  
      const currentDateTime = moment();
      const givenDateTime = moment(tokenRefOn);
      const timeDifference = currentDateTime.diff(givenDateTime, 'minutes');
  
      if (timeDifference >= 12 * 60) {
        // Fetch new token
        const tokenEndpoint = '/token';
        const token = await getAccessToken(clientId, clientSecret,tokenEndpoint);
  
        if (token) {
          const updates = {
            refresh_token: token,
            token_ref_on: moment().format('YYYY-MM-DD HH:mm:ss'),
          };
  
        await RollerAuth.update(updates, {
            where: { location: location }
        });
          accessToken = token;
        } else {
          throw new Error('Failed to fetch new access token.');
        }
      } else {
        // Use existing token
        accessToken = refToken;
      }
  
      return {
        clientId,
        clientSecret,
        accessToken,
      };
    } catch (error) {
      console.error('Error in newRollerClass:', error.message);
      return null;
    }
};

const getValues = async(model, attributes, where, single = false) => {
    const query = {
      attributes,
      where
    };
  
    if (single) {
      return model.findOne(query);
    } else {
      return model.findAll(query);
    }
}

rollerUtils.PackageProcess = async (rollerResponse, type, location = false, includeProds = false , card_id = false) => {

  let products = {};
  let productsF = {};

  if (includeProds) {
      // includeProds = includeProds.split(',').map(id => parseInt(id, 10));
      includeProds = includeProds.split(',').map(id => id);
  }

  if(card_id && card_id === 2 && rollerResponse[0]?.products.length <= 0){
    if (Object.keys(products).length === 0) {
        products.products = [];
    }
    productsF = { ...products };
  } else 
  {
    for (const value of rollerResponse) {
        if (value.availabilities && type === 'inclusions' && value.type === 'addon') {
            const addBook = await AdditionalBookingForm.findAll({
                attributes: ['id', 'parent_id', 'search_term'],
                where: { client_id: location }
            });

            const cproducts = [];
            for (const productV of value.products) {
                if ((!includeProds || includeProds.includes(productV.id))) {
                    const productDt = await RestProducts.findOne({
                        attributes: ['packageItems.cost', 'packageItems.quantity'],
                        where: { Pid: productV.id },
                        include: [{
                            model: RestProductPackageItem,
                            as: 'packageItems',
                            attributes: [],
                            required: true
                        }]
                    });

                    if (productDt) {
                        productV.cost = productDt?.cost !== null ? productDt?.cost : productV?.cost;
                        productV.quantity = productDt?.quantity !== null ? productDt?.quantity : productV?.quantity;
                    }

                    productV.cost = parseFloat(productV?.cost);
                    productV.tax = parseFloat(productV?.tax);

                    let addForm = false;
                    for (const addVal of addBook) {
                        const searchTerms = addVal.search_term.split(',');
                        for (const term of searchTerms) {
                            if (productV.name.toLowerCase().includes(term.toLowerCase())) {
                                addForm = await RestProducts.findAll({
                                    attributes: [
                                      ['Pid', 'id'],
                                      'name'
                                    ],
                                    where: { parent_id: addVal.parent_id }
                                });
                                break;
                            }
                        }
                    }

                    if (addForm) {
                        productV.addition_form = addForm.map(f => f.toJSON());
                    }

                    cproducts.push({ ...productV, ...value.availabilities[0].allocations[0] });
                }
            }

            if (cproducts.length > 0) {
                products.categories = products.categories || [];
                products.categories.push({
                    id: value.id,
                    name: value.name,
                    description: value.description,
                    imageUrl: value.imageUrl,
                    products: cproducts
                });
            }
        } else if (value.sessions && type === 'sessionpass') {
            const sessions = {};
            for (const svalue of value.sessions) {
                if (svalue.onlineSalesOpen) {
                    for (const savalue of svalue.allocations) {
                        sessions[savalue.productId] = sessions[savalue.productId] || [];
                        delete svalue.allocations;
                        sessions[savalue.productId].push({ session: svalue, allocation: savalue });
                    }
                }
            }

            let i = 0;

          
            for (const productV of value.products) {
                if ((includeProds && includeProds.includes(productV.id)) || !includeProds) {
                    const productDt = await RestProducts.findOne({
                      where: { Pid: productV.id },
                      attributes: ['minPurchase', 'tax'],
                      include: [
                        {
                          model: RestProductPackageItem,
                          attributes: ['cost', 'packageProductId'],
                          as: 'packageItems',
                          required: true,
                          include: [
                            {
                              model: RestProducts, // Alias for package product
                              as: 'packageProduct',
                              attributes: ['cost'],
                              required: true,
                            },
                          ],
                        },
                        {
                          model: RestProductParent,
                          attributes: ['depositPercentage', 'depositAmount'],
                          as: 'parent',
                          required: true,
                        },
                      ],
                    });

                   const productData = {
                        ...productV,
                        tax: parseFloat(productV?.tax),
                        minPurchase: productDt?.dataValues?.minPurchase,
                        depositPercentage: productDt?.dataValues?.parent?.dataValues?.depositPercentage !== null ? parseFloat(productDt?.dataValues?.parent?.dataValues?.depositPercentage) : productDt?.dataValues?.parent?.dataValues?.depositPercentage,
                        depositAmount: productDt?.dataValues?.parent?.dataValues?.depositAmount !== null ? parseFloat(productDt?.dataValues?.parent?.dataValues?.depositAmount) : productDt?.dataValues?.parent?.dataValues?.depositAmount,
                        sessions: sessions[productV.id] || []
                    };

                    if (productDt && productDt?.packageProductId !== null) {
                        productData.packageProductId = productDt?.packageProductId;
                    }

                    if (productDt && productDt?.dataValues?.packageItems?.dataValues?.packageProduct?.cost !== null && (card_id && card_id===2)) {
                        productData.cost = parseFloat(productDt?.dataValues?.packageItems?.dataValues?.packageProduct?.cost);
                    }

                  //   if (productDt && productDt?.tax !== null) {
                  //     productData.tax = parseFloat(productDt?.tax);
                  // }

                    products.products = products.products || [];
                    products.products[i++] = productData;
                }
            }
        } else if (value.type === 'membership') {
            for (const productV of value.products) {
                products.products = products.products || [];
                products.products.push({ ...productV, ...value.availabilities[0].allocations[0] });
            }
        }

        if (Object.keys(products).length === 0) {
            products.products = [];
        }

        productsF = { ...products };
    }
  }
  return productsF;
};

export default rollerUtils;