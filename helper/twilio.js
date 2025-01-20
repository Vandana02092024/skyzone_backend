import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const twilioUtils = {};
const twillo_base_url = process.env.TWILLO_BASE_URL;
const email_verify = process.env.TWILLO_EMAIL_VERIFY;
const twillo_verify = process.env.TWILLO_VERIFY;
const twillo_check_verify = process.env.TWILLO_CHECK_VERIFY;

twilioUtils.twilio_curl_post = async (data, email = false) => {
  const url = email
    ? `${twillo_base_url}${email_verify}`
    : `${twillo_base_url}${twillo_verify}`;

  try {
    const response = await axios.post(url, data);
    return { code: true, data: response.data, to:data };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { code: false, message: error.message };
  }
};

twilioUtils.verify_twilio_otp = async (data) => {
    const url = `${twillo_base_url}${twillo_check_verify}`;
  
    try {
      const response = await axios.post(url, data);
      return { code: true, data: response.data };
    } catch (error) {
      console.error('Error fetching data:', error);
      return { code: false, message: error.message };
    }
};

export default twilioUtils;
