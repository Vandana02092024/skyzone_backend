import  CommonFunction from "../../../../helper/common.js";
import moment from "moment";
import { Sequelize, Op } from 'sequelize';
import predictedTrafficService from "../models/predictedTraffic.js";
import {
  PublishSchedule,
} from '../../../../config/humanityTables.js';

const getpredictedTrafficData = async (req, res) => {
    try {
        const client_id = req.body.client_id;
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
        }
        const weekPicker = req.body.weekPicker ? req.body.weekPicker :'';

        const newweeklist = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

         // Execute all promises in parallel
         const [
            getwalkinActualList, 
            getBirthdayActualList, 
            getwalkinPredictedList, 
            getbirthdayPredictedList
          ] = await Promise.all([
            predictedTrafficService.getwalkinActual(client_id, weekPicker),
            predictedTrafficService.getBirthdayActual(client_id, weekPicker),
            predictedTrafficService.getwalkinPredicted(client_id, weekPicker),
            predictedTrafficService.getbirthdayPredicted(client_id, weekPicker)
          ]);

          // Extract actual data from Sequelize model instances using `map`
          const walkinActual = (getwalkinActualList)
          ? getwalkinActualList.map(item => ({
              total: parseInt(item?.dataValues?.total) || null,
              Date: item?.dataValues?.Date || null,
              weekday: item?.dataValues?.weekday || 0,
            }))
          : [];

            const birthdayActual = (getBirthdayActualList)
            ? getBirthdayActualList.map(item => ({
              total: parseInt(item?.dataValues?.total) || null,
              Date: item?.dataValues?.Date || null,
              weekday: item?.dataValues?.weekday || 0,
            }))
            : [];

            const walkinPredicted = (getwalkinPredictedList) 
            ? getwalkinPredictedList.map(item => ({
              total: parseInt(item?.dataValues?.total) || null,
              Date: item?.dataValues?.Date || null,
              weekday: item?.dataValues?.weekday || 0,
            }))
            : [];

            const birthdayPredicted = (getbirthdayPredictedList)
            ? getbirthdayPredictedList.map(item => ({
              total: parseInt(item?.dataValues?.total) || null,
              Date: item?.dataValues?.Date || null,
              weekday: item?.dataValues?.weekday || 0,
            }))
            : [];

            const responseData = {
                walkinActual,
                birthdayActual,
                walkinPredicted,
                birthdayPredicted,
                newweeklist:newweeklist
            };
        
  
      return res.status(200).json(CommonFunction.succsMessage('success',responseData));
    } catch (error) {
      console.error('Error fetching getpredictedTrafficData:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
    }
};

const getSchedulevsActual = async (req, res) => {
    try {
      const client_id = req.body.client_id;
      if (!client_id) {
        return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
      }
        const weekPicker = req.body.weekPicker ? req.body.weekPicker :'';

        const newweeklist = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

         // Execute all promises in parallel
         const [
            getscheduleHoursList, 
            getPredictedHoursList, 
            getListOfPosition,
          ] = await Promise.all([
            predictedTrafficService.getScheduleHours(client_id, weekPicker),
            predictedTrafficService.getPredictedHours(client_id, weekPicker),
            predictedTrafficService.getListOfPosition(client_id, weekPicker)
          ]);

          // Extract actual data from Sequelize model instances using `map`
            const scheduleHours = (getscheduleHoursList)
            ? getscheduleHoursList.map(item => item?.dataValues) 
            : [];

            const PredictedHours = (getPredictedHoursList)
            ? getPredictedHoursList.map(item => item?.dataValues) 
            : [];

            const ListOfPosition = (getListOfPosition) 
            ? getListOfPosition.map(item => item?.dataValues) 
            : [];

            const responseData = {
                scheduleHours,
                PredictedHours,
                ListOfPosition,
                newweeklist:newweeklist
            };
        
  
      return res.status(200).json(CommonFunction.succsMessage('success',responseData));
    } catch (error) {
      console.error('Error fetching getpredictedTrafficData:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
    }
};

const getFutureStaffLists = async (req, res) => {
  try {
    const client_id = req.body.client_id;
    if (!client_id) {
      return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
    }
    const weekPicker = req.body.weekPicker ? req.body.weekPicker : '';
    const getfinalData = await predictedTrafficService.getFutureStaffList(client_id, weekPicker);

    // Group the data by `Date` field
    const groupedData = await Promise.all(
      Object.entries(
        getfinalData.reduce((acc, item) => {
          const date = item.Date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(item);
          return acc;
        }, {})
      ).map(async ([date, items]) => {
        // Check if the schedule is published for this date
        const publishCount = await PublishSchedule.count({
          where: {
            publish_date: date,
            client_id: client_id,
            [Op.or]: [
              { Position: '' },
              { Position: null }
            ]
          }
        });

        // Determine the `pubSc` status
        const pubSc = publishCount > 0 ? 'disabled' : '';

        return {
          date,
          pubSc,
          items
        };
      })
    );

    // Return the grouped data
    return res.status(200).json(CommonFunction.succsMessage('success', groupedData));
  } catch (error) {
    console.error('Error fetching future staff lists:', error);
    return res.status(500).json(CommonFunction.succsMessage('error', error));
  }
};

const getstaffSetting = async (req, res) => {
  try {
    const client_id = req.body.client_id;
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
        }

      // Execute all promises in parallel
      const [
        payRateListParamResult, 
        modelParamResult,
      ] = await Promise.all([
        predictedTrafficService.getPayRateListParam(client_id),
        predictedTrafficService.getmodelParamResult()
      ]);

      // Extract actual data from Sequelize model instances using `map`
      const payRateListParam = (payRateListParamResult)
      ? payRateListParamResult.map(item => item?.dataValues) 
      : [];

      const modelParam = (modelParamResult)
      ? modelParamResult.map(item => item?.dataValues) 
      : [];

      const responseData = {
        payRateListParamResult:payRateListParam,
        modelParamResult:modelParam,
    };

    return res.status(200).json(CommonFunction.succsMessage('success',responseData));
  } catch (error) {
      console.error('Error fetching getstaffSetting:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const getstaffSettingNext = async (req, res) => {
  try {
    const client_id = req.body.client_id;
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
        }

      // Execute all promises in parallel
      const [
        ListModelParams, 
        PreOpeningEventParams,
        OpeningHourListParam,
        PaidBreakListParam,
        BreakDurationListParam,
        ShiftHoursListParam,
        StaffCountListParam,
        StaffMinimumListParam,
        allStaffMinimumListParam,
        closingStaffMinimumListParam
      ] = await Promise.all([
        predictedTrafficService.getListModelParams(client_id),
        predictedTrafficService.getPreOpeningEventParams(client_id),
        predictedTrafficService.getOpeningHourListParam(client_id),
        predictedTrafficService.getPaidBreakListParam(client_id),
        predictedTrafficService.getBreakDurationListParam(client_id),
        predictedTrafficService.getShiftHoursListParam(client_id),
        predictedTrafficService.getStaffCountListParam(client_id),
        predictedTrafficService.getStaffMinimumListParam(client_id),
        predictedTrafficService.getAllStaffMinimumListParam(client_id),
        predictedTrafficService.getClosingStaffMinimumListParam(client_id)
      ]);

      // Extract actual data from Sequelize model instances using `map`
      const getListModelParamsData = (ListModelParams)
      ? ListModelParams
      : [];

      const getPreOpeningEventParamsData = (PreOpeningEventParams)
      ? PreOpeningEventParams
      : [];

      const getOpeningHourListParamData = (OpeningHourListParam)
      ? OpeningHourListParam
      : [];

      const getPaidBreakListParamData = (PaidBreakListParam)
      ? PaidBreakListParam
      : [];
      const getBreakDurationListParamData = (BreakDurationListParam)
      ? BreakDurationListParam
      : [];

      const getShiftHoursListParamData = (ShiftHoursListParam)
      ? ShiftHoursListParam
      : [];

      const getStaffCountListParamData = (StaffCountListParam)
      ? StaffCountListParam
      : [];

      const getStaffMinimumListParamData = (StaffMinimumListParam)
      ? StaffMinimumListParam
      : [];

      const getAllStaffMinimumListParamData = (allStaffMinimumListParam)
      ? allStaffMinimumListParam
      : [];

      const getClosingStaffMinimumListParamData = (closingStaffMinimumListParam)
      ? closingStaffMinimumListParam
      : [];



      const responseData = {
        ListModelParam : getListModelParamsData,
        PreOpeningEventListParam : getPreOpeningEventParamsData,
        OpeningHourListParam : getOpeningHourListParamData,
        PaidBreakListParam : getPaidBreakListParamData,
        BreakDurationListParam : getBreakDurationListParamData,
        ShiftHoursListParam : getShiftHoursListParamData,
        StaffCountListParam : getStaffCountListParamData,
        StaffMinimumListParam : getStaffMinimumListParamData,
        allStaffMinimumListParam : getAllStaffMinimumListParamData,
        closingStaffMinimumListParam : getClosingStaffMinimumListParamData,
    };

    return res.status(200).json(CommonFunction.succsMessage('success',responseData));
  } catch (error) {
      console.error('Error fetching getstaffSetting:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const getstaffHours = async (req, res) => {
  try {
    const client_id = req.body.client_id;
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
        }
    const getfinalData = await predictedTrafficService.getstaffHoursList(client_id);

      return res.status(200).json(CommonFunction.succsMessage('success',getfinalData));
  } catch (error) {
      console.error('Error fetching future staff lists:', error);
      return res.status(500).json(CommonFunction.succsMessage('error',error));
  }
};

// update , insert and export functions

const ExportStaffScheduleData = async (req, res) => { 
  try {
    const curDay = req.body.weekn || new Date().toISOString().split('T')[0];
    const lastSevenDay = req.body.weekz || new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];

    const data = await predictedTrafficService.getStaffScheduleDataForExcel(curDay, lastSevenDay);
    if(data.code===true) {
      return res.status(200).json(CommonFunction.succsMessage('success',data.res));
    } else {
      return res.status(400).json(CommonFunction.errMessage('Failed to load data for excel',data.res));
    }
  } catch (error) {
    console.error('Error in ExportStaffScheduleData:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
}

const CreateSchedule = async (req, res) => {
  try {
    const {forDate, pos,client_id} = req.body;
        if (!forDate) {
          return res.status(400).json(CommonFunction.errMessage("forDate key are required"));
        }
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("client id are required"));
        }
        if (!Array.isArray(pos) || pos.length === 0) {
          return res.status(400).json({ message: 'Positions array is required and cannot be empty' });
        }
      const createData = await predictedTrafficService.createScheduleData(forDate,pos,client_id);
      if(createData.code===true) {
        return res.status(200).json(CommonFunction.succsMessage('New Schedules has been created',[]));
      } else {
        return res.status(400).json(CommonFunction.errMessage('Failed to create new Schedules',createData.res));
      }
  } catch (error) {
      console.error('Error fetching future staff lists:', error);
      return res.status(500).json(CommonFunction.succsMessage('error',error));
  }
}

const SaveStaffSettings = async (req, res) => {
  try {
    const {data , client_id} = req.body;

        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("client id are required"));
        }
        if (!Array.isArray(data) || data.data === 0) {
          return res.status(400).json({ message: 'data array is required and cannot be empty' });
        }
      const createData = await predictedTrafficService.SaveStaffSettingData(data , client_id);
      if(createData.code===true) {
        return res.status(200).json(CommonFunction.succsMessage('Data has been updated',[]));
      } else {
        return res.status(400).json(CommonFunction.errMessage('Failed to save settings',createData.res));
      }
  } catch (error) {
      console.error('Error fetching future staff lists:', error);
      return res.status(500).json(CommonFunction.succsMessage('error',error));
  }
}

const SaveStaffSettingsNext = async (req, res) => {
  try {
    const { data , client_id } = req.body;

        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("client id are required"));
        }
        if (!Array.isArray(data) && data.length === 0) {
          return res.status(400).json(CommonFunction.errMessage('data array is required and cannot be empty'));
        }
      const updateData =  await predictedTrafficService.UpdateMParametersData(data,client_id);
      if(updateData.code===true) {
        return res.status(200).json(CommonFunction.succsMessage('Data has been Updated',[]));
      } else {
        return res.status(400).json(CommonFunction.errMessage('Failed to Updated',createData.res));
      }
  } catch (error) {
      console.error('Error in SaveStaffSettingsNext:', error);
      return res.status(500).json(CommonFunction.succsMessage('error',error));
  }
}

const SaveStaffHours = async (req, res) => {
  try {
    const {data , client_id} = req.body;

        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("client id are required"));
        }
        if (!Array.isArray(data) || data.data === 0) {
          return res.status(400).json({ message: 'data array is required and cannot be empty' });
        }
      const createData = await predictedTrafficService.SaveStaffHoursData(data , client_id);
      if(createData.code===true) {
        return res.status(200).json(CommonFunction.succsMessage('Data has been updated',[]));
      } else {
        return res.status(400).json(CommonFunction.errMessage('Failed to Save Staff Hours',createData.res));
      }
  } catch (error) {
      console.error('Error fetching future staff lists:', error);
      return res.status(500).json(CommonFunction.succsMessage('error',error));
  }
}

// holiday settings Apis

const getHolidaySettings = async (req, res) => {
  try {
    const client_id = req.body.client_id;
    const year = req.body.year;
        if (!client_id) {
          return res.status(400).json(CommonFunction.errMessage("Client Id are required"));
        }
    const getfinalData = await predictedTrafficService.getHolidaySettings(client_id,year);

      return res.status(200).json(CommonFunction.succsMessage('success',getfinalData));
  } catch (error) {
      console.error('Error fetching holiday settings:', error);
      return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};


export {
    getpredictedTrafficData,
    getSchedulevsActual,
    getFutureStaffLists,
    getstaffSetting,
    getstaffSettingNext,
    getstaffHours,
    CreateSchedule,
    ExportStaffScheduleData,
    SaveStaffSettings,
    SaveStaffSettingsNext,
    SaveStaffHours,
    getHolidaySettings
}