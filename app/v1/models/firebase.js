import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFile } from "fs/promises";

import {
    MobileCustomerDeviceIds,
    MobileCustomers
  } from '../../../config/tables.js';

const firebaseService = {};

// GET CREDENTIALS FILE
const serviFile = JSON.parse(
    await readFile(
      new URL("../../../config/skyzoneFirebase.json", import.meta.url)
    )
);

//  INITIALIZE FIREBASE APP
const appInit = initializeApp({
    credential: cert(serviFile),
});

firebaseService.getIdsData = async (en_email) => {
  try {
    const getCustomer = await MobileCustomers.findOne({
      attributes: ["id", "fname", "lname", "email", "phone"],
      where: { email: en_email },
    });
    if (getCustomer) {
      const customer_id = getCustomer.id;
      result = await MobileCustomerDeviceIds.findAll({
        attributes: ['device_id', 'client_id'],
          where: {
            customer_id:customer_id
          },
      });
      return result ? {code: true, data: result} : {};
    } else {
      return {code: false, message: "Customer not found"};
    }
  } catch (error) {
      console.error("Error fetching Customer Device:", error);
      return {};
  }
};

firebaseService.RegisterDeviceId = async (deviceId,topic) => {
  try {
      const registrationTokens = deviceId;
      const topicName = topic;

      try {
        // REGISTER DEVICE
        getMessaging()
          .subscribeToTopic(registrationTokens, topicName)
          .then((response) => {
            res.status(200).json({ message: "success", data: response });
          });
      } catch (error) {
        console.log('error in firebase RegisterDeviceId',error);
        throw error;
      }

      return results;
  } catch (error) {
      console.error('error in RegisterDeviceId', error);
      throw error;
  }
};

firebaseService.getCustomerDeviceIds = async (customer_id, client_id = false) => {
    try {
        const whereCondition = {
            customer_id: customer_id
        };
        if (client_id) {
            whereCondition.client_id = client_id;
        }

        const results = await MobileCustomerDeviceIds.findAll({
            attributes: ['device_id', 'client_id'],
            where: whereCondition
        });

        return results;
    } catch (error) {
        console.error('Error fetching customer device IDs:', error);
        throw error;
    }
};

// SEND MESSAGE TO TOPIC //

firebaseService.notifyMessagetoMultiDevices = async (title,message,topic) => {
    let notificationMessage = {};
    notificationMessage = {
                notification: {
                    title: title.replace('&nbsp;', ' ').replace(/<[^>]+>/g, ''),
                    body: message.replace('&nbsp;', ' ').replace(/<[^>]+>/g, '')
                },
                topic:topic,
            };

    getMessaging()
    .send(notificationMessage)
    .then((response) => {
      console.log('response',response);
    })
    .catch((error) => {
      console.log('error in notifyMessagetoMultiDevices',error);
    });
};

// SEND MESSAGE FOR TESTING PURPOSE //

firebaseService.TestNotifyMessage = async (device_id,res) => {
  // let notify = false;
 let title = 'Skyzone Notification';
 let message = "This is a notification for testing purposes.";
 let notify = true;

  let notificationMessage = {};

  if (notify) {
      
      notificationMessage = {
              token: device_id,
              notification: {
                  title: title.replace('&nbsp;', ' ').replace(/<[^>]+>/g, ''),
                  body: message.replace('&nbsp;', ' ').replace(/<[^>]+>/g, '')
              },
              data: {
                  screen: 'Orders'
              }
          };
  }

  // Send a message to devices subscribed to the provided topic.
  getMessaging()
  .send(notificationMessage)
  .then((response) => {
    res
      .status(200)
      .json({status:'success', message: "Successfully sent message", data: response });
  })
  .catch((error) => {
    res.status(400).json({
      message: "Error sending message:" + error.message,
      data: [],
    });
  });
};

// SEND MESSAGE TO A SINGLE DEVICE //

firebaseService.notifyMessage = async (device_id, order_status = 'PENDING') => {
    let notify = false;
    let title = '';
    let message = '';

    if (order_status === 'PREPARING') {
        title = 'Preparing Your Order';
        message = "We're busy preparing your order! Hang tight—it'll be ready soon. Thanks for choosing us!";
        notify = true;
    } else if (order_status === 'COMPLETED') {
        title = 'Your Food is Ready!';
        message = "Your food is freshly prepared and ready for pickup at the counter. Enjoy your meal!";
        notify = true;
    }

    let notificationMessage = {};

    if (notify) {
        
        notificationMessage = {
                token: device_id,
                notification: {
                    title: title.replace('&nbsp;', ' ').replace(/<[^>]+>/g, ''),
                    body: message.replace('&nbsp;', ' ').replace(/<[^>]+>/g, '')
                },
                data: {
                    screen: 'Orders'
                }
            };
    }

    // Send a message to devices subscribed to the provided topic.
    getMessaging()
    .send(notificationMessage)
    .then((response) => {
      res
        .status(200)
        .json({ message: "Successfully sent message", data: response });
    })
    .catch((error) => {
      res.status(400).json({
        message: "Error sending message:" + error.message,
        data: [],
      });
    });
};

// SEND NOTIFICATION FOR ANY DEVICE 

firebaseService.sendNotifyMessage = async (device_id, title , message) => {
        notificationMessage = {
                token: device_id,
                notification: {
                    title: title.replace('&nbsp;', ' ').replace(/<[^>]+>/g, ''),
                    body: message.replace('&nbsp;', ' ').replace(/<[^>]+>/g, '')
                },
                data: {
                    screen: 'Orders'
                }
            };

    // Send a message to devices subscribed to the provided topic.
    getMessaging()
    .send(notificationMessage)
    .then((response) => {
      return { code: true, res: response };
    })
    .catch((error) => {
       console.log('error in sendNotifyMessage',error);
    });
};

export default firebaseService;