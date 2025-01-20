const router = express.Router();
import express from "express";
import { 
    getpredictedTrafficData,
    getSchedulevsActual,
    getFutureStaffLists,
    getstaffSetting,
    getstaffSettingNext,
    getstaffHours,
    ExportStaffScheduleData,
    CreateSchedule,
    SaveStaffSettings,
    SaveStaffSettingsNext,
    SaveStaffHours,
    getHolidaySettings,
} from "../controllers/PredictedTrafficController.js";

router.post('/get-predictedTraffic', getpredictedTrafficData);
router.post('/get-schedulevsActual', getSchedulevsActual);
router.post('/get-FutureStaffLists', getFutureStaffLists);
router.post('/get-staffSetting', getstaffSetting);
router.post('/get-staffSettingNext', getstaffSettingNext);
router.post('/get-staffHours', getstaffHours);
router.post('/export-schedule-data', ExportStaffScheduleData);
router.post('/create-schedule', CreateSchedule);
router.post('/save-staffSetting', SaveStaffSettings);
router.post('/save-staffSettingNext', SaveStaffSettingsNext);
router.post('/save-staffhours', SaveStaffHours);
router.post('/get_holiday_setting', getHolidaySettings);
export default router;