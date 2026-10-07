import { randomBytes } from 'node:crypto';

const key = randomBytes(32).toString('base64');

console.log('ENCRYPTION_KEY=' + key);
console.log('\nPaste this into your .env file.');
