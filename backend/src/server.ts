import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { MCPClient } from './mcpClient';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Ruta para servir archivos estáticos si es necesario
app.use(express.static(path.join(__dirname, '../public')));

const mcpClient = new MCPClient();
let isConnected = false;

// Función para intentar conectar al servidor MCP
async function connectToMCP() {
  try {
    const mcpServerPath = path.join(__dirname, '../../mcp-server');
    console.log(`🔗 Intentando conectar al servidor MCP en: ${mcpServerPath}`);
    
    await mcpClient.connect(mcpServerPath);
    isConnected = true;
    console.log('✅ Cliente MCP conectado exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar con el servidor MCP:', error);
    isConnected = false;
  }
}

// Intentar conectar al inicio
connectToMCP();

// Rutas REST
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpConnected: isConnected,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tools', async (req, res) => {
  try {
    if (!isConnected) {
      throw new Error('Cliente MCP no conectado');
    }
    
    const response = await mcpClient.listTools();
    res.json(response.result || { tools: [] });
  } catch (error) {
    console.error('Error al obtener herramientas:', error);
    res.status(500).json({ 
      error: 'Error al obtener herramientas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

app.post('/api/tools/:toolName', async (req, res) => {
  try {
    if (!isConnected) {
      throw new Error('Cliente MCP no conectado');
    }
    
    const { toolName } = req.params;
    const { arguments: args } = req.body;
    
    const response = await mcpClient.callTool(toolName, args || {});
    res.json(response.result);
  } catch (error) {
    console.error('Error al llamar herramienta:', error);
    res.status(500).json({ 
      error: 'Error al llamar herramienta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    if (!isConnected) {
      throw new Error('Cliente MCP no conectado');
    }
    
    const response = await mcpClient.listResources();
    res.json(response.result || { resources: [] });
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    res.status(500).json({ 
      error: 'Error al obtener recursos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Enviar estado de conexión
  socket.emit('connection-status', { 
    connected: isConnected,
    clientId: socket.id 
  });

  // Listar herramientas
  socket.on('list-tools', async () => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'Cliente MCP no conectado' });
        return;
      }
      
      const response = await mcpClient.listTools();
      socket.emit('tools-list', response.result || { tools: [] });
    } catch (error) {
      console.error('Error al listar herramientas:', error);
      socket.emit('error', { 
        message: 'Error al listar herramientas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Llamar herramienta
  socket.on('call-tool', async (data) => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'Cliente MCP no conectado' });
        return;
      }
      
      const { name, arguments: args } = data;
      const response = await mcpClient.callTool(name, args || {});
      socket.emit('tool-result', {
        toolName: name,
        result: response.result,
        requestId: data.requestId
      });
    } catch (error) {
      console.error('Error al llamar herramienta:', error);
      socket.emit('error', { 
        message: 'Error al llamar herramienta',
        details: error instanceof Error ? error.message : 'Error desconocido',
        requestId: data.requestId
      });
    }
  });

  // Listar recursos
  socket.on('list-resources', async () => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'Cliente MCP no conectado' });
        return;
      }
      
      const response = await mcpClient.listResources();
      socket.emit('resources-list', response.result || { resources: [] });
    } catch (error) {
      console.error('Error al listar recursos:', error);
      socket.emit('error', { 
        message: 'Error al listar recursos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Obtener recurso
  socket.on('get-resource', async (data) => {
    try {
      if (!isConnected) {
        socket.emit('error', { message: 'Cliente MCP no conectado' });
        return;
      }
      
      const { uri } = data;
      const response = await mcpClient.getResource(uri);
      socket.emit('resource-data', {
        uri,
        data: response.result,
        requestId: data.requestId
      });
    } catch (error) {
      console.error('Error al obtener recurso:', error);
      socket.emit('error', { 
        message: 'Error al obtener recurso',
        details: error instanceof Error ? error.message : 'Error desconocido',
        requestId: data.requestId
      });
    }
  });

  // Reconectar MCP
  socket.on('reconnect-mcp', async () => {
    try {
      console.log('🔄 Intentando reconectar MCP...');
      await connectToMCP();
      socket.emit('connection-status', { 
        connected: isConnected,
        message: isConnected ? 'Conectado exitosamente' : 'Error al conectar'
      });
    } catch (error) {
      console.error('Error al reconectar MCP:', error);
      socket.emit('error', { 
        message: 'Error al reconectar MCP',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Recibir logs del cliente
  socket.on('client-log', (data) => {
    const { message, level, timestamp } = data;
    const logTime = new Date(timestamp).toLocaleString('es-ES');
    
    // Formatear el mensaje para el servidor
    const logMessage = `[CLIENT-${socket.id.substring(0, 6)}] ${message}`;
    
    // Escribir en consola según el nivel
    switch (level) {
      case 'error':
        console.error(`❌ [${logTime}] ${logMessage}`);
        break;
      case 'warn':
        console.warn(`⚠️ [${logTime}] ${logMessage}`);
        break;
      case 'info':
      default:
        console.log(`ℹ️ [${logTime}] ${logMessage}`);
        break;
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Manejar notificaciones del servidor MCP
mcpClient.on('notification', (notification) => {
  console.log('📢 Notificación del servidor MCP:', notification);
  io.emit('mcp-notification', notification);
});

// Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  mcpClient.disconnect();
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  mcpClient.disconnect();
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Frontend URL: http://localhost:3000`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
}); 