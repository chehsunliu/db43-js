# DB43 - JS

[![Test](https://img.shields.io/github/actions/workflow/status/chehsunliu/db43-js/test.yml?style=flat-square&logo=github&label=Test)](https://github.com/chehsunliu/db43-js/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/chehsunliu/db43-js/test.yml?style=flat-square&logo=github&label=Release)](https://github.com/chehsunliu/db43-js/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/%40chehsunliu%2Fdb43?style=flat-square&logo=npm)](https://www.npmjs.com/package/@chehsunliu/db43)

For database truncate and load, simplifying the setup of integration testing.

## Usage

### DynamoDB

Install the package:

```sh
npm install -D @chehsunliu/db43-dynamodb
```

Configure the DB43 plugins in the Jest setup file `setup.ts`:

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import * as db43 from "@chehsunliu/db43";
import { DynamoDbPlugin } from "@chehsunliu/db43-dynamodb";

const client = new DynamoDBClient({
    region: "us-west-2",
    endpoint: "http://127.0.0.1:8000",
    credentials: {
        accessKeyId: "xxx",
        secretAccessKey: "xxx",
    },
});

beforeAll(async () => {
    db43.configure({ plugins: [new DynamoDbPlugin({ client })] });
});
```

Then call the `truncate` and `load` in the test file:

```ts
import * as path from "node:path";
import * as db43 from "@chehsunliu/db43";

beforeEach(async () => {
    await db43.truncate();
    await db43.load({ folder: path.join(__dirname, "data") });
});
```

For each table in your DynamoDB container, it will search the data file in the following order. Only the first one found will be loaded.

- `dynamodb.${table-name}.json`
- `raw.${table-name}.json`

For example, if there are 3 tables: `posts`, `comments`, `users`, and the data files in the folder are `dynamodb.posts.json`, `raw.posts.json`, `raw.comments.json`. Then only `dynamodb.posts.json` and `raw.comments.json` will be loaded.

The format of the data file should be in JSON array:

```json
[
  { "k1": "", ... },
  ...
  { "k2": "", ... },
]
```
