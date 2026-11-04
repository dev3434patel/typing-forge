<?php
declare(strict_types=1);
namespace SparowType;

/** JSON object decoding with the original invalid-property rejection contract. */
final class RequestBody
{
    public static function decode(string $raw): array
    {
        // The object decoder rejects NUL-prefixed property names even when a
        // later duplicate key overwrites their containing object. An associative
        // decode or decoded-key walk alone cannot preserve that rejection.
        if(str_contains($raw,'\u0000')){
            $decoded=json_decode($raw,false,512,JSON_THROW_ON_ERROR);
            if(!$decoded instanceof \stdClass)throw new \JsonException('The body is not an object.');
            return json_decode($raw,true,512,JSON_THROW_ON_ERROR);
        }
        $body=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
        // Decode first so syntax/depth/UTF8 error codes keep their original
        // precedence. Numeric-key and empty JSON objects remain valid objects.
        $offset=strspn($raw," \t\r\n");
        if(($raw[$offset]??null)!=='{')throw new \JsonException('The body is not an object.');
        return $body;
    }
}
