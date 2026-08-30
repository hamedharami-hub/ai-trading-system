import type { EventEnvelope } from '@trade/contracts';
import type { IEventStore } from './types.js';

export class LocalEventStore implements IEventStore {
  private events: EventEnvelope[] = [];
  private correlationIndex = new Map<string, EventEnvelope[]>();
  private typeIndex = new Map<string, EventEnvelope[]>();

  public async append(event: EventEnvelope): Promise<void> {
    this.events.push(event);

    // Index by correlation_id
    let corrList = this.correlationIndex.get(event.correlation_id);
    if (!corrList) {
      corrList = [];
      this.correlationIndex.set(event.correlation_id, corrList);
    }
    corrList.push(event);

    // Index by event_type
    let typeList = this.typeIndex.get(event.event_type);
    if (!typeList) {
      typeList = [];
      this.typeIndex.set(event.event_type, typeList);
    }
    typeList.push(event);
  }

  public async getEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]> {
    return [...(this.correlationIndex.get(correlationId) || [])];
  }

  public async getEventsByType(eventType: string): Promise<EventEnvelope[]> {
    return [...(this.typeIndex.get(eventType) || [])];
  }

  public async getAllEvents(): Promise<EventEnvelope[]> {
    return [...this.events];
  }

  public get count(): number {
    return this.events.length;
  }
}
