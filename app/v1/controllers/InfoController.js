import CommonFunction from "../../../helper/common.js";
import { MetaDatas } from "../../../config/tables.js";

const getLatestVersion = async (req, res) => {
    try {
        const infoData = await MetaDatas.findAll({
            where: {
                meta_key: ["android_version", "ios_version", "force_version"],
            },
            order: [["created_at", "DESC"]],
            limit: 3,
        });

        const finalResponse = {};
        infoData.forEach((value) => {
            if (value.meta_key === "android_version") {
                finalResponse.android_version = parseFloat(value.meta_value);
            } else if (value.meta_key === "ios_version") {
                finalResponse.ios_version = parseFloat(value.meta_value);
            } else if (value.meta_key === "force_version") {
                finalResponse.force = value.meta_value === "0" ? false : true;
            }
        });

        res.status(200).json(CommonFunction.succsMessage("success", finalResponse));
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const addLatestVersion = async (req, res) => {
    const data = req.body;
    let force;
    // Mandatory fields validation
    if (!data.android_version) return res.status(400).json(CommonFunction.errMessage("Androind version is required."));
    if (!data.ios_version) return res.status(400).json(CommonFunction.errMessage("iOS vesion is required."));

    // Sanitize input
    const android_version = data.android_version.trim();
    const ios_version = data.ios_version.trim();
    if (data.force) {
        force = data.force;
    }

    const Postdata = {
        android_version: android_version,
        ios_version: ios_version,
        force: force,
    };

    try {
        await Promise.all(
            Object.entries(Postdata).map(async ([key, value]) => {
                if (key === "force") {
                    key = "force_version";
                    value = value === "true" ? "1" : "0";
                }

                await MetaDatas.create({
                    meta_key: key,
                    meta_value: value,
                });
            })
        );

        res.status(200).json(CommonFunction.succsMessage("Version updated successfully.", []));
    } catch (error) {
        console.log("Error in addLatestVersion", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export { getLatestVersion, addLatestVersion };