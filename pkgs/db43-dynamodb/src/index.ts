import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  BatchWriteItemCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, paginateScan, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "node:fs";
import * as path from "node:path";

import { Plugin } from "@chehsunliu/db43";

const maxWindowSize = 25;

const defaultDataFilenameFactory = {
  dynamoDbJsonFilename: (tableName: string): string => `dynamodb.${tableName}.json`,
  rawDynamoDbJsonFilename: (tableName: string): string => `raw-dynamodb.${tableName}.json`,
  rawJsonFilename: (tableName: string): string => `raw.${tableName}.json`,
};

type DataFilenameFactory = typeof defaultDataFilenameFactory;

type DynamoDbPluginProps = {
  connection: {
    region: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  dataFilenameFactory?: DataFilenameFactory;
};

type TableMetaMap = {
  [tableName: string]: {
    primaryKeys: string[];
  };
};

export class DynamoDbPlugin implements Plugin {
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;
  private readonly dataFilenameFactory: DataFilenameFactory;
  private _tableMetaMap?: TableMetaMap;

  constructor(props: DynamoDbPluginProps) {
    this.client = new DynamoDBClient({
      region: props.connection.region,
      endpoint: props.connection.endpoint,
      credentials: {
        accessKeyId: props.connection.accessKeyId,
        secretAccessKey: props.connection.secretAccessKey,
      },
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.dataFilenameFactory = props.dataFilenameFactory ?? defaultDataFilenameFactory;
  }

  truncate = async (): Promise<void> => {
    const tableMetaMap = await this.getTableMetaMap();
    const tasks = Object.entries(tableMetaMap).map(([tableName, meta]) =>
      this.truncateTable(tableName, meta.primaryKeys),
    );
    await Promise.all(tasks);
  };

  load = async (folder: string): Promise<void> => {
    const tableMetaMap = await this.getTableMetaMap();

    const tasks = [];
    for (const tableName in tableMetaMap) {
      const dynamodbJsonFilepath = path.join(folder, this.dataFilenameFactory.dynamoDbJsonFilename(tableName));
      if (fs.existsSync(dynamodbJsonFilepath)) {
        tasks.push(this.loadDynamoDbJsonData(tableName, dynamodbJsonFilepath));
        continue;
      }

      const rawDynamodbJsonFilepath = path.join(folder, this.dataFilenameFactory.rawDynamoDbJsonFilename(tableName));
      if (fs.existsSync(rawDynamodbJsonFilepath)) {
        tasks.push(this.loadRawJsonData(tableName, rawDynamodbJsonFilepath));
        continue;
      }

      const rawJsonFilepath = path.join(folder, this.dataFilenameFactory.rawJsonFilename(tableName));
      if (fs.existsSync(rawJsonFilepath)) {
        tasks.push(this.loadRawJsonData(tableName, rawJsonFilepath));
      }
    }
    await Promise.all(tasks);
  };

  release = async (): Promise<void> => {};

  private getTableMetaMap = async (): Promise<TableMetaMap> => {
    if (this._tableMetaMap !== undefined) {
      return this._tableMetaMap;
    }

    const r = await this.client.send(new ListTablesCommand({}));
    const tableNames = r.TableNames ?? [];

    this._tableMetaMap = {};
    const rs = await Promise.all(tableNames.map((t) => this.client.send(new DescribeTableCommand({ TableName: t }))));

    for (const r of rs) {
      const t = r.Table;
      if (t === undefined) {
        continue;
      }

      this._tableMetaMap[t.TableName!] = {
        primaryKeys: t.KeySchema!.map((k) => k.AttributeName!),
      };
    }

    return this._tableMetaMap;
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
          {} as Record<string, unknown>,
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

  private loadDynamoDbJsonData = async (tableName: string, filepath: string) => {
    const buffer = fs.readFileSync(filepath);
    const items = JSON.parse(buffer.toString()) as Record<string, AttributeValue>[];

    const tasks = [];
    for (let i = 0; i < items.length; i += maxWindowSize) {
      const chunk = items.slice(i, i + maxWindowSize);
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ PutRequest: { Item: item } })),
        },
      });
      tasks.push(this.docClient.send(command));
    }

    await Promise.all(tasks);
  };

  private loadRawJsonData = async (tableName: string, filepath: string) => {
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
