-- Additive only. Run after schema.sql; never import this into a different application's schema.
CREATE TABLE IF NOT EXISTS progression_profiles (
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 profile_json LONGTEXT NOT NULL,
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT progression_profile_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progression_receipts (
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 claim_id VARCHAR(180) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 fact_json LONGTEXT NULL,
 command_json LONGTEXT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(user_id,claim_id),
 CONSTRAINT progression_receipt_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS progression_league_members (
 week_date DATE NOT NULL,
 tier TINYINT UNSIGNED NOT NULL DEFAULT 0,
 group_no INT UNSIGNED NOT NULL,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
 last_activity DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(week_date,user_id),
 KEY progression_league_group(week_date,tier,group_no,xp,last_activity),
 CONSTRAINT progression_league_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS progression_league_groups (
 week_date DATE NOT NULL,
 tier TINYINT UNSIGNED NOT NULL,
 group_no INT UNSIGNED NOT NULL,
 member_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY(week_date,tier,group_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO schema_metadata(version) VALUES(2);
