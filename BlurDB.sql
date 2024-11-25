-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.40 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for blur
CREATE DATABASE IF NOT EXISTS `blur` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `blur`;

-- Dumping structure for table blur.chat_messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int NOT NULL,
  `room_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhalwepod3944695ji0suwoqb9` (`room_id`),
  KEY `FKgiqeap8ays4lf684x7m0r2729` (`sender_id`),
  CONSTRAINT `FKgiqeap8ays4lf684x7m0r2729` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKhalwepod3944695ji0suwoqb9` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.chat_messages_seq
CREATE TABLE IF NOT EXISTS `chat_messages_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.chat_rooms
CREATE TABLE IF NOT EXISTS `chat_rooms` (
  `creator_id` int NOT NULL,
  `id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','DELETED','INACTIVE') DEFAULT NULL,
  `type` enum('FRIEND','PRIVATE','PUBLIC') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKkcyi40l5yas17t11xai5i3m1j` (`creator_id`),
  KEY `FK5dcbwunakaptlbc6yv3l761w4` (`receiver_id`),
  CONSTRAINT `FK5dcbwunakaptlbc6yv3l761w4` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkcyi40l5yas17t11xai5i3m1j` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.chat_rooms_seq
CREATE TABLE IF NOT EXISTS `chat_rooms_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.comments
CREATE TABLE IF NOT EXISTS `comments` (
  `disliked_count` int DEFAULT NULL,
  `id` int NOT NULL,
  `liked_count` int DEFAULT NULL,
  `post_id` int NOT NULL,
  `reply_count` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `parent_id` varchar(255) DEFAULT NULL,
  `type` enum('BLANK_LINE','BLOCK','IN_LINE') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKh4c7lvsc298whoyd4w9ta25cr` (`post_id`),
  KEY `FK8omq0tc18jd43bu5tjh6jvraq` (`user_id`),
  CONSTRAINT `FK8omq0tc18jd43bu5tjh6jvraq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKh4c7lvsc298whoyd4w9ta25cr` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.comments_seq
CREATE TABLE IF NOT EXISTS `comments_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.comment_liked_by_user
CREATE TABLE IF NOT EXISTS `comment_liked_by_user` (
  `comment_id` int NOT NULL,
  `id` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  KEY `FKk74pcyr0ytjubd9097opmvoyy` (`comment_id`),
  CONSTRAINT `FKk74pcyr0ytjubd9097opmvoyy` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`),
  CONSTRAINT `comment_liked_by_user_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `comment_liked_by_user_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.liked_by_users
CREATE TABLE IF NOT EXISTS `liked_by_users` (
  `id` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `user_id` int NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  KEY `FK281u39o3dpytbo2gqltus50jm` (`user_id`),
  CONSTRAINT `FK281u39o3dpytbo2gqltus50jm` FOREIGN KEY (`user_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `liked_by_users_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `liked_by_users_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `is_sent` bit(1) DEFAULT NULL,
  `receiver_id` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `content` varchar(255) DEFAULT NULL,
  `action` enum('DELETED','EDITED','RECEIVED','SEEN','SENDING','SENT','TYPING') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9kxl0whvhifo6gw4tjq36v53k` (`receiver_id`),
  CONSTRAINT `FK9kxl0whvhifo6gw4tjq36v53k` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.notifications_send_by
CREATE TABLE IF NOT EXISTS `notifications_send_by` (
  `notification_id` int NOT NULL,
  `send_by_id` int NOT NULL,
  KEY `FK7sq9d5vv23jsavtoyecyvo4w2` (`send_by_id`),
  KEY `FKnjx5xhk32ycb4pufgnpj0bc21` (`notification_id`),
  CONSTRAINT `FK7sq9d5vv23jsavtoyecyvo4w2` FOREIGN KEY (`send_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKnjx5xhk32ycb4pufgnpj0bc21` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.notifications_seq
CREATE TABLE IF NOT EXISTS `notifications_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.posts
CREATE TABLE IF NOT EXISTS `posts` (
  `comments_count` int DEFAULT NULL,
  `id` int NOT NULL,
  `likes_count` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `content` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `posts_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `posts_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.posts_comments
CREATE TABLE IF NOT EXISTS `posts_comments` (
  `comments_id` int NOT NULL,
  `post_id` int NOT NULL,
  UNIQUE KEY `UKsjeadiuvloecnqe9psjjdcjqr` (`comments_id`),
  KEY `FKbjdq8a62c5siv1mk27umswg9` (`post_id`),
  CONSTRAINT `FKbjdq8a62c5siv1mk27umswg9` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKgfwb3n0tyt6x3lro7kavj8fui` FOREIGN KEY (`comments_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.posts_likes_by_users
CREATE TABLE IF NOT EXISTS `posts_likes_by_users` (
  `id` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `user_id` int NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  KEY `FKnfmylo4nlqlvmkggkcvkt4dcd` (`user_id`),
  CONSTRAINT `FKnfmylo4nlqlvmkggkcvkt4dcd` FOREIGN KEY (`user_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `posts_likes_by_users_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `posts_likes_by_users_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.posts_seq
CREATE TABLE IF NOT EXISTS `posts_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.stories
CREATE TABLE IF NOT EXISTS `stories` (
  `comments_count` int DEFAULT NULL,
  `id` int NOT NULL,
  `likes_count` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `content` varchar(255) DEFAULT NULL,
  `media` varchar(255) DEFAULT NULL,
  `story_status` enum('CUSTOM','FRIEND','PRIVATE','PUBLIC') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKshv2ytgbsn9w9mpu43mc6ln6j` (`user_id`),
  CONSTRAINT `FKshv2ytgbsn9w9mpu43mc6ln6j` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.stories_seq
CREATE TABLE IF NOT EXISTS `stories_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `bio` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','GUEST','USER') DEFAULT NULL,
  `status` enum('ACTIVE','DELETED','INACTIVE') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.users_saved_post
CREATE TABLE IF NOT EXISTS `users_saved_post` (
  `saved_post_id` int NOT NULL,
  `user_id` int NOT NULL,
  KEY `FKn1uw7drs0j8swsex3cy5b7jc1` (`saved_post_id`),
  KEY `FKqsrxvk32r6mgwffwy1esk6lpf` (`user_id`),
  CONSTRAINT `FKn1uw7drs0j8swsex3cy5b7jc1` FOREIGN KEY (`saved_post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKqsrxvk32r6mgwffwy1esk6lpf` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.users_seq
CREATE TABLE IF NOT EXISTS `users_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.users_stories
CREATE TABLE IF NOT EXISTS `users_stories` (
  `stories_id` int NOT NULL,
  `user_id` int NOT NULL,
  UNIQUE KEY `UKxfqvp1dcgf0fyw5bpvp0maka` (`stories_id`),
  KEY `FKbrkpb5fknc6sgejyy0613twk` (`user_id`),
  CONSTRAINT `FKbrkpb5fknc6sgejyy0613twk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKbugm5cf28mpgrljxciubdu1eq` FOREIGN KEY (`stories_id`) REFERENCES `stories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.users_viewed_stories
CREATE TABLE IF NOT EXISTS `users_viewed_stories` (
  `user_id` int NOT NULL,
  `viewed_stories_id` int NOT NULL,
  KEY `FK8ebe8uw6oad0uvth6l3urdwsp` (`viewed_stories_id`),
  KEY `FKrfno5xr2h1rp2jt5b9pqgl93x` (`user_id`),
  CONSTRAINT `FK8ebe8uw6oad0uvth6l3urdwsp` FOREIGN KEY (`viewed_stories_id`) REFERENCES `stories` (`id`),
  CONSTRAINT `FKrfno5xr2h1rp2jt5b9pqgl93x` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.user_follower
CREATE TABLE IF NOT EXISTS `user_follower` (
  `id` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `user_id` int NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  KEY `FK31vprrcmt5cwijol72deguk3y` (`user_id`),
  CONSTRAINT `FK31vprrcmt5cwijol72deguk3y` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_follower_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `user_follower_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table blur.user_following
CREATE TABLE IF NOT EXISTS `user_following` (
  `id` int DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `user_id` int NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_image` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  KEY `FKiauj02dmro0awb3hetthnrlye` (`user_id`),
  CONSTRAINT `FKiauj02dmro0awb3hetthnrlye` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_following_chk_1` CHECK ((`role` between 0 and 2)),
  CONSTRAINT `user_following_chk_2` CHECK ((`status` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
