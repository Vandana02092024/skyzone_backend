import { Sequelize, Op } from 'sequelize';
import moment from 'moment';
import {
  HumanityEmployeesData,
  HumanityScheduleSummaryUsers,
  humanityschedulesummaryshifts,
  HeadCounts,
  GroupArrivals
  } from '../../../config/humanityTables.js';

import { BookingItems,RestProductPackageItem } from '../../../config/tables.js';

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

humanityService.getbookingData = async (clientId) => {
  try { 
    // const checkLastRecord = await HeadCounts.findOne({
    //   attributes : ['ShiftDate'],
    //   where: { client_id: clientId },
    //   order: [['ShiftDate', 'DESC']],
    //   limit: 1
    // });
    // let year;
    // // let month;
    // if(checkLastRecord) {
    //   year = moment(checkLastRecord.ShiftDate).add(1, 'year').format('YYYY');
    //   // month = moment(checkLastRecord.ShiftDate).format('MM');
    // } else {
    //   year = '2019';
    //   // month = '01';
    // }
    let year = '2025';
    const result = await BookingItems.findAll({
      attributes: [
        'productId',
        [Sequelize.literal('CASE WHEN `packageItem`.`productId` IS NULL THEN -2 ELSE 5 END'), 'hcClass'],
        'bookingDate',
        'sessionStart',
        'sessionEnd',
        [Sequelize.fn('SUM', Sequelize.literal('`BookingItems`.`quantity` * `BookingItems`.`groupSize`')), 'ttl']
      ],
      include: [
        {
          model: RestProductPackageItem,
          as: 'packageItem',
          attributes: [],
          where: { client_id: clientId },
          required: false
        }
      ],
      where: {
        sessionStart: { [Sequelize.Op.ne]: null },
        sessionEnd: { [Sequelize.Op.ne]: null },
        client_id: clientId,
        // Filter for the current month and year
        // [Sequelize.Op.and]: [
        //   // Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('bookingDate')), month),
        //   Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('bookingDate')), year)
        // ]
      },
      group: [
        'sessionStart',
        'sessionEnd',
        'productId',
        'bookingDate',
        Sequelize.literal('CASE WHEN `packageItem`.`productId` IS NULL THEN -2 ELSE 5 END')
      ],
      order: [['bookingDate', 'DESC']]
    });
    return result;
  } catch (error) {
    console.error('Error in getbookingData:', error);
    throw error;
  }
};

humanityService.insertDataIntoHeadcountTable = async (clientId, data) => {
  try { 
    const headCountsData = [];

    // Loop through each booking date
    Object.keys(data).forEach((bookingDate) => {
      // Loop through each time slot data
      data[bookingDate].forEach((item) => {
        const { HcTime, hcClass, ttl } = item;

        // Prepare the data for insertion or update
        headCountsData.push({
          ShiftDate: bookingDate,
          HourNo: HcTime,
          HCClassNo: hcClass,
          HeadCount: ttl,
          client_id: clientId,
        });
      });
    });

    // Upsert each record into the HeadCounts table
    for (const record of headCountsData) {
      await HeadCounts.upsert(record);
    }

    return { code: true, res: 'success' };
    
  } catch (error) {
    console.error('Error in insertDataIntoHeadcountTable:', error);
    return { code: false, res: error };
  }
};

// GroupArrival function

humanityService.GetGroupArrivalData = async (clientId) => {
  try {
    let year = '2025';
      const data = await BookingItems.findAll({
          attributes: [
              'productId',
              [Sequelize.literal("CONCAT(bookingReference, '-', bookingItemId)"), 'RefID'],
              'bookingDate',
              [Sequelize.literal("CASE WHEN `packageItem`.`product_id` IS NULL THEN -2 ELSE 5 END"), 'hcClass'],
              [Sequelize.literal("CONCAT(bookingDate, ' ', sessionStart, ':00')"), 'StartDateTime'],
              [Sequelize.literal("CONCAT(bookingDate, ' ', sessionEnd, ':00')"), 'EndDateTime'],
              [Sequelize.fn('SUM', Sequelize.literal('`BookingItems`.`quantity` * `BookingItems`.`groupSize`')), 'GroupSize'],
              [Sequelize.fn('SUM', Sequelize.literal('`BookingItems`.`cost` * `BookingItems`.`quantity`')), 'TotalSaleAmount'],
              Sequelize.literal('1 AS GrpStatusNo')
          ],
          include: [
              {
                  model: RestProductPackageItem,
                  as: 'packageItem',
                  attributes: [],
                  required: false, // LEFT JOIN
                  on: Sequelize.and(
                    Sequelize.where(Sequelize.col('BookingItems.productId'), '=', Sequelize.col('packageItem.productId')),
                    Sequelize.where(Sequelize.col('BookingItems.client_id'), '=', Sequelize.col('packageItem.client_id'))
                ),
              }
          ],
          where: {
              sessionStart: { [Op.ne]: null },
              sessionEnd: { [Op.ne]: null },
              client_id: clientId,
              [Sequelize.Op.and]: [
          // Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('bookingDate')), month),
          Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('bookingDate')), year)
        ],
              [Op.or]: [
                { bookingStatus: { [Op.like]: 'PartiallyPaid' } },
                { bookingStatus: { [Op.like]: 'Paid' } }
            ]
          },
          group: [
              Sequelize.literal("StartDateTime"),
              Sequelize.literal("EndDateTime"),
              'productId',
              Sequelize.literal("CASE WHEN `packageItem`.`product_id` IS NULL THEN -2 ELSE 5 END"),
          ],
          order: [[Sequelize.literal('bookingDate'), 'DESC']]
      });

      return data;
  } catch (error) {
      console.error('Error fetching booking data:', error);
      throw error;
  }
};

humanityService.insertDataIntoGroupArrivalTable = async (clientId, data) => {
  try {
    const InsData = [];
    const existingRefIDs = [];

    // Extract all RefIDs from the incoming data
    const newRefIDs = data.map(item => item.dataValues.RefID);

    // Fetch existing records by RefIDs
    const existingRecords = await GroupArrivals.findAll({
      attributes: ['RefID'],
      where: {
        RefID: newRefIDs,
        client_id: clientId,
      },
    });

    // Collect existing RefIDs
    existingRecords.forEach(record => existingRefIDs.push(record.RefID));

    // Filter out data with RefIDs that already exist
    const filteredData = data.filter(
      item => !existingRefIDs.includes(item.dataValues.RefID)
    );

    // Prepare data for insertion
    filteredData.forEach(item => {
      const { RefID, GrpStatusNo, StartDateTime, EndDateTime, GroupSize, TotalSaleAmount, bookingDate } = item.dataValues;

      InsData.push({
        RefID,
        GrpStatusNo: 1,
        StartDateTime,
        EndDateTime,
        GroupSize,
        TotalSaleAmount,
        BookingDate:bookingDate,
        client_id: clientId,
      });
    });

    // Perform bulk insert for filtered data
    if (InsData.length > 0) {
      await GroupArrivals.bulkCreate(InsData);
    }

    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error in insertDataIntoGroupArrivalTable:', error);
    return { code: false, res: error };
  }
};

export default humanityService;