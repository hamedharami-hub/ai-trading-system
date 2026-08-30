export interface SequenceTrackerConfig {
  maxBufferWindow: number; // Max out-of-order packets before triggering gap failure
}

export const DEFAULT_SEQUENCE_CONFIG: SequenceTrackerConfig = {
  maxBufferWindow: 50
};

export type SequenceStatus = 'IN_SYNC' | 'BUFFERED' | 'DUPLICATE' | 'GAP_DETECTED';

export interface SequenceResult<T> {
  status: SequenceStatus;
  readyItems: T[];
  gapDetails?: { expected: number; received: number } | undefined;
}

export class SequenceTracker<T = unknown> {
  private expectedSequence = 0;
  private isInitialized = false;
  private buffer = new Map<number, T>();
  private gapCount = 0;

  constructor(private readonly config: SequenceTrackerConfig = DEFAULT_SEQUENCE_CONFIG) {}

  /**
   * Initializes sequence tracking baseline with the first received sequence number.
   */
  public initialize(firstSequence: number): void {
    this.expectedSequence = firstSequence;
    this.isInitialized = true;
    this.buffer.clear();
    this.gapCount = 0;
  }

  /**
   * Ingests an incoming packet with its sequence number.
   */
  public ingest(sequenceNumber: number, data: T): SequenceResult<T> {
    if (!this.isInitialized) {
      this.initialize(sequenceNumber);
      this.expectedSequence = sequenceNumber + 1;
      return {
        status: 'IN_SYNC',
        readyItems: [data]
      };
    }

    if (sequenceNumber < this.expectedSequence) {
      // Late or duplicate packet
      return {
        status: 'DUPLICATE',
        readyItems: []
      };
    }

    if (sequenceNumber === this.expectedSequence) {
      this.expectedSequence++;
      const ready: T[] = [data];

      // Drain contiguous buffered packets
      while (this.buffer.has(this.expectedSequence)) {
        const next = this.buffer.get(this.expectedSequence)!;
        this.buffer.delete(this.expectedSequence);
        ready.push(next);
        this.expectedSequence++;
      }

      return {
        status: 'IN_SYNC',
        readyItems: ready
      };
    }

    // sequenceNumber > expectedSequence -> Gap detected
    this.buffer.set(sequenceNumber, data);

    if (this.buffer.size > this.config.maxBufferWindow) {
      this.gapCount++;
      return {
        status: 'GAP_DETECTED',
        readyItems: [],
        gapDetails: {
          expected: this.expectedSequence,
          received: sequenceNumber
        }
      };
    }

    return {
      status: 'BUFFERED',
      readyItems: []
    };
  }

  public getExpectedSequence(): number {
    return this.expectedSequence;
  }

  public getGapCount(): number {
    return this.gapCount;
  }

  public reset(): void {
    this.expectedSequence = 0;
    this.isInitialized = false;
    this.buffer.clear();
  }
}
