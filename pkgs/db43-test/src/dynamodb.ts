import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, paginateQuery } from "@aws-sdk/lib-dynamodb";

import { Post, PostRepository, Comment } from "./domain";

export type DynamoDbPostRepositoryProps = {
  tableName: string;
};

export class DynamoDbPostRepository implements PostRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly props: DynamoDbPostRepositoryProps;

  constructor(props: DynamoDbPostRepositoryProps, client: DynamoDBClient) {
    this.docClient = DynamoDBDocumentClient.from(client);
    this.props = props;
  }

  getById = async (id: string): Promise<Post | null> => {
    const paginator = paginateQuery(
      { client: this.docClient },
      {
        TableName: this.props.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": `post#${id}`,
        },
      },
    );

    let post: Omit<Post, "comments"> | null = null;
    const comments: Comment[] = [];

    for await (const page of paginator) {
      if (page.Items === undefined) {
        continue;
      }

      for (const rawItem of page.Items as RawItem[]) {
        if (rawItem.type === "post") {
          post = {
            id,
            username: rawItem.username,
            title: rawItem.title,
            content: rawItem.content,
            createdAt: rawItem.postCreatedAt,
          };
        } else if (rawItem.type === "comment") {
          comments.push({
            id: rawItem.sk.slice("comment#".length),
            username: rawItem.username,
            content: rawItem.content,
            createdAt: rawItem.commentCreatedAt,
          });
        }
      }
    }

    if (post === null) {
      return null;
    }

    return { ...post, comments };
  };

  listByUsername = async (username: string): Promise<Post[]> => {
    const paginator = paginateQuery(
      { client: this.docClient },
      {
        TableName: this.props.tableName,
        IndexName: "SearchPostByUsername",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username,
        },
        ScanIndexForward: false,
      },
    );

    const posts: Post[] = [];

    for await (const page of paginator) {
      if (page.Items === undefined) {
        continue;
      }

      for (const rawItem of page.Items as RawPost[]) {
        posts.push({
          id: rawItem.pk.slice("post#".length),
          username,
          title: rawItem.title,
          content: rawItem.content,
          createdAt: rawItem.postCreatedAt,
          comments: [],
        });
      }
    }

    return posts;
  };
}

type RawItem = RawPost | RawComment;

type RawPost = {
  pk: string;
  sk: "post";
  type: "post";
  title: string;
  content: string;
  username: string;
  postCreatedAt: number;
};

type RawComment = {
  pk: string;
  sk: string;
  type: "comment";
  content: string;
  username: string;
  commentCreatedAt: number;
};
