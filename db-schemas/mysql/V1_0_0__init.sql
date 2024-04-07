CREATE TABLE IF NOT EXISTS `users`
(
    `id`        CHAR(36)        NOT NULL,
    `username`  VARCHAR(128)    NOT NULL,
    `createdAt` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE (`username`)
);

CREATE TABLE IF NOT EXISTS `posts`
(
    `id`        CHAR(36)        NOT NULL,
    `title`     VARCHAR(256)    NOT NULL,
    `content`   TEXT            NOT NULL,
    `createdAt` BIGINT UNSIGNED NOT NULL,
    `userId`    CHAR(36)        NOT NULL,

    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `comments`
(
    `id`        CHAR(36)        NOT NULL,
    `content`   TEXT            NOT NULL,
    `createdAt` BIGINT UNSIGNED NOT NULL,
    `userId`    CHAR(36)        NOT NULL,
    `postId`    CHAR(36)        NOT NULL,

    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`postId`) REFERENCES `posts` (`id`) ON DELETE CASCADE
);
