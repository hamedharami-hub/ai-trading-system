import type { EventEnvelope, AuditEventPayload, StrategyCandidatePayload } from '@trade/contracts';
import { validatePayload } from '@trade/contracts';
import type { PwaConfig, NodeConnectionStatus } from './types.js';

export class NodeClient {
  private status: NodeConnectionStatus = 'DISCONNECTED';
  private eventListeners: Array<(event: EventEnvelope) => void> = [];
  private statusListeners: Array<(status: NodeConnectionStatus) => void> = [];

  constructor(private readonly config: PwaConfig) {}

  public onEvent(listener: (event: EventEnvelope) => void): void {
    this.eventListeners.push(listener);
  }

  public onStatusChange(listener: (status: NodeConnectionStatus) => void): void {
    this.statusListeners.push(listener);
  }

  private setStatus(newStatus: NodeConnectionStatus): void {
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      listener(newStatus);
    }
  }

  public get connectionStatus(): NodeConnectionStatus {
    return this.status;
  }

  public async fetchState(): Promise<any> {
    try {
      this.setStatus('CONNECTING');
      const res = await fetch(`${this.config.nodeUrl}/state`);
      if (!res.ok) {
        throw new Error(`Failed to fetch state: HTTP ${res.status}`);
      }
      const data = await res.json();
      this.setStatus('CONNECTED');
      return data;
    } catch (err) {
      this.setStatus('ERROR');
      throw err;
    }
  }

  public async triggerEmergencyStop(): Promise<boolean> {
    const res = await fetch(`${this.config.nodeUrl}/emergency-stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.sessionToken}`
      }
    });

    if (!res.ok) {
      throw new Error(`Emergency stop failed: HTTP ${res.status}`);
    }

    return true;
  }

  private eventSource: any = null;

  public connectEventStream(): void {
    if (typeof EventSource !== 'undefined') {
      this.disconnect();
      const sseUrl = `${this.config.nodeUrl}/events`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const envelope: EventEnvelope = JSON.parse(event.data);
          this.handleIncomingEnvelope(envelope);
        } catch (err) {
          console.error('[NodeClient] Error parsing SSE event payload:', err);
        }
      };

      this.eventSource.onerror = (err: any) => {
        console.warn('[NodeClient] SSE connection error:', err);
      };
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public handleIncomingEnvelope(envelope: EventEnvelope): void {
    // Validate envelope structure
    if (envelope.schema_version !== '1.0.0') {
      console.warn(`[NodeClient] Received unsupported schema version: ${envelope.schema_version}`);
      return;
    }

    for (const listener of this.eventListeners) {
      listener(envelope);
    }
  }
}
