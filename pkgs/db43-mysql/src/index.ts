import { knex, Knex } from "knex";
import schemaInspector from "knex-schema-inspector";
import * as fs from "node:fs";
import * as path from "node:path";

import { Plugin } from "@chehsunliu/db43";

const defaultDataFilenameFactory = {
  mySqlSqlFilename: (tableName: string): string => `mysql.${tableName}.sql`,
  genericSqlFilename: (tableName: string): string => `generic.${tableName}.sql`,
  rawSqlJsonFilename: (tableName: string): string => `raw-sql.${tableName}.json`,
  rawJsonFilename: (tableName: string): string => `raw.${tableName}.json`,
};

type DataFilenameFactory = typeof defaultDataFilenameFactory;

type MySqlPluginProps = {
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  dataFilenameFactory?: DataFilenameFactory;
};

type TableMetaMap = {
  [tableName: string]: {
    jsonFields: Set<string>;
  };
};

export class MySqlPlugin implements Plugin {
  private readonly props: MySqlPluginProps;
  private readonly dataFilenameFactory: DataFilenameFactory;
  private _knex?: Knex;
  private _tableMetaMap?: TableMetaMap;

  constructor(props: MySqlPluginProps) {
    this.props = props;
    this.dataFilenameFactory = props.dataFilenameFactory ?? defaultDataFilenameFactory;
  }

  truncate = async (): Promise<void> => {
    const metaMap = await this.getTableMetaMap();

    // Running truncation concurrently will cause errors, possibly due to disabling foreign key checks.
    for (const tableName in metaMap) {
      await this.knex(tableName).truncate();
    }
  };

  load = async (folder: string): Promise<void> => {
    const metaMap = await this.getTableMetaMap();

    const tasks = [];
    for (const tableName in metaMap) {
      const mysqlSqlFilepath = path.join(folder, this.dataFilenameFactory.mySqlSqlFilename(tableName));
      if (fs.existsSync(mysqlSqlFilepath)) {
        tasks.push(this.loadSqlData(mysqlSqlFilepath));
        continue;
      }

      const genericSqlFilepath = path.join(folder, this.dataFilenameFactory.genericSqlFilename(tableName));
      if (fs.existsSync(genericSqlFilepath)) {
        tasks.push(this.loadSqlData(genericSqlFilepath));
        continue;
      }

      const rawSqlJsonFilepath = path.join(folder, this.dataFilenameFactory.rawSqlJsonFilename(tableName));
      if (fs.existsSync(rawSqlJsonFilepath)) {
        tasks.push(this.loadJsonData(tableName, rawSqlJsonFilepath));
        continue;
      }

      const rawJsonFilepath = path.join(folder, this.dataFilenameFactory.rawJsonFilename(tableName));
      if (fs.existsSync(rawJsonFilepath)) {
        tasks.push(this.loadJsonData(tableName, rawJsonFilepath));
      }
    }
    await Promise.all(tasks);
  };

  release = async (): Promise<void> => {
    if (this._knex !== undefined) {
      await this._knex.destroy();
    }
    this._knex = undefined;
  };

  get knex(): Knex {
    if (this._knex === undefined) {
      this._knex = knex({
        client: "mysql2",
        connection: {
          ...this.props.connection,
          multipleStatements: true,
        },
        pool: {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          afterCreate: (conn: any, done: any) => {
            conn.query("SET FOREIGN_KEY_CHECKS = 0", (err: any) => done(err, conn));
          },
          /* eslint-enable @typescript-eslint/no-explicit-any */
        },
      });
    }

    return this._knex;
  }

  private getTableMetaMap = async (): Promise<TableMetaMap> => {
    if (this._tableMetaMap !== undefined) {
      return this._tableMetaMap;
    }

    const inspector = schemaInspector(this.knex);
    const tableNames = await inspector.tables();

    this._tableMetaMap = {};
    for (const tableName of tableNames) {
      const columns = await inspector.columnInfo(tableName);
      // JSON column is 'json' in MySQL while 'longtext' in MariaDB
      const jsonFields = columns.filter((c) => c.data_type === "longtext" || c.data_type === "json").map((c) => c.name);
      this._tableMetaMap[tableName] = {
        jsonFields: new Set(jsonFields),
      };
    }

    return this._tableMetaMap;
  };

  private getTableMeta = async (tableName: string) => {
    const metaMap = await this.getTableMetaMap();
    return metaMap[tableName];
  };

  private loadSqlData = async (filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    await this.knex.raw(buffer.toString());
  };

  private loadJsonData = async (tableName: string, filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    const items = JSON.parse(buffer.toString()) as object[];

    const meta = await this.getTableMeta(tableName);
    const normalizedItems = items.map((item) => {
      return Object.fromEntries(
        Object.entries(item).map(([k, v]) => (meta.jsonFields.has(k) ? [k, JSON.stringify(v)] : [k, v])),
      );
    });
    await this.knex(tableName).insert(normalizedItems);
  };
}
