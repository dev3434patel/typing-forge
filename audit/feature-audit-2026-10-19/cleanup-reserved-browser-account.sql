-- Finite SQL used by cleanup-reserved-browser-account.php. This is NOT a
-- standalone import: the CLI fixture verifies the explicit audit configuration,
-- actual server port, one eligible account, task date and safe dependencies.
-- Never substitute a production database or remove the complete email/date
-- guards. No actual email, account ID, password or credential is stored here.

-- statement: account-total
SELECT COUNT(*) FROM users;

-- statement: candidate-lock
SELECT id FROM users
WHERE BINARY email REGEXP '^sparowtype-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}@example[.]test$'
  AND created_at >= '2026-10-19 00:00:00.000'
  AND created_at < '2026-10-20 00:00:00.000'
FOR UPDATE;

-- statement: preference-count
SELECT COUNT(*) FROM user_preferences WHERE user_id = ?;

-- statement: result-count
SELECT COUNT(*) FROM typing_sessions WHERE user_id = ?;

-- statement: receipt-count
SELECT COUNT(*) FROM submission_receipts WHERE user_id = ?;

-- statement: challenge-count
SELECT COUNT(*) FROM typing_challenges WHERE user_id = ?;

-- statement: room-count
SELECT COUNT(*) FROM race_sessions WHERE host_id = ? OR opponent_id = ? OR winner_id = ?;

-- statement: outcome-count
SELECT COUNT(*) FROM race_outcomes WHERE user_id = ?;

-- statement: delete-locked-candidate
DELETE FROM users
WHERE id = ?
  AND BINARY email REGEXP '^sparowtype-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}@example[.]test$'
  AND created_at >= '2026-10-19 00:00:00.000'
  AND created_at < '2026-10-20 00:00:00.000';
