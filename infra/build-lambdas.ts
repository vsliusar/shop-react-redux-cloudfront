import { build } from "esbuild";
import * as path from "path";
import * as fs from "fs";

const lambdas = [
  { name: "getProductsList", entry: "lambda/handlers/getProductsList.ts" },
  { name: "getProductsById", entry: "lambda/handlers/getProductsById.ts" },
];

(async () => {
  for (const lambda of lambdas) {
    const outDir = path.join("dist", lambda.name);
    const outFile = path.join(outDir, "index.js");

    fs.mkdirSync(outDir, { recursive: true });

    await build({
      entryPoints: [lambda.entry],
      bundle: true,
      platform: "node",
      target: "node20",
      outfile: outFile,
      sourcemap: false,
    });

    console.log(`✅ Built ${lambda.name}`);
  }
})();
