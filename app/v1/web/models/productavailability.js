import { RollerAvailableProducts } from "../../../../config/tables.js";

export const updateStatus = async (data) => {
    try {
      const updatePromises = data.map(value =>
        RollerAvailableProducts.update(
          { status: value.status },
          { where: { id: value.id } }
        )
      );
      await Promise.all(updatePromises);
  
      return { code: true, res: "Updated." };
    } catch (error) {
      return { code: false, res: error.message };
    }
  };
