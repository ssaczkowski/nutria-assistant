# 🦦 nutrIA - AI Nutrition Assistant

<img src="https://github.com/user-attachments/assets/c4577113-a382-4704-9aaf-b09d1b8703a5" width="250" height="250" />

Un asistente de nutrición inteligente con interfaz web moderna protagonizado por una adorable nutria fitness. Utiliza el protocolo MCP (Model Context Protocol) para interactuar con herramientas especializadas y ayudarte a alcanzar tus objetivos de salud.

## 🦦 Conoce a Nuestro Mascot

**Nutria Fitness** - Nuestra adorable nutria entrenadora que te acompañará en tu viaje hacia una vida más saludable. Con su bandana deportiva y pesas en mano, representa la perfecta combinación entre nutrición inteligente y actividad física.

## ✨ Características

- **Mascot encantador** con nuestra nutria fitness como guía personal
- **Diseño moderno** con gradientes, efectos glassmorphism y animaciones suaves
- **Interfaz intuitiva** construida con React + TypeScript + Tailwind CSS
- **Conexión en tiempo real** via WebSockets
- **Herramientas MCP integradas** (echo, add, current-time, random-number)
- **Logs inteligentes** en el servidor (interfaz limpia para el usuario)
- **Conexión automática** con manejo silencioso de errores

  <img width="1473" alt="Captura de pantalla 2025-07-06 a la(s) 3 28 25 a  m" src="https://github.com/user-attachments/assets/6d866f9e-c1b6-4c1b-9b9c-02ea8728e717" />


## 🎯 Herramientas Disponibles

### Herramientas de IA Nutricional
- **chat** - Conversa con IA especializada en nutrición y salud
- **nutrition-advice** - Obtén consejos específicos y personalizados de nutrición

### Herramientas Internas
- **send-email** - Envío automático de emails al nutricionista (se activa automáticamente cuando escribes "enviar mail")

> ⚠️ **Nota**: nutrIA requiere OpenAI para funcionar. Sin configuración OpenAI, solo verás instrucciones de setup.

## 🚀 Inicio Rápido

### 🌐 Deployment en Heroku (Recomendado)

¡Publica nutrIA en Internet en menos de 5 minutos!

```bash
# Deployment automático con un solo comando
./deploy-heroku.sh
```

📚 **Guía completa**: [`HEROKU-DEPLOYMENT.md`](HEROKU-DEPLOYMENT.md)

**Características del deployment:**
- ✅ **Gratis** con plan Eco de Heroku
- ✅ **HTTPS** automático
- ✅ **Configuración automática** de variables de entorno
- ✅ **URL personalizada** (ej: `https://tu-nutria-assistant.herokuapp.com`)
- ✅ **Escalable** según tus necesidades

### 💻 Desarrollo Local

#### Configurar el Icono del Mascot

1. Guarda la imagen de la nutria fitness como `frontend/public/nutria-icon.png`
2. **Formato recomendado**: PNG con **fondo transparente**, 128x128px o superior
3. **Importante**: El fondo transparente permite que se integre perfectamente con los gradientes
4. La imagen se mostrará automáticamente redondeada en el logo de la aplicación

#### Configurar OpenAI (Requerido)

```bash
# Configurar tu API key de OpenAI
./setup-openai-key.sh
```

### Configurar Notificaciones (Opcional - para envío real)

#### 🚀 Opción 1: Twilio Demo URL (¡MÁS RÁPIDA!)

```bash
# Configuración en 1 minuto - 100% GRATUITO
./setup-twilio-demo.sh
```

**Características:**
- ✅ **Configuración más rápida** (1 minuto)
- ✅ **100% GRATUITO** para desarrollo
- ✅ **Sin límites** de mensajes
- ✅ **Funciona inmediatamente**
- ✅ **Perfecto para pruebas** y desarrollo

#### 🔧 Opción 2: Configuración Completa

```bash
# Configurar servicio de notificaciones moderno
./setup-notifications.sh
```

**Opciones disponibles:**

- **📡 Webhook**: Zapier, Make, Discord, Slack, Teams
- **📧 EmailJS**: Servicio gratuito de emails (200/mes)
- **📁 Archivo Local**: Guarda notificaciones en JSON
- **🖥️ Consola**: Solo logs en terminal



> **¿Por qué cambiar?** Las contraseñas de aplicación están **deprecadas desde septiembre 2024**. Los nuevos métodos son más seguros, fáciles y confiables.

### Ejecutar nutrIA

```bash
# Ejecutar todos los servicios
./start.sh
```

Esto iniciará:
- **nutrIA Frontend** en `http://localhost:3000`
- **Backend API** en `http://localhost:3001`
- **Servidor MCP** en background

### Usar nutrIA

1. Abre `http://localhost:3000` en tu navegador
2. Haz clic en cualquier **pregunta sugerida** para comenzar
3. O selecciona una **herramienta específica** del panel izquierdo
4. Escribe tu consulta en el elegante campo de entrada
5. ¡Disfruta de la experiencia moderna!

## 🔧 Comandos de Ejemplo

```bash
# Pregunta general sobre nutrición
¿Cuáles son los mejores alimentos para desayunar?

# Solicitar consejo específico
Dame consejos para aumentar mi masa muscular

# Pregunta personalizada
¿Qué dieta me recomiendas para mis objetivos?

# Consulta específica
¿Cómo puedo reducir mis triglicéridos naturalmente?

# Enviar email al nutricionista
enviar mensaje Necesito agendar una cita para revisión nutricional
¿Puedo enviar un mensaje a mi nutricionista?
mandar un mensaje al nutricionista sobre mi dieta

# Variaciones naturales de envío
¿Podrías enviarle mi plan a mi nutridoc?
quiero mandarle esto a mi doctor
necesito compartir mi información con mi especialista
podés pasarle estos datos a mi nutri

# Validar información con nutricionista
¿Podés validar esto con mi nutricionista?
necesito que mi nutricionista revise esta información
¿puedes consultar esto con mi nutricionista?
quiero una segunda opinión profesional
```

## 📢 Funcionalidad de Notificaciones

La herramienta de envío de notificaciones es una **funcionalidad interna** que se activa automáticamente cuando detecta palabras clave relacionadas con el contacto del nutricionista:

### Palabras clave que activan el envío de email:

**Envío directo:**
- "enviar mail", "enviar email", "enviar correo"
- "mandar mail", "mandar email"
- "enviar mensaje", "enviar un mensaje"
- "mandar mensaje", "mandar un mensaje"
- "contactar nutricionista", "escribir al nutricionista"
- "comunicar con nutricionista"
- "mensaje al nutricionista", "mensaje a mi nutricionista"

**Variaciones naturales:**
- "enviarle", "mandarle", "pasarle", "compartir con"
- "nutridoc", "mi nutri", "mi doctor", "mi doctora", "mi especialista"
- "al nutri", "al doctor", "a la doctora", "al especialista"
- "podrías enviar", "puedes enviar", "podés enviar"
- "podrías mandar", "puedes mandar", "podés mandar"
- "quiero enviar", "necesito enviar"
- "mi plan a", "esto a mi", "la información a"

**Validación profesional:**
- "validar", "validalo", "validarlo", "validá esto"
- "validar con mi nutricionista"
- "consultar con mi nutricionista"
- "preguntar a mi nutricionista"
- "revisar con mi nutricionista"
- "verificar con mi nutricionista"
- "confirmar con mi nutricionista"
- "¿podés validar esto?"
- "segunda opinión", "opinión profesional"

### Ejemplo de uso:

**Envío directo:**
```
Usuario: "enviar mensaje Necesito agendar una cita para el próximo martes"
nutrIA: ✅ Notificación enviada exitosamente a Dr. Ana García

📧 Asunto: Consulta de Usuario - nutrIA
📝 Tu mensaje ha sido enviado y deberías recibir una respuesta pronto.

🔔 Te notificaremos cuando Dr. Ana García responda.
📤 Método usado: 📧 Email
📬 ID: abc123def456
```

**Validación profesional:**
```
Usuario: "¿Cuáles son los mejores alimentos para bajar triglicéridos?"
nutrIA: [Respuesta con recomendaciones nutricionales]

Usuario: "¿Podés validar esto con mi nutricionista?"
nutrIA: ✅ Notificación enviada exitosamente a Dr. Ana García

📧 Asunto: Validación profesional solicitada - Usuario - nutrIA
📝 Se ha enviado tu solicitud de validación junto con el contexto de la conversación.

🔔 Te notificaremos cuando Dr. Ana García responda.
📤 Método usado: 📧 Email
📬 ID: xyz789ghi012
```

### Configuración del nutricionista:
Puedes editar la información del nutricionista en el panel lateral:
- **Nombre**: Nombre del nutricionista
- **Email**: Dirección de correo electrónico

### Configuración del servicio de notificaciones:
Para enviar notificaciones reales, configura el método preferido usando:
```bash
./setup-notifications.sh
```

🆕 **Configuración Moderna:** El sistema ofrece múltiples opciones sin configuraciones complejas:

**Métodos disponibles:**
- **📱 WhatsApp**: Business API, Twilio, Webhook - La opción MÁS DIRECTA
- **📡 Webhook**: Zapier, Make, Discord, Slack - La opción más versátil
- **📧 EmailJS**: Servicio gratuito de emails (200/mes) - Fácil de configurar
- **📁 Archivo Local**: Guarda en JSON - Siempre funciona
- **🖥️ Consola**: Solo logs - Para desarrollo

**Ventajas del nuevo sistema:**
- ✅ **Más directo**: WhatsApp es la app más usada para comunicación
- ✅ **Más seguro**: Sin contraseñas de aplicación deprecadas
- ✅ **Más fácil**: Configuración en minutos
- ✅ **Más confiable**: APIs modernas
- ✅ **Más versátil**: Múltiples destinos (WhatsApp, email, chat, SMS)

> **Importante**: Las notificaciones se envían con formato profesional incluyendo la información del paciente, mensaje y branding de nutrIA. Sin configuración, solo se guardan localmente.

## 📊 Arquitectura

```
nutria-assistant/
├── frontend/          # React app con diseño moderno
├── backend/           # Express + Socket.io API
├── mcp-server/        # Servidor MCP con herramientas OpenAI
└── logs/              # Logs del sistema
```

## 🔍 Debugging

Los logs del sistema se almacenan en el directorio `logs/`:

```bash
# Ver logs del frontend
tail -f logs/frontend.log

# Ver logs del backend
tail -f logs/backend.log

# Ver logs del servidor MCP
tail -f logs/mcp-server.log
```

## 🛑 Detener la Aplicación

Presiona `Ctrl+C` en la terminal donde ejecutaste `./start.sh`

## 🔄 Reinstalar Dependencias

```bash
# En cada directorio (frontend, backend, mcp-server)
npm install
```

## 🐛 Solución de Problemas

### Puerto ocupado
```bash
# Matar procesos en puertos 3000 y 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Logs no se actualizan
```bash
# Recrear directorio de logs
rm -rf logs/
mkdir logs/
```

### Errores de conexión
Los errores de conexión se registran automáticamente en los logs del servidor, no aparecen en la interfaz del usuario.

## 🎨 Personalización

### Agregar nuevas herramientas
Edita `mcp-server/src/index.ts` para agregar nuevas herramientas MCP.

### Modificar la interfaz
Edita `frontend/src/components/ChatInterface.tsx` para personalizar la UI.

## 🚀 Deployment en Producción

### 🌐 Heroku (Recomendado)

Publica nutrIA en Internet de forma gratuita y profesional:

```bash
# Deployment automático - Todo en un comando
./deploy-heroku.sh
```

**El script hará automáticamente:**
1. ✅ Verificar que Heroku CLI esté instalado
2. ✅ Crear o usar una app existente
3. ✅ Configurar variables de entorno
4. ✅ Construir frontend y backend
5. ✅ Desplegar en Heroku
6. ✅ Mostrar la URL de tu aplicación

**Características del deployment:**
- 🆓 **Gratis** con plan Eco de Heroku (550-1000 horas/mes)
- 🔒 **HTTPS** automático incluido
- 📱 **Responsive** funciona en móviles y desktop
- 🌍 **Acceso global** desde cualquier lugar
- 📊 **Monitoreo** incluido con logs detallados

### 🔧 Configuración Manual

Si prefieres configurar manualmente:

```bash
# 1. Instalar Heroku CLI
# macOS: brew install heroku/brew/heroku
# Otros: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login en Heroku
heroku login

# 3. Crear app
heroku create tu-nutria-assistant

# 4. Configurar variables
heroku config:set OPENAI_API_KEY="tu-api-key" -a tu-nutria-assistant
heroku config:set NODE_ENV=production -a tu-nutria-assistant

# 5. Desplegar
git push heroku main
```

### 📚 Documentación Completa

- **Guía detallada**: [`HEROKU-DEPLOYMENT.md`](HEROKU-DEPLOYMENT.md)
- **Troubleshooting**: Solución de problemas paso a paso
- **Comandos útiles**: Monitoreo, logs, scaling
- **Costos**: Información sobre planes gratuitos y pagos

### 🌟 Alternativas de Deployment

| Plataforma | Costo | Configuración | Mejor para |
|------------|-------|---------------|------------|
| **Heroku** | Gratis + $7/mes | Automática | Aplicaciones completas |
| **Vercel** | Gratis | Fácil | Frontend estático |
| **Railway** | Gratis + $5/mes | Automática | Aplicaciones Node.js |
| **Render** | Gratis + $7/mes | Automática | Aplicaciones web |

### 💻 Comandos Post-Deployment

```bash
# Ver tu aplicación en producción
heroku open -a tu-nutria-assistant

# Monitorear logs en tiempo real
heroku logs --tail -a tu-nutria-assistant

# Reiniciar la aplicación
heroku restart -a tu-nutria-assistant

# Ver estado de la aplicación
heroku ps -a tu-nutria-assistant

# Configurar dominio personalizado
heroku domains:add nutria.tudominio.com -a tu-nutria-assistant
```

### 🔍 Ejemplo de URL Final

Después del deployment, tu aplicación estará disponible en:
```
https://tu-nutria-assistant.herokuapp.com
```

¡Y funcionará exactamente igual que en desarrollo local! 🎉

## 📄 Licencia

MIT License 
