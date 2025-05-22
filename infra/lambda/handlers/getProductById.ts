import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCK_TABLE = process.env.STOCK_TABLE!;

export async function handler(event: any) {
  const productId = event.pathParameters.productId;

  try {
    const productData = await client.send(
      new GetItemCommand({
        TableName: PRODUCTS_TABLE,
        Key: {
          id: { S: productId },
        },
      })
    );

    if (!productData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found!" }),
      };
    }

    const product = {
      id: productData.Item.id.S!,
      title: productData.Item.title.S!,
      description: productData.Item.description.S!,
      price: Number(productData.Item.price.N!),
    };

    const stockData = await client.send(
      new GetItemCommand({
        TableName: STOCK_TABLE,
        Key: {
          product_id: { S: productId },
        },
      })
    );

    const count = stockData.Item ? Number(stockData.Item.count.N!) : 0;

    const joinedProduct = {
      ...product,
      count: count,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(joinedProduct),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch product" }),
    };
  }
}
