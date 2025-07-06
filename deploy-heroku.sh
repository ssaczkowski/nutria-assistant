#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    error "Heroku CLI no está instalado. Instálalo desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Verificar que el usuario está logueado en Heroku
if ! heroku auth:whoami &> /dev/null; then
    error "No estás logueado en Heroku. Ejecuta: heroku login"
    exit 1
fi

log "🦦 Iniciando deployment de nutrIA en Heroku..."

# Solicitar nombre de la app
read -p "Ingresa el nombre de tu app en Heroku (o presiona Enter para crear una nueva): " APP_NAME

if [ -z "$APP_NAME" ]; then
    log "Creando nueva app en Heroku..."
    APP_NAME=$(heroku apps:create --json | jq -r '.name')
    log "✅ App creada: $APP_NAME"
else
    log "Usando app existente: $APP_NAME"
fi

# Verificar que la app existe
if ! heroku apps:info $APP_NAME &> /dev/null; then
    error "La app '$APP_NAME' no existe en Heroku"
    exit 1
fi

# Configurar variables de entorno
log "🔧 Configurando variables de entorno..."

# Solicitar OpenAI API Key
read -p "Ingresa tu OpenAI API Key: " OPENAI_KEY
if [ -z "$OPENAI_KEY" ]; then
    warning "No se configuró OpenAI API Key. Puedes configurarla después con:"
    warning "heroku config:set OPENAI_API_KEY=tu-api-key -a $APP_NAME"
else
    heroku config:set OPENAI_API_KEY="$OPENAI_KEY" -a $APP_NAME
fi

# Configurar otras variables
heroku config:set NODE_ENV=production -a $APP_NAME
heroku config:set NOTIFICATION_METHOD=local -a $APP_NAME
heroku config:set NOTIFICATION_TYPE=file -a $APP_NAME
heroku config:set TZ=America/Argentina/Buenos_Aires -a $APP_NAME

log "✅ Variables de entorno configuradas"

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
    log "Inicializando repositorio git..."
    git init
    git add .
    git commit -m "Initial commit para nutrIA"
fi

# Agregar remote de Heroku
log "🔗 Configurando remote de Heroku..."
if git remote get-url heroku &> /dev/null; then
    git remote set-url heroku https://git.heroku.com/$APP_NAME.git
else
    git remote add heroku https://git.heroku.com/$APP_NAME.git
fi

# Hacer commit de los cambios si hay algunos
if ! git diff --cached --quiet; then
    log "Haciendo commit de cambios..."
    git add .
    git commit -m "Prepare for Heroku deployment"
fi

# Deploy a Heroku
log "🚀 Desplegando en Heroku..."
git push heroku main

if [ $? -eq 0 ]; then
    log "✅ Deployment exitoso!"
    
    # Mostrar información de la app
    APP_URL=$(heroku apps:info $APP_NAME --json | jq -r '.app.web_url')
    
    echo
    log "🦦 ===== nutrIA Desplegado Exitosamente ====="
    log "🌍 URL: $APP_URL"
    log "📱 App: $APP_NAME"
    log "🔧 Dashboard: https://dashboard.heroku.com/apps/$APP_NAME"
    echo
    log "📋 Comandos útiles:"
    echo "  • Ver logs:      heroku logs --tail -a $APP_NAME"
    echo "  • Abrir app:     heroku open -a $APP_NAME"
    echo "  • Restart:       heroku restart -a $APP_NAME"
    echo "  • Config vars:   heroku config -a $APP_NAME"
    echo
    
    # Abrir la aplicación
    read -p "¿Deseas abrir la aplicación en el navegador? (y/n): " OPEN_APP
    if [ "$OPEN_APP" = "y" ]; then
        heroku open -a $APP_NAME
    fi
    
else
    error "❌ Error en el deployment. Revisa los logs:"
    error "heroku logs --tail -a $APP_NAME"
    exit 1
fi 