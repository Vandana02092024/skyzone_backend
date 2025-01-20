import { Sequelize, Op } from 'sequelize';
import { ApiTextLogs } from '../../../config/tables.js';

const logService = {};

logService.createMenualLogs = async (data) => {
    try {
      const createLog =  await ApiTextLogs.create({
        log: data,
        });
      return createLog;
    } catch (error) {
      console.error('Error in createMenualLogs:', error);
      throw error;
    }
};

logService.getLog = async () => {
    try {
      const Logs =  await ApiTextLogs.findAll({
        attributes : ['id','log']
        });
      return Logs;
    } catch (error) {
      console.error('Error in getLog:', error);
      throw new Error('Unable to retrieve logs.');
    }
};

export default logService;