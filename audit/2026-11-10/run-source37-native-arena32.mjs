import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { materializeSource37Adapters, source37GeneratedFiles, verifyPreparedSource37NativeArena32 } from './source37-runtime-adapters.mjs';
assert.equal(process.env.SPAROWTYPE_SOURCE37_ARENA_HTTP_WINDOW,'1','Wait for separate root native-functional GO.');
await materializeSource37Adapters();
await verifyPreparedSource37NativeArena32();
await import(pathToFileURL(path.resolve(source37GeneratedFiles.nativeOwner)).href);
