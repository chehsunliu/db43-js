export type Plugin = {
  truncate: () => Promise<void>;
  load: (folder: string) => Promise<void>;
  release: () => Promise<void>;
};

let plugins: Plugin[] = [];

type ConfigureInput = {
  plugins: Plugin[];
};

type LoadInput = {
  folder: string;
};

export const configure = (input: ConfigureInput) => {
  plugins = input.plugins;
};

export const truncate = async () => {
  await Promise.all(plugins.map((p) => p.truncate()));
};

export const load = async (input: LoadInput) => {
  await Promise.all(plugins.map((p) => p.load(input.folder)));
};

export const release = async () => {
  await Promise.all(plugins.map((p) => p.release()));
};
