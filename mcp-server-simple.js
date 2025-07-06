#!/usr/bin/env node

const { spawn } = require('child_process');
const NotificationService = require('./notification-service.js');
require('dotenv').config();

// Configurar OpenAI con manejo de errores
let openai = null;
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.error('OpenAI no disponible:', error.message);
}

// Configurar servicio de notificaciones
const notificationService = new NotificationService();

// Todas las herramientas (incluyendo internas)
const getAllTools = () => {
  const tools = [];
  
  if (openai) {
    tools.push(
      {
        name: 'chat',
        description: 'Conversar con IA especializada en nutrición y salud',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Mensaje para la IA' },
            userProfile: { type: 'object', description: 'Perfil del usuario' }
          },
          required: ['message']
        }
      },
      {
        name: 'nutrition-advice',
        description: 'Obtener consejos específicos de nutrición',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Pregunta sobre nutrición' },
            userProfile: { type: 'object', description: 'Perfil del usuario' }
          },
          required: ['question']
        }
      },
      {
        name: 'send-email',
        description: 'Enviar email al nutricionista (herramienta interna)',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Email del destinatario' },
            subject: { type: 'string', description: 'Asunto del email' },
            message: { type: 'string', description: 'Contenido del email' },
            userProfile: { type: 'object', description: 'Perfil del usuario' },
            nutritionist: { type: 'object', description: 'Información del nutricionista' }
          },
          required: ['to', 'subject', 'message']
        }
      }
    );
  } else {
    tools.push({
      name: 'setup-required',
      description: 'Configuración de OpenAI requerida',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Mensaje informativo' }
        },
        required: ['message']
      }
    });
  }
  
  return tools;
};

// Herramientas disponibles para el usuario (solo las visibles)
const getAvailableTools = () => {
  const tools = getAllTools();
  // Filtrar herramientas internas
  return tools.filter(tool => tool.name !== 'send-email');
};

// Procesar solicitudes
const processRequest = async (request) => {
  try {
    const parsed = JSON.parse(request);
    
    // Listar herramientas
    if (parsed.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: parsed.id,
        result: { tools: getAvailableTools() }
      };
    }
    
    // Llamar herramienta
    if (parsed.method === 'tools/call') {
      const { name, arguments: args } = parsed.params;
      let result;
      
      // Verificar que la herramienta existe en TODAS las herramientas (incluyendo internas)
      const allTools = getAllTools();
      const toolExists = allTools.some(tool => tool.name === name);
      
      if (!toolExists) {
        throw new Error(`Herramienta no encontrada: ${name}`);
      }
      
      switch (name) {
        case 'setup-required':
          result = {
            content: [{
              type: 'text',
              text: '🔧 Para usar nutrIA necesitas configurar OpenAI.\n\n' +
                   '📋 Pasos:\n' +
                   '1. Ejecuta: ./setup-openai-key.sh\n' +
                   '2. Sigue las instrucciones\n' +
                   '3. Reinicia la aplicación\n\n' +
                   '💡 Una vez configurado tendrás acceso completo a nutrIA!'
            }]
          };
          break;
          
        case 'chat':
          if (!openai) {
            throw new Error('OpenAI no configurado');
          }
          
          const message = args?.message || '';
          const userProfile = args?.userProfile || {};
          
          let systemPrompt = 'Eres nutrIA, una IA especializada en nutrición y salud. Proporciona consejos útiles y personalizados.';
          
          if (userProfile.name || userProfile.age || userProfile.weight || userProfile.height) {
            systemPrompt += '\n\nInformación del usuario:';
            if (userProfile.name) systemPrompt += `\n• Nombre: ${userProfile.name}`;
            if (userProfile.age) systemPrompt += `\n• Edad: ${userProfile.age} años`;
            if (userProfile.weight) systemPrompt += `\n• Peso: ${userProfile.weight} kg`;
            if (userProfile.height) systemPrompt += `\n• Altura: ${userProfile.height} m`;
            
            if (userProfile.weight && userProfile.height) {
              const bmi = (userProfile.weight / (userProfile.height * userProfile.height)).toFixed(1);
              systemPrompt += `\n• IMC: ${bmi}`;
            }
          }
          
          const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 600,
            temperature: 0.7
          });
          
          result = {
            content: [{
              type: 'text',
              text: chatResponse.choices[0]?.message?.content || 'Error generando respuesta'
            }]
          };
          break;
          
        case 'nutrition-advice':
          if (!openai) {
            throw new Error('OpenAI no configurado');
          }
          
          const question = args?.question || '';
          const userProfile2 = args?.userProfile || {};
          
          let advicePrompt = 'Eres nutrIA. Proporciona consejos específicos de nutrición con recomendaciones prácticas.';
          
          if (userProfile2.name || userProfile2.age || userProfile2.weight || userProfile2.height) {
            advicePrompt += '\n\nPerfil del usuario:';
            if (userProfile2.name) advicePrompt += `\n• Nombre: ${userProfile2.name}`;
            if (userProfile2.age) advicePrompt += `\n• Edad: ${userProfile2.age} años`;
            if (userProfile2.weight) advicePrompt += `\n• Peso: ${userProfile2.weight} kg`;
            if (userProfile2.height) advicePrompt += `\n• Altura: ${userProfile2.height} m`;
            
            if (userProfile2.weight && userProfile2.height) {
              const bmi = (userProfile2.weight / (userProfile2.height * userProfile2.height)).toFixed(1);
              advicePrompt += `\n• IMC: ${bmi}`;
            }
          }
          
          const adviceResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: advicePrompt },
              { role: 'user', content: question }
            ],
            max_tokens: 700,
            temperature: 0.7
          });
          
          result = {
            content: [{
              type: 'text',
              text: adviceResponse.choices[0]?.message?.content || 'Error generando respuesta'
            }]
          };
          break;

        case 'send-email':
          const emailTo = args?.to || '';
          const emailSubject = args?.subject || '';
          const emailMessage = args?.message || '';
          const emailUserProfile = args?.userProfile || {};
          const emailNutritionist = args?.nutritionist || {};
          const conversationContext = args?.conversationContext || '';
          const isValidation = args?.isValidation || false;
          const fromEmail = args?.fromEmail || '';
          
          try {
            console.log('📢 Enviando notificación...');
            console.log('Para:', emailTo);
            console.log('Asunto:', emailSubject);
            console.log('Usuario:', emailUserProfile.name);
            console.log('Tipo:', isValidation ? 'Validación' : 'Consulta directa');
            
            // Enviar notificación usando el servicio
            const notificationResult = await notificationService.notify({
              to: emailTo,
              subject: emailSubject,
              message: emailMessage,
              userProfile: emailUserProfile,
              type: isValidation ? 'validation' : 'direct'
            });
            
            if (notificationResult.success) {
              const responseText = isValidation
                ? `✅ Notificación enviada exitosamente a ${emailNutritionist.name || emailTo}\n\n` +
                  `📧 Asunto: ${emailSubject}\n` +
                  `📝 Se ha enviado tu solicitud de validación junto con el contexto de la conversación.\n\n` +
                  `🔔 Te notificaremos cuando ${emailNutritionist.name || 'tu nutricionista'} responda.\n\n` +
                  `📬 ID: ${notificationResult.messageId}`
                : `✅ Notificación enviada exitosamente a ${emailNutritionist.name || emailTo}\n\n` +
                  `📧 Asunto: ${emailSubject}\n` +
                  `📝 Tu mensaje ha sido enviado y deberías recibir una respuesta pronto.\n\n` +
                  `🔔 Te notificaremos cuando ${emailNutritionist.name || 'tu nutricionista'} responda.\n\n` +
                  `📬 ID: ${notificationResult.messageId}`;
              
              result = {
                content: [{
                  type: 'text',
                  text: responseText
                }]
              };
            } else {
              result = {
                content: [{
                  type: 'text',
                  text: `⚠️ No se pudo enviar la notificación.\n\n` +
                       `📝 Tu mensaje fue: "${emailMessage}"\n` +
                       `📧 Destinatario: ${emailTo}\n\n` +
                       `💡 Verifica la configuración del sistema de notificaciones.`
                }]
              };
            }
            
          } catch (error) {
            console.error('❌ Error enviando notificación:', error.message);
            
            result = {
              content: [{
                type: 'text',
                text: `❌ Error enviando notificación: ${error.message}\n\n` +
                     `📝 Tu mensaje era: "${emailMessage}"\n` +
                     `📧 Destinatario: ${emailTo}\n\n` +
                     `💡 Verifica la configuración del servicio de notificaciones.`
              }]
            };
          }
          break;
          
        default:
          throw new Error(`Herramienta no encontrada: ${name}`);
      }
      
      return {
        jsonrpc: '2.0',
        id: parsed.id,
        result
      };
    }
    
    // Inicialización
    if (parsed.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: parsed.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nutria-mcp-server', version: '1.0.0' }
        }
      };
    }
    
    // Método no encontrado
    return {
      jsonrpc: '2.0',
      id: parsed.id,
      error: { code: -32601, message: 'Método no encontrado' }
    };
    
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: parsed?.id || null,
      error: { code: -32603, message: error.message }
    };
  }
};

// Servidor principal
let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk.toString();
  
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Mantener línea incompleta
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = await processRequest(line);
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('Error procesando:', error);
      }
    }
  }
});

console.error('🦦 nutrIA MCP Server (Simple) iniciado correctamente');
console.error(`✅ OpenAI: ${openai ? 'Configurado' : 'No configurado'}`); 