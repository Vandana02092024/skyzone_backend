import bcrypt from "bcrypt";

export const comparePasswords = async (pass, enpass) => {
  try {
    const match = await bcrypt.compare(pass, enpass);
    return match;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw error;
  }
};

export const generateRandomNumber = (digits) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
