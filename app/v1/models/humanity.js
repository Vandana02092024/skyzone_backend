import { Sequelize, Op } from 'sequelize';
import {
  HumanityEmployeesData,
  HumanityScheduleSummaryUsers,
  humanityschedulesummaryshifts,
  } from '../../../config/humanityTables.js';

const humanityService = {};

humanityService.CreateEmployee = async (data) => {
  return await HumanityEmployeesData.create(data);
};

humanityService.UpdateEmployee = async (id, data) => {
  return await HumanityEmployeesData.update(data, {
    where: { EmpID: id },
  });
};

humanityService.getEmployeeById = async (id) => {
  return await HumanityEmployeesData.findOne({
    where: { EmpID: id },
  });
};

// shift Data 

humanityService.CreateHumanityScheduleSummaryUser = async (data) => {
  try {
    return await HumanityScheduleSummaryUsers.create(data);
  } 
  catch (error) {
    console.error('Error in CreateHumanityScheduleSummaryUser:', error);
  }
};

humanityService.CreateHumanityScheduleSummaryShift = async (data) => {
  try {
    return await humanityschedulesummaryshifts.create(data);
  }
  catch (error) {
    console.error('Error in CreateHumanityScheduleSummaryShift:', error);
  }
};

humanityService.getHumanityScheduleSummaryUser = async (id) => {
  return await HumanityScheduleSummaryUsers.findOne({
    where: { id: id },
  });
};

humanityService.deleteHumanityScheduleSummaryShift = async (id) => {
  try {
    return await humanityschedulesummaryshifts.destroy({
      where: { userid: id },
    });
  }
  catch (error) {
    console.error('Error in deleteHumanityScheduleSummaryShift:', error);
  }
};

export default humanityService;