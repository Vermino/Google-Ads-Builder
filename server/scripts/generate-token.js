#!/usr/bin/env node

/**
 * Generate Secure API Authentication Token
 *
 * This script generates a cryptographically secure random token
 * for use with the API server authentication.
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure API Authentication Token...\n');

const token = crypto.randomBytes(32).toString('hex');

console.log('Your secure API token:');
console.log('─'.repeat(64));
console.log(token);
console.log('─'.repeat(64));

console.log('\n📝 Add this to your server/.env file:');
console.log(`API_AUTH_TOKEN=${token}`);

console.log('\n📝 Add this to your frontend/.env.local file:');
console.log(`VITE_API_TOKEN=${token}`);

console.log('\n✅ Token generated successfully!\n');
console.log('⚠️  IMPORTANT: Keep this token secret and never commit it to git.\n');
