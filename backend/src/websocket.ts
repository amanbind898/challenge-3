import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { ruleEngine } from './ruleEngine.js';
import { simulator } from './simulator.js';
import { getTransactionsCollection } from './db.js';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
    this.startTransactionSimulation();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected to WebSocket');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to fraud detection system'
      }));
    });
  }

  private async handleMessage(ws: WebSocket, data: any): Promise<void> {
    switch (data.type) {
      case 'start_simulation':
        if (!simulator.isActive()) {
          this.startTransactionSimulation();
        }
        ws.send(JSON.stringify({ type: 'simulation_status', running: true }));
        break;

      case 'stop_simulation':
        simulator.stop();
        ws.send(JSON.stringify({ type: 'simulation_status', running: false }));
        break;

      case 'get_status':
        ws.send(JSON.stringify({ 
          type: 'status', 
          simulation_running: simulator.isActive(),
          connected_clients: this.clients.size
        }));
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private startTransactionSimulation(): void {
    simulator.start(async (transaction) => {
      try {
        // Store transaction
        const transactionsCollection = getTransactionsCollection();
        await transactionsCollection.insertOne(transaction);

        // Apply fraud rules
        const ruleResult = await ruleEngine.applyRulesToTransaction(transaction);

        // Broadcast to all connected clients
        const message = {
          type: 'transaction',
          data: {
            transaction,
            analysis: ruleResult
          }
        };

        this.broadcast(JSON.stringify(message));
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }, 1500); // Generate transaction every 1.5 seconds
  }

  private broadcast(message: string): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
