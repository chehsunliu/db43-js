import { Plugin } from "@chehsunliu/db43-types";

export type MySqlPluginProps = {};

export class MySqlPlugin implements Plugin {
  constructor(props: MySqlPluginProps) {}

  load = async (folder: string): Promise<void> => {};

  truncate = async (): Promise<void> => {};
}
