import { getProductById } from "../data/products";
import { buildApiResponse } from "../utils/apiResponse";

/**
 * Lambda function handler for getting a product by its ID.
 * @param {Object} event - The API Gateway event.
 * @returns {Promise<Object>} An API Gateway proxy response object.
 */
export const handler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const productId = event.pathParameters
      ? event.pathParameters.productId
      : null;

    if (!productId) {
      return buildApiResponse(400, { message: "Product ID is required" });
    }

    const product = getProductById(productId);

    if (!product) {
      return buildApiResponse(404, {
        message: `Product with ID ${productId} not found`,
      });
    }

    return buildApiResponse(200, product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return buildApiResponse(500, { message: "Internal Server Error" });
  }
};
