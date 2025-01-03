import  CommonFunction from "../../../helper/common.js";

import humanityUtils from "../../../helper/humanity.js";
import humanityService from "../models/humanity.js";
import moment from "moment";

const getLocations = async (req, res) => {
  try {
    const endpoint = '/locations';
    const response = await humanityUtils.getRequest(endpoint);

    return res.status(200).json(CommonFunction.succsMessage(
       'locations data retrieved successfully', 
       response.data
    ));
  } catch (error) {
    console.error('Error fetching location data:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const getCompanies = async (req, res) => {
  try {
    const endpoint = '/companies';
    const response = await humanityUtils.getRequest(endpoint);

    return res.status(200).json(CommonFunction.succsMessage(
      'Company data retrieved successfully',
       response.data,
    ));
  } catch (error) {
    console.error('Error fetching company data:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const getEmployees = async (req, res) => {
  try {
    const endpoint = '/employees';
    const response = await humanityUtils.getRequest(endpoint);
    const data = response.data;
    const empDataArray = await Promise.all(
      data.map(async (item) => {
        const empData = {
          EmpID: item.id,
          Name: item.name,
          Status: item.status_name,
          LastActive: moment.unix(item.last_active).format('YYYY-MM-DD h:mm:ss'),
          StartDate: item.work_start_date,
          Client: 1,
        };
    
        // Check if the employee exists (you need to implement this function)
        const existingEmployee = await humanityService.getEmployeeById(item.id);
    
        if (existingEmployee) {
          // Update the existing employee record
          await humanityService.UpdateEmployee(item.id, empData);  // Corrected this line
        } else {
          // Create a new employee record
          await humanityService.CreateEmployee(empData);
        }
    
        // Return empData (if needed, otherwise you can skip this return)
        return empData;
      })
    );

    return res.status(200).json(CommonFunction.succsMessage(
      'Employees data retrieved successfully',
       empDataArray,
    ));
  } catch (error) {
    console.error('Error fetching employees data:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

const getShifts = async (req, res) => {
  try {

    const start_date = new Date(new Date().setMonth(new Date().getMonth() - 36)).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const end_date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const type = 'schedule_summary';
    const employee = 'all';
    const QueryData = {
      start_date,
      end_date,
      type,
      employee
    };

    // console.log('QueryData',QueryData);
    // return false;

    const endpoint = '/reports/schedule';
    const response = await humanityUtils.getRequest(endpoint, QueryData);
    const data = response.data.users;

    const ShiftDataArray = await Promise.all(
      data.map(async (item) => {
        const userData = {
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          work_start_date: item.work_start_date,
          eid: item.eid,
          location: item.location,
          client: 1,
        };

        const existingRecord = await humanityService.getHumanityScheduleSummaryUser(item.id);

        if (existingRecord) {
          await humanityService.deleteHumanityScheduleSummaryShift(item.id);
        } else {
          await humanityService.CreateHumanityScheduleSummaryUser(userData);
        }

        // Process shifts
        if (item?.shifts) {
          await Promise.all(item.shifts.map(async (shift) => {
            const ShiftData = {
              userid: item.id,
              id: shift.id,
              schedule: shift.schedule,
              published: shift.published,
              edited: shift.edited,
              shift_loc: shift.shift_loc,
              start_timestamp: shift.start_timestamp,
              end_timestamp: shift.end_timestamp,
              schedule_name: shift.schedule_name,
              schedule_color: shift.schedule_color,
              start_date: shift.start_date,
              start: shift.start,
              end_date: shift.end_date,
              end: shift.end,
              client: 1
            };
            await humanityService.CreateHumanityScheduleSummaryShift(ShiftData);
          }));
        }

        return userData;
      })
    );

    return res.status(200).json(CommonFunction.succsMessage(
      'Shift data retrieved successfully',
      ShiftDataArray,
    ));
  } catch (error) {
    console.error('Error fetching Shift data:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
};

export {
  getLocations,
  getCompanies,
  getEmployees,
  getShifts,
}