export type Plugin = {
  truncate: () => Promise<void>;
  load: (folder: string) => Promise<void>;
};

export const add = (a: number, b: number): number => a + b;
