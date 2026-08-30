import { describe, it, expect } from 'vitest';
import { getNodeStatus } from '../src/index.js';
import { parseDecimal, toDecimalString } from '@trade/contracts';

describe('Local Trading Node Baseline', () => {
  it('imports and uses contracts correctly', () => {
    const status = getNodeStatus();
    expect(status).toContain('100');

    const d = parseDecimal('50.25');
    expect(toDecimalString(d)).toBe('50.25');
  });
});
