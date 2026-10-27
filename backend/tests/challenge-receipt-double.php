<?php
declare(strict_types=1);

/** Actual DataService/SessionValidator with a bounded PDO protocol double.
 * It models server processing/lock delay without sleeping or connecting to SQL.
 */
final class ChallengeReceiptReachedConsumption extends RuntimeException {}
final class ChallengeReceiptConnection extends PDO
{
    public int $clockReads = 0;
    public bool $transaction = false;
    public bool $consumptionReached = false;
    public function __construct(public float $now, public array $challenge, public float $lockDelay, public bool $invalidClock = false) {}
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        if ($query !== 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000') throw new RuntimeException('Unexpected receipt protocol query.');
        $this->clockReads++;
        return new ChallengeReceiptStatement($this, $query);
    }
    public function prepare(string $query, array $options = []): PDOStatement|false { return new ChallengeReceiptStatement($this, $query); }
    public function beginTransaction(): bool { $this->transaction = true; return true; }
    public function inTransaction(): bool { return $this->transaction; }
    public function rollBack(): bool { $this->transaction = false; return true; }
}
final class ChallengeReceiptStatement extends PDOStatement
{
    private array $params = [];
    public function __construct(private ChallengeReceiptConnection $db, private string $query) {}
    public function execute(?array $params = null): bool
    {
        $this->params = $params ?? [];
        if (str_starts_with($this->query, 'SELECT id FROM users')) $this->db->now += $this->db->lockDelay;
        elseif (str_starts_with($this->query, 'UPDATE typing_challenges SET consumed_by=')) {
            $this->db->consumptionReached = true;
            throw new ChallengeReceiptReachedConsumption('Timing and canonical rate checks reached the consumption boundary.');
        } elseif (!str_starts_with($this->query, 'SELECT payload_hash,accepted_json,deleted_at FROM submission_receipts') && !str_starts_with($this->query, 'SELECT * FROM typing_challenges')) {
            throw new RuntimeException('Unexpected receipt protocol statement.');
        }
        return true;
    }
    public function fetchColumn(int $column = 0): mixed
    {
        if ($this->query === 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000') return $this->db->invalidClock ? 'invalid-clock' : (string) $this->db->now;
        if (str_starts_with($this->query, 'SELECT id FROM users')) return $this->params[0];
        throw new RuntimeException('Unexpected receipt protocol column.');
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        if (str_starts_with($this->query, 'SELECT payload_hash,accepted_json,deleted_at FROM submission_receipts')) return false;
        if (str_starts_with($this->query, 'SELECT * FROM typing_challenges')) return $this->db->challenge;
        throw new RuntimeException('Unexpected receipt protocol row.');
    }
}

function verifyChallengeReceiptCase(array $case): bool
{
    $timing = $case['timing']; $receipt = $case['receipt']; $candidate = $case['candidate'];
    $row = ['id' => $candidate['configuration']['challengeId'], 'user_id' => $candidate['ownerScope'], 'configuration' => json_encode($timing['issued'], JSON_THROW_ON_ERROR), 'starts_at' => SparowType\Database::timestamp($timing['start']), 'deadline_at' => SparowType\Database::timestamp($timing['deadline']), 'expires_at' => SparowType\Database::timestamp($timing['expires']), 'target_text' => $candidate['targetText'], 'consumed_by' => null];
    $db = new ChallengeReceiptConnection((float) $timing['now'], $row, (float) ($receipt['lockDelayMs'] ?? 0), $receipt['invalidClock'] ?? false);
    $service = new SparowType\DataService($db, new SparowType\SessionValidator(), []);
    if ($receipt['captureAtDispatch'] ?? false) {
        $arrival = $service->captureRequestReceipt();
        $db->now += $receipt['beforeSubmitDelayMs'] ?? 0;
        if ($service->captureRequestReceipt() !== $arrival || $db->clockReads !== 1) throw new RuntimeException('An already captured receipt changed during processing.');
    }
    $nested = ($receipt['nestedTransaction'] ?? false) === true;
    if ($nested) $db->beginTransaction();
    try {
        $service->submit(['id' => $candidate['ownerScope']], ['expectedOwner' => $candidate['ownerScope'], 'candidate' => $candidate, ...($receipt['clientFields'] ?? [])]);
        throw new RuntimeException('The protocol double must stop before persisting a session.');
    } catch (ChallengeReceiptReachedConsumption) {
        $expectedReads = SparowType\ChallengeTimingPolicy::firstInput($timing['issued']) ? 1 : 2;
        if (!$db->consumptionReached || $db->clockReads !== $expectedReads || $db->transaction !== $nested) throw new RuntimeException('Receipt capture or rollback ownership was not preserved.');
        if ($nested) $db->rollBack();
        return true;
    }
}
