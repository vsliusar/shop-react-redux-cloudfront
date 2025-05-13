import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "us-east-1" });

async function fillTables() {
  const products = [
    {
      id: { S: uuidv4() },
      title: { S: "Product Title 1" },
      description: { S: "This product 1 description" },
      price: { N: "100" },
    },
    {
      id: { S: uuidv4() },
      title: { S: "Product Title 2" },
      description: { S: "This product 2 description" },
      price: { N: "200" },
    },
    {
      id: { S: uuidv4() },
      title: { S: "Product Title 3" },
      description: { S: "This product 3 description" },
      price: { N: "300" },
    },
    {
      id: { S: uuidv4() },
      title: { S: "Product Title 4" },
      description: { S: "This product 4 description" },
      price: { N: "400" },
    },
  ];

  for (const product of products) {
    // Insert product into products table
    await client.send(
      new PutItemCommand({
        TableName: "products",
        Item: product,
      })
    );
    // Insert corresponding stock item into stock table
    await client.send(
      new PutItemCommand({
        TableName: "stock",
        Item: {
          product_id: product.id,
          count: { N: "10" },
        },
      })
    );
  }
  console.log("Tables filled with test data.");
}

fillTables().catch((err) => {
  console.error("Error filling tables:", err);
});
