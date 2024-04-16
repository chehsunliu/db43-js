import * as Knex from "knex";

import * as db43 from "@chehsunliu/db43";
import { MySqlPlugin } from "@chehsunliu/db43-mysql";
import { configure as configureRepo, MySqlPostRepository } from "@chehsunliu/db43-test";

let knex2: Knex.Knex | undefined;

beforeAll(async () => {
  knex2 = Knex.knex({
    client: "mysql2",
    connection: {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "xxx",
      database: "demo",
      multipleStatements: true,
    },
  });
  configureRepo(
    new MySqlPostRepository(
      {
        userTableName: "users",
        postTableName: "posts",
        commentTableName: "comments",
      },
      knex2,
    ),
  );

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
});

afterAll(async () => {
  await knex2!.destroy();
  await db43.release();
});
