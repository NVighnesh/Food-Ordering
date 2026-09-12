CREATE TABLE IF NOT EXISTS `notification` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT,
  `title` VARCHAR(255),
  `body` TEXT,
  `type` VARCHAR(255),
  `data` TEXT,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME,
  PRIMARY KEY (`id`),
  INDEX `idx_notification_user_created_at` (`user_id`,`created_at`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
