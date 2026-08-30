import { describe, it, expect } from 'vitest';
import { SequenceTracker } from '../../src/feed/sequence-tracker.js';

describe('Sequence Tracker & Gap Detector', () => {
  it('processes contiguous sequential packets without buffering', () => {
    const tracker = new SequenceTracker<string>({ maxBufferWindow: 10 });
    tracker.initialize(100);

    const r1 = tracker.ingest(100, 'item-100');
    expect(r1.status).toBe('IN_SYNC');
    expect(r1.readyItems).toEqual(['item-100']);

    const r2 = tracker.ingest(101, 'item-101');
    expect(r2.status).toBe('IN_SYNC');
    expect(r2.readyItems).toEqual(['item-101']);
    expect(tracker.getExpectedSequence()).toBe(102);
  });

  it('discards late or duplicate sequence packets', () => {
    const tracker = new SequenceTracker<string>({ maxBufferWindow: 10 });
    tracker.initialize(100);
    tracker.ingest(100, 'item-100');
    tracker.ingest(101, 'item-101');

    const dup = tracker.ingest(100, 'item-100-duplicate');
    expect(dup.status).toBe('DUPLICATE');
    expect(dup.readyItems).toHaveLength(0);
  });

  it('buffers out-of-order packets and drains them in order once missing packet arrives', () => {
    const tracker = new SequenceTracker<string>({ maxBufferWindow: 10 });
    tracker.initialize(100);
    tracker.ingest(100, 'item-100');

    // Missing seq 101, arrives seq 102 and 103
    const r102 = tracker.ingest(102, 'item-102');
    expect(r102.status).toBe('BUFFERED');
    expect(r102.readyItems).toHaveLength(0);

    const r103 = tracker.ingest(103, 'item-103');
    expect(r103.status).toBe('BUFFERED');

    // Now missing seq 101 arrives
    const r101 = tracker.ingest(101, 'item-101');
    expect(r101.status).toBe('IN_SYNC');
    expect(r101.readyItems).toEqual(['item-101', 'item-102', 'item-103']);
    expect(tracker.getExpectedSequence()).toBe(104);
  });

  it('triggers GAP_DETECTED fail-closed when buffer window is exceeded', () => {
    const tracker = new SequenceTracker<string>({ maxBufferWindow: 2 });
    tracker.initialize(100);
    tracker.ingest(100, 'item-100');

    // 3 packets without receiving seq 101
    tracker.ingest(102, 'item-102');
    tracker.ingest(103, 'item-103');
    const rGap = tracker.ingest(104, 'item-104');

    expect(rGap.status).toBe('GAP_DETECTED');
    expect(rGap.gapDetails?.expected).toBe(101);
    expect(rGap.gapDetails?.received).toBe(104);
    expect(tracker.getGapCount()).toBe(1);
  });
});
