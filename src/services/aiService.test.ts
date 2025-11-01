/**
 * AI Service Test Suite
 *
 * Test cases for validation functions and error handling.
 * These tests can be run without API keys.
 */

import {
  validateHeadline,
  validateDescription,
  isAIServiceAvailable,
  getAvailableProviders,
  formatAIError,
  AIServiceError,
} from './aiService';

/* ==================== VALIDATION TESTS ==================== */

/**
 * Test headline validation
 */
export function testHeadlineValidation() {
  console.log('=== Testing Headline Validation ===\n');

  const tests = [
    // Valid headlines
    { text: 'Premium Organic Dog Food', expected: true, reason: 'Valid headline' },
    { text: 'Shop Now - 50% Off', expected: true, reason: 'Valid with CTA' },
    { text: 'Free Shipping Today!', expected: true, reason: 'Valid with 1 exclamation' },
    { text: 'Best Deals Available', expected: true, reason: 'Valid at 30 chars' },

    // Invalid headlines - Too long
    {
      text: 'This headline is way too long for Google Ads',
      expected: false,
      reason: 'Exceeds 30 characters',
    },

    // Invalid headlines - Prohibited characters
    { text: 'Amazing Deal <script>', expected: false, reason: 'Contains <>' },
    { text: 'Great Prices {deal}', expected: false, reason: 'Contains {}' },
    { text: 'Buy Now [Limited]', expected: false, reason: 'Contains []' },
    { text: 'Products\\Services', expected: false, reason: 'Contains \\' },

    // Invalid headlines - Excessive punctuation
    {
      text: 'Amazing!!! Incredible!!!',
      expected: false,
      reason: 'Too many exclamation marks',
    },
    {
      text: 'What??? Why??? How???',
      expected: false,
      reason: 'Too many question marks',
    },

    // Invalid headlines - All caps
    {
      text: 'SHOP NOW BUY TODAY SAVE',
      expected: false,
      reason: 'Excessive capitalization',
    },

    // Edge cases
    { text: '', expected: false, reason: 'Empty string' },
    { text: 'A', expected: true, reason: 'Single character' },
    { text: '12345678901234567890123456789', expected: true, reason: 'Exactly 29 chars' },
    { text: '123456789012345678901234567890', expected: true, reason: 'Exactly 30 chars' },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = validateHeadline(test.text);
    const success = result === test.expected;

    if (success) {
      passed++;
      console.log(`✓ Test ${index + 1}: ${test.reason}`);
    } else {
      failed++;
      console.log(`✗ Test ${index + 1}: ${test.reason}`);
      console.log(`  Text: "${test.text}"`);
      console.log(`  Length: ${test.text.length} chars`);
      console.log(`  Expected: ${test.expected}, Got: ${result}`);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, total: tests.length };
}

/**
 * Test description validation
 */
export function testDescriptionValidation() {
  console.log('=== Testing Description Validation ===\n');

  const tests = [
    // Valid descriptions
    {
      text: 'Get 50% off today. Free shipping on all orders. Shop now!',
      expected: true,
      reason: 'Valid description',
    },
    {
      text: 'Premium organic dog food delivered fresh. Vet approved. Order today!',
      expected: true,
      reason: 'Valid with multiple sentences',
    },
    {
      text: 'Fast & reliable service',
      expected: true,
      reason: 'Short valid description',
    },

    // Invalid descriptions - Too long
    {
      text: 'This description is way too long and exceeds the maximum character limit allowed by Google Ads for descriptions',
      expected: false,
      reason: 'Exceeds 90 characters',
    },

    // Invalid descriptions - Prohibited characters
    {
      text: 'Great products <script>alert("test")</script>',
      expected: false,
      reason: 'Contains prohibited <> characters',
    },
    {
      text: 'Amazing deals {with} special [characters]',
      expected: false,
      reason: 'Contains prohibited {} [] characters',
    },

    // Invalid descriptions - Excessive punctuation
    {
      text: 'Amazing!!! Incredible!!! Fantastic!!!',
      expected: false,
      reason: 'Too many exclamation marks',
    },

    // Edge cases
    { text: '', expected: false, reason: 'Empty string' },
    { text: 'A', expected: true, reason: 'Single character' },
    {
      text: '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
      expected: true,
      reason: 'Exactly 90 chars',
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = validateDescription(test.text);
    const success = result === test.expected;

    if (success) {
      passed++;
      console.log(`✓ Test ${index + 1}: ${test.reason}`);
    } else {
      failed++;
      console.log(`✗ Test ${index + 1}: ${test.reason}`);
      console.log(`  Text: "${test.text}"`);
      console.log(`  Length: ${test.text.length} chars`);
      console.log(`  Expected: ${test.expected}, Got: ${result}`);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, total: tests.length };
}

/* ==================== ERROR HANDLING TESTS ==================== */

/**
 * Test error formatting
 */
export function testErrorFormatting() {
  console.log('=== Testing Error Formatting ===\n');

  const errors = [
    new AIServiceError('AUTH_ERROR', 'Invalid API key'),
    new AIServiceError('RATE_LIMIT', 'Too many requests'),
    new AIServiceError('API_ERROR', 'Service unavailable'),
    new AIServiceError('PROVIDER_NOT_CONFIGURED', 'No API key'),
    new AIServiceError('INVALID_RESPONSE', 'No valid copy'),
    new AIServiceError('TIMEOUT', 'Request timeout'),
    new AIServiceError('UNKNOWN_ERROR', 'Unknown error'),
    new Error('Generic error'),
    'String error',
    null,
  ];

  errors.forEach((error, index) => {
    const formatted = formatAIError(error);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input: ${error}`);
    console.log(`  Output: ${formatted}\n`);
  });
}

/* ==================== PROVIDER DETECTION TESTS ==================== */

/**
 * Test provider detection
 */
export function testProviderDetection() {
  console.log('=== Testing Provider Detection ===\n');

  const isAvailable = isAIServiceAvailable();
  const providers = getAvailableProviders();

  console.log('AI Service Available:', isAvailable);
  console.log('Available Providers:', providers.length > 0 ? providers : 'None');

  if (providers.includes('openai')) {
    console.log('✓ OpenAI is configured');
  } else {
    console.log('✗ OpenAI is not configured');
  }

  if (providers.includes('claude')) {
    console.log('✓ Claude is configured');
  } else {
    console.log('✗ Claude is not configured');
  }

  console.log();
}

/* ==================== CHARACTER COUNT TESTS ==================== */

/**
 * Test character counting accuracy
 */
export function testCharacterCounting() {
  console.log('=== Testing Character Counting ===\n');

  const headlines = [
    'Test',
    'This is a test headline',
    '123456789012345678901234567890', // Exactly 30
    'Shop Now - Limited Time Offer', // 30 chars
  ];

  const descriptions = [
    'Short test',
    'This is a longer description with multiple words and punctuation marks!',
    '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', // Exactly 90
  ];

  console.log('Headlines:');
  headlines.forEach((h) => {
    const isValid = validateHeadline(h);
    console.log(`  "${h}"`);
    console.log(`  Length: ${h.length} chars, Valid: ${isValid ? 'Yes' : 'No'}\n`);
  });

  console.log('Descriptions:');
  descriptions.forEach((d) => {
    const isValid = validateDescription(d);
    console.log(`  "${d}"`);
    console.log(`  Length: ${d.length} chars, Valid: ${isValid ? 'Yes' : 'No'}\n`);
  });
}

/* ==================== SPECIAL CHARACTER TESTS ==================== */

/**
 * Test special character handling
 */
export function testSpecialCharacters() {
  console.log('=== Testing Special Characters ===\n');

  const tests = [
    { char: '<', name: 'Less than', type: 'prohibited' },
    { char: '>', name: 'Greater than', type: 'prohibited' },
    { char: '{', name: 'Left brace', type: 'prohibited' },
    { char: '}', name: 'Right brace', type: 'prohibited' },
    { char: '[', name: 'Left bracket', type: 'prohibited' },
    { char: ']', name: 'Right bracket', type: 'prohibited' },
    { char: '\\', name: 'Backslash', type: 'prohibited' },
    { char: '!', name: 'Exclamation', type: 'allowed' },
    { char: '?', name: 'Question mark', type: 'allowed' },
    { char: '-', name: 'Hyphen', type: 'allowed' },
    { char: '&', name: 'Ampersand', type: 'allowed' },
    { char: '%', name: 'Percent', type: 'allowed' },
  ];

  console.log('Character validation:');
  tests.forEach((test) => {
    const headline = `Test ${test.char} Headline`;
    const isValid = validateHeadline(headline);
    const expected = test.type === 'allowed';

    const symbol = isValid === expected ? '✓' : '✗';
    console.log(`  ${symbol} ${test.name} (${test.char}): ${isValid ? 'Valid' : 'Invalid'}`);
  });

  console.log();
}

/* ==================== RUN ALL TESTS ==================== */

/**
 * Run all test suites
 */
export function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   AI Service Test Suite                ║');
  console.log('╚════════════════════════════════════════╝\n');

  const results = {
    headline: testHeadlineValidation(),
    description: testDescriptionValidation(),
  };

  testProviderDetection();
  testCharacterCounting();
  testSpecialCharacters();
  testErrorFormatting();

  console.log('╔════════════════════════════════════════╗');
  console.log('║   Test Summary                         ║');
  console.log('╚════════════════════════════════════════╝\n');

  const totalPassed = results.headline.passed + results.description.passed;
  const totalFailed = results.headline.failed + results.description.failed;
  const totalTests = results.headline.total + results.description.total;

  console.log(`Headline Tests: ${results.headline.passed}/${results.headline.total} passed`);
  console.log(
    `Description Tests: ${results.description.passed}/${results.description.total} passed`
  );
  console.log(`\nTotal: ${totalPassed}/${totalTests} passed`);

  if (totalFailed === 0) {
    console.log('\n✓ All tests passed!\n');
  } else {
    console.log(`\n✗ ${totalFailed} test(s) failed\n`);
  }

  return {
    passed: totalPassed,
    failed: totalFailed,
    total: totalTests,
  };
}

// Export for use in other files
export default {
  testHeadlineValidation,
  testDescriptionValidation,
  testErrorFormatting,
  testProviderDetection,
  testCharacterCounting,
  testSpecialCharacters,
  runAllTests,
};
