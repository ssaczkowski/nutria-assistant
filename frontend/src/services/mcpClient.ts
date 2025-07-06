import { io, Socket } from 'socket.io-client';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: Date;
  toolName?: string;
  requestId?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class MCPClientService {
  private socket: Socket | null = null;
  private isConnected = false;
  private mcpConnected = false;
  private listeners: { [key: string]: ((...args: any[]) => void)[] } = {};

  connect(serverUrl?: string): Promise<void> {
    // Determinar URL del servidor según el entorno
    const defaultUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001';
    
    const finalUrl = serverUrl || defaultUrl;
    
    return new Promise((resolve, reject) => {
      this.socket = io(finalUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado al servidor');
        this.isConnected = true;
        this.emit('connected');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor');
        this.isConnected = false;
        this.mcpConnected = false;
        this.emit('disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
        reject(error);
      });

      this.socket.on('connection-status', (status) => {
        this.mcpConnected = status.connected;
        this.emit('mcp-status', status);
      });

      this.socket.on('tools-list', (data) => {
        this.emit('tools-list', data);
      });

      this.socket.on('tool-result', (data) => {
        this.emit('tool-result', data);
      });

      this.socket.on('resources-list', (data) => {
        this.emit('resources-list', data);
      });

      this.socket.on('resource-data', (data) => {
        this.emit('resource-data', data);
      });

      this.socket.on('error', (error) => {
        console.error('❌ Error del servidor:', error);
        this.emit('error', error);
      });

      this.socket.on('mcp-notification', (notification) => {
        this.emit('mcp-notification', notification);
      });

      // Timeout para la conexión inicial
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Timeout en la conexión'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.mcpConnected = false;
  }

  // Métodos para interactuar con herramientas
  async listTools(): Promise<MCPTool[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('No conectado al servidor'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout al listar herramientas'));
      }, 10000);

      this.once('tools-list', (data) => {
        clearTimeout(timeout);
        resolve(data.tools || []);
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.emit('list-tools');
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('No conectado al servidor'));
        return;
      }

      const requestId = Date.now().toString();
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout al llamar herramienta: ${name}`));
      }, 30000);

      const handleResult = (data: any) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.off('tool-result', handleResult);
          this.off('error', handleError);
          resolve(data.result);
        }
      };

      const handleError = (error: any) => {
        if (error.requestId === requestId) {
          clearTimeout(timeout);
          this.off('tool-result', handleResult);
          this.off('error', handleError);
          reject(error);
        }
      };

      this.on('tool-result', handleResult);
      this.on('error', handleError);

      this.socket.emit('call-tool', {
        name,
        arguments: args,
        requestId
      });
    });
  }

  async listResources(): Promise<MCPResource[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('No conectado al servidor'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout al listar recursos'));
      }, 10000);

      this.once('resources-list', (data) => {
        clearTimeout(timeout);
        resolve(data.resources || []);
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.emit('list-resources');
    });
  }

  async getResource(uri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('No conectado al servidor'));
        return;
      }

      const requestId = Date.now().toString();
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout al obtener recurso: ${uri}`));
      }, 30000);

      const handleResult = (data: any) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.off('resource-data', handleResult);
          this.off('error', handleError);
          resolve(data.data);
        }
      };

      const handleError = (error: any) => {
        if (error.requestId === requestId) {
          clearTimeout(timeout);
          this.off('resource-data', handleResult);
          this.off('error', handleError);
          reject(error);
        }
      };

      this.on('resource-data', handleResult);
      this.on('error', handleError);

      this.socket.emit('get-resource', {
        uri,
        requestId
      });
    });
  }

  reconnectMCP(): void {
    if (this.socket) {
      this.socket.emit('reconnect-mcp');
    }
  }

  // Sistema de eventos
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  once(event: string, listener: (...args: any[]) => void): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get mcpStatus(): boolean {
    return this.mcpConnected;
  }
}

// Instancia singleton
export const mcpClient = new MCPClientService(); 