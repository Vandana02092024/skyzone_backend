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

// Group Arrivals and Head Count Api

const InsertHeadCountData = async (req, res) => {
try {
  const clientId = req.query.client_id || 1;
  const bookingData = await humanityService.getbookingData(clientId);
  if(bookingData) {
    const result = {};
    bookingData.forEach((item) => {
      const { bookingDate, sessionStart, sessionEnd, hcClass, ttl } = item.dataValues;
  
      // Initialize the `bookingDate` group if it doesn't exist
      if (!result[bookingDate]) {
        result[bookingDate] = [];
      }
  
      // Extract hours from sessionStart and sessionEnd
      const startHour = parseInt(sessionStart.split(':')[0], 10); // Hour part of sessionStart
      const endHour = parseInt(sessionEnd.split(':')[0], 10);   // Hour part of sessionEnd
  
      // If the session ends after the hour, increment endHour to the next hour
      let endTime = endHour;
      if (parseInt(sessionEnd.split(':')[1], 10) > 0) {
        endTime += 1;
      }
  
      // Loop through the range of hours
      for (let hour = startHour; hour < endTime; hour++) {
        // Create time slot (e.g., "11-12")
        const nextHour = hour + 1;
        const timeSlot = `${hour}-${nextHour}`;
  
        // Add the formatted object to the `bookingDate` array
        result[bookingDate].push({
          time: timeSlot,
          bookingDate,
          hcClass,
          ttl,
        });
      }
    });

    const newResult = {};

    // Iterate over each date in the result
  Object.entries(result).forEach(([bookingDate, records]) => {
    const groupedByTime = {};

    records.forEach(({ time, hcClass, ttl }) => {
      const [startHour] = time.split('-'); // Extract the start hour as HcTime

      // Create a unique key using startHour and hcClass for grouping
      const key = `${startHour}-${hcClass}`;

      // Initialize the group if it doesn't exist
      if (!groupedByTime[key]) {
        groupedByTime[key] = {
          HcTime: startHour,
          time: time,
          bookingDate: bookingDate,
          hcClass: hcClass,
          ttl: parseInt(ttl),
        };
      } else {
        // Sum the ttl for the same time and hcClass
        groupedByTime[key].ttl += parseInt(ttl);
      }
    });

    // Convert grouped object to an array and sort by HcTime in ascending order
    newResult[bookingDate] = Object.values(groupedByTime).sort((a, b) => {
      return parseInt(a.HcTime) - parseInt(b.HcTime);
    });
  });

  // Now we can insert Data into headcount table
  const InsertData = await humanityService.insertDataIntoHeadcountTable(clientId,newResult);
  if(InsertData.code ===true){
    return res.status(200).json(CommonFunction.succsMessage(InsertData.res,[]));
  } else {
    return res.status(200).json(CommonFunction.errMessage('Failed to insert data into headcount table',InsertData.res.errors));
  }
  } else {
    return res.status(200).json(CommonFunction.errMessage('No booking data found'));
  }

} catch (error) {
  console.error('Error inserting HeadCount data:', error);
  return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
}
}

const CreateGroupArrivalData = async (req, res) => {
  try {
    const clientId = req.query.client_id || 1;
    const GetData = await humanityService.GetGroupArrivalData(clientId);
    // return res.status(200).json(CommonFunction.succsMessage('success',GetData));
    if(GetData) {
      const InsertData = await humanityService.insertDataIntoGroupArrivalTable(clientId,GetData);
      if(InsertData.code ===true) {
        return res.status(200).json(CommonFunction.succsMessage(InsertData.res,[]));
      } else {
        return res.status(400).json(CommonFunction.errMessage('Failed to insert data into table'));
      }
    } else {
      return res.status(200).json(CommonFunction.errMessage('No data found for client_id'));
    }
  }
  catch (error) {
    console.error('Error in CreateGroupArrivalData:', error);
    return res.status(500).json(CommonFunction.errMessage('Internal Server Error'));
  }
}

export {
  getLocations,
  getCompanies,
  getEmployees,
  getShifts,
  InsertHeadCountData,
  CreateGroupArrivalData,
}