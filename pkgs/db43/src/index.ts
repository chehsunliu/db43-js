import { Plugin } from "@chehsunliu/db43-types";

let plugins: Plugin[] = [];

type ConfigureInput = {
  plugins: Plugin[];
};

export const configure = (input: ConfigureInput) => {
  plugins = input.plugins;
};

export const truncate = async () => {
  await Promise.all(plugins.map((p) => p.truncate()));
};

type LoadInput = {
  folder: string;
};

export const load = async (input: LoadInput) => {
  await Promise.all(plugins.map((p) => p.load(input.folder)));
};
