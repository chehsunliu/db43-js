import { PostRepository } from "./domain";

let _repo: PostRepository | undefined;

export const configure = (repo: PostRepository) => {
  _repo = repo;
};

export const repo = () => _repo!;

export * from "./dynamodb";
export * from "./mysql";
