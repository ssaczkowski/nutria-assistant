#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensaje con color
log() {
    echo -e "${GREEN}[nutrIA]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🦦 Configuración de OpenAI para nutrIA"
echo "======================================"
echo

# Verificar si ya existe la clave
if [ -f "mcp-server/.env" ] && grep -q "OPENAI_API_KEY" mcp-server/.env; then
    current_key=$(grep "OPENAI_API_KEY" mcp-server/.env | cut -d'=' -f2)
    if [ "$current_key" != "your_openai_api_key_here" ] && [ -n "$current_key" ]; then
        info "Ya tienes una clave de OpenAI configurada."
        read -p "¿Quieres cambiarla? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Configuración cancelada."
            exit 0
        fi
    fi
fi

echo "Para usar OpenAI con nutrIA, necesitas:"
echo "1. Una cuenta en OpenAI (https://platform.openai.com)"
echo "2. Una API key válida"
echo "3. Créditos en tu cuenta (mínimo $5 USD)"
echo
echo "Pasos para obtener tu API key:"
echo "• Ir a https://platform.openai.com/api-keys"
echo "• Crear una nueva API key"
echo "• Copiar la clave (sk-...)"
echo

read -p "¿Ya tienes tu API key de OpenAI? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Consigue tu API key primero y luego vuelve a ejecutar este script."
    echo
    echo "Guía rápida:"
    echo "1. Regístrate en https://platform.openai.com"
    echo "2. Verifica tu email y teléfono"
    echo "3. Añade un método de pago"
    echo "4. Ve a https://platform.openai.com/api-keys"
    echo "5. Haz clic en 'Create new secret key'"
    echo "6. Copia la clave (empieza con sk-...)"
    echo
    exit 0
fi

# Pedir la API key
echo
read -p "Ingresa tu API key de OpenAI: " -r api_key

# Validar formato básico
if [[ ! $api_key =~ ^sk-[a-zA-Z0-9]{48,}$ ]]; then
    error "La API key no tiene el formato correcto (debe empezar con 'sk-')"
    exit 1
fi

# Crear archivo .env
echo "OPENAI_API_KEY=$api_key" > mcp-server/.env

log "✅ API key configurada correctamente"
echo
info "Ahora puedes usar nutrIA con OpenAI:"
echo "• Ejecuta: ./start.sh"
echo "• Disfruta de respuestas inteligentes de nutrición"
echo
warning "⚠️  Importante:"
echo "• Mantén tu API key segura"
echo "• No la compartas con nadie"
echo "• Monitorea tu uso en https://platform.openai.com/usage"
echo
log "🦦 ¡nutrIA está listo para ayudarte con nutrición inteligente!" 