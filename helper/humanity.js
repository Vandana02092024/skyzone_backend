import axios from 'axios';
import moment from 'moment';
import dotenv from 'dotenv';
import { Sequelize, Op } from 'sequelize';
import querystring from 'querystring';

import {
  HumanityRefreshKeys
  } from '../config/humanityTables.js';

dotenv.config();

const humanityUtils = {};

const url = process.env.HUMANITY_URL;

const getAccessToken = async (location=null) => {
  try {
    location = location ? location :1;
   const credentl = await HumanityRefreshKeys.findOne({
      attributes: ['client_id', 'access_token', 'refresh_token', 'expires_in','update_at'],
      where: { client_id: location }, 
    });

    if (!credentl) {
      throw new Error('Credentials not found.');
    }
    const ExToken = credentl.access_token;
    const tokenRefOn = credentl.update_at;

    const currentDateTime = moment();
    const givenDateTime = moment(tokenRefOn);
    const timeDifference = currentDateTime.diff(givenDateTime, 'minutes');
    console.log('timeDifference',timeDifference);
    let accessToken;

    if (timeDifference >= 12 * 60) {
      // Fetch new token
      const tokenUrl = 'https://www.humanity.com/oauth2/token.php';
      const token = await postRequest(credentl.refresh_token,tokenUrl);
      // console.log('token',token);

      if (token) {
        const updates = {
          refresh_token: token.refresh_token,
          access_token: token.access_token,
          update_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        };

      await HumanityRefreshKeys.update(updates, {
          where: { client_id: location }
      });
        accessToken = token.access_token;
      } else {
        throw new Error('Failed to fetch new access token.');
      }
    } else {
      // Use existing token
      accessToken = ExToken;
    }

    return accessToken;
  } catch (error) {
    console.error('Error in getTokenDetails:', error);
    return null;
  }
};

humanityUtils.getRequest = async (endpoint,QueryData=null) => {
  try {
     const token = await getAccessToken();
    //  return false;
    const response = await axios.get(`${url}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      params: QueryData ? QueryData : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error in GET request:', error.message);
    return null;
  }
};

const postRequest = async (refToken, tokenUrl) => {
  
  const resData = {
    client_id: process.env.HUMANITY_CLIENT_ID,
    client_secret: process.env.HUMANITY_CLIENT_SECRET,
    redirect_uri: process.env.HUMANITY_REDIRECT_URL,
    grant_type: 'refresh_token',
    refresh_token: refToken
  };

  try {
    const response = await axios.post(`${tokenUrl}`, querystring.stringify(resData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in POST request:', error.message);
    return error;
  }
};

export default humanityUtils;