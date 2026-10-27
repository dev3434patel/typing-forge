-- Private account relationships and asynchronous server-issued duels. No free-text chat.
CREATE TABLE IF NOT EXISTS social_links (
 user_low CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 user_high CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 requested_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 state VARCHAR(12) NOT NULL DEFAULT 'pending',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(user_low,user_high),
 CONSTRAINT social_link_low FOREIGN KEY(user_low) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_link_high FOREIGN KEY(user_high) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_link_requester FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS social_blocks (
 owner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 blocked_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(owner_id,blocked_id),
 CONSTRAINT social_block_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_block_subject FOREIGN KEY(blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS social_reports (
 reporter_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reported_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reason VARCHAR(16) NOT NULL,
 report_date DATE NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(reporter_id,reported_id,reason,report_date),
 CONSTRAINT social_report_owner FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_report_subject FOREIGN KEY(reported_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS social_duels (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 creator_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 opponent_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 expected_text LONGTEXT NOT NULL,
 state VARCHAR(12) NOT NULL DEFAULT 'pending',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 expires_at DATETIME(3) NOT NULL,
 UNIQUE KEY social_duel_request(creator_id,request_key),
 KEY social_duel_creator(creator_id,created_at),
 KEY social_duel_opponent(opponent_id,created_at),
 CONSTRAINT social_duel_creator_owner FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_duel_opponent_owner FOREIGN KEY(opponent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS social_duel_runs (
 duel_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 challenge_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 client_session_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
 accepted_json LONGTEXT NULL,
 PRIMARY KEY(duel_id,user_id),
 UNIQUE KEY social_run_challenge(challenge_id),
 UNIQUE KEY social_run_session(user_id,client_session_id),
 CONSTRAINT social_run_duel FOREIGN KEY(duel_id) REFERENCES social_duels(id) ON DELETE CASCADE,
 CONSTRAINT social_run_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT social_run_challenge_owner FOREIGN KEY(challenge_id) REFERENCES typing_challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO schema_metadata(version) VALUES(4);
