-- SparowType PHP backend: MySQL 8.0+ or MariaDB 10.4+, InnoDB, UTF-8.
-- Import into an empty database through phpMyAdmin. No example users or scores.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  handle VARCHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  data_version BIGINT UNSIGNED NOT NULL DEFAULT 0,
  auth_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email (email),
  UNIQUE KEY users_handle (handle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  preferences_json LONGTEXT NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS typing_sessions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_session_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  payload_hash VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  accepted_json LONGTEXT NOT NULL,
  evidence_json LONGTEXT NULL,
  evidence_expires_at DATETIME(3) NOT NULL,
  learning_json LONGTEXT NULL,
  key_summaries_json LONGTEXT NOT NULL,
  comparison_key LONGTEXT NOT NULL,
  comparison_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  mode VARCHAR(16) NOT NULL,
  elapsed_ms DOUBLE NOT NULL,
  wpm DOUBLE NULL,
  input_accuracy DOUBLE NULL,
  ranked TINYINT(1) NOT NULL DEFAULT 0,
  personal_best_eligible TINYINT(1) NOT NULL DEFAULT 0,
  race_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  finished_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY sessions_owner_client (user_id,client_session_id),
  UNIQUE KEY sessions_race_once (user_id,race_id),
  KEY sessions_owner_history (user_id,created_at,id),
  KEY sessions_cohort_period (comparison_hash,ranked,created_at),
  KEY sessions_retention (evidence_expires_at),
  CONSTRAINT sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_receipts (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_session_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  payload_hash VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  accepted_json LONGTEXT NULL,
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY(user_id,client_session_id),
  CONSTRAINT receipts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS typing_challenges (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  nonce CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  configuration LONGTEXT NOT NULL,
  target_text LONGTEXT NOT NULL,
  issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  starts_at DATETIME(3) NOT NULL,
  deadline_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  consumed_by VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  KEY challenges_owner_issued(user_id,issued_at),
  KEY challenges_retention(expires_at),
  CONSTRAINT challenges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS race_sessions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  room_code CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  host_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  opponent_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  winner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  expected_text LONGTEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'waiting',
  duration_seconds INT NOT NULL DEFAULT 30,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  is_bot_race TINYINT(1) NOT NULL DEFAULT 0,
  countdown_started_at DATETIME(3) NULL,
  started_at DATETIME(3) NULL,
  deadline_at DATETIME(3) NULL,
  ended_at DATETIME(3) NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  host_last_seen_at DATETIME(3) NULL,
  opponent_last_seen_at DATETIME(3) NULL,
  host_progress DOUBLE NOT NULL DEFAULT 0,
  opponent_progress DOUBLE NOT NULL DEFAULT 0,
  host_wpm DOUBLE NULL,
  opponent_wpm DOUBLE NULL,
  host_accuracy DOUBLE NULL,
  opponent_accuracy DOUBLE NULL,
  rematch_of CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  UNIQUE KEY race_room_code(room_code),
  UNIQUE KEY race_rematch_once(rematch_of,host_id),
  KEY race_matchmaking(is_public,status,duration_seconds,created_at),
  CONSTRAINT race_host FOREIGN KEY(host_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT race_opponent FOREIGN KEY(opponent_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT race_winner FOREIGN KEY(winner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT race_rematch_parent FOREIGN KEY(rematch_of) REFERENCES race_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS race_outcomes (
  race_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  progress DOUBLE NOT NULL DEFAULT 0,
  wpm DOUBLE NULL,
  accuracy DOUBLE NULL,
  elapsed_ms DOUBLE NOT NULL DEFAULT 0,
  incorrect_attempts INT NOT NULL DEFAULT 0,
  exact_completion TINYINT(1) NOT NULL DEFAULT 0,
  sequence INT NOT NULL DEFAULT 0,
  accepted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  client_session_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  transcript_events LONGTEXT NULL,
  finalized TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY(race_id,user_id),
  UNIQUE KEY race_outcome_session(user_id,client_session_id),
  CONSTRAINT outcome_race FOREIGN KEY(race_id) REFERENCES race_sessions(id) ON DELETE CASCADE,
  CONSTRAINT outcome_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS race_match_locks (
  duration_seconds SMALLINT PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO race_match_locks(duration_seconds) VALUES(15),(30),(60),(120);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  window_started BIGINT UNSIGNED NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  KEY rate_expiration(window_started)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_metadata (
  version INT PRIMARY KEY,
  installed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
INSERT IGNORE INTO schema_metadata(version) VALUES(1);
