#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar OpenAI (opcional)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Función principal
async function main() {
  try {

    const server = new Server(
      {
        name: 'mcp-custom-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Herramientas disponibles (solo OpenAI)
    const getAvailableTools = () => {
      const tools = [];

      // Solo agregar herramientas de OpenAI si está disponible
      if (openai) {
        tools.push(
          {
            name: 'chat',
            description: 'Conversar con IA especializada en nutrición y salud',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Mensaje para la IA de nutrición',
                },
                model: {
                  type: 'string',
                  description: 'Modelo a usar (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)',
                },
                userProfile: {
                  type: 'object',
                  description: 'Perfil del usuario (edad, peso, altura, objetivos)',
                },
              },
              required: ['message'],
            },
          },
          {
            name: 'nutrition-advice',
            description: 'Obtener consejos específicos y personalizados de nutrición',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'Pregunta sobre nutrición',
                },
                userProfile: {
                  type: 'object',
                  description: 'Perfil del usuario (edad, peso, altura, objetivos)',
                },
              },
              required: ['question'],
            },
          }
        );
      } else {
        // Si no hay OpenAI, mostrar mensaje informativo
        tools.push({
          name: 'setup-required',
          description: 'Configuración de OpenAI requerida para usar nutrIA',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensaje informativo',
              },
            },
            required: ['message'],
          },
        });
      }

      return tools;
    };

    // Listar herramientas
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: getAvailableTools(),
      };
    });

    // Ejecutar herramientas
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'setup-required':
            return {
              content: [
                {
                  type: 'text',
                  text: '🔧 Para usar nutrIA necesitas configurar OpenAI.\n\n' +
                       '📋 Pasos:\n' +
                       '1. Ejecuta: ./setup-openai-key.sh\n' +
                       '2. Sigue las instrucciones para obtener tu API key\n' +
                       '3. Reinicia la aplicación\n\n' +
                       '💡 Una vez configurado, tendrás acceso a:\n' +
                       '• Chat inteligente especializado en nutrición\n' +
                       '• Consejos personalizados basados en tu perfil\n' +
                       '• Respuestas precisas sobre alimentación y salud'
                },
              ],
            };

          case 'chat':
            if (!openai) {
              throw new McpError(ErrorCode.MethodNotFound, 'OpenAI no está configurado. Ejecuta ./setup-openai-key.sh');
            }
            
            const message = args?.message as string || '';
            const model = args?.model as string || 'gpt-4o-mini';
            const userProfile = args?.userProfile as any || {};
            
            // Crear prompt del sistema con información del usuario
            let systemPrompt = 'Eres nutrIA, una IA especializada en nutrición y salud. Proporciona consejos útiles, precisos y personalizados sobre alimentación, dietas y hábitos saludables. Siempre recomienda consultar a profesionales de la salud para casos específicos.';
            
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
              model: model,
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: message
                }
              ],
              max_tokens: 600,
              temperature: 0.7,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: chatResponse.choices[0]?.message?.content || 'No se pudo generar respuesta',
                },
              ],
            };

          case 'nutrition-advice':
            if (!openai) {
              throw new McpError(ErrorCode.MethodNotFound, 'OpenAI no está configurado. Ejecuta ./setup-openai-key.sh');
            }
            
            const question = args?.question as string || '';
            const userProfile2 = args?.userProfile as any || {};
            
            let adviceSystemPrompt = 'Eres nutrIA, una IA especializada en nutrición y salud. Proporciona consejos específicos y personalizados sobre alimentación y nutrición. Incluye recomendaciones prácticas y detalladas.';
            
            if (userProfile2.name || userProfile2.age || userProfile2.weight || userProfile2.height) {
              adviceSystemPrompt += '\n\nPerfil del usuario:';
              if (userProfile2.name) adviceSystemPrompt += `\n• Nombre: ${userProfile2.name}`;
              if (userProfile2.age) adviceSystemPrompt += `\n• Edad: ${userProfile2.age} años`;
              if (userProfile2.weight) adviceSystemPrompt += `\n• Peso: ${userProfile2.weight} kg`;
              if (userProfile2.height) adviceSystemPrompt += `\n• Altura: ${userProfile2.height} m`;
              
              if (userProfile2.weight && userProfile2.height) {
                const bmi = (userProfile2.weight / (userProfile2.height * userProfile2.height)).toFixed(1);
                adviceSystemPrompt += `\n• IMC: ${bmi}`;
              }
            }
            
            const adviceResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: adviceSystemPrompt
                },
                {
                  role: 'user',
                  content: question
                }
              ],
              max_tokens: 700,
              temperature: 0.7,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: adviceResponse.choices[0]?.message?.content || 'No se pudo generar respuesta',
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Herramienta no encontrada: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        throw new McpError(
          ErrorCode.InternalError,
          `Error al ejecutar la herramienta ${name}: ${errorMessage}`
        );
      }
    });

    // Iniciar servidor
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🦦 nutrIA MCP Server iniciado con éxito');
  } catch (error) {
    console.error('❌ Error al iniciar servidor MCP:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(console.error); 