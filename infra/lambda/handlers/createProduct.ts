import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCK_TABLE = process.env.STOCK_TABLE!;

export async function handler(event: any) {
  try {
    const requestBody = JSON.parse(event.body);

    const { title, description, price, count } = requestBody;

    if (!title || !description || !price || !count) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const productId = uuidv4();

    const product = {
      id: { S: productId },
      title: { S: title },
      description: { S: description },
      price: { N: String(price) },
    };

    await client.send(
      new PutItemCommand({
        TableName: PRODUCTS_TABLE,
        Item: product,
      })
    );

    const stock = {
      product_id: { S: productId },
      count: { N: String(count) },
    };

    await client.send(
      new PutItemCommand({
        TableName: STOCK_TABLE,
        Item: stock,
      })
    );

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Product created",
        productId: productId,
      }),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create product!" }),
    };
  }
}
