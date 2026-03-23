import { describe, it, expect } from 'vitest';
import {
  toMoney, addMoney, subtractMoney, multiplyMoney, divideMoney,
  calculateTVA, calculateTTC, calculateHT, sumMoney,
  calculateCMP, calculateLinearDepreciation, calculateMargin, percentOf
} from './currency';

describe('currency utilities', () => {
  it('handles floating point precision', () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(multiplyMoney(0.1, 0.2)).toBe(0.02);
  });

  it('toMoney rounds to 2 decimals', () => {
    expect(toMoney(1.005)).toBe(1.01);
    expect(toMoney(null)).toBe(0);
    expect(toMoney(undefined)).toBe(0);
  });

  it('addMoney / subtractMoney', () => {
    expect(addMoney(100, 200.55)).toBe(300.55);
    expect(subtractMoney(500, 199.99)).toBe(300.01);
  });

  it('divideMoney handles zero', () => {
    expect(divideMoney(100, 0)).toBe(0);
    expect(divideMoney(100, 3)).toBe(33.33);
  });

  it('percentOf', () => {
    expect(percentOf(1000, 18)).toBe(180);
  });

  it('TVA calculations', () => {
    expect(calculateTVA(10000, 18)).toBe(1800);
    expect(calculateTTC(10000, 18)).toBe(11800);
    expect(calculateHT(11800, 18)).toBe(10000);
  });

  it('sumMoney', () => {
    expect(sumMoney([100.1, 200.2, null, undefined, 300.3])).toBe(600.6);
  });

  it('calculateCMP', () => {
    // 100 units at 50, adding 50 at 60 => (5000+3000)/150 = 53.33
    expect(calculateCMP(100, 50, 50, 60)).toBe(53.33);
    expect(calculateCMP(0, 0, 0, 0)).toBe(0);
  });

  it('calculateLinearDepreciation', () => {
    expect(calculateLinearDepreciation(100000, 10000, 5)).toBe(18000);
  });

  it('calculateMargin', () => {
    expect(calculateMargin(1000, 600)).toBe(40);
    expect(calculateMargin(0, 600)).toBe(0);
  });
});
