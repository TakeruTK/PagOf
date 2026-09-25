#!/usr/bin/env node
// Generates an ADMIN_PASSWORD_HASH value in the pbkdf2-sha256:<iterations>:<salt>:<hash>
// format lib/admin-auth.ts expects. Run whenever the admin password needs to be set
// or rotated — nothing here is stored; copy the printed line into the server's env.
//
// Usage:
//   node scripts/generate-admin-hash.mjs "the new password"
//   node scripts/generate-admin-hash.mjs            # generates a random password too

import { randomBytes, pbkdf2Sync, randomInt } from 'node:crypto';

const ITERATIONS = 600_000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+';

function randomPassword(length = 24) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

const password = process.argv[2] || randomPassword();
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256').toString('hex');

if (!process.argv[2]) {
  console.log(`Generated password: ${password}`);
  console.log('Save it in a password manager now — it is not stored anywhere.\n');
}
console.log(`ADMIN_PASSWORD_HASH=pbkdf2-sha256:${ITERATIONS}:${salt}:${hash}`);
