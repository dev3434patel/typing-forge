// Release coordinator runs this only after the earlier browser job has finished.
// Separate outputs preserve the original failed attempts and their cleanup receipt.
process.env.SPAROWTYPE_COMPETITION_OUTPUT_PREFIX = 'php-real-competition-confirmation';
await import('./run-php-real-competition.mjs');
