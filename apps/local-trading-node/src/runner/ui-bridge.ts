import * as http from 'node:http';
import type { EventEnvelope } from '@trade/contracts';
import type { BridgeStateResponse, IUIBridge, RunnerConfig } from './types.js';

export interface UIBridgeCallbacks {
  getState: () => BridgeStateResponse;
  onEmergencyStop: () => void;
  onPolicyDecision?: (decision: unknown) => void;
}

export class UIBridge implements IUIBridge {
  private server: http.Server | null = null;
  private sseClients: Set<http.ServerResponse> = new Set();

  constructor(
    private readonly config: RunnerConfig,
    private readonly callbacks: UIBridgeCallbacks
  ) {}

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.sseClients) {
        client.end();
      }
      this.sseClients.clear();

      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public broadcast(event: EventEnvelope): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      client.write(data);
    }
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers for local web clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '/';

    if (req.method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', nodeId: this.config.nodeId }));
      return;
    }

    if (req.method === 'GET' && url === '/state') {
      const state = this.callbacks.getState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    if (req.method === 'GET' && url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(': connected\n\n');
      this.sseClients.add(res);

      req.on('close', () => {
        this.sseClients.delete(res);
      });
      return;
    }

    // Authenticated endpoints
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${this.config.sessionToken}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid session token' }));
      return;
    }

    if (req.method === 'POST' && url === '/emergency-stop') {
      this.callbacks.onEmergencyStop();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Emergency stop executed' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  public get clientCount(): number {
    return this.sseClients.size;
  }
}
