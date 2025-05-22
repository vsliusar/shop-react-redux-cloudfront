import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCK_TABLE = process.env.STOCK_TABLE!;

export async function handler() {
  try {
    const productsData = await client.send(
      new ScanCommand({ TableName: PRODUCTS_TABLE })
    );
    const stockData = await client.send(
      new ScanCommand({ TableName: STOCK_TABLE })
    );

    const products = (productsData.Items || []).map((item) => ({
      id: item.id.S!,
      title: item.title.S!,
      description: item.description.S!,
      price: Number(item.price.N!),
    }));

    const stockMap = new Map(
      (stockData.Items || []).map((item) => [
        item.product_id.S!,
        Number(item.count.N!),
      ])
    );

    const joinedProducts = products.map((product) => ({
      ...product,
      count: stockMap.get(product.id) ?? 0,
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch products!" }),
    };
  }
}
