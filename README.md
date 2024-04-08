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

1. `dynamodb.${table-name}.json`
2. `raw.${table-name}.json`

For example, if there are 3 tables: `posts`, `comments`, `users`, and the data files in the folder are `dynamodb.posts.json`, `raw.posts.json`, `raw.comments.json`. Then only `dynamodb.posts.json` and `raw.comments.json` will be loaded.

The format of the data file should be in JSON array:

```json
[
  { "k1": "", ... },
  ...
  { "k2": "", ... },
]
```

### MySQL

Install the package:

```sh
npm install -D @chehsunliu/db43-mysql
```

Configure the DB43 plugins in the Jest setup file `setup.ts`:

```ts
import * as Knex from "knex";
import * as db43 from "@chehsunliu/db43";
import { MySqlPlugin } from "@chehsunliu/db43-mysql";

let knex: Knex.Knex | undefined;

beforeAll(async () => {
    knex = Knex.knex({
        client: "mysql2",
        connection: {
            host: "127.0.0.1",
            port: 3306,
            user: "root",
            password: "xxx",
            database: "demo",
            multipleStatements: true,
        },
        pool: {
            afterCreate: (conn: any, done: any) => {
                conn.query("SET FOREIGN_KEY_CHECKS = 0", (err: any) => done(err, conn));
            },
        },
    });

    db43.configure({ plugins: [new MySqlPlugin({ knex })] });
});

afterAll(async () => {
    await knex!.destroy();
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
2. `raw-sql.${table-name}.json`
3. `raw.${table-name}.json`

For example, if there are 3 tables: `posts`, `comments`, `users`, and the data files in the folder are `mysql.posts.sql`, `raw.posts.json`, `raw-sql.comments.json`. Then only `mysql.posts.json` and `raw-sql.comments.json` will be loaded.

The format of the JSON data file should be in JSON array:

```json
[
  { "k1": "", ... },
  ...
  { "k2": "", ... },
]
```
