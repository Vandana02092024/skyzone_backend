import { Sequelize, Op } from 'sequelize';
import {
    GroupArrivals,
    HeadCounts,
    HolidaySetting,
    MFutureHeadcountsWalkin,
    MFutureStaffLists,
    MParameters,
    GetPosition,
    ListParam,
    ModelParam,
    PublishSchedule,
    StaffHours,
    humanityschedulesummaryshifts,
  } from '../../../../config/humanityTables.js';
import moment from "moment";

const predictedTrafficService = {};

predictedTrafficService.getwalkinActual = async (client_id,weekPicker=null) => {
    try {
        const HCClassNoList = [1, 2, 3, -2];
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await HeadCounts.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('HeadCount')), 'total'],
                [Sequelize.fn('DATE', Sequelize.col('ShiftDate')), 'Date'],
                [Sequelize.fn('weekday', Sequelize.col('ShiftDate')), 'weekday'],
            ],
            where: {
                client_id: client_id,
                HCClassNo: HCClassNoList,
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('ShiftDate'), 1), weekNumber),
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('ShiftDate')), year)
                ],
            },
            group: [Sequelize.fn('DATE', Sequelize.col('ShiftDate'))]
        });

        if (results.length > 0) {
          return  results;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching getwalkinActual by week:", error);
    }
};

predictedTrafficService.getBirthdayActual = async (client_id,weekPicker=null) => {
    try {
        const GrpStatusNo = [1,2]
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await GroupArrivals.findAll({
            attributes: [
              [Sequelize.fn('DATE', Sequelize.col('StartDateTime')), 'Date'],
              [Sequelize.fn('weekday', Sequelize.col('StartDateTime')), 'weekday'],
              [Sequelize.fn('SUM', Sequelize.col('GroupSize')), 'total']
            ],
            where: {
              GrpStatusNo: { [Op.in]: GrpStatusNo },
              [Op.and]: [
                Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('StartDateTime'), 1), weekNumber),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('StartDateTime')), year),
                {
                  StartDateTime: { [Op.lt]: Sequelize.fn('CURDATE') }  // Dates less than current date
                }
              ]
            },
            group: [Sequelize.fn('DATE', Sequelize.col('StartDateTime'))],  // Group by the date part of StartDateTime
            partition: 'p' + client_id  // Manually specifying partition (this will depend on how your table is partitioned)
          });

        if (results.length > 0) {
            return results;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching getBirthdayActual by week:", error);
    }
};

predictedTrafficService.getwalkinPredicted = async (client_id, weekPicker = null) => {
    try {
        let year;
        let weekNumber;

        // Determine year and week number
        if (weekPicker) {
            const wk = weekPicker.split('-');
            year = wk[0];
            weekNumber = wk[1];
        } else {
            year = moment().format('YYYY');
            weekNumber = moment().isoWeek();
        }

        const results = await MFutureHeadcountsWalkin.findAll({
            attributes: [
                [Sequelize.col('Date'), 'Date'], // No need to prefix with MFutureHeadcountsWalkin
                [Sequelize.fn('weekday', Sequelize.col('Date')), 'weekday'],
                [Sequelize.literal(`\`0\` + \`1\` + \`2\` + \`3\` + \`4\` + \`5\` + \`6\` + \`7\` + \`8\` + \`9\` + \`10\` + \`11\` + \`12\` + \`13\` + \`14\` + \`15\` + \`16\` + \`17\` + \`18\` + \`19\` + \`20\` + \`21\` + \`22\` + \`23\``), 'total']
            ],
            where: {
                client_id: client_id,
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('Date'), 1), weekNumber),
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('Date')), year)
                  ], 
            },
            group: [Sequelize.col('Date'), 'client_id'],
            // order: [[Sequelize.col('Date'), 'DESC']]
        });

        // Return results or an empty array
        return results.length > 0 ? results : [];

    } catch (error) {
        console.error("Error fetching getwalkinPredicted by week:", error);
        throw new Error("Unable to fetch data");
    }
};

predictedTrafficService.getbirthdayPredicted = async (client_id,weekPicker=null) => {
    try {
        const GrpStatusNo = [1,2]
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await GroupArrivals.findAll({
            attributes: [
              [Sequelize.fn('DATE', Sequelize.col('StartDateTime')), 'Date'],
              [Sequelize.fn('weekday', Sequelize.col('StartDateTime')), 'weekday'],
              [Sequelize.fn('SUM', Sequelize.col('GroupSize')), 'total']
            ],
            where: {
              client_id: client_id, 
              GrpStatusNo: { [Op.in]: GrpStatusNo },   
              [Sequelize.Op.and]: [
                Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('StartDateTime'), 1), weekNumber),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('StartDateTime')), year)
              ], 
            },
            group: [Sequelize.fn('DATE', Sequelize.col('StartDateTime'))]
        });

        if (results.length > 0) {
            return results;
        } else {
           return [];
        }
    } catch (error) {
        console.error("Error fetching getbirthdayPredicted by week:", error);
    }
};

// schedulevsActual 
predictedTrafficService.getScheduleHours = async (client_id,weekPicker=null) => {

    try {
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await humanityschedulesummaryshifts.findAll({
            attributes: [
              [Sequelize.fn('DATE', Sequelize.col('start_timestamp')), 'start_day'],
              [Sequelize.fn('DATE', Sequelize.col('end_timestamp')), 'end_day'],
              'schedule_name',
              [Sequelize.fn('COUNT', Sequelize.col('schedule_name')), 'cnt_emp'],
              [Sequelize.fn('SUM', Sequelize.literal('TIMESTAMPDIFF(MINUTE, start_timestamp, end_timestamp) / 60')), 'PayrollHours'],
              [Sequelize.fn('SUM', Sequelize.literal('(TIMESTAMPDIFF(MINUTE, start_timestamp, end_timestamp) / 60) * listParam.payRate')), 'PayrollCost'],
              [Sequelize.fn('AVG', Sequelize.col('listParam.payRate')), 'payRate']
            ],
            include: [{
              model: ListParam,
              as: 'listParam',
              attributes: [],
              where: {
                client_id: client_id,
                position_model: { [Op.ne]: 'N/A' }
              }
            }],
            where: {
              client: client_id,
              [Op.and]: [
                Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('start_timestamp'), 1), weekNumber),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('start_timestamp')), year)
              ],
            },
            group: ['schedule_name']
        });

        if (results.length > 0) {
            return results;
        } else {
           return [];
        }
    } catch (error) {
        console.error("Error fetching getScheduleHours:", error);
    }
}

predictedTrafficService.getPredictedHours = async (client_id,weekPicker=null) => {

    try {
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await MFutureStaffLists.findAll({
            attributes: [
              'Position',
              'Client_id',
              [Sequelize.fn('ROUND', Sequelize.fn('SUM', Sequelize.literal('`0` + `1` + `2` + `3` + `4` + `5` + `6` + `7` + `8` + `9` + `10` + `11` + `12` + `13` + `14` + `15` + `16` + `17` + `18` + `19` + `20` + `21` + `22` + `23`')), 0), 'hrs'],
              [Sequelize.fn('ROUND', Sequelize.fn('SUM', Sequelize.literal('(`0` + `1` + `2` + `3` + `4` + `5` + `6` + `7` + `8` + `9` + `10` + `11` + `12` + `13` + `14` + `15` + `16` + `17` + `18` + `19` + `20` + `21` + `22` + `23`) * payRate')), 0), 'payroll_cost']
            ],
            where: {
              Client_id: client_id,
              Date: {
                [Sequelize.Op.and]: [
                  Sequelize.where(Sequelize.fn('WEEK', Sequelize.col('Date'), 1), weekNumber),
                  Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('Date')), year)
                ]
              }
            },
            include: [
              {
                model: ListParam,
                as: 'mlistParam',
                // required: true,
                where: {
                  Client_id: client_id
                }
              }
            ],
            group: ['Position'],
            // raw: true,
        });

        if (results.length > 0) {
            return results;
        } else {
           return [];
        }
    } catch (error) {
        console.error("Error fetching getPredictedHours:", error);
    }
}

predictedTrafficService.getListOfPosition = async (client_id,weekPicker=null) => {

    try {
        let year;
        let weekNumber;
        if (weekPicker) {
            const wk = weekPicker.split('-');
             year = wk[0];
             weekNumber = wk[1];
        } else {
             year = moment().format('YYYY');
             weekNumber = moment().isoWeek();
        }
        const results = await ListParam.findAll(
            {
                 where: { client_id: client_id },
                 order: [['id']]
            }
        );

        if (results.length > 0) {
            return results;
        } else {
           return [];
        }
    } catch (error) {
        console.error("Error fetching getListOfPosition:", error);
    }
}

predictedTrafficService.getFutureStaffList = async (
  clientId,
  weekPicker = null
) => {
  try {
    let year, weekNumber;
    if (weekPicker) {
      const wk = weekPicker.split("-");
      year = wk[0];
      weekNumber = wk[1];
    } else {
      year = moment().format("YYYY");
      weekNumber = moment().isoWeek();
    }

    // Fetch main data
    const results = await MFutureStaffLists.findAll({
      attributes: [
          'id', 'Client_id', 'Position', 'Created_Date', 'Date',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
          '11', '12', '13', '14', '15', '16', '17', '18', '19',
          '20', '21', '22', '23'
      ],
      where: {
        Client_id: clientId,
          [Op.and]: [
              Sequelize.literal(`WEEK(Date, 1) = ${weekNumber} AND YEAR(Date) = ${year}`),
              {
                  Created_Date: {
                      [Op.in]: Sequelize.literal(`(
                          SELECT MAX(Created_Date) 
                          FROM m_futureStaffLists AS sub
                          WHERE sub.Client_id = MFutureStaffLists.Client_id
                          AND sub.Date = MFutureStaffLists.Date
                          AND sub.Position = MFutureStaffLists.Position
                      )`)
                  }
              }
          ]
      },
      order: [
          ['Client_id', 'DESC'],
          ['Date', 'DESC'],
          ['Position', 'DESC']
      ]
  });

    // Fetch `pubSc` status for each item
    var item_position = "";
    var inc = 1;
    for (const item of results) {
      const positionPublishSelect = await PublishSchedule.count({
        where: {
          publish_date: item?.dataValues.Date,
          Position: item?.dataValues.Position,
          client_id: clientId,
        },
      });
      var check_val = true;
      if (item_position === item.dataValues.Position) {
        item_position = item.dataValues.Position;
        item.dataValues.Position = item.dataValues.Position + inc;
        check_val = false;
        inc++;
      } else {
        item_position = item.dataValues.Position;
        inc = 1;
      }

      item.dataValues.posPubSc = positionPublishSelect > 0 ? "disabled" : "";
      item.dataValues.checkVal = check_val;
    }

    return results;
  } catch (error) {
    console.error("Error fetching getFutureStaffList:", error);
    return [];
  }
};

predictedTrafficService.getPayRateListParam = async (clientId) => {
  try {
      const results = await GetPosition.findAll({
      attributes: ['position'],
      where: {
          client_id: clientId
      },
      include: [{
          model: ListParam,
          as: 'listParam',
          attributes: ['id','position_model', 'payRate'],
          where: {
              client_id: clientId,
              parameterName: { [Op.col]: 'GetPosition.position' }  // Join condition
          },
          required: false  // Left join
      }]
  });

      if (results.length > 0) {
          return results;
      } else {
         return [];
      }
  } catch (error) {
      console.error("Error fetching getPayRateListParam:", error);
  }
}

predictedTrafficService.getmodelParamResult = async () => {

  try {
      const results = await ModelParam.findAll({
        attributes: [
          "id",
          ["parameterName", "label"],
          ["position_model", "value"],
        ],
      });

      if (results.length > 0) {
          return results;
      } else {
         return [];
      }
  } catch (error) {
      console.error("Error fetching getmodelParamResult:", error);
  }
}

predictedTrafficService.getstaffHoursList = async (clientId) => {

  try {
    const results = await GetPosition.findAll({
      attributes: [
        'id', 'position',
        [Sequelize.col('listParam.id'), 'listParam.id'],
        [Sequelize.col('listParam.position_model'), 'listParam.position_model'],
        [Sequelize.col('staffHours.id'), 'staffHours.id'],
        [Sequelize.col('staffHours.timeBefore'), 'staffHours.timeBefore'],
        [Sequelize.col('staffHours.timeAfter'), 'staffHours.timeAfter']
      ],
      include: [
        {
          model: ListParam,
          as: 'listParam',
          required: false, // LEFT OUTER JOIN
          attributes: [],
          on: {
            client_id: Sequelize.literal('`GetPosition`.`client_id` = `listParam`.`client_id`'),
            parameterName: Sequelize.literal('`listParam`.`parameterName` = `GetPosition`.`position`')
          }
        },
        {
          model: StaffHours,
          as: 'staffHours',
          required: false, // LEFT OUTER JOIN
          attributes: [],
          on: {
            client_id: Sequelize.literal('`GetPosition`.`client_id` = `staffHours`.`client_id`'),
            position: Sequelize.literal('`staffHours`.`position` = `GetPosition`.`position`')
          }
        }
      ],
      where: {
        client_id: clientId,
        '$listParam.position_model$': {
          [Op.ne]: 'N/A'
        }
      },
      raw: true
    });
    // Mapping the result
    return results.map(result => ({
      id:result['staffHours.id'],
      position: result.position,
      position_model: result['listParam.position_model'],
      timeBefore: result['staffHours.timeBefore'],
      timeAfter: result['staffHours.timeAfter']
    }));
  } catch (error) {
      console.error("Error fetching getmodelParamResult:", error);
  }
}

// getstaffSettingNext function

predictedTrafficService.getListModelParams = async (clientId) => {

  try {
    // Query the database for the records with the specified conditions
    const results = await ListParam.findAll({
        // attributes: ['*'],  // Replace with actual column names if needed
        where: {
            client_id: clientId,
            position_model: {
                [Op.notIn]: ['party', 'N/A']  // Excluding 'party' and 'N/A' values from position_model
            }
        },
        group: ['position_model'],  // Grouping by 'position_model'
    });

    // Return the fetched results
    return results;
} catch (error) {
    console.error('Error fetching list model parameters:', error);
    throw error;  // Re-throw error to be handled elsewhere if necessary
}
}
predictedTrafficService.getPreOpeningEventParams = async (clientId) => {
  try {
    // Fetch the parameters for "Pre-opening events"
    const results = await MParameters.findAll({
      attributes: [
        'id','client', 'parameter', 'weekday', 'startTime', 'startTimeMinutes',
        'endTime', 'endTimeMinutes', 'man', 'cafe', 'park', 'desk', 'jump',
        'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        parameter: 'Pre-opening events'
      }
    });

    // Prepare the final array structure
    const preOpeningEventListParam = [];

    // Use a map to organize data by weekday
    const weekdayMap = {};

    results.forEach(row => {
      const weekday = row.weekday;

      // If weekday is not already in the map, initialize it
      if (!weekdayMap[weekday]) {
        weekdayMap[weekday] = {
          id: null,
          StartTime: null,
          EndTime: null,
          dayTest: {}
        };
      }

      // Populate StartTime, EndTime, and dayTest for the weekday
      weekdayMap[weekday].id = row.id;
      weekdayMap[weekday].StartTime = `${row.startTime}:${row.startTimeMinutes}`;
      weekdayMap[weekday].EndTime = `${row.endTime}:${row.endTimeMinutes}`;
      weekdayMap[weekday].dayTest = {
        man: row.man,
        cafe: row.cafe,
        park: row.park,
        desk: row.desk,
        jump: row.jump,
        gman: row.gman,
        lead: row.lead,
        floater: row.floater
      };
    });

    // Convert the map into the desired array format
    for (const [weekday, data] of Object.entries(weekdayMap)) {
      preOpeningEventListParam.push({
        [weekday]: data
      });
    }

    return preOpeningEventListParam;
  } catch (error) {
    console.error('Error fetching pre-opening event parameters:', error);
    throw error;
  }
};

predictedTrafficService.getOpeningHourListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Opening hours"
    const results = await MParameters.findAll({
      attributes: [
        'id','client', 'parameter', 'weekday', 'startTime', 'startTimeMinutes', 'endTime', 'endTimeMinutes'
      ],
      where: {
        client: clientId,
        parameter: 'Opening hours'
      }
    });

    // Prepare the desired array format
    const openingHourListParam = [];

    // Loop through the results and populate the desired structure
    results.forEach(row => {
      const { id, weekday, startTime, startTimeMinutes, endTime, endTimeMinutes } = row.dataValues;

      // Add data for each weekday in the desired format
      openingHourListParam.push({
        [weekday]: {
          id: id,
          OpenStartTime: `${startTime}:${startTimeMinutes}`,
          OpenEndTime: `${endTime}:${endTimeMinutes}`
        }
      });
    });

    // Return the final result
    return openingHourListParam;
  } catch (error) {
    console.error('Error fetching getOpeningHourListParam:', error);
    throw error;
  }
};

predictedTrafficService.getPaidBreakListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Paid break every X hours"
    const results = await MParameters.findOne({
      attributes: ['id','client', 'parameter', 'value'],
      where: {
        client: clientId,
        parameter: 'Paid break every X hours'
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching getPaidBreakListParam:', error);
    throw error;
  }
};

predictedTrafficService.getBreakDurationListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Paid break every X hours"
    const results = await MParameters.findOne({
      attributes: ['id','client', 'parameter', 'value'],
      where: {
        client: clientId,
        parameter: 'Break duration in minutes'
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching getBreakDurationListParam:', error);
    throw error;
  }
};

predictedTrafficService.getShiftHoursListParam = async (clientId) => {
  try {
    // Fetch the shift hours parameters
    const shiftHoursParams = await MParameters.findAll({
      attributes: [
        'id','client', 'parameter', 'man', 'cafe', 'park',
        'desk', 'jump', 'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        parameter: {
          [Op.in]: ['Minimum shift', 'Maximum shift']
        }
      }
    });

    // Map the results
    const shiftHoursResult = shiftHoursParams.map(param => ({
      id: param.id,
      client: param.client,
      parameter: param.parameter,
      man: param.man,
      cafe: param.cafe,
      park: param.park,
      desk: param.desk,
      jump: param.jump,
      gman: param.gman,
      lead: param.lead,
      floater: param.floater
    }));

    return shiftHoursResult;
  } catch (error) {
    console.error('Error fetching getShiftHoursListParam:', error);
    throw error;
  }
};

predictedTrafficService.getStaffCountListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Staff minimum, given number of jumpers"
    const staffCountParams = await MParameters.findAll({
      attributes: [
        'id', 'client', 'parameter', 'threshold', 'man', 'cafe', 'park',
        'desk', 'jump', 'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        parameter: 'Staff minimum, given number of jumpers'
      }
    });

    // Map the results
    const staffCountResult = staffCountParams.map(param => ({
      id: param.id,
      client: param.client,
      parameter: param.parameter,
      threshold: param.threshold,
      man: param.man,
      cafe: param.cafe,
      park: param.park,
      desk: param.desk,
      jump: param.jump,
      gman: param.gman,
      lead: param.lead,
      floater: param.floater
    }));

    return staffCountResult;
  } catch (error) {
    console.error('Error fetching getStaffCountListParam:', error);
    throw error;
  }
};

predictedTrafficService.getStaffMinimumListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Paid break every X hours"
    const results = await MParameters.findOne({
      attributes: [
        'id', 'client', 'parameter', 'weekday', 'man', 'cafe', 'park',
        'desk', 'jump', 'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        weekday: '',
        parameter: 'Staff minimum (opening shift)'
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching getStaffMinimumListParam:', error);
    throw error;
  }
};

predictedTrafficService.getAllStaffMinimumListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Paid break every X hours"
    const query = await MParameters.findAll({
      attributes: [
        'id', 'client', 'parameter', 'weekday', 'man', 'cafe', 'park',
        'desk', 'jump', 'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        weekday: { [Op.ne]: '' }, // Op.ne is '!=' in SQL (not equal)
        parameter: { [Op.like]: 'Staff minimum (%' }
      }
    });

    // Mapping the results
    const results = query.map(param => ({
      id: param.id,
      client: param.client,
      parameter: param.parameter,
      weekday: param.weekday,
      man: param.man,
      cafe: param.cafe,
      park: param.park,
      desk: param.desk,
      jump: param.jump,
      gman: param.gman,
      lead: param.lead,
      floater: param.floater
    }));

    return results;
  } catch (error) {
    console.error('Error fetching getAllStaffMinimumListParam:', error);
    throw error;
  }
};

predictedTrafficService.getClosingStaffMinimumListParam = async (clientId) => {
  try {
    // Fetch the parameters for "Paid break every X hours"
    const results = await MParameters.findOne({
      attributes: [
        'id', 'client', 'parameter', 'weekday', 'man', 'cafe', 'park',
        'desk', 'jump', 'gman', 'lead', 'floater'
      ],
      where: {
        client: clientId,
        weekday: '',
        parameter: 'Staff minimum (closing shift)'
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching getClosingStaffMinimumListParam:', error);
    throw error;
  }
};

// update , insert and export functions

predictedTrafficService.getStaffScheduleDataForExcel = async (curDay, lastSevenDay) => {
  try {
    // Get the date range from query parameters or set defaults
    const data = await MFutureStaffLists.findAll({
      attributes: [
        'Date', 'Position',
        ['0', '00_Hour'], ['1', '01_Hour'], ['2', '02_Hour'], ['3', '03_Hour'],
        ['4', '04_Hour'], ['5', '05_Hour'], ['6', '06_Hour'], ['7', '07_Hour'],
        ['8', '08_Hour'], ['9', '09_Hour'], ['10', '10_Hour'], ['11', '11_Hour'],
        ['12', '12_Hour'], ['13', '13_Hour'], ['14', '14_Hour'], ['15', '15_Hour'],
        ['16', '16_Hour'], ['17', '17_Hour'], ['18', '18_Hour'], ['19', '19_Hour'],
        ['20', '20_Hour'], ['21', '21_Hour'], ['22', '22_Hour'], ['23', '23_Hour']
      ],
      where: {
        Client_id: 1,
        Date: {
          [Op.between]: [lastSevenDay, curDay]
        }
      },
      order: [['Date', 'DESC']]
    });
    console.log('data',data);
    return { code: true, res: data };
  } catch (error) {
    console.error('Error in getStaffScheduleDataForExcel:', error);
    return { code: false, res: error };
  }
  
}

predictedTrafficService.createScheduleData = async (forDate,pos,clientId) => {
  try {
    const publishPromises = pos.map(position => {
      return PublishSchedule.create({
        publish_date: forDate,
        position: position,
        client_id: clientId
      });
    });
    // Wait for all insertions to complete
    await Promise.all(publishPromises);
    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error creating schedule data:', error);
    return { code: false, res: error };
  }
}

predictedTrafficService.SaveStaffSettingData = async (data , clientId) => {
  try {
    const publishPromises = data.map(async (item) => {

      // Check if the record exists for the given client and id
      const existingRecord = await ListParam.findOne({
        where: { id: item.id, Client_id: clientId },
      });

      if (existingRecord) {
        // Update the existing record if it exists
        await ListParam.update(item, {
          where: { id: item.id, Client_id: clientId },
        });
      }
    });
    // Wait for all insertions to complete
    await Promise.all(publishPromises);
    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error in SaveStaffSettingData:', error);
    return { code: false, res: error };
  }
}

// Helper functions to extract hours and minutes
const beforeColon = (timeString) => timeString.split(":")[0];
const afterColon = (timeString) => timeString.split(":")[1] || "0"; 

predictedTrafficService.UpdateMParametersData = async (data, clientId) => {
  try {
    // Loop through each item in the data array and update
    const updatePromises = data.map(async (item) => {
      // Process the time fields
      if (item.StartTime) {
        item.startTime = beforeColon(item.StartTime);
        item.startTimeMinutes = afterColon(item.StartTime);
      }
      if (item.EndTime) {
        item.endTime = beforeColon(item.EndTime);
        item.endTimeMinutes = afterColon(item.EndTime);
      }
      if (item.OpenStartTime) {
        item.startTime = beforeColon(item.OpenStartTime);
        item.startTimeMinutes = afterColon(item.OpenStartTime);
      }
      if (item.OpenEndTime) {
        item.endTime = beforeColon(item.OpenEndTime);
        item.endTimeMinutes = afterColon(item.OpenEndTime);
      }

      // Check if the record exists for the given client and id
      const existingRecord = await MParameters.findOne({
        where: { id: item.id, client: clientId },
      });

      if (existingRecord) {
        // Update the existing record if it exists
        await MParameters.update(item, {
          where: { id: item.id, client: clientId },
        });
      }
    });

    // Wait for all update operations to complete
    await Promise.all(updatePromises);

    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error updating MParameters data:', error);
    return { code: false, res: error.message }; // Ensure error message is returned, not the entire error object
  }
};

predictedTrafficService.SaveStaffHoursData = async (data , clientId) => {
  try {
    const DataPromises = data.map(async (item) => {

      // Check if the record exists for the given client and id
      const existingRecord = await StaffHours.findOne({
        where: { id: item.id, client_id: clientId },
      });

      if (existingRecord) {
        // Update the existing record if it exists
        await StaffHours.update(item, {
          where: { id: item.id, client_id: clientId },
        });
      }
      if(item.id===0) {
        delete item.id;
        item.client_id = clientId;
        // Create new record if it doesn't exist
        await StaffHours.create(item);
      }
    });
    console.log('Updated staff hours',DataPromises);
    // Wait for all insertions to complete
    await Promise.all(DataPromises);
    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error in SaveStaffHoursData:', error);
    return { code: false, res: error };
  }
}

// holiday settings Functions

predictedTrafficService.getHolidaySettings = async (clientId,year) => {
  try {
    const results = await HolidaySetting.findAll({
      where: {
        client_id: clientId,
        year: year,
      },
      order: [
        ['id', 'ASC'],
        ['holiday_desc', 'ASC']
      ],
    });

    return results;
  } catch (error) {
    console.error('Error fetching getPaidBreakListParam:', error);
    throw error;
  }
};

export default predictedTrafficService;