import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export class MCPClient extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, any>();

  async connect(serverPath: string): Promise<void> {
    // Conectar al servidor MCP simple en lugar del servidor TypeScript
    const simpleServerPath = serverPath.replace('/mcp-server', '/mcp-server-simple.js');
    this.serverProcess = spawn('node', [simpleServerPath], {
      cwd: serverPath.replace('/mcp-server', ''),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.serverProcess.stdout?.on('data', (data) => {
      this.handleServerResponse(data.toString());
    });

    this.serverProcess.stderr?.on('data', (data) => {
      console.log('MCP Server:', data.toString());
    });

    this.serverProcess.on('error', (error) => {
      console.error('Error al iniciar el servidor MCP:', error);
    });

    this.serverProcess.on('close', (code) => {
      console.log(`Servidor MCP terminado con código: ${code}`);
    });

    // Inicializar el servidor
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const initMessage = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { 
          tools: {},
          resources: {},
          prompts: {}
        },
        clientInfo: { 
          name: 'custom-client', 
          version: '1.0.0' 
        }
      }
    };

    await this.sendMessage(initMessage);
    
    // Enviar initialized notification
    const initializedMessage = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    };
    
    this.sendNotification(initializedMessage);
  }

  async listTools(): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/list',
      params: {}
    };

    return this.sendMessage(message);
  }

  async callTool(name: string, args: any): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/call',
      params: { 
        name, 
        arguments: args 
      }
    };

    return this.sendMessage(message);
  }

  async listResources(): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'resources/list',
      params: {}
    };

    return this.sendMessage(message);
  }

  async getResource(uri: string): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'resources/read',
      params: { uri }
    };

    return this.sendMessage(message);
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = message.id;
      this.pendingRequests.set(id, { resolve, reject });
      
      if (this.serverProcess?.stdin) {
        this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
      } else {
        reject(new Error('Servidor MCP no está conectado'));
        return;
      }
      
      // Timeout después de 30 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private sendNotification(message: any): void {
    if (this.serverProcess?.stdin) {
      this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
    }
  }

  private handleServerResponse(data: string): void {
    const lines = data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.id !== undefined && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);
          
          if (response.error) {
            reject(new Error(response.error.message || 'Error desconocido'));
          } else {
            resolve(response);
          }
        } else if (response.method) {
          // Manejar notificaciones del servidor
          this.emit('notification', response);
        }
      } catch (error) {
        console.error('Error parsing server response:', error);
        console.error('Raw data:', line);
      }
    }
  }

  private getNextId(): number {
    return ++this.messageId;
  }

  disconnect(): void {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.pendingRequests.clear();
  }
} 