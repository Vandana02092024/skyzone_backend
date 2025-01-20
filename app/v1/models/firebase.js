import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFile } from "fs/promises";

import {
    MobileCustomerDeviceIds,
    MobileCustomers,
    ClientMaster,
    MobileCustomersPreferedLocation,
    FirebaseTokenRegLogs,
    FirebaseTopicRegIds,
  } from '../../../config/tables.js';
import CommonFunction from "../../../helper/common.js";
import { console } from "inspector";

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

// function for subscription and unsubscribe devices on firebase topic

const subscriptionTopic = async (DeviceId, TopicName) => {
  try {
    // SUBSCRIBE TO TOPIC
    const regTopic = getMessaging()
      .subscribeToTopic(DeviceId, TopicName)
      .then((response) => {
        console.log("response", response);
      });

      console.log('regTopic',regTopic);
    if (regTopic) {
      await CommonFunction.updateCustomerTopic(DeviceId, TopicName, 1);
    }
    return true;
  } catch (error) {
    console.log("error in firebase subscriptionTopic", error);
    throw error;
  }
};

const unsubscribeTopic = async (DeviceId, TopicName) => {
  try {
    // UNSUBSCRIBE FROM TOPIC
    const unregTopic = getMessaging()
      .unsubscribeFromTopic(DeviceId, TopicName)
      .then((response) => {
        console.log("response", response);
      });
      console.log('unregTopic',unregTopic);
    if (unregTopic) {
      await CommonFunction.updateCustomerTopic(DeviceId, TopicName, 0);
    }
    return unregTopic;
  } catch (error) {
    console.log("error in firebase unsubscribeTopic", error);
    throw error;
  }
};

firebaseService.unsubscribeTopic = async (DeviceId, TopicName) => {
  try {
    // UNSUBSCRIBE FROM TOPIC
    const unregTopic = getMessaging()
      .unsubscribeFromTopic(DeviceId, TopicName);
      console.log('unregTopic',unregTopic);
    if (unregTopic) {
      await CommonFunction.updateCustomerTopic(DeviceId, TopicName, 0);
    }
    return true;
  } catch (error) {
    console.log("error in firebase unsubscribeTopic", error);
    throw error;
  }
};

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
        const response = await getMessaging()
          .subscribeToTopic(registrationTokens, topicName);
            console.log('response', response);
            await FirebaseTokenRegLogs.create({
              log: response,
              deviceId:deviceId,
              topic_name:topic,
            });
            if(response.successCount===1) {
              await FirebaseTopicRegIds.create({
                deviceId:deviceId,
                topic_name:topic,
                status:1,
              });
            }
            return true;
      } catch (error) {
        console.log('error in firebase RegisterDeviceId',error);
        throw error;
      }

      return true;
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
  try {
    let notificationMessage = {};
    notificationMessage = {
                notification: {
                    title: title.replace('&nbsp;', ' ').replace(/<[^>]+>/g, ''),
                    body: message.replace('&nbsp;', ' ').replace(/<[^>]+>/g, '')
                },
                condition:topic,
            };

  console.log('notificationMessage',notificationMessage);

  const sentms = getMessaging().send(notificationMessage);
  return sentms;
     } catch (error) {
        console.error('Error notifyMessagetoMultiDevices:', error);
        throw error;
    }
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
    // for Remidered
    else if (order_status === 'REMINDERS') {
      title = 'Reminder: Your Food is Ready!';
      message = "Reminder: Your food is freshly prepared and ready for pickup at the counter. Enjoy your meal!";
      notify = true;
    }

    let notificationMessage = {};

    if (notify && device_id) {
        
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

    console.log('notificationMessage',notificationMessage);

    // Send a message to devices subscribed to the provided topic.
   const sendnotify =  getMessaging()
    .send(notificationMessage)
    .then((response) => {
      console.log('response',response);
    })
    .catch((error) => {
     console.log('error',error);
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
      console.log('response',response);
    })
    .catch((error) => {
       console.log('error in sendNotifyMessage',error);
    });
};


// firebase push notifications  device id's remove and register
firebaseService.RegisterDeviceIdRegRem = async (data, customer_id) => {
  try {
    const clientId = data.client_id;
    const registrationTokens = data.device_id;
    const topicName = await CommonFunction.getFirebaseTopic(clientId);
    const checkfromMobileCustomers = await MobileCustomers.findOne({
      where: {
        id: customer_id,
      },
    });
    if (checkfromMobileCustomers) {
      const checkPreferedLocation =
        await MobileCustomersPreferedLocation.findOne({
          where: {
            customerId: customer_id,
            // client_id: clientId,
            is_weiver: "No",
          },
        });
      if (!checkPreferedLocation) {
        const checkweiverLocation =
          await MobileCustomersPreferedLocation.findOne({
            where: {
              customerId: customer_id,
              // client_id: clientId,
              is_weiver: "Yes",
            },
          });
        if (!checkweiverLocation) {
          await MobileCustomersPreferedLocation.create({
            customerId: customer_id,
            client_id: clientId,
            is_weiver: "No",
          });

          if (topicName) {
            await subscriptionTopic(registrationTokens, topicName);
          }
        }
      } else {
        const getAlreadyRegTopic = await MobileCustomerDeviceIds.findOne({
          where: {
            customer_id: customer_id,
            device_id: registrationTokens,
          },
        });
        if (getAlreadyRegTopic) {
          const alreadyTopic = getAlreadyRegTopic?.topic_registered;
          if (alreadyTopic===undefined || alreadyTopic==='' || alreadyTopic===null) {
            if (topicName) {
              await subscriptionTopic(registrationTokens, topicName);
              await MobileCustomersPreferedLocation.update(
                { client_id: clientId }, // Fields to update
                {
                  where: {
                    customerId: customer_id,
                    client_id: clientId,
                    is_weiver: "No",
                  },
                }
              );
            }
          } else {
            if (alreadyTopic != topicName) {
              await unsubscribeTopic(registrationTokens, alreadyTopic);
              await subscriptionTopic(registrationTokens, topicName);
              await MobileCustomersPreferedLocation.update(
                { client_id: clientId }, // Fields to update
                {
                  where: {
                    customerId: customer_id,
                    // client_id: clientId,
                    is_weiver: "No",
                  },
                }
              );
            }
          }
        } else {
          await MobileCustomerDeviceIds.create({
            customer_id: customer_id,
            device_id: registrationTokens,
            topic_registered: topicName,
          });
          if (topicName) {
            await subscriptionTopic(registrationTokens, topicName);
          }
        }
      }
    }

    return { code: true, res: 1 };
  } catch (error) {
    console.error("error in RegisterDeviceIdRegRem", error);
    throw error;
  }
};

export default firebaseService;