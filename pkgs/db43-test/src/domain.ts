export type Post = {
  id: string;
  username: string;
  title: string;
  content: string;
  createdAt: number;
  comments: Comment[];
};

export type Comment = {
  id: string;
  username: string;
  content: string;
  createdAt: number;
};

export type PostRepository = {
  getById: (id: string) => Promise<Post | null>;
  listByUsername: (username: string) => Promise<Post[]>;
};
