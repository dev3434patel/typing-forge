-- Additive classroom-lite storage. Import after the base schema. No sample rows.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS classroom_classes (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 owner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 title VARCHAR(80) NOT NULL,
 code_lookup CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 code_salt CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 code_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT classroom_teacher FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS classroom_members (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 class_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 alias VARCHAR(32) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY classroom_alias(class_id,alias),
 CONSTRAINT classroom_member_class FOREIGN KEY(class_id) REFERENCES classroom_classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS classroom_assignments (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 member_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT classroom_assignment_member FOREIGN KEY(member_id) REFERENCES classroom_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS classroom_receipts (
 session_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 member_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 payload_hash VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 elapsed_ms DOUBLE NOT NULL,
 insertion_attempts INT UNSIGNED NOT NULL,
 correct_attempts INT UNSIGNED NOT NULL,
 correct_characters INT UNSIGNED NOT NULL,
 wpm DOUBLE NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT classroom_receipt_assignment FOREIGN KEY(session_id) REFERENCES classroom_assignments(id) ON DELETE CASCADE,
 CONSTRAINT classroom_receipt_member FOREIGN KEY(member_id) REFERENCES classroom_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO schema_metadata(version) VALUES(3);
