import React, { useState, useEffect, useRef } from 'react';
import { mcpClient, MCPTool, MCPMessage } from '../services/mcpClient';

interface ChatInterfaceProps {
  className?: string;
}

// Preguntas sugeridas para nutrIA
const SUGGESTED_QUESTIONS = [
  {
    question: "Quiero comer menos carne ¿Cómo puedo implementar una dieta vegana?",
    icon: "🌱",
    color: "from-emerald-400 to-teal-500",
    command: "chat message:Quiero comer menos carne y transicionar a una dieta vegana. ¿Cómo puedo hacerlo de manera saludable? Necesito una guía paso a paso con alimentos específicos y cómo asegurarme de obtener todos los nutrientes necesarios."
  },
  {
    question: "Me dieron mal los triglicéridos ¿Qué debería comer o dejar de comer?",
    icon: "🫀",
    color: "from-red-400 to-pink-500",
    command: "chat message:Mis exámenes de sangre mostraron triglicéridos altos. ¿Qué alimentos específicos debo evitar y cuáles debo incluir en mi dieta? Necesito un plan nutricional para reducir mis triglicéridos de manera natural."
  },
  {
    question: "Quiero aumentar mi masa muscular ¿Cómo puedo hacer?",
    icon: "💪",
    color: "from-blue-400 to-indigo-500",
    command: "chat message:Quiero aumentar mi masa muscular. ¿Cuáles son las mejores estrategias nutricionales? Necesito información sobre proteínas, timing de comidas, suplementos y cómo combinar la alimentación con el entrenamiento."
  },
  {
    question: "Enviar mensaje a mi nutricionista",
    icon: "📧",
    color: "from-purple-400 to-violet-500",
    command: "enviar mensaje Necesito agendar una cita para revisión nutricional y consulta sobre mi plan alimentario actual"
  },
  {
    question: "¿Podrías enviarle mi plan a mi nutridoc?",
    icon: "📋",
    color: "from-indigo-400 to-purple-500",
    command: "podrias enviarle mi plan nutricional a mi nutridoc para que lo revise"
  },
  {
    question: "Contarle a mi doctor sobre mi progreso",
    icon: "📱",
    color: "from-green-400 to-emerald-500",
    command: "contarle a mi doctor sobre mi progreso con la dieta y los cambios que he notado"
  },

];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mcpStatus, setMcpStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados para el modal de imagen
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estados para el perfil del usuario
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Usuario',
    age: 25,
    weight: 70,
    height: 1.70,
    objetivo: ''
  });
  const [tempProfile, setTempProfile] = useState(userProfile);

  // Estados para el nutricionista
  const [isEditingNutritionist, setIsEditingNutritionist] = useState(false);
  const [nutritionist, setNutritionist] = useState({
    name: 'Dr. Nutricionista',
    email: 'nutricionista@ejemplo.com'
  });
  const [tempNutritionist, setTempNutritionist] = useState(nutritionist);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await mcpClient.connect();
        setIsConnected(true);
        
        // Obtener herramientas disponibles
        const tools = await mcpClient.listTools();
        setAvailableTools(tools);
        
        logToServer(`Conexión MCP establecida. Herramientas disponibles: ${tools.length}`, 'info');
        
        // Agregar mensaje de bienvenida inicial
        const welcomeMessage: MCPMessage = {
          id: Date.now().toString(),
          type: 'tool',
          content: `¡Hola, ${userProfile.name}! 🦦\n\nSoy nutrIA, tu asistente especializado en nutrición y salud. Estoy aquí para ayudarte con:\n\n• Planes de alimentación personalizados\n• Consejos nutricionales específicos\n• Análisis de dietas y hábitos\n• Recomendaciones para objetivos de salud\n\n¿En qué puedo ayudarte hoy? Puedes escribirme directamente o usar una de las preguntas sugeridas.`,
          timestamp: new Date(),
          toolName: 'chat'
        };
        setMessages([welcomeMessage]);
        
      } catch (error) {
        console.error('Error al conectar:', error);
        logToServer(`Error de conexión MCP: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      }
    };

    initializeConnection();

    // Configurar listeners
    mcpClient.on('connected', () => {
      setIsConnected(true);
      logToServer('WebSocket conectado al servidor', 'info');
    });

    mcpClient.on('disconnected', () => {
      setIsConnected(false);
      logToServer('WebSocket desconectado del servidor', 'warn');
    });

    mcpClient.on('mcp-status', (status) => {
      setMcpStatus(status.connected);
      logToServer(`Estado MCP: ${status.connected ? 'Conectado' : 'Desconectado'}`, 'info');
    });

    mcpClient.on('error', (error) => {
      console.error('Error:', error);
      logToServer(`Error del cliente MCP: ${error.message || 'Error desconocido'}`, 'error');
    });

    return () => {
      mcpClient.disconnect();
    };
  }, []);

  const addSystemMessage = (content: string) => {
    // Filtrar mensajes del sistema - solo mostrar los realmente importantes
    const importantMessages = [
      'Herramientas disponibles',
      'Selecciona una herramienta',
      'Bienvenido',
      'Conectado exitosamente'
    ];
    
    const shouldShow = importantMessages.some(keyword => content.includes(keyword));
    
    if (shouldShow) {
      const message: MCPMessage = {
        id: Date.now().toString(),
        type: 'system',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    } else {
      // Enviar a logs del servidor en lugar de mostrar
      logToServer(`Sistema: ${content}`, 'info');
    }
  };

  // Función para enviar logs al servidor sin mostrar en la interfaz
  const logToServer = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    console.log(`[${level.toUpperCase()}] ${message}`);
    // Enviar al servidor para logging
    if (mcpClient.connected) {
      mcpClient.emit('client-log', { message, level, timestamp: new Date() });
    }
  };

  // Función para limpiar mensajes del sistema no importantes
  const cleanupSystemMessages = () => {
    setMessages(prev => prev.filter(msg => {
      if (msg.type !== 'system') return true;
      
      // Mantener solo mensajes importantes
      const importantMessages = [
        'Bienvenido',
        'herramientas disponibles',
        'Conectado exitosamente'
      ];
      
      return importantMessages.some(keyword => 
        msg.content.toLowerCase().includes(keyword.toLowerCase())
      );
    }));
  };

  // Función para limpiar todo el chat
  const clearChat = () => {
    // Crear nuevo mensaje de bienvenida
    const welcomeMessage: MCPMessage = {
      id: Date.now().toString(),
      type: 'tool',
      content: `¡Hola, ${userProfile.name}! 🦦\n\nSoy nutrIA, tu asistente especializado en nutrición y salud. Estoy aquí para ayudarte con:\n\n• Planes de alimentación personalizados\n• Consejos nutricionales específicos\n• Análisis de dietas y hábitos\n• Recomendaciones para objetivos de salud\n\nPuedes preguntarme o seleccionar una pregunta sugerida.`,
      timestamp: new Date(),
      toolName: 'chat'
    };
    setMessages([welcomeMessage]);
    setShowSuggestions(true); // Mostrar sugerencias de nuevo
  };

  // Funciones para manejar el perfil del usuario
  const calculateBMI = (weight: number, height: number): number => {
    return Math.round((weight / (height * height)) * 10) / 10;
  };

  const handleProfileEdit = () => {
    setTempProfile(userProfile); // Crear copia temporal
    setIsEditingProfile(true);
  };

  const handleProfileSave = () => {
    setUserProfile(tempProfile); // Guardar cambios
    setIsEditingProfile(false);
    // Mostrar mensaje de confirmación amigable
    const bmi = calculateBMI(tempProfile.weight, tempProfile.height);
    let bmiStatus = '';
    if (bmi < 18.5) bmiStatus = 'Bajo peso';
    else if (bmi < 25) bmiStatus = 'Peso normal';
    else if (bmi < 30) bmiStatus = 'Sobrepeso';
    else bmiStatus = 'Obesidad';
    
    addSystemMessage(`✅ Perfil actualizado correctamente. Tu IMC es ${bmi} (${bmiStatus})`);
  };

  const handleProfileCancel = () => {
    setTempProfile(userProfile); // Revertir cambios
    setIsEditingProfile(false);
  };

  const handleProfileChange = (field: keyof typeof userProfile, value: string | number) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para manejar el nutricionista
  const handleNutritionistEdit = () => {
    setTempNutritionist(nutritionist);
    setIsEditingNutritionist(true);
  };

  const handleNutritionistSave = () => {
    setNutritionist(tempNutritionist);
    setIsEditingNutritionist(false);
    addSystemMessage(`✅ Información del nutricionista actualizada: ${tempNutritionist.name}`);
  };

  const handleNutritionistCancel = () => {
    setTempNutritionist(nutritionist);
    setIsEditingNutritionist(false);
  };

  const handleNutritionistChange = (field: keyof typeof nutritionist, value: string) => {
    setTempNutritionist(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para manejar imágenes
  const handleImageUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const sendImageMessage = async () => {
    if (!selectedImage || !imagePreview) return;
    
    // Agregar mensaje de imagen del usuario
    const imageMessage: MCPMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `[Imagen enviada: ${selectedImage.name}]`,
      timestamp: new Date(),
      imageData: imagePreview
    };
    
    setMessages(prev => [...prev, imageMessage]);
    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);
    
    try {
      // Usar la herramienta de análisis nutricional de imágenes
      const result = await mcpClient.callTool('image-nutrition-analysis', {
        imageData: imagePreview,
        imageName: selectedImage.name,
        userProfile: userProfile
      });
      
      addToolMessage('image-nutrition-analysis', result);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      logToServer(`Error al analizar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      addSystemMessage('❌ Error procesando la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview(null);
    setIsDragging(false);
  };

  // Función para manejar preguntas sugeridas
  const handleSuggestedQuestion = async (question: string, command: string) => {
    setShowSuggestions(false); // Ocultar sugerencias
    addUserMessage(question);
    setIsLoading(true);

    try {
      // Extraer la pregunta detallada del comando
      let detailedQuestion = question;
      if (command.includes('message:')) {
        const commandParts = command.split('message:');
        if (commandParts.length > 1) {
          detailedQuestion = commandParts[1].trim();
        }
      }

      // Determinar si es una pregunta de consejo nutricional específico
      const lowerQuestion = detailedQuestion.toLowerCase();
      const nutritionKeywords = ['consejo', 'recomendación', 'plan', 'dieta específica', 'qué comer', 'qué evitar', 'masa muscular', 'triglicéridos', 'vegana'];
      const isNutritionAdvice = nutritionKeywords.some(keyword => lowerQuestion.includes(keyword));

      let toolName = 'chat';
      let args: any = {
        message: detailedQuestion,
        userProfile: userProfile
      };

      if (isNutritionAdvice) {
        const nutritionTool = availableTools.find(tool => tool.name === 'nutrition-advice');
        if (nutritionTool) {
          toolName = 'nutrition-advice';
          args = {
            question: detailedQuestion,
            userProfile: userProfile
          };
        }
      }

      const result = await mcpClient.callTool(toolName, args);
      addToolMessage(toolName, result);
    } catch (error) {
      console.error('Error al ejecutar pregunta sugerida:', error);
      logToServer(`Error al ejecutar comando sugerido: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      addSystemMessage('❌ No se pudo ejecutar el comando. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para parsear comandos simples
  const parseCommand = (command: string): { toolName: string; args: any } => {
    const parts = command.trim().split(' ');
    const toolName = parts[0];
    const args: any = {};

    // Parsear argumentos en formato key:value
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes(':')) {
        const [key, ...valueParts] = part.split(':');
        const value = valueParts.join(':');
        
        // Intentar convertir números
        if (!isNaN(Number(value))) {
          args[key] = Number(value);
        } else {
          args[key] = value;
        }
      }
    }

    // Para herramientas de OpenAI, agregar el perfil del usuario
    if (toolName === 'chat' || toolName === 'nutrition-advice') {
      args.userProfile = userProfile;
    }

    return { toolName, args };
  };

  const addUserMessage = (content: string) => {
    // Detectar y actualizar objetivo antes de agregar el mensaje
    detectAndUpdateObjective(content);
    
    const message: MCPMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addToolMessage = (toolName: string, result: any) => {
    // Extraer solo el texto de la respuesta
    let content = '';
    try {
      // Verificar la estructura estándar MCP
      if (result && result.content && Array.isArray(result.content)) {
        // Buscar contenido de tipo texto
        const textContent = result.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text) {
          content = textContent.text;
        } else {
          // Si no hay texto, usar el primer elemento del array
          content = result.content[0]?.text || JSON.stringify(result, null, 2);
        }
      } else if (result && typeof result === 'string') {
        // Si es string directo
        content = result;
      } else if (result && result.text) {
        // Si tiene propiedad text directa
        content = result.text;
      } else if (result && result.message) {
        // Si tiene propiedad message
        content = result.message;
      } else {
        content = JSON.stringify(result, null, 2);
      }
    } catch (error) {
      content = 'Error procesando respuesta';
    }

    const message: MCPMessage = {
      id: Date.now().toString(),
      type: 'tool',
      content: content,
      timestamp: new Date(),
      toolName
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected || isLoading) return;

    const userInput = inputValue.trim();
    setShowSuggestions(false); // Ocultar sugerencias al enviar mensaje
    addUserMessage(userInput);
    setInputValue('');
    setIsLoading(true);

    try {
      if (selectedTool) {
        // Llamar a la herramienta seleccionada
        const args = parseUserInput(userInput, selectedTool);
        const result = await mcpClient.callTool(selectedTool.name, args);
        addToolMessage(selectedTool.name, result);
      } else {
        // Intentar determinar qué herramienta usar basándose en el input
        const toolToUse = await determineToolFromInput(userInput);
        if (toolToUse) {
          const args = parseUserInput(userInput, toolToUse);
          const result = await mcpClient.callTool(toolToUse.name, args);
          addToolMessage(toolToUse.name, result);
        } else {
          logToServer('Usuario envió comando no reconocido: ' + userInput, 'info');
          // No mostrar ningún mensaje al usuario, simplemente ignorar
        }
      }
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      logToServer(`Error al procesar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      // Mostrar un mensaje genérico amigable al usuario
      addSystemMessage('❌ No se pudo procesar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseUserInput = (input: string, tool: MCPTool): any => {
    const args: any = {};
    
    // Parseo básico basado en el schema de la herramienta
    if (tool.inputSchema && tool.inputSchema.properties) {
      const properties = tool.inputSchema.properties;
      
      switch (tool.name) {
        case 'send-email':
          // Detectar si es una solicitud de validación
          const validationKeywords = [
            'validar', 'validalo', 'validarlo', 'validá', 'validá esto', 'validar con', 'validar esto con',
            'consultar con', 'consultar esto con', 'preguntar a', 'preguntarle a', 'preguntale a',
            'revisar con', 'revisar esto con', 'verificar con', 'verificar esto con',
            'confirmar con', 'confirmar esto con',
            'podes validar', 'podés validar', 'puedes validar', 'podes consultar', 'podés consultar', 'puedes consultar',
            'podes preguntar', 'podés preguntar', 'puedes preguntar', 'podes revisar', 'podés revisar', 'puedes revisar',
            'mi nutricionista', 'al nutricionista', 'la nutricionista', 'el nutricionista',
            'segunda opinión', 'segunda opinion', 'opinión profesional', 'opinion profesional'
          ];
          
          const emailKeywords = [
            // Envío directo
            'enviar mail', 'enviar email', 'enviar correo', 'mandar mail', 'mandar email', 
            'contactar nutricionista', 'escribir al nutricionista', 'enviar mensaje', 'enviar un mensaje', 
            'mandar mensaje', 'mandar un mensaje', 'comunicar con nutricionista', 'mensaje al nutricionista', 
            'mensaje a mi nutricionista',
            
            // Variaciones más naturales
            'enviarle', 'mandarle', 'pasarle', 'compartir con', 'contarle a',
            'nutridoc', 'mi nutri', 'mi doctor', 'mi doctora', 'mi especialista', 'doctora', 'doctor',
            'al nutri', 'al doctor', 'a la doctora', 'al especialista', 'a mi doctor', 'a mi doctora',
            'podrias enviar', 'podrías enviar', 'puedes enviar', 'podes enviar', 'podés enviar',
            'podrias mandar', 'podrías mandar', 'puedes mandar', 'podes mandar', 'podés mandar',
            'quiero enviar', 'necesito enviar', 'quiero mandar', 'necesito mandar',
            'mi plan a', 'esto a mi', 'la información a', 'los datos a', 'mis datos a',
            
            // Comunicación general
            'comunicar con', 'comunicarle', 'comunicarme con', 'hablar con', 'hablarle a',
            'decirle a', 'contarle a', 'informarle a', 'avisarle a', 'notificarle a',
            'transmitir a', 'reportar a', 'compartir con', 'enviarselo a', 'mandarselo a',
            
            // Intenciones de contacto
            'contactar', 'contactar con', 'contactarme con', 'llamar a', 'escribir a',
            'consultar con', 'preguntarle a', 'comunicarme con mi', 'hablar con mi',
            
            // Frases completas comunes
            'quiero que sepa', 'necesito que sepa', 'debería saber', 'tiene que saber',
            'informar que', 'avisar que', 'notificar que', 'reportar que',
            

            
            // Más variaciones de envío directo
            'enviar a', 'mandar a', 'enviarle a', 'mandarle a', 'escribirle a', 'comunicarle a',
            'avisarle a', 'informarle a', 'decirle a', 'contarle a', 'reportarle a', 'notificarle a'
          ];
          
          const isValidationRequest = validationKeywords.some(keyword => input.toLowerCase().includes(keyword));
          let message = input;
          
          if (isValidationRequest) {
            // Para solicitudes de validación, incluir contexto de la conversación
            const conversationContext = messages
              .filter(msg => msg.type === 'tool' && msg.toolName === 'chat')
              .slice(-3) // Últimos 3 mensajes de IA
              .map(msg => msg.content)
              .join('\n\n');
            
            const userRequest = input;
            message = `Solicitud de validación del paciente: "${userRequest}"
            
${conversationContext ? `Contexto de la conversación reciente:
${conversationContext}` : ''}

Por favor revisa esta información y proporciona tu opinión profesional.`;
            
            args.conversationContext = conversationContext;
            args.isValidation = true;
            args.subject = `Validación profesional solicitada - ${userProfile.name || 'Paciente'} - nutrIA`;
          } else {
            // Para envío regular de email, extraer el contenido después de las palabras clave
            for (const keyword of emailKeywords) {
              if (input.toLowerCase().includes(keyword)) {
                const keywordIndex = input.toLowerCase().indexOf(keyword);
                const afterKeyword = input.substring(keywordIndex + keyword.length).trim();
                if (afterKeyword) {
                  message = afterKeyword;
                  break;
                }
              }
            }
            
            // Si no hay mensaje específico, proporcionar mensaje predeterminado
            if (message === input && emailKeywords.some(k => input.toLowerCase().includes(k))) {
              message = `Hola! Soy ${userProfile.name}. Me gustaría hacer una consulta nutricional. ¿Podrías ayudarme cuando tengas tiempo disponible? ¡Gracias!`;
            }
            
            args.subject = `Consulta de ${userProfile.name || 'Paciente'} - nutrIA`;
            args.isValidation = false;
          }
          
          args.to = nutritionist.email;
          args.message = message;
          args.userProfile = userProfile;
          args.nutritionist = nutritionist;
          args.fromEmail = nutritionist.email; // Email del nutricionista para configuración automática
          break;
        case 'chat':
          args.message = input;
          args.userProfile = userProfile;
          break;
        case 'nutrition-advice':
          args.question = input;
          args.userProfile = userProfile;
          break;
        case 'setup-required':
          args.message = input;
          break;
        default:
          // Para herramientas personalizadas, intentar parsear JSON si es posible
          try {
            const jsonMatch = input.match(/\{.*\}/);
            if (jsonMatch) {
              Object.assign(args, JSON.parse(jsonMatch[0]));
            } else {
              // Usar el input como primer parámetro si no es JSON
              const firstProperty = Object.keys(properties)[0];
              if (firstProperty) {
                args[firstProperty] = input;
              }
            }
          } catch {
            // Si falla el parseo, usar el input completo
            const firstProperty = Object.keys(properties)[0];
            if (firstProperty) {
              args[firstProperty] = input;
            }
          }
          break;
      }
    }
    
    return args;
  };

  const determineToolFromInput = async (input: string): Promise<MCPTool | null> => {
    const lowerInput = input.toLowerCase();
    
    // Detectar solicitudes de envío de mensaje por email (más amplio)
    const messageKeywords = [
      // Envío directo
      'enviar mail', 'enviar email', 'enviar correo', 'mandar mail', 'mandar email', 
      'contactar nutricionista', 'escribir al nutricionista', 'enviar mensaje', 'enviar un mensaje', 
      'mandar mensaje', 'mandar un mensaje', 'comunicar con nutricionista', 'mensaje al nutricionista', 
      'mensaje a mi nutricionista',
      
      // Variaciones más naturales
      'enviarle', 'mandarle', 'pasarle', 'compartir con', 'contarle a',
      'nutridoc', 'mi nutri', 'mi doctor', 'mi doctora', 'mi especialista', 'doctora', 'doctor',
      'al nutri', 'al doctor', 'a la doctora', 'al especialista', 'a mi doctor', 'a mi doctora',
      'podrias enviar', 'podrías enviar', 'puedes enviar', 'podes enviar', 'podés enviar',
      'podrias mandar', 'podrías mandar', 'puedes mandar', 'podes mandar', 'podés mandar',
      'quiero enviar', 'necesito enviar', 'quiero mandar', 'necesito mandar',
      'mi plan a', 'esto a mi', 'la información a', 'los datos a', 'mis datos a',
      
      // Comunicación general
      'comunicar con', 'comunicarle', 'comunicarme con', 'hablar con', 'hablarle a',
      'decirle a', 'contarle a', 'informarle a', 'avisarle a', 'notificarle a',
      'transmitir a', 'reportar a', 'compartir con', 'enviarselo a', 'mandarselo a',
      
      // Intenciones de contacto
      'contactar', 'contactar con', 'contactarme con', 'llamar a', 'escribir a',
      'consultar con', 'preguntarle a', 'comunicarme con mi', 'hablar con mi',
      
      // Frases completas comunes
      'quiero que sepa', 'necesito que sepa', 'debería saber', 'tiene que saber',
      'informar que', 'avisar que', 'notificar que', 'reportar que',
      

      
      // Más variaciones de envío directo
      'enviar a', 'mandar a', 'enviarle a', 'mandarle a', 'escribirle a', 'comunicarle a',
      'avisarle a', 'informarle a', 'decirle a', 'contarle a', 'reportarle a', 'notificarle a'
    ];
    
    // Detectar solicitudes de validación con nutricionista (más amplio)
    const validationKeywords = [
      'validar', 'validalo', 'validarlo', 'validá', 'validá esto', 'validar con', 'validar esto con',
      'consultar con', 'consultar esto con', 'preguntar a', 'preguntarle a', 'preguntale a',
      'revisar con', 'revisar esto con', 'verificar con', 'verificar esto con',
      'confirmar con', 'confirmar esto con', 'chequear con', 'chequear esto con',
      'podes validar', 'podés validar', 'puedes validar', 'podes consultar', 'podés consultar', 'puedes consultar',
      'podes preguntar', 'podés preguntar', 'puedes preguntar', 'podes revisar', 'podés revisar', 'puedes revisar',
      'mi nutricionista', 'al nutricionista', 'la nutricionista', 'el nutricionista',
      'segunda opinión', 'segunda opinion', 'opinión profesional', 'opinion profesional',
      'está bien esto', 'esta bien esto', 'está correcto', 'esta correcto', 'es correcto',
      'qué opina', 'que opina', 'qué dice', 'que dice', 'qué piensa', 'que piensa',
      'supervisor', 'supervisar', 'supervisión', 'bajo supervisión'
    ];
    
    const isMessageRequest = messageKeywords.some(keyword => lowerInput.includes(keyword));
    const isValidationRequest = validationKeywords.some(keyword => lowerInput.includes(keyword));
    
    // Debug logging para detectar problemas
    console.log('🔍 DETECCIÓN DEBUG:', {
      input: lowerInput,
      isMessageRequest,
      isValidationRequest,
      matchedKeywords: messageKeywords.filter(keyword => lowerInput.includes(keyword))
    });
    
    if (isMessageRequest || isValidationRequest) {
      // Crear herramienta virtual para envío de mensaje
      const messageTool: MCPTool = {
        name: 'send-email',
        description: 'Enviar mensaje por email al nutricionista',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Email del destinatario' },
            subject: { type: 'string', description: 'Asunto del email' },
            message: { type: 'string', description: 'Contenido del email' },
            userProfile: { type: 'object', description: 'Perfil del usuario' },
            nutritionist: { type: 'object', description: 'Información del nutricionista' },
            conversationContext: { type: 'string', description: 'Contexto de la conversación' },
            isValidation: { type: 'boolean', description: 'Si es una solicitud de validación' },
            fromEmail: { type: 'string', description: 'Email del nutricionista para configuración automática' }
          },
          required: ['to', 'subject', 'message']
        }
      };
      return messageTool;
    }
    
    // Buscar palabras clave que indiquen necesidad de consejo nutricional específico
    const nutritionKeywords = ['consejo', 'recomendación', 'plan', 'dieta específica', 'qué comer', 'qué evitar', 'masa muscular', 'triglicéridos', 'vegana', 'proteína'];
    const isNutritionAdvice = nutritionKeywords.some(keyword => lowerInput.includes(keyword));
    
    if (isNutritionAdvice) {
      const nutritionTool = availableTools.find(tool => tool.name === 'nutrition-advice');
      if (nutritionTool) return nutritionTool;
    }
    
    // Para todo lo demás, usar chat general
    const chatTool = availableTools.find(tool => tool.name === 'chat');
    if (chatTool) return chatTool;
    
    // Si no hay herramientas de OpenAI, usar la herramienta de setup
    const setupTool = availableTools.find(tool => tool.name === 'setup-required');
    if (setupTool) return setupTool;
    
    return null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return '';
      case 'tool': return ''; // Sin icono para herramientas
      case 'system': return '🔧';
      default: return '💬';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg';
      case 'tool': return 'bg-gradient-to-r from-cyan-50 to-teal-50 text-gray-800 border border-cyan-200/50 shadow-md';
      case 'system': return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200/50 shadow-sm';
      default: return 'bg-white text-gray-800 shadow-md';
    }
  };

  // Función para detectar y actualizar objetivos del usuario
  const detectAndUpdateObjective = (message: string) => {
    const objetivos = {
      'perder peso': 'adelgazar',
      'bajar de peso': 'adelgazar', 
      'adelgazar': 'adelgazar',
      'definir': 'definir',
      'tonificar': 'definir',
      'ganar masa muscular': 'masa',
      'aumentar masa': 'masa',
      'muscle': 'masa',
      'masa muscular': 'masa',
      'volumen': 'volumen',
      'ganar peso': 'volumen',
      'aumentar peso': 'volumen',
      'mantener': 'mantener',
      'mantenimiento': 'mantener',
      'salud': 'salud',
      'saludable': 'salud',
      'triglicéridos': 'salud',
      'colesterol': 'salud',
      'diabetes': 'salud',
      'vegana': 'vegana',
      'vegetariano': 'vegetariano',
      'rendimiento': 'rendimiento',
      'deporte': 'rendimiento',
      'atlético': 'rendimiento'
    };

    const lowerMessage = message.toLowerCase();
    for (const [keyword, objetivo] of Object.entries(objetivos)) {
      if (lowerMessage.includes(keyword)) {
        if (userProfile.objetivo !== objetivo) {
          setUserProfile(prev => ({
            ...prev,
            objetivo: objetivo
          }));
          logToServer(`Objetivo detectado y actualizado: ${objetivo}`, 'info');
        }
        break;
      }
    }
  };

  // Función para convertir objetivos en oraciones descriptivas
  const getObjetivoDescriptivo = (objetivo: string): string => {
    const descripcioneObjetivos: Record<string, string> = {
      'adelgazar': 'Perder peso de forma saludable',
      'masa': 'Ganar masa muscular',
      'definir': 'Definir y tonificar el cuerpo',
      'volumen': 'Aumentar peso y volumen',
      'mantener': 'Mantener peso actual',
      'salud': 'Mejorar la salud general',
      'vegana': 'Alimentación vegana balanceada',
      'vegetariano': 'Alimentación vegetariana equilibrada',
      'rendimiento': 'Optimizar rendimiento deportivo'
    };
    
    return descripcioneObjetivos[objetivo] || objetivo;
  };

  return (
    <>
    <div className={`flex h-screen bg-gradient-to-br from-slate-50 to-gray-100 ${className}`}>
      {/* Sidebar con herramientas */}
      <div className="w-80 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20 flex flex-col">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center overflow-hidden p-1">
              <img 
                src="/nutria-icon.png" 
                alt="nutrIA mascot" 
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = img.parentElement?.querySelector('span') as HTMLElement;
                  img.style.display = 'none';
                  if (fallback) {
                    fallback.style.display = 'block';
                    fallback.parentElement!.classList.remove('p-1');
                  }
                }}
              />
              <span className="text-white font-bold text-lg hidden">🦦</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                nutrIA
              </h2>
              <p className="text-sm text-gray-500">Assistant Tools</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} shadow-sm`}></div>
              <span className={isConnected ? 'text-emerald-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Perfil del Usuario */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 shadow-md">
              <div className="mb-4">
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full text-base font-semibold text-gray-800 bg-white/80 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Nombre"
                  />
                ) : (
                  <h4 className="font-semibold text-gray-800">{userProfile.name}</h4>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">🎂</span>
                    <span className="text-sm font-medium text-gray-700">Edad</span>
                  </div>
                  {isEditingProfile ? (
                    <input
                      type="number"
                      value={tempProfile.age}
                      onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 0)}
                      className="w-20 text-sm text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      min="1"
                      max="120"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{userProfile.age} años</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">⚖️</span>
                    <span className="text-sm font-medium text-gray-700">Peso</span>
                  </div>
                  {isEditingProfile ? (
                    <input
                      type="number"
                      value={tempProfile.weight}
                      onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value) || 0)}
                      className="w-20 text-sm text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      min="1"
                      max="300"
                      step="0.1"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{userProfile.weight} kg</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">📏</span>
                    <span className="text-sm font-medium text-gray-700">Altura</span>
                  </div>
                  {isEditingProfile ? (
                    <input
                      type="number"
                      value={tempProfile.height}
                      onChange={(e) => handleProfileChange('height', parseFloat(e.target.value) || 0)}
                      className="w-20 text-sm text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      min="0.5"
                      max="3"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{userProfile.height} m</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">🎯</span>
                    <span className="text-sm font-medium text-gray-700">IMC</span>
                  </div>
                  <span className="text-sm text-emerald-600 font-medium">
                    {isEditingProfile ? 
                      calculateBMI(tempProfile.weight, tempProfile.height) : 
                      calculateBMI(userProfile.weight, userProfile.height)
                    }
                  </span>
                </div>
                
                {/* Mostrar objetivo si está definido */}
                {userProfile.objetivo && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">🚀</span>
                      <span className="text-sm font-medium text-gray-700">Objetivo</span>
                    </div>
                    <span className="text-sm text-blue-600 font-medium capitalize">
                      {getObjetivoDescriptivo(userProfile.objetivo)}
                    </span>
                  </div>
                )}
              </div>
              
              {isEditingProfile ? (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleProfileSave}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                  >
                    <span className="mr-2">💾</span>
                    Guardar
                  </button>
                  <button
                    onClick={handleProfileCancel}
                    className="flex-1 py-2 px-4 bg-white/80 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-white transition-all duration-200"
                  >
                    <span className="mr-2">❌</span>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleProfileEdit}
                  className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-sm font-medium rounded-xl border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200"
                >
                  <span className="mr-2">✏️</span>
                  Editar Perfil
                </button>
              )}
            </div>

            {/* Mi nutridoc */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 shadow-md">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">👨‍⚕️</span>
                Mi nutridoc
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">👤</span>
                    <span className="text-sm font-medium text-gray-700">Nombre</span>
                  </div>
                  {isEditingNutritionist ? (
                    <input
                      type="text"
                      value={tempNutritionist.name}
                      onChange={(e) => handleNutritionistChange('name', e.target.value)}
                      className="w-32 text-sm text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="Nombre del nutricionista"
                    />
                  ) : (
                    <span className="text-sm text-gray-600 truncate max-w-32">{nutritionist.name}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">✉️</span>
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </div>
                  {isEditingNutritionist ? (
                    <input
                      type="email"
                      value={tempNutritionist.email}
                      onChange={(e) => handleNutritionistChange('email', e.target.value)}
                      className="w-32 text-sm text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="email@ejemplo.com"
                    />
                  ) : (
                    <span className="text-sm text-gray-600 truncate max-w-32">{nutritionist.email}</span>
                  )}
                </div>
              </div>
              
              {isEditingNutritionist ? (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleNutritionistSave}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                  >
                    <span className="mr-2">💾</span>
                    Guardar
                  </button>
                  <button
                    onClick={handleNutritionistCancel}
                    className="flex-1 py-2 px-4 bg-white/80 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-white transition-all duration-200"
                  >
                    <span className="mr-2">❌</span>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNutritionistEdit}
                  className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                >
                  <span className="mr-2">✏️</span>
                  Editar Nutricionista
                </button>
              )}
            </div>

            {/* Herramientas Disponibles */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 shadow-md">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">⚡</span>
                Herramientas
              </h4>
              <div className="space-y-2">
                {availableTools.map((tool, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedTool?.name === tool.name
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                        : 'bg-white/40 border border-gray-200/30 hover:bg-white/60'
                    }`}
                    onClick={() => setSelectedTool(selectedTool?.name === tool.name ? null : tool)}
                  >
                    <div className="font-medium text-gray-800 text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{tool.description}</div>
                    {selectedTool?.name === tool.name && (
                      <div className="mt-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>
                        <span className="text-xs text-emerald-600 font-medium">Seleccionado</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1.5">
                 <img 
                   src="/nutria-icon.png" 
                   alt="nutrIA mascot" 
                   className="w-full h-full object-contain rounded-xl"
                   onError={(e) => {
                     const img = e.currentTarget;
                     const fallback = img.parentElement?.querySelector('span') as HTMLElement;
                     img.style.display = 'none';
                     if (fallback) {
                       fallback.style.display = 'block';
                       fallback.parentElement!.classList.remove('p-1.5');
                     }
                   }}
                 />
                 <span className="text-white font-bold text-xl hidden">🦦</span>
               </div>
              <div>
                                 <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                   nutrIA
                 </h1>
                <p className="text-sm text-gray-500">AI-Powered Nutrition Assistant</p>
              </div>
            </div>
            {selectedTool && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium">
                  <span className="mr-2">⚡</span>
                  {selectedTool.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preguntas sugeridas */}
          {(showSuggestions || messages.filter(m => m.type === 'user').length === 0) && (
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUGGESTED_QUESTIONS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(item.question, item.command)}
                    className={`group p-6 rounded-3xl bg-gradient-to-br ${item.color} text-white text-left hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0`}
                    disabled={!isConnected || isLoading}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-2xl">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold leading-relaxed group-hover:text-white/90 transition-colors">
                          {item.question}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes del chat */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl px-6 py-4 rounded-2xl ${getMessageColor(message.type)} backdrop-blur-sm`}>
                {message.type !== 'tool' && (
                  <div className="flex items-center space-x-2 mb-2">
                    {getMessageIcon(message.type) && (
                      <span className="text-lg">{getMessageIcon(message.type)}</span>
                    )}
                    <span className="text-xs font-semibold opacity-75 capitalize">
                      {message.type === 'user' ? userProfile.name : message.type}
                    </span>
                    <span className="text-xs opacity-50">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  {message.type === 'tool' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 rounded-2xl shadow-md border border-gray-200/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/70 backdrop-blur-xl border-t border-white/20 p-6 shadow-lg">
          <div className="flex space-x-4">
            <button
              onClick={clearChat}
              className="p-3 text-gray-500 hover:text-gray-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
              title="Clear Chat"
            >
              <span className="text-xl">🔄</span>
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedTool 
                    ? `Type input for ${selectedTool.name}...`
                    : "Ask nutrIA anything or select a tool..."
                }
                className="w-full py-4 px-6 bg-white/80 border border-gray-200/50 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 shadow-md backdrop-blur-sm"
                disabled={!isConnected || isLoading}
              />
            </div>
            <button
              onClick={() => setShowImageModal(true)}
              className="p-3 text-gray-500 hover:text-emerald-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
              title="Upload Image"
              disabled={!isConnected || isLoading}
            >
              <span className="text-xl">📷</span>
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !isConnected || isLoading}
              className="py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-[1.02] active:scale-95"
            >
              <span className="mr-2">{isLoading ? '⏳' : '✨'}</span>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Modal para subir imágenes */}
    {showImageModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">📷 Upload Image</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-6xl mb-4">📸</div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Drag & Drop your image here
                </h4>
                <p className="text-gray-600 mb-4">
                  Or click to select a file
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="imageUpload"
                />
                <label
                  htmlFor="imageUpload"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Choose Image
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview || ''}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-2xl shadow-lg"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                {selectedImage && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Image Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Name:</strong> {selectedImage?.name || 'Unknown'}</p>
                      <p><strong>Size:</strong> {((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Type:</strong> {selectedImage?.type || 'Unknown'}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button
                    onClick={sendImageMessage}
                    disabled={isLoading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '⏳ Sending...' : '✨ Send Image'}
                  </button>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all duration-200"
                  >
                    Choose Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}; 