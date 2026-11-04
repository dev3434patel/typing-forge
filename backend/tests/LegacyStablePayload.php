<?php
declare(strict_types=1);

/** Retained source22 serializer algorithm, independent of production changes. */
final class LegacyStablePayload
{
    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    public static function stablePayload(mixed $value): string
    {
        if (is_object($value)) {
            $value = get_object_vars($value);
            $object = true;
        } else {
            $object = false;
        }
        if (!is_array($value)) {
            return self::json($value);
        }
        if (!$object && array_is_list($value)) {
            return '[' . implode(',', array_map([self::class, 'stablePayload'], $value)) . ']';
        }
        ksort($value, SORT_STRING);
        $parts = [];
        foreach ($value as $key => $item) {
            $parts[] = self::json((string)$key) . ':' . self::stablePayload($item);
        }
        return '{' . implode(',', $parts) . '}';
    }
}
