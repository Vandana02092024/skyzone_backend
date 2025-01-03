import { User } from "../../../../config/tables.js";

// ## SEARCH USER BY LOGIN CREDENTAILS //
export const LoginUser = async (select, credentials) => {
  try {
    const res = await User.findOne({
      attributes: select,
      where: credentials,
    });

    if (!res) return { code: false, res: "Username or Password is incorrect." };
    else return { code: true, res: res };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

// ## DEFAULT EXPORT
export default User;
