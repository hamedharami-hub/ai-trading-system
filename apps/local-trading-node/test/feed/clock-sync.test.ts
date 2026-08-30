import { describe, it, expect } from 'vitest';
import { ClockSyncTracker } from '../../src/feed/clock-sync.js';

describe('Clock Synchronization Tracker', () => {
  it('calculates smoothed clock offset accurately', () => {
    const tracker = new ClockSyncTracker({ maxDriftMs: 500, staleThresholdMs: 5000, alpha: 0.5 });
    const localNow = 1700000000100;
    const exchangeISO = new Date(1700000000000).toISOString(); // 100ms offset

    const offset = tracker.recordSample(exchangeISO, localNow);
    expect(offset).toBe(100);
    expect(tracker.getSmoothedOffsetMs()).toBe(100);
    expect(tracker.isDriftExceeded()).toBe(false);
  });

  it('detects excessive clock drift exceeding threshold (DEC-046)', () => {
    const tracker = new ClockSyncTracker({ maxDriftMs: 500, staleThresholdMs: 5000, alpha: 1.0 });
    const localNow = 1700000001000;
    const exchangeISO = new Date(1700000000000).toISOString(); // 1000ms drift (> 500ms limit)

    tracker.recordSample(exchangeISO, localNow);
    expect(tracker.isDriftExceeded()).toBe(true);
  });

  it('detects feed staleness when no sample received within threshold', () => {
    const tracker = new ClockSyncTracker({ maxDriftMs: 500, staleThresholdMs: 2000, alpha: 0.5 });
    const t0 = 1700000000000;
    tracker.recordSample(new Date(t0).toISOString(), t0);

    expect(tracker.isStale(t0 + 1000)).toBe(false);
    expect(tracker.isStale(t0 + 3000)).toBe(true); // Exceeded 2000ms threshold
  });
});
