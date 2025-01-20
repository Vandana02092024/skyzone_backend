import { Association, DataTypes } from "sequelize";
import sequelize from "./db.js";

const HumanityRefreshKeys = sequelize.define(
    "HumanityRefreshKeys",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      client_id: {
        type: DataTypes.INTEGER(255),
        allowNull: true,
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      token_type: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      expires_in: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scope: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      update_at: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
      },
    },
    {
      tableName: "humanity_refresh_keys",
      timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
    }
);

const HumanityEmployeesData = sequelize.define(
  "HumanityEmployeesData",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    EmpID: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    Name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    LastActive: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    StartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Client: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
  },
  {
    tableName: "humanityemployeesdata",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const HumanityScheduleSummaryUsers = sequelize.define(
  "HumanityScheduleSummaryUsers",
  {
    autoid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    id : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    group_id : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    work_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    eid: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    location: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    client : {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    data_inserted_on : {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "humanityschedulesummaryusers",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const humanityschedulesummaryshifts = sequelize.define(
  "HumanityScheduleSummaryShifts",
  {
    userid : {
      type: DataTypes.INTEGER,
      // autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    id : {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
    },
    schedule: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    published : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    edited: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    shift_loc: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    start_timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_timestamp : {
      type: DataTypes.DATE,
      allowNull: true,
    },
    schedule_name : {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    schedule_color : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    start_date : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    start : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    end_date : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    end : {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    client : {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    data_inserted_on : {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    datat_updated_on : {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "humanityScheduleSummaryShifts",
    timestamps: false, // Set to true if you want Sequelize to handle created_at/updated_at automatically
  }
);

const GroupArrivals = sequelize.define('GroupArrivals', {
  RefID: {
    type: DataTypes.CHAR(38),
    allowNull: false,
    primaryKey: true
  },
  GrpStatusNo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  StartDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  EndDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  GroupSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  TotalSaleAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  BookingDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,  
  tableName: 'grouparrivals'
});

const HeadCounts = sequelize.define('HeadCounts', {
  ShiftDate: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true,
      // defaultValue: DataTypes.NOW,
  },
  DivNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      defaultValue: 0,
  },
  SessionNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      defaultValue: 0,
  },
  HourNo: {
      type: DataTypes.TINYINT(3),
      allowNull: false,
      primaryKey: true,
  },
  HCClassNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
  },
  HeadCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  InCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  OutCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
  }
}, {
  tableName: 'HeadCounts',
  timestamps: false, 
});

const HolidaySetting = sequelize.define('HolidaySetting', {
  id:{
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
  },
  holiday_desc: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  start_date: {
      type: DataTypes.DATE,
      allowNull: false,
  },
  end_date: {
      type: DataTypes.DATE,
      allowNull: false,
  },
  start_time: {
      type: DataTypes.DATE,
      allowNull: true,
  },
  end_time: {
      type: DataTypes.DATE,
      allowNull: true,
  },
  type: {
      type: DataTypes.ENUM('1', '2','3'),
      allowNull: false,
      defaultValue: '1',
  },
  year: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
  },
}, {
  tableName: 'holiday_setting',
  timestamps: false, 
});

const MFutureHeadcountsWalkin = sequelize.define('MFutureHeadcountsWalkin', {
  Date: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey:false,
  },
  0: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  4: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  5: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  6: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  7: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  8: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  9: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  10: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  11: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  12: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  13: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  14: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  15: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  16: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  17: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  18: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  19: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  20: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  21: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  22: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  23: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:true,
  },
  Created_Date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      primaryKey:false,
  },
}, {
  tableName: 'm_futureHeadcountsWalkin',
  timestamps: false,
  primaryKey:false,
  hasPrimaryKeys: false,
  autoIncrement: false, 
  indexes: [],
});

const MFutureStaffLists = sequelize.define('MFutureStaffLists', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
  },
  Date: {
      type: DataTypes.DATE,
      allowNull: false,
  },
  Position: {
      type: DataTypes.STRING(255),
      allowNull: false,
  },
  0: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  4: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  5: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  6: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  7: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  8: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  9: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  10: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  11: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  12: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  13: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  14: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  15: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  16: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  17: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  18: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  19: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  20: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  21: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  22: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  23: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:false,
  },
  Client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey:true,
  },
  Created_Date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      primaryKey:false,
  },
}, {
  tableName: 'm_futureStaffLists',
  timestamps: false,
});

const MParameters = sequelize.define("MParameters", {
  id:{
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
  },
  client: {
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  parameter:{
      type: DataTypes.TEXT,
      allowNull: true,
  },
  weekday: {
      type: DataTypes.TEXT,
      allowNull: true,
  },
  value:{
      type: DataTypes.DOUBLE,
      allowNull: true,

  },
  startDate	:{
      type: DataTypes.TEXT,
      allowNull: true,

  },
  endDate:{
      type: DataTypes.TEXT,
      allowNull: true,

  },
  startTime:{
      type: DataTypes.BIGINT(20),
      allowNull: true,

  },
  startTimeMinutes:{
      type: DataTypes.BIGINT(20),
      allowNull: true,

  },
  endTime:{
      type: DataTypes.BIGINT(20),
      allowNull: true,

  },
  endTimeMinutes:{
      type: DataTypes.BIGINT(20),
      allowNull: true,

  },
  threshold:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  threshold:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  man:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  cafe:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  park:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  desk:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  jump:{
      type: DataTypes.BIGINT(20),
      allowNull: true,
  },
  gman:{
      type: DataTypes.TINYINT(4),
      allowNull: true,
  },
  lead:{
      type: DataTypes.TINYINT(4),
      allowNull: true,
  },
  floater:{
      type: DataTypes.TINYINT(4),
      allowNull: true,
  },
  description:{
      type: DataTypes.TEXT,
      allowNull: true,
  },
},
{
  tableName: 'm_parameters',
  timestamps: false ,
  freezeTableName: true  
});

const GetPosition = sequelize.define('GetPosition', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
  },
  position: {
      type: DataTypes.STRING(255),
      allowNull: false,
  },
  position_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
  }
}, {
  tableName: 'Tbl_GetPosition',
  timestamps: false, 
});

const ListParam = sequelize.define('ListParam', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
  },
  parameterName: {
      type: DataTypes.STRING(255),
      allowNull: false,
  },
  payRate: {
      type: DataTypes.STRING(100),
      allowNull: true,
  },
  Client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  position_model: {
      type: DataTypes.STRING(60),
      allowNull: false,
  }
}, {
  tableName: 'Tbl_ListParam',
  timestamps: false, 
});

const ModelParam = sequelize.define('ModelParam', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
  },
  parameterName: {
      type: DataTypes.STRING(255),
      allowNull: false,
  },
  position_model: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'Tbl_ModelParam',
  timestamps: false, 
});

const PublishSchedule = sequelize.define('PublishSchedule', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement:true
  },
  publish_date: {
      type: DataTypes.STRING(100),
      allowNull: false,
  },
  position: {
      type: DataTypes.STRING(100),
      allowNull: true,
  },
  client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'Tbl_publish_schedule',
  timestamps: false, 
});

const StaffHours = sequelize.define('StaffHours', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement:true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  timeBefore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeAfter: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  timestamps: false,  
  tableName: 'Tbl_staff_hours' 
});

// Associations
MFutureHeadcountsWalkin.hasMany(MFutureHeadcountsWalkin, {
  as: 'latestHeadcounts', // Alias for the join
  foreignKey: 'client_id',
  sourceKey: 'client_id'
});

humanityschedulesummaryshifts.belongsTo(ListParam, {
  foreignKey: 'schedule_name',
  targetKey: 'parameterName',
  as: 'listParam', // Alias for include
});

MFutureStaffLists.belongsTo(ListParam, {
  foreignKey: 'Position',
  targetKey: 'position_model',
  as: 'mlistParam', // Alias for include
});

// Association between TblGetPosition and TblListParam
GetPosition.hasOne(ListParam, {
  foreignKey: 'client_id',
  sourceKey: 'client_id',
  as: 'listParam'
});

ListParam.belongsTo(GetPosition, {
  foreignKey: 'client_id',
  targetKey: 'client_id',
  as: 'getPosition'
});

GetPosition.hasOne(StaffHours, {
  foreignKey: 'client_id',
  sourceKey: 'client_id',
  as: 'staffHours',
  constraints: false
});

export {
    HumanityRefreshKeys,
    HumanityEmployeesData,
    HumanityScheduleSummaryUsers,
    humanityschedulesummaryshifts,
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
};