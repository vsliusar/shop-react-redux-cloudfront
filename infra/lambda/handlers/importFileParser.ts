import { S3Event } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csv from "csv-parser";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      // Get the file from S3
      const { Body } = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );

      if (!Body) {
        throw new Error(`No body returned for object: ${key}`);
      }

      // Parse CSV
      const results: any[] = [];

      // Convert the S3 stream to array of objects
      await new Promise((resolve, reject) => {
        // Ensure Body is treated as a readable stream
        const stream = Body as Readable;

        stream
          .pipe(csv())
          .on("data", (data: any) => {
            console.log("Parsed CSV row:", data);
            results.push(data);
          })
          .on("end", async () => {
            try {
              console.log(
                `Successfully parsed ${results.length} rows from ${key}`
              );

              // Copy to parsed folder
              const newKey = key.replace("uploaded/", "parsed/");
              await s3Client.send(
                new CopyObjectCommand({
                  Bucket: bucket,
                  CopySource: `${bucket}/${key}`,
                  Key: newKey,
                })
              );
              console.log(`Copied ${key} to ${newKey}`);

              // Delete from uploaded folder
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: bucket,
                  Key: key,
                })
              );
              console.log(`Deleted ${key}`);

              resolve(null);
            } catch (error) {
              console.error("Error in file processing completion:", error);
              reject(error);
            }
          })
          .on("error", (error: any) => {
            console.error("Error parsing CSV:", error);
            reject(error);
          });
      });

      console.log(`Successfully processed file ${key}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "CSV processing completed successfully",
      }),
    };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
};
