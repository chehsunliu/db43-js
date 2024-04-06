import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  paginateScan,
  BatchWriteCommand,
  BatchWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import * as fs from "node:fs";
import * as path from "node:path";

import { Plugin } from "@chehsunliu/db43-types";

const maxWindowSize = 25;

type DynamoDbPluginProps = {
  client: DynamoDBClient;
};

type TableMeta = {
  [tableName: string]: {
    primaryKeys: string[];
  };
};

export class DynamoDbPlugin implements Plugin {
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;
  private _tableMeta: TableMeta | undefined;

  constructor(props: DynamoDbPluginProps) {
    this.client = props.client;
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  truncate = async (): Promise<void> => {
    const tableMeta = await this.getTableMeta();
    const tasks = Object.entries(tableMeta).map(([tableName, meta]) => this.truncateTable(tableName, meta.primaryKeys));
    await Promise.all(tasks);
  };

  load = async (folder: string): Promise<void> => {
    const tableMeta = await this.getTableMeta();

    const tasks = [];
    for (const tableName in tableMeta) {
      const filepath = path.join(folder, `raw.${tableName}.json`);
      if (fs.existsSync(filepath)) {
        tasks.push(this.loadData(tableName, filepath));
      }
    }
    await Promise.all(tasks);
  };

  private getTableMeta = async (): Promise<TableMeta> => {
    if (this._tableMeta !== undefined) {
      return this._tableMeta;
    }

    const r = await this.client.send(new ListTablesCommand());
    const tableNames = r.TableNames ?? [];

    this._tableMeta = {};
    const rs = await Promise.all(tableNames.map((t) => this.client.send(new DescribeTableCommand({ TableName: t }))));

    for (const r of rs) {
      const t = r.Table;
      if (t === undefined) {
        continue;
      }

      this._tableMeta[t.TableName!] = {
        primaryKeys: t.KeySchema!.map((k) => k.AttributeName!),
      };
    }

    return this._tableMeta;
  };

  private truncateTable = async (tableName: string, primaryKeys: string[]) => {
    const paginator = paginateScan({ client: this.docClient }, { TableName: tableName });

    const items = [];
    for await (const page of paginator) {
      if (page.Items === undefined) {
        continue;
      }

      for (const item of page.Items) {
        const itemWithPkOnly = primaryKeys.reduce(
          (out, key) => {
            out[key] = item[key];
            return out;
          },
          {} as Record<string, any>,
        );
        items.push(itemWithPkOnly);
      }
    }

    const tasks = [];
    for (let i = 0; i < items.length; i += maxWindowSize) {
      const chunk = items.slice(i, i + maxWindowSize);
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ DeleteRequest: { Key: item } })),
        },
      });
      tasks.push(this.docClient.send(command));
    }

    await Promise.all(tasks);
  };

  private loadData = async (tableName: string, filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    const items = JSON.parse(buffer.toString()) as object[];

    const tasks = [];
    for (let i = 0; i < items.length; i += maxWindowSize) {
      const chunk = items.slice(i, i + maxWindowSize);
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ PutRequest: { Item: item } })),
        },
      });
      tasks.push(this.docClient.send(command));
    }

    await Promise.all(tasks);
  };
}
