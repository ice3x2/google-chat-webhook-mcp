import express, { Request, Response } from 'express';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface MockWebhookRequest {
  timestamp: string;
  body: any;
  headers: Record<string, any>;
}

export class MockWebhookServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private requests: MockWebhookRequest[] = [];

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use((req: Request, res: Response, next: any) => {
      console.log(`[MockWebhook] ${req.method} ${req.url}`);
      next();
    });
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post('/webhook', (req: Request, res: Response) => {
      const request: MockWebhookRequest = {
        timestamp: new Date().toISOString(),
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
        },
      };

      this.requests.push(request);
      
      console.log(`[MockWebhook] Received request #${this.requests.length}`);
      
      // Simulate Google Chat response
      res.status(200).json({
        name: `spaces/MOCK_SPACE/messages/MSG_${Date.now()}`,
        sender: { name: 'Mock Sender', displayName: 'Mock Bot' },
        createTime: new Date().toISOString(),
        text: req.body.text || '',
      });
    });

    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'healthy', 
        requestCount: this.requests.length,
        uptime: process.uptime(),
      });
    });

    this.app.get('/requests', (req: Request, res: Response) => {
      res.status(200).json({
        count: this.requests.length,
        requests: this.requests,
      });
    });

    this.app.delete('/requests', (req: Request, res: Response) => {
      const count = this.requests.length;
      this.requests = [];
      res.status(200).json({ 
        cleared: count,
        message: `Cleared ${count} requests`,
      });
    });
  }

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          const url = `http://localhost:${this.port}/webhook`;
          console.log(`✅ Mock webhook server started at ${url}`);
          resolve(url);
        });

        this.server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${this.port} is already in use`);
          }
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: any) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Mock webhook server stopped');
          resolve();
        }
      });
    });
  }

  getRequests(): MockWebhookRequest[] {
    return [...this.requests];
  }

  clearRequests(): void {
    this.requests = [];
  }

  saveRequestsToFile(filePath: string): void {
    const data = {
      timestamp: new Date().toISOString(),
      count: this.requests.length,
      requests: this.requests,
    };
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${this.requests.length} requests to ${filePath}`);
  }
}
