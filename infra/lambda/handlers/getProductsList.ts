import { getAllProducts } from "../data/products";
import { buildApiResponse } from "../utils/apiResponse";

/**
 * Lambda function handler for getting the list of all products.
 * @param {Object} event - The API Gateway event.
 * @returns {Promise<Object>} An API Gateway proxy response object.
 */

export const handler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const products = getAllProducts();

    return buildApiResponse(200, products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return buildApiResponse(500, { message: "Internal Server Error" });
  }
};
