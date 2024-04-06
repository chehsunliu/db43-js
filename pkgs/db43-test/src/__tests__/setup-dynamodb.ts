import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import * as db43 from "@chehsunliu/db43";
import { DynamoDbPlugin } from "@chehsunliu/db43-dynamodb";
import { configure as configureRepo, DynamoDbPostRepository } from "@chehsunliu/db43-test";

const client = new DynamoDBClient({
  region: "us-west-2",
  endpoint: "http://127.0.0.1:8000",
  credentials: {
    accessKeyId: "xxx",
    secretAccessKey: "xxx",
  },
});

configureRepo(new DynamoDbPostRepository({ tableName: "posts" }, client));

beforeAll(async () => {
  db43.configure({ plugins: [new DynamoDbPlugin({ client })] });
});
