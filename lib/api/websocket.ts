/**
 * lib/api/websocket.ts
 * WebSocket client for real-time communication with the backend server
 */

export type MessageType = 
  | 'init-room'
  | 'join-room'
  | 'spectate-room'
  | 'update-state'
  | 'get-room-state'
  | 'check-room-capacity'
  | 'room-initialized'
  | 'room-joined'
  | 'room-spectated'
  | 'player-joined'
  | 'player-left'
  | 'state-updated'
  | 'room-state'
  | 'capacity-check'
  | 'error';

export interface WSMessage {
  type: MessageType;
  [key: string]: string | number | boolean | null | string[] | number[] | Record<string, unknown>;
}

type MessageHandler = (message: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<MessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor() {
    const env = (typeof process !== 'undefined' && process.env) ? (process.env as unknown as Record<string, string | undefined>) : undefined;
    const envUrl = env ? env.NEXT_PUBLIC_WS_URL : undefined;
    if (envUrl) {
      this.url = envUrl;
      return;
    }

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.hostname;
      const port = ':3001';
      this.url = `${protocol}://${host}${port}/ws`;
    } else {
      this.url = 'ws://localhost:3001/ws';
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.url);
        this.isIntentionallyClosed = false;

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('Reconnect failed:', err);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleMessage(message: WSMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  on(type: MessageType, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(type: MessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(message: WSMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  close(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
