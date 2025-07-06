#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensaje con color
log() {
    echo -e "${GREEN}[MCP]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para matar procesos en puertos
kill_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Limpiar puertos
info "Limpiando puertos..."
kill_port 3000
kill_port 3001

# Crear directorio de logs
mkdir -p logs

# Función para limpiar al salir
cleanup() {
    echo
    info "Deteniendo servicios..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$MCP_PID" ]; then
        kill $MCP_PID 2>/dev/null
    fi
    
    kill_port 3000
    kill_port 3001
    log "Servicios detenidos"
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Iniciar servicios
info "Iniciando servidor MCP..."
node mcp-server-simple.js > logs/mcp-server.log 2>&1 &
MCP_PID=$!

sleep 2

info "Iniciando backend..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

info "Iniciando frontend..."
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

# Mostrar estado
echo
log "🦦 nutrIA iniciado exitosamente"
echo
echo "📊 Servicios:"
echo "  • nutrIA Frontend: http://localhost:3000"
echo "  • Backend API:     http://localhost:3001"
echo "  • MCP Server:      Ejecutándose en background"
echo
echo "🔍 Logs:"
echo "  • tail -f logs/frontend.log"
echo "  • tail -f logs/backend.log"
echo "  • tail -f logs/mcp-server.log"
echo
echo "🛑 Para detener: Ctrl+C"
echo

# Esperar indefinidamente
while true; do
    sleep 1
done 