'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { Calculator } = require('../src/calculator/calculator');

describe('Calculator', () => {
  const calc = new Calculator();

  describe('add / subtract / multiply', () => {
    it('adds two positive numbers', () => {
      assert.equal(calc.add(2, 3), 5);
    });

    it('subtracts numbers', () => {
      assert.equal(calc.subtract(10, 4), 6);
    });

    it('multiplies numbers', () => {
      assert.equal(calc.multiply(6, 7), 42);
    });
  });

  describe('divide', () => {
    it('divides evenly', () => {
      assert.equal(calc.divide(10, 2), 5);
    });

    it('returns a fractional result when the division is not exact', () => {
      assert.equal(calc.divide(7, 2), 3.5);
    });

    it('throws a RangeError when the divisor is 0', () => {
      assert.throws(() => calc.divide(1, 0), RangeError);
    });
  });

  describe('sumRange', () => {
    it('includes both bounds', () => {
      assert.equal(calc.sumRange(1, 5), 15);
    });

    it('returns the single value when start === end', () => {
      assert.equal(calc.sumRange(4, 4), 4);
    });

    it('returns 0 when start is greater than end', () => {
      assert.equal(calc.sumRange(5, 1), 0);
    });
  });

  describe('isPrime', () => {
    it('accepts prime numbers', () => {
      assert.equal(calc.isPrime(2), true);
      assert.equal(calc.isPrime(7), true);
      assert.equal(calc.isPrime(97), true);
    });

    it('rejects values below 2 and non-integers', () => {
      assert.equal(calc.isPrime(1), false);
      assert.equal(calc.isPrime(0), false);
      assert.equal(calc.isPrime('7'), false);
    });

    it('rejects squares of prime numbers', () => {
      assert.equal(calc.isPrime(4), false);
      assert.equal(calc.isPrime(9), false);
    });
  });

  describe('parseNumber', () => {
    it('parses a plain decimal integer', () => {
      assert.equal(calc.parseNumber('42'), 42);
    });

    it('parses a negative decimal integer', () => {
      assert.equal(calc.parseNumber('-7'), -7);
    });

    it('returns NaN for malformed input instead of silently truncating', () => {
      assert.ok(Number.isNaN(calc.parseNumber('12abc')));
      assert.ok(Number.isNaN(calc.parseNumber('0x10')));
    });
  });

  describe('average', () => {
    it('averages a list of numbers', () => {
      assert.equal(calc.average([2, 4, 6]), 4);
    });

    it('throws a RangeError for an empty list', () => {
      assert.throws(() => calc.average([]), RangeError);
    });
  });

  describe('roundTo', () => {
    it('rounds to the requested number of decimals', () => {
      assert.equal(calc.roundTo(2.345, 2), 2.35);
      assert.equal(calc.roundTo(2.4, 0), 2);
    });
  });

  describe('isEven', () => {
    it('detects even and odd positive numbers', () => {
      assert.equal(calc.isEven(4), true);
      assert.equal(calc.isEven(7), false);
    });
  });

  describe('percentage', () => {
    it('expresses a part as a percentage of a whole', () => {
      assert.equal(calc.percentage(25, 200), 12.5);
    });
  });
});
