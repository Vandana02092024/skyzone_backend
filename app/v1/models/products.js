import { CategoryCard,RestProductPackageItem,MobileTransactionFee,RestProductParent,RollerAvailableProducts,LatestOfferings } from "../../../config/tables.js";
import { Sequelize, Op } from 'sequelize';

const productService = {};

productService.getCardDetails = async (card_id,client_id) => {
    try {
        const card_details = await CategoryCard.findOne({
          attributes: ['name','description','header_img','product_type'],
          where: { id: card_id }, 
        });
        if(card_details) {
            return card_details;
        }
      } catch (err) {
        return { code: false, message: err.message };
      }

};

productService.getRestProductParent = async (id) => {
    try {
        const details = await RestProductParent.findAll({
          attributes: ['description'],
          where: { Pid: id }, 
        });
        if(details) {
            return details;
        }
      } catch (err) {
        res.status(500).json({ code: false, message: err.message });
      }

};

productService.packageIds = async (products,client_id) => {

    // Extract product ids from the response
  const prodIds = products.map(item => item.id);
    try {
        // Query the database
    const results = await RestProductPackageItem.findAll({
        attributes: [
          [Sequelize.fn('GROUP_CONCAT', Sequelize.col('productId')), 'productids']
        ],
        where: {
          packageProductId: {
            [Op.in]: prodIds
          },
          client_id: client_id
        },
        group: ['client_id']
      });
  
      // Extract the result
      const productIds = results.length > 0 ? results[0].get('productids') : null;
  
      return productIds;
      } catch (err) {
        res.status(500).json({ code: false, message: err.message });
      }

};

productService.getTransactionFee = async () => {
    try {
        const details = await MobileTransactionFee.findOne({
          attributes: ['fee'],
          where: { id: 1 }, 
        });
        if(details) {
            return details;
        }
      } catch (err) {
        res.status(500).json({ code: false, message: err.message });
      }

};

productService.getAvailableProducts = async (client_id) => {
  try {
    const products = await RollerAvailableProducts.findAll({
      where: {
        client_id: client_id
      },
      attributes: [
        ['product_id', 'id'],
        ['product_id', 'parentProductId'],
        [Sequelize.col('rest_product_parent.name'), 'name'],
        [Sequelize.col('rest_product_parent.name'), 'parentProductName'],
        'type',
        [Sequelize.col('rest_product_parent.description'), 'description'],
        [Sequelize.col('rest_product_parent.imageUrl'), 'imageUrl'],
        ['online_sale', 'onlineSalesOpen'],
        ['id', 'row_id'],
        ['status', 'status'],
      ],
      include: [
        {
          model: RestProductParent,
          attributes: [],
          required: true // Ensures that only matching records are included
        }
      ]
    });

   return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return { code: false, message: error.message };
  }

};

productService.getOfferDiscount = async (offer_id,client_id) => {
  try {
      const result = await LatestOfferings.findOne({
        attributes: ['id','title','discount_code','discount_type','discount_amount','discount_percent','offer_type','client_id'],
        where: { id: offer_id,client_id: client_id}, 
      });
      if(result) {
          return result;
      } else {
        return {};
      }
    } catch (err) {
      console.error('getOfferDiscount',err);
    }

};

export default productService;