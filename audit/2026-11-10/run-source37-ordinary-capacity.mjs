import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { materializeSource37Adapters, source37GeneratedFiles, verifyPreparedOrdinarySource37 } from './source37-runtime-adapters.mjs';
assert.equal(process.env.SPAROWTYPE_SOURCE37_CAPACITY_ACCEPTANCE,'1','Wait for separate root load GO and the resource window.');
await materializeSource37Adapters();
await verifyPreparedOrdinarySource37();
await import(pathToFileURL(path.resolve(source37GeneratedFiles.capacityOwner)).href);
