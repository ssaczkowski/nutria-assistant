# 🦦 nutrIA - Sistema de Notificaciones Locales

## 📋 Resumen
Sistema simplificado que **simula el envío de notificaciones** guardándolas en archivo local. Se eliminaron todas las dependencias externas (WhatsApp, Email, Webhooks) para mayor simplicidad y confiabilidad. Para el usuario, la experiencia es como si realmente se enviaran al nutricionista.

## ✅ Configuración Actual
- **Método**: 📁 Archivo local únicamente
- **Ubicación**: `notifications/`
- **Formato**: JSON
- **Estado**: ✅ Activo

## 🗂️ Archivos de Notificación
Las notificaciones se guardan en:
```
notifications/notification-YYYY-MM-DD.json
```

**Ejemplo:**
```
notifications/notification-2025-07-06.json
```

## 📊 Formato de Notificación
```json
[
  {
    "timestamp": "2025-07-06T04:56:36.545Z",
    "to": "nutricionista@example.com",
    "subject": "Validación profesional solicitada - Usuario - nutrIA",
    "message": "Solicitud de validación del paciente...",
    "userProfile": {
      "name": "Usuario",
      "age": 31,
      "weight": 50,
      "height": 1.55
    },
    "type": "validation",
    "id": "mcr79qkicr8h9fzicj7"
  }
]
```

## 🔍 Comandos Útiles

### Ver notificaciones del día
```bash
cat notifications/notification-$(date +%Y-%m-%d).json
```

### Ver todas las notificaciones
```bash
cat notifications/notification-*.json
```

### Listar archivos de notificación
```bash
ls -la notifications/
```

### Contar notificaciones del día
```bash
cat notifications/notification-$(date +%Y-%m-%d).json | jq length
```

## 🧪 Cómo Probar

1. **Inicia nutrIA:**
   ```bash
   ./start.sh
   ```

2. **Escribe una frase que active notificaciones:**
   - "enviar whatsapp"
   - "enviarle a mi nutricionista"
   - "podrías enviarlo a mi nutri"
   - "quiero consultarlo con mi doctor"

3. **Verifica que se procesó:**
   ```bash
   cat notifications/notification-*.json
   ```
   (El sistema simula el envío pero internamente guarda en archivo local)

## 📂 Estructura del Sistema

```
nutria-assistant/
├── notifications/                 # Directorio de notificaciones
│   └── notification-YYYY-MM-DD.json
├── notification-service.js        # Servicio simplificado
├── setup-local-only.sh           # Script de configuración
├── NOTIFICACIONES-LOCALES.md     # Esta documentación
└── .env                          # Variables de entorno
```

## 🔧 Variables de Entorno Activas

```env
NOTIFICATION_METHOD=local
NOTIFICATION_TYPE=file
```

## 💡 Ventajas del Sistema Local

- ✅ **Sin dependencias externas**
- ✅ **Funciona sin internet**
- ✅ **Notificaciones siempre procesadas**
- ✅ **Fácil de revisar manualmente**
- ✅ **No requiere configuración adicional**
- ✅ **Historial completo**
- ✅ **Formato JSON estándar**
- ✅ **Experiencia de usuario transparente**

## 🚀 Flujo de Funcionamiento

1. **Usuario escribe:** "enviar whatsapp"
2. **Sistema detecta:** Frase de notificación
3. **Sistema genera:** Notificación estructurada
4. **Sistema guarda:** En archivo local (simula envío)
5. **Sistema confirma:** "Notificación enviada exitosamente"

## 📱 Mensajes del Sistema

Cuando funciona correctamente verás:
```
✅ Notificación enviada exitosamente a nutricionista@example.com

📧 Asunto: Validación profesional solicitada - Sabrina - nutrIA
📝 Se ha enviado tu solicitud de validación junto con el contexto de la conversación.

🔔 Te notificaremos cuando tu nutricionista responda.

📬 ID: mcr79qkicr8h9fzicj7
```

## 🔧 Resolución de Problemas

### Si no se procesan notificaciones:
1. Verifica que el directorio `notifications/` existe
2. Verifica permisos de escritura
3. Revisa logs: `tail -f logs/mcp-server.log`

### Si aparecen errores:
1. Reinicia el sistema: `./start.sh`
2. Verifica configuración: `cat .env`
3. Revisa logs de errores

## 🎯 Próximos Pasos

Si en el futuro quieres agregar notificaciones remotas:
1. Ejecuta el script correspondiente (`setup-email.sh`, etc.)
2. El sistema automáticamente detectará los nuevos métodos
3. Mantendrá el archivo local como fallback

## 📞 Soporte

- **Logs**: `tail -f logs/mcp-server.log`
- **Configuración**: `cat .env`
- **Notificaciones**: `ls -la notifications/` 