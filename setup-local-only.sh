#!/bin/bash

# 🦦 nutrIA - Configuración Solo Archivo Local
# Script para configurar notificaciones únicamente en archivo local

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               🦦 nutrIA - Solo Archivo Local                 ║"
echo "║           Eliminar todas las notificaciones remotas         ║"
echo "╚══════════════════════════════════════════════════════════════╝"

echo ""
echo "🔧 Configurando notificaciones solo en archivo local..."

# Crear o actualizar .env
ENV_FILE=".env"
touch $ENV_FILE

echo "🗑️  Eliminando configuraciones remotas..."

# Remover todas las configuraciones de notificaciones remotas
sed -i '' '/^TWILIO_DEMO_URL=/d' $ENV_FILE
sed -i '' '/^TWILIO_ACCOUNT_SID=/d' $ENV_FILE
sed -i '' '/^TWILIO_AUTH_TOKEN=/d' $ENV_FILE
sed -i '' '/^TWILIO_PHONE_NUMBER=/d' $ENV_FILE
sed -i '' '/^WEBHOOK_URL=/d' $ENV_FILE
sed -i '' '/^EMAILJS_SERVICE_ID=/d' $ENV_FILE
sed -i '' '/^EMAILJS_TEMPLATE_ID=/d' $ENV_FILE
sed -i '' '/^EMAILJS_PUBLIC_KEY=/d' $ENV_FILE
sed -i '' '/^WHATSAPP_BUSINESS_TOKEN=/d' $ENV_FILE
sed -i '' '/^WHATSAPP_PHONE_ID=/d' $ENV_FILE
sed -i '' '/^NUTRITIONIST_PHONE=/d' $ENV_FILE
sed -i '' '/^NOTIFICATION_METHOD=/d' $ENV_FILE
sed -i '' '/^NOTIFICATION_TYPE=/d' $ENV_FILE
sed -i '' '/^EMAIL_USER=/d' $ENV_FILE
sed -i '' '/^EMAIL_PASS=/d' $ENV_FILE
sed -i '' '/^EMAIL_HOST=/d' $ENV_FILE
sed -i '' '/^EMAIL_PORT=/d' $ENV_FILE

echo "📁 Configurando solo archivo local..."

# Agregar configuración de archivo local únicamente
echo "NOTIFICATION_METHOD=local" >> $ENV_FILE
echo "NOTIFICATION_TYPE=file" >> $ENV_FILE

echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "📋 Configuración actual:"
echo "  • Método: 📁 Archivo local únicamente"
echo "  • Ubicación: notifications/"
echo "  • Formato: JSON"
echo ""
echo "🗂️  Las notificaciones se guardarán en:"
echo "  • notifications/notification-YYYY-MM-DD.json"
echo ""
echo "🔍 Para ver las notificaciones guardadas:"
echo "  • cat notifications/notification-*.json"
echo "  • ls -la notifications/"
echo ""
echo "🧪 PRUEBA LA CONFIGURACIÓN:"
echo "  1. Inicia nutrIA: ./start.sh"
echo "  2. Escribe: 'enviar whatsapp' o 'enviarle a mi nutricionista'"
echo "  3. Verifica: cat notifications/notification-*.json"
echo ""
echo "📊 ESTADO DEL SISTEMA:"
echo "  ❌ WhatsApp: Deshabilitado"
echo "  ❌ Email: Deshabilitado"
echo "  ❌ Webhooks: Deshabilitado"
echo "  ✅ Archivo local: Activo"
echo ""
echo "💡 VENTAJAS:"
echo "  • Sin dependencias externas"
echo "  • Funciona sin internet"
echo "  • Notificaciones siempre guardadas"
echo "  • Fácil de revisar manualmente"
echo ""

# Crear directorio de notificaciones si no existe
mkdir -p notifications

echo "🎯 ¡Sistema configurado exitosamente!"
echo "   Solo se usarán notificaciones locales."
echo "" 