# DB43 - JS

[![Test](https://img.shields.io/github/actions/workflow/status/chehsunliu/db43-js/test.yml?style=flat-square&logo=github&label=Test)](https://github.com/chehsunliu/db43-js/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/chehsunliu/db43-js/test.yml?style=flat-square&logo=github&label=Release)](https://github.com/chehsunliu/db43-js/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/%40chehsunliu%2Fdb43?style=flat-square&logo=npm)](https://www.npmjs.com/package/@chehsunliu/db43)

For database truncate and load, simplifying the setup of integration testing.

## Usage

### DynamoDB

Install the package:

```sh
npm install -D @chehsunliu/db43 @chehsunliu/db43-dynamodb
```

Configure the DB43 plugins in the Jest setup file `setup.ts`:

```ts
import * as db43 from "@chehsunliu/db43";
import { DynamoDbPlugin } from "@chehsunliu/db43-dynamodb";

beforeAll(async () => {
  const plugin = new DynamoDbPlugin({
    connection: {
      region: "us-west-2",
      endpoint: "http://127.0.0.1:8000",
      accessKeyId: "xxx",
      secretAccessKey: "xxx",
    },
  });
  db43.configure({ plugins: [plugin] });
});

afterAll(async () => {
  await db43.release();
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

1. `dynamodb.${table-name}.json`
2. `raw-dynamodb.${table-name}.json`
3. `raw.${table-name}.json`

The format of `dynamodb.${table-name}.json` is a DynamoDB JSON array:

```json
[
  { "k1": { "S": "v1" }, "k2": { "N": 123 } },
  { "k1": { "S": "v2" }, "k2": { "N": 456 } }
]
```

The format of `raw-dynamodb.${table-name}.json` and `raw.${table-name}.json` is a JSON array:

```json
[
  { "k1": "v1", "k2": 123 },
  { "k1": "v2", "k2": 456 }
]
```

### MySQL

Install the package:

```sh
npm install -D @chehsunliu/db43 @chehsunliu/db43-mysql
```

Configure the DB43 plugins in the Jest setup file `setup.ts`:

```ts
import * as db43 from "@chehsunliu/db43";
import { MySqlPlugin } from "@chehsunliu/db43-mysql";

db43.configure({
  plugins: [
    new MySqlPlugin({
      connection: {
        host: "127.0.0.1",
        port: 3306,
        user: "root",
        password: "xxx",
        database: "demo",
      },
    }),
  ],
});

afterAll(async () => {
  await db43.release();
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

For each table in your MySQL database, it will search the data file in the following order. Only the first one found will be loaded.

1. `mysql.${table-name}.sql`
2. `generic.${table-name}.sql`
3. `raw-sql.${table-name}.json`
4. `raw.${table-name}.json`

The format of `mysql.${table-name}.sql` amd `generic.${table-name}.sql` is a SQL file:

```sql
INSERT INTO `posts` (`content`) VALUES ('v1');
INSERT INTO `posts` (`content`) VALUES ('v2');
INSERT INTO `posts` (`content`) VALUES ('v3');
```

The format of `raw-sql.${table-name}.json` and `raw.${table-name}.json` is a JSON array:

```json
[
  { "k1": "v1", "k2": 123 },
  { "k1": "v2", "k2": 456 }
]
```
