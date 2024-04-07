import * as Knex from "knex";

import * as db43 from "@chehsunliu/db43";
import { MySqlPlugin } from "@chehsunliu/db43-mysql";
import { configure as configureRepo, MySqlPostRepository } from "@chehsunliu/db43-test";

let knex1: Knex.Knex | undefined;
let knex2: Knex.Knex | undefined;

beforeAll(async () => {
  knex1 = Knex.knex({
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

  db43.configure({ plugins: [new MySqlPlugin({ knex: knex1 })] });
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
});

afterAll(async () => {
  await knex1!.destroy();
  await knex2!.destroy();
});
