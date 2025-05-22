/**
 * Builds a standard API Gateway proxy response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {Object | Array | string} body - The response body.
 * @returns {Object} An API Gateway proxy response object.
 */
export const buildApiResponse = (statusCode: any, body: any) => {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
};
