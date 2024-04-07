import { Knex } from "knex";

import { Post, PostRepository, Comment } from "./domain";

export type MySqlPostRepositoryProps = {
  userTableName: string;
  postTableName: string;
  commentTableName: string;
};

export class MySqlPostRepository implements PostRepository {
  private readonly props: MySqlPostRepositoryProps;
  private readonly knex: Knex;

  constructor(props: MySqlPostRepositoryProps, knex: Knex) {
    this.props = props;
    this.knex = knex;
  }

  getById = async (id: string): Promise<Post | null> => {
    const rawItems = await this.knex
      .select(
        { id: "p.id" },
        { title: "p.title" },
        { content: "p.content" },
        { createdAt: "p.createdAt" },
        { username: "u.username" },
        { commentId: "c.id" },
        // { commentUsername: "c.id"},
        { commentContent: "c.content" },
        { commentCreatedAt: "c.createdAt" },
        { commentUsername: "u2.username" },
      )
      .from({ p: this.props.postTableName })
      .join({ u: this.props.userTableName }, "p.userId", "=", "u.id")
      .leftJoin({ c: this.props.commentTableName }, "p.id", "=", "c.postId")
      .leftJoin({ u2: this.props.userTableName }, "c.userId", "=", "u2.id")
      .where("p.id", id);

    let post: Post | null = null;
    const comments = [];
    for (const item of rawItems) {
      post = {
        id: item.id,
        title: item.title,
        content: item.content,
        username: item.username,
        createdAt: item.createdAt,
        comments: [],
      };
      if (item.commentId) {
        comments.push({
          id: item.commentId,
          content: item.commentContent,
          createdAt: item.commentCreatedAt,
          username: item.commentUsername,
        });
      }
    }
    return post === null ? null : { ...post, comments };
  };

  listByUsername = async (username: string): Promise<Post[]> => {
    const rawItems = await this.knex
      .select({ id: "p.id" }, { title: "p.title" }, { content: "p.content" }, { createdAt: "p.createdAt" })
      .from({ p: this.props.postTableName })
      .join({ u: this.props.userTableName }, "p.userId", "=", "u.id")
      .where("u.username", username)
      .orderBy("p.createdAt", "desc");

    return rawItems.map((item) => ({ ...item, username, comments: [] }));
  };
}
