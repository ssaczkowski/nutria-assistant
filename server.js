const express = require('express');
const { createServer } = require('http');
const { Server: SocketServer } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const { EventEmitter } = require('events');
require('dotenv').config();

// Configuración de puerto
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Crear aplicación Express
const app = express();
const server = createServer(app);

// Configurar Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: isProduction ? false : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: isProduction ? false : ["http://localhost:3000"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend en producción
if (isProduction) {
  const frontendPath = path.join(__dirname, 'frontend', 'build');
  app.use(express.static(frontendPath));
  console.log(`📁 Sirviendo archivos estáticos desde: ${frontendPath}`);
}

// ===== MCP CLIENT LOGIC =====
class MCPClient extends EventEmitter {
  constructor() {
    super();
    this.serverProcess = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  async connect() {
    const serverPath = path.join(__dirname, 'mcp-server-simple.js');
    console.log(`🔗 Iniciando MCP Server: ${serverPath}`);
    
    this.serverProcess = spawn('node', [serverPath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.serverProcess.stdout?.on('data', (data) => {
      this.handleServerResponse(data.toString());
    });

    this.serverProcess.stderr?.on('data', (data) => {
      console.log('🦦 MCP Server:', data.toString());
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Error al iniciar MCP Server:', error);
    });

    this.serverProcess.on('close', (code) => {
      console.log(`🦦 MCP Server terminado con código: ${code}`);
    });

    // Inicializar
    await this.initialize();
  }

  async initialize() {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'initialize',
      params: {}
    };

    return this.sendMessage(message);
  }

  async listTools() {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/list',
      params: {}
    };

    return this.sendMessage(message);
  }

  async callTool(name, args) {
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

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      const id = message.id;
      this.pendingRequests.set(id, { resolve, reject });
      
      if (this.serverProcess?.stdin) {
        this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
      } else {
        reject(new Error('MCP Server no está conectado'));
        return;
      }
      
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  handleServerResponse(data) {
    const lines = data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      } catch (error) {
        // Línea no es JSON válido, probablemente log del servidor
      }
    }
  }

  getNextId() {
    return ++this.messageId;
  }

  disconnect() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.pendingRequests.clear();
  }
}

// Crear cliente MCP
const mcpClient = new MCPClient();
let isConnected = false;

// Función para conectar al MCP
async function connectToMCP() {
  try {
    console.log('🔗 Conectando al servidor MCP...');
    await mcpClient.connect();
    isConnected = true;
    console.log('✅ Cliente MCP conectado exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar con MCP:', error);
    isConnected = false;
  }
}

// ===== RUTAS API =====
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpConnected: isConnected,
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development'
  });
});

// ===== SOCKET.IO EVENTS =====
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Enviar estado de conexión
  socket.emit('connection-status', { connected: isConnected });

  // Listar herramientas
  socket.on('list-tools', async () => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'MCP Server no conectado' });
        return;
      }

      const result = await mcpClient.listTools();
      socket.emit('tools-list', result);
    } catch (error) {
      console.error('Error listando herramientas:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Ejecutar herramienta
  socket.on('call-tool', async (data) => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'MCP Server no conectado' });
        return;
      }

      const { name, args, requestId } = data;
      console.log(`🔧 Ejecutando herramienta: ${name}`);
      
      const result = await mcpClient.callTool(name, args);
      socket.emit('tool-result', { 
        result, 
        requestId,
        toolName: name 
      });
    } catch (error) {
      console.error('Error ejecutando herramienta:', error);
      socket.emit('error', { 
        message: error.message,
        requestId: data.requestId 
      });
    }
  });

  // Reconectar MCP
  socket.on('reconnect-mcp', async () => {
    console.log('🔄 Intentando reconectar MCP...');
    await connectToMCP();
    socket.emit('connection-status', { connected: isConnected });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Servir frontend en producción
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// ===== INICIO DEL SERVIDOR =====
async function startServer() {
  try {
    // Conectar MCP
    await connectToMCP();
    
    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n🦦 ===== nutrIA Server =====');
      console.log(`🚀 Servidor iniciado en puerto: ${PORT}`);
      console.log(`🌍 Modo: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
      console.log(`🔗 MCP Connected: ${isConnected ? '✅' : '❌'}`);
      if (!isProduction) {
        console.log(`📱 Frontend: http://localhost:${PORT}`);
        console.log(`🔌 API: http://localhost:${PORT}/api`);
      }
      console.log('============================\n');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Recibido SIGTERM, cerrando servidor...');
  mcpClient.disconnect();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibido SIGINT, cerrando servidor...');
  mcpClient.disconnect();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar aplicación
startServer(); 