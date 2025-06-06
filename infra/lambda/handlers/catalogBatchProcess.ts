import { SQSHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ddb = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const product = JSON.parse(record.body);

      const { id, title, description, price, count } = product;

      await ddb.send(
        new PutItemCommand({
          TableName: process.env.PRODUCTS_TABLE!,
          Item: {
            id: { S: id },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
          },
        })
      );

      await ddb.send(
        new PutItemCommand({
          TableName: process.env.STOCK_TABLE!,
          Item: {
            product_id: { S: id },
            count: { N: count.toString() },
          },
        })
      );

      console.log(`Product ${id} added successfully.`);

      await sns.send(
        new PublishCommand({
          TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN!,
          Subject: "New Product Created",
          Message: `Product "${title}" was created with ID "${id}" and stock count ${count}.`,
        })
      );
    } catch (error) {
      console.error("Error processing message", error);
    }
  }
};
