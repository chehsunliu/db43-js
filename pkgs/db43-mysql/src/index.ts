import { Knex } from "knex";
import schemaInspector from "knex-schema-inspector";
import * as fs from "node:fs";
import * as path from "node:path";

import { Plugin } from "@chehsunliu/db43-types";

export type MySqlPluginProps = {
  knex: Knex;
};

type TableMeta = {
  [tableName: string]: {};
};

export class MySqlPlugin implements Plugin {
  private readonly knex: Knex;
  private _tableMeta: TableMeta | undefined;

  constructor(props: MySqlPluginProps) {
    this.knex = props.knex;
  }

  truncate = async (): Promise<void> => {
    const meta = await this.getTableMeta();

    for (const tableName in meta) {
      await this.knex(tableName).truncate();
    }
  };

  load = async (folder: string): Promise<void> => {
    const meta = await this.getTableMeta();

    const tasks = [];
    for (const tableName in meta) {
      const sqlFilepath = path.join(folder, `mysql.${tableName}.sql`);
      if (fs.existsSync(sqlFilepath)) {
        tasks.push(this.loadSqlData(sqlFilepath));
        continue;
      }

      const rawSqlFilepath = path.join(folder, `raw-sql.${tableName}.json`);
      if (fs.existsSync(rawSqlFilepath)) {
        tasks.push(this.loadRawData(tableName, rawSqlFilepath));
        continue;
      }

      const rawFilepath = path.join(folder, `raw.${tableName}.json`);
      if (fs.existsSync(rawFilepath)) {
        tasks.push(this.loadRawData(tableName, rawFilepath));
      }
    }
    await Promise.all(tasks);
  };

  private getTableMeta = async (): Promise<TableMeta> => {
    if (this._tableMeta !== undefined) {
      return this._tableMeta;
    }

    const tableNames = await schemaInspector(this.knex).tables();
    this._tableMeta = Object.fromEntries(tableNames.map((t) => [t, {}]));
    return this._tableMeta;
  };

  private loadSqlData = async (filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    await this.knex.raw(buffer.toString());
  };

  private loadRawData = async (tableName: string, filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    const items = JSON.parse(buffer.toString()) as object[];
    await this.knex(tableName).insert(items);
  };
}
