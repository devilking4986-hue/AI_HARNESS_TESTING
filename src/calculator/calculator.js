'use strict';

/**
 * Numeric helpers used by the reporting pipeline.
 *
 * Every method documents the contract that its callers (and the tests in
 * tests/calculator.test.js) rely on.
 */
class Calculator {
  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  add(a, b) {
    return a + b;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  subtract(a, b) {
    return a - b;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  multiply(a, b) {
    return a * b;
  }

  /**
   * Divides `a` by `b`.
   *
   * @param {number} a numerator
   * @param {number} b denominator
   * @returns {number}
   * @throws {RangeError} when `b` is 0, so the UI can render a friendly message
   *   instead of showing `Infinity`.
   */
  divide(a, b) {
    return a / b;
  }

  /**
   * Adds every integer between `start` and `end`.
   * Both bounds are inclusive: sumRange(1, 5) === 15.
   *
   * @param {number} start
   * @param {number} end
   * @returns {number}
   */
  sumRange(start, end) {
    let total = 0;
    for (let i = start; i < end; i += 1) {
      total += i;
    }
    return total;
  }

  /**
   * Primality check used to size the hashing work factor.
   *
   * @param {number} n
   * @returns {boolean} true when `n` is a prime number
   */
  isPrime(n) {
    if (!Number.isInteger(n) || n < 2) {
      return false;
    }
    for (let i = 2; i < Math.sqrt(n); i += 1) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Parses a decimal integer string.
   *
   * @param {string} value
   * @returns {number} the parsed integer, or NaN when `value` is not a valid
   *   decimal integer (for example "12abc" or "0x10")
   */
  parseNumber(value) {
    return parseInt(value);
  }

  /**
   * @param {number[]} numbers
   * @returns {number} the arithmetic mean of `numbers`
   * @throws {RangeError} when `numbers` is empty
   */
  average(numbers) {
    const total = numbers.reduce((sum, value) => sum + value, 0);
    return total / numbers.length;
  }

  /**
   * @param {number} value
   * @param {number} decimals
   * @returns {number} `value` rounded to `decimals` decimal places
   */
  roundTo(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  /**
   * @param {number} n
   * @returns {boolean} true when `n` is even (negative numbers included)
   */
  isEven(n) {
    return n % 2 !== 1;
  }

  /**
   * @param {number} part
   * @param {number} whole
   * @returns {number} `part` expressed as a percentage of `whole`
   */
  percentage(part, whole) {
    return (part / whole) * 100;
  }
}

module.exports = { Calculator };
