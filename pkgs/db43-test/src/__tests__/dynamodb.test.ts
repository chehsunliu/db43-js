import * as db43 from "@chehsunliu/db43";
import * as path from "node:path";
import { repo } from "..";

describe("posts", () => {
  beforeEach(async () => {
    await db43.truncate();
    await db43.load({ folder: path.join(__dirname, "data-1") });
  });

  it("lists without comments", async () => {
    const posts = await repo().listByUsername("alice");
    expect(posts).toStrictEqual([
      {
        id: "00000002-f8ac-4a27-9aeb-9ae54c8fd0ea",
        username: "alice",
        title: "Designing the schema for DynamoDB is hard",
        content: "Blah Blah Blah Blah Blah",
        createdAt: 1712405305,
        comments: [],
      },
      {
        id: "00000001-f8ac-4a27-9aeb-9ae54c8fd0ea",
        username: "alice",
        title: "What's the best distro",
        content: "What's the best Linux distro now? There are lots of...",
        createdAt: 1712405283,
        comments: [],
      },
    ]);

    const posts2 = await repo().listByUsername("bob");
    expect(posts2).toStrictEqual([
      {
        id: "00000003-f8ac-4a27-9aeb-9ae54c8fd0ea",
        username: "bob",
        title: "VTI is so high that I couldn't afford it!!",
        content: "I know the theory of index investing, but it's just so hard to blah blah blah",
        createdAt: 1712405308,
        comments: [],
      },
    ]);
  });

  it("shows empty list if nothing found", async () => {
    const posts = await repo().listByUsername("louis");
    expect(posts).toStrictEqual([]);
  });

  it("supports getting a post with all its comments", async () => {
    const p1 = await repo().getById("00000001-f8ac-4a27-9aeb-9ae54c8fd0ea");
    expect(p1).toStrictEqual({
      id: "00000001-f8ac-4a27-9aeb-9ae54c8fd0ea",
      username: "alice",
      title: "What's the best distro",
      content: "What's the best Linux distro now? There are lots of...",
      createdAt: 1712405283,
      comments: [
        {
          id: "00000001-9d91-48b0-a40e-f5031e3038ad",
          username: "kevin",
          content: "Nice article!",
          createdAt: 1712405312,
        },
        {
          id: "00000002-9d91-48b0-a40e-f5031e3038ad",
          username: "bob",
          content: "hmm...",
          createdAt: 1712405314,
        },
      ],
    });

    const p2 = await repo().getById("00000003-f8ac-4a27-9aeb-9ae54c8fd0ea");
    expect(p2).toStrictEqual({
      id: "00000003-f8ac-4a27-9aeb-9ae54c8fd0ea",
      username: "bob",
      title: "VTI is so high that I couldn't afford it!!",
      content: "I know the theory of index investing, but it's just so hard to blah blah blah",
      createdAt: 1712405308,
      comments: [
        {
          id: "00000003-9d91-48b0-a40e-f5031e3038ad",
          username: "louis",
          content: "Great.",
          createdAt: 1712405315,
        },
      ],
    });
  });
});

describe("posts-without-comments", () => {
  beforeEach(async () => {
    await db43.truncate();
    await db43.load({ folder: path.join(__dirname, "data-2") });
  });

  it("shows without comments", async () => {
    const post = await repo().getById("00000001-f8ac-4a27-9aeb-9ae54c8fd0ea");
    expect(post).toStrictEqual({
      id: "00000001-f8ac-4a27-9aeb-9ae54c8fd0ea",
      username: "alice",
      title: "It's time to join NVIDIA",
      content: "AI makes it more promising than before.",
      createdAt: 1702418438,
      comments: [],
    });
  });
});
