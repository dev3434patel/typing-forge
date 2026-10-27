<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli' || getenv('SPAROWTYPE_PACK_HTTP_ACCEPTANCE') !== '1' || !getenv('SPAROWTYPE_CONFIG_FILE')) throw new RuntimeException('Explicit isolated pack acceptance is required.');
$config = require dirname(__DIR__).'/bootstrap.php';
$name = $config['database']['name'] ?? '';
if (!preg_match('/^sparow_pack_([a-f0-9]{16})_audit$/D', $name, $match) || ($config['database']['host'] ?? null) !== '127.0.0.1' || in_array((int)$config['database']['port'], [3306,3307,3308,8081], true) || ($config['session_name'] ?? null) !== 'sparow_ephemeral_'.$match[1]) throw new RuntimeException('A newly owned ephemeral classroom schema and cookie namespace are required.');
$db = \SparowType\Database::connect($config);
if ($db->query('SELECT DATABASE()')->fetchColumn() !== $name || (int)$db->query('SELECT @@port')->fetchColumn() !== (int)$config['database']['port']) throw new RuntimeException('The actual server does not match the isolated configuration.');
$body = json_decode(fgets(STDIN) ?: '', true, 64, JSON_THROW_ON_ERROR);
$run = $body['run'] ?? '';
if (!is_string($run) || !preg_match('/^[a-f0-9]{10}$/D', $run)) throw new RuntimeException('A bounded synthetic run identity is required.');
$email = 'classroom-audit-'.$run.'-teacher@example.invalid';
switch ($body['operation'] ?? '') {
    case 'guard':
        foreach (['classroom_classes','classroom_members','classroom_assignments','classroom_receipts'] as $table) $db->query('SELECT 1 FROM '.$table.' LIMIT 0');
        $result = ['database' => $name, 'port' => (int)$config['database']['port'], 'sessionName' => $config['session_name']];
        break;
    case 'inspect-own-counts':
        $counts = [];
        foreach ([
            'accounts' => 'SELECT COUNT(*) FROM users WHERE BINARY email=?',
            'classes' => 'SELECT COUNT(*) FROM classroom_classes c JOIN users u ON u.id=c.owner_id WHERE BINARY u.email=?',
            'members' => 'SELECT COUNT(*) FROM classroom_members m JOIN classroom_classes c ON c.id=m.class_id JOIN users u ON u.id=c.owner_id WHERE BINARY u.email=?',
            'receipts' => 'SELECT COUNT(*) FROM classroom_receipts r JOIN classroom_members m ON m.id=r.member_id JOIN classroom_classes c ON c.id=m.class_id JOIN users u ON u.id=c.owner_id WHERE BINARY u.email=?',
        ] as $key => $sql) { $query = $db->prepare($sql); $query->execute([$email]); $counts[$key] = (int)$query->fetchColumn(); }
        $result = $counts;
        break;
    case 'cleanup-run':
        $query = $db->prepare('DELETE FROM users WHERE BINARY email=?'); $query->execute([$email]);
        $result = ['deletedOwnSyntheticAccounts' => $query->rowCount()];
        break;
    case 'hold-own-member-lock':
        // Used only to prove that another real SQL connection's member lock
        // fences pending-assignment reads, rather than relying on HTTP timing.
        $query = $db->prepare('SELECT m.id,m.class_id FROM classroom_members m JOIN classroom_classes c ON c.id=m.class_id JOIN users u ON u.id=c.owner_id WHERE m.id=? AND BINARY u.email=?');
        $query->execute([$body['memberId'] ?? '', $email]);
        $member = $query->fetch();
        if (!$member) throw new RuntimeException('Only this run\'s synthetic member may be locked.');
        $db->beginTransaction();
        // Do not hold the joined class/user rows: the test must isolate the
        // member-row fence rather than accidentally block an earlier class lock.
        $lock = $db->prepare('SELECT id FROM classroom_members WHERE id=? AND class_id=? FOR UPDATE');
        $lock->execute([$member['id'], $member['class_id']]);
        if (!$lock->fetch()) throw new RuntimeException('The owned synthetic member disappeared before its lock.');
        echo "{\"locked\":true}\n"; fflush(STDOUT);
        $release = json_decode(fgets(STDIN) ?: '', true, 8, JSON_THROW_ON_ERROR);
        if (($release['action'] ?? null) !== 'release') throw new RuntimeException('Explicit owned lock release is required.');
        $db->commit(); echo "{\"released\":true}\n"; exit;
    default: throw new RuntimeException('Unknown bounded classroom fixture action.');
}
echo \SparowType\Database::json($result);
