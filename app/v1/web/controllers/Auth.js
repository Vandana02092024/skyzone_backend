import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { LoginUser } from "../models/auth.js";
import CommonFunction from "../../../../helper/common.js";
import { comparePasswords } from "../../../../helper/utility.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { updateUser } from "../models/user.js";

dotenv.config();
const salt = bcrypt.genSaltSync(10);

async function generateQRCodeUrl(secret, width = 300, height = 300) {
  try {
    const dataUrl = qrcode.toDataURL(secret.otpauth_url, {
      width: width,
      height: height,
      margin: 3,
    });
    return dataUrl;
  } catch (err) {
    console.error("qr err", err);
    throw new Error("Error generating QR code");
  }
}

// ## LOGIN //
export const LogIn = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // IF USERNAME PASSWORD NOT EMPTY
  if (username && password) {
    const select = [
      "id",
      "email",
      "first_name",
      "role",
      "password",
      "auth_secret_key",
      "status",
    ];
    const where = { username: username }; // , status: 1

    // CHECK IF USER EXISTS //
    try {
      var exUser = await LoginUser(select, where);
    } catch (err) {
      res
        .status(400)
        .json(CommonFunction.errMessage("Error Login User: " + err));
    }

    // IF USER EXISTS IN OUR SYSTEM WITH USERNAME ONLY
    if (exUser.code) {
      // VERIFY USER PASSWORD //
      if (exUser.res.status !== 1) {
        res
          .status(401)
          .json(CommonFunction.errMessage("Your account is deactivated."));
      } else {
        try {
          var match = await comparePasswords(password, exUser.res.password);
        } catch (err) {
          res
            .status(400)
            .json(CommonFunction.errMessage("Error Password Compare: " + err));
        }

        // IF PASSWORD MATCHES
        if (match) {
          const user_id = CommonFunction.encrypt(JSON.stringify(exUser.res.id));

          // CREATE RESPONSE //
          // IF AUTH KEY IS BALNK THE GENERATE A QR URL //
          var userSecrets = exUser.res.auth_secret_key;
          var qrCodeUrl = false;
          if (
            exUser.res.auth_secret_key === "" ||
            exUser.res.auth_secret_key === null
          ) {
            const secret = speakeasy.generateSecret({
              name: `${process.env.TF_AUTH_NM} (${CommonFunction.decrypt(
                exUser.res.email
              )})`,
            });
            userSecrets = secret.base32;
            qrCodeUrl = await generateQRCodeUrl(secret);
          }

          const response = {
            tfaInfo: {
              token: user_id,
              auth_secret_key: userSecrets,
              qr_code_url: qrCodeUrl,
            },
          };

          // SEND RESPONSE TO FORNTEND //
          res
            .status(200)
            .json(CommonFunction.succsMessage("Login successful!", response));
        }

        // SEND ERROR MESSAGE
        else
          res
            .status(401)
            .json(CommonFunction.errMessage("Incorrect username / password."));
      }
    } else {
      res
        .status(400)
        .json(CommonFunction.errMessage(`Error Message: ${exUser.res}`));
    }
  } else res.status(400).json(CommonFunction.errMessage("Invalid arguments."));
};

// ## VERIFY GOOGLE TFA
export const Verify = async (req, res) => {
  const { secret, otp } = req.body;

  const isValid = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: otp,
  });

  if (isValid) {
    try {
      const select = ["id", "role", "first_name"];
      const user_id = CommonFunction.decrypt(req.body.token);

      const where = { id: user_id };
      var exUser = await LoginUser(select, where);

      if (exUser.code) {
        const getToken = {
          user_id: exUser.res.id,
          role: exUser.res.role,
        };

        // GENERATE USER TOKEN //
        const token = jwt.sign(getToken, process.env.JWT_SECRET, {
          expiresIn: "7d", // "3h",
        });

        var response = {
          userInfo: {
            token: token,
            user: {
              name: exUser.res.first_name,
              role: CommonFunction.encrypt(exUser.res.role.toString()),
              // role: exUser.res.role,
            },
          },
        };

        await updateUser({ auth_secret_key: secret }, user_id);
      } else {
        res.status(400).json(CommonFunction.errMessage("Invalid Request"));
      }
    } catch (error) {
      res
        .status(401)
        .json(
          CommonFunction.errMessage(
            "There is some issue while updating record."
          )
        );
    }

    res
      .status(200)
      .json(CommonFunction.succsMessage("Login successful!", response));
  } else {
    res.status(400).json(CommonFunction.errMessage("Invalid OTP"));
  }
};
