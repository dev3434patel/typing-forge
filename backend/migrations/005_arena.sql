-- Additive eight-person arena. Import after schema.sql; no fabricated players.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS arena_rooms (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 room_code CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 host_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'waiting',
 duration_seconds SMALLINT UNSIGNED NOT NULL,
 expected_text LONGTEXT NOT NULL,
 configuration_json LONGTEXT NOT NULL,
 is_public TINYINT(1) NOT NULL DEFAULT 0,
 bracket_wpm DOUBLE NOT NULL DEFAULT 35,
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 starts_at DATETIME(3) NULL,
 deadline_at DATETIME(3) NULL,
 ended_at DATETIME(3) NULL,
 expires_at DATETIME(3) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 rematch_of CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
 KEY arena_match(is_public,status,duration_seconds,created_at),
 CONSTRAINT arena_host FOREIGN KEY(host_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT arena_rematch FOREIGN KEY(rematch_of) REFERENCES arena_rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS arena_members (
 arena_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 slot TINYINT UNSIGNED NOT NULL,
 ready TINYINT(1) NOT NULL DEFAULT 0,
 status VARCHAR(16) NOT NULL DEFAULT 'joined',
 last_seen_at DATETIME(3) NOT NULL,
 client_session_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
 events_json LONGTEXT NULL,
 evidence_json LONGTEXT NULL,
 metrics_json LONGTEXT NULL,
 event_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 sequence_count INT UNSIGNED NOT NULL DEFAULT 0,
 credited_units INT UNSIGNED NOT NULL DEFAULT 0,
 accuracy DOUBLE NULL,
 wpm DOUBLE NULL,
 elapsed_ms DOUBLE NOT NULL DEFAULT 0,
 finished_at DATETIME(3) NULL,
 rematch_vote TINYINT(1) NOT NULL DEFAULT 0,
 quarantine_reason VARCHAR(64) NULL,
 appeal_requested_at DATETIME(3) NULL,
 PRIMARY KEY(arena_id,user_id),
 UNIQUE KEY arena_slot(arena_id,slot),
 UNIQUE KEY arena_client(user_id,client_session_id),
 KEY arena_retention(finished_at),
 CONSTRAINT arena_member_room FOREIGN KEY(arena_id) REFERENCES arena_rooms(id) ON DELETE CASCADE,
 CONSTRAINT arena_member_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS arena_match_locks (
 duration_seconds SMALLINT UNSIGNED PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO arena_match_locks(duration_seconds) VALUES(15),(30),(60),(120);
INSERT IGNORE INTO schema_metadata(version) VALUES(5);
