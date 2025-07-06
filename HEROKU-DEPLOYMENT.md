# 🦦 nutrIA - Guía de Deployment en Heroku

Esta guía te ayudará a publicar nutrIA en Heroku de forma rápida y sencilla.

## 📋 Requisitos Previos

### 1. Heroku CLI
Instala la CLI de Heroku:
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Descarga desde: https://devcenter.heroku.com/articles/heroku-cli

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Git
Asegúrate de tener Git instalado:
```bash
git --version
```

### 3. Cuenta de Heroku
- Regístrate en [heroku.com](https://heroku.com)
- Verifica tu email
- Opcionalmente, agrega un método de pago para evitar limitaciones

## 🚀 Deployment Automático

### Opción 1: Script Automatizado (Recomendado)

Ejecuta el script de deployment:
```bash
chmod +x deploy-heroku.sh
./deploy-heroku.sh
```

El script te guiará paso a paso:
1. Verificará que tengas Heroku CLI instalado
2. Te pedirá el nombre de tu app (o creará una nueva)
3. Configurará las variables de entorno
4. Desplegará la aplicación automáticamente

### Opción 2: Deployment Manual

Si prefieres hacerlo manualmente:

#### 1. Login en Heroku
```bash
heroku login
```

#### 2. Crear App
```bash
# Crear app con nombre específico
heroku create tu-nutria-assistant

# O crear app con nombre aleatorio
heroku create
```

#### 3. Configurar Variables de Entorno
```bash
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY="tu-api-key-aquí"
heroku config:set NOTIFICATION_METHOD=local
heroku config:set NOTIFICATION_TYPE=file
heroku config:set TZ=America/Argentina/Buenos_Aires
```

#### 4. Inicializar Git (si es necesario)
```bash
git init
git add .
git commit -m "Initial commit para nutrIA"
```

#### 5. Agregar Remote de Heroku
```bash
heroku git:remote -a tu-nutria-assistant
```

#### 6. Desplegar
```bash
git push heroku main
```

## ⚙️ Configuración de Variables de Entorno

### Variables Obligatorias
```bash
NODE_ENV=production              # Modo producción
OPENAI_API_KEY=sk-...           # Tu API key de OpenAI
```

### Variables Opcionales
```bash
NOTIFICATION_METHOD=local        # Método de notificaciones
NOTIFICATION_TYPE=file          # Tipo de notificación
TZ=America/Argentina/Buenos_Aires # Timezone
DEBUG=false                     # Logs detallados
```

### Configurar después del deployment
```bash
heroku config:set VARIABLE=valor -a tu-nutria-assistant
```

## 🔧 Comandos Útiles

### Monitoreo
```bash
# Ver logs en tiempo real
heroku logs --tail -a tu-nutria-assistant

# Ver logs históricos
heroku logs -n 200 -a tu-nutria-assistant

# Abrir app en navegador
heroku open -a tu-nutria-assistant
```

### Gestión
```bash
# Reiniciar app
heroku restart -a tu-nutria-assistant

# Ver estado
heroku ps -a tu-nutria-assistant

# Ver variables de entorno
heroku config -a tu-nutria-assistant

# Acceder a consola
heroku run bash -a tu-nutria-assistant
```

### Scaling
```bash
# Escalar dynos
heroku ps:scale web=1 -a tu-nutria-assistant

# Ver uso de recursos
heroku ps:type -a tu-nutria-assistant
```

## 🏗️ Arquitectura en Heroku

```
┌─────────────────────────────────────────────────────────────┐
│                        Heroku Dyno                         │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Frontend      │  │    Backend      │  │ MCP Server  │ │
│  │  (React Build)  │  │  (Express API)  │  │  (Node.js)  │ │
│  │                 │  │                 │  │             │ │
│  │  Static Files   │  │  Socket.IO      │  │  AI Tools   │ │
│  │  Served by      │  │  REST API       │  │  OpenAI     │ │
│  │  Express        │  │  File System    │  │  Nutrition  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  Port: $PORT (assigned by Heroku)                          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Archivos

```
nutria-assistant/
├── package.json          # Configuración principal
├── server.js             # Servidor unificado para Heroku
├── Procfile              # Configuración de proceso Heroku
├── env.example           # Variables de entorno ejemplo
├── deploy-heroku.sh      # Script de deployment
├── frontend/
│   ├── build/            # Archivos compilados (generado)
│   ├── src/              # Código fuente React
│   └── package.json      # Dependencias frontend
├── backend/
│   ├── src/              # Código fuente backend
│   └── package.json      # Dependencias backend
├── mcp-server-simple.js  # Servidor MCP
└── notifications/        # Archivos de notificaciones
```

## 🔍 Proceso de Build

Heroku ejecuta automáticamente:

1. **Install**: `npm install` (dependencias principales)
2. **Build Frontend**: `cd frontend && npm ci && npm run build`
3. **Build Backend**: `cd backend && npm ci && npm run build`
4. **Start**: `node server.js`

## 🛠️ Troubleshooting

### Error: "Application error"
```bash
# Revisar logs
heroku logs --tail -a tu-nutria-assistant

# Verificar variables de entorno
heroku config -a tu-nutria-assistant

# Reiniciar app
heroku restart -a tu-nutria-assistant
```

### Error: "No OpenAI API Key"
```bash
heroku config:set OPENAI_API_KEY="tu-api-key" -a tu-nutria-assistant
```

### Error: "Build failed"
```bash
# Verificar package.json
cat package.json

# Limpiar cache de Heroku
heroku repo:purge_cache -a tu-nutria-assistant
```

### Error: "H10 App crashed"
```bash
# Ver logs detallados
heroku logs -n 500 -a tu-nutria-assistant

# Verificar que el puerto está configurado
heroku config:get PORT -a tu-nutria-assistant
```

## 💰 Costos en Heroku

### Plan Gratuito (Eco Dynos)
- **Costo**: $0/mes
- **Limitaciones**: 
  - 550-1000 horas/mes
  - Duerme después de 30 min sin actividad
  - Límite de memoria: 512MB

### Plan Básico (Basic Dynos)
- **Costo**: $7/mes
- **Beneficios**:
  - Nunca duerme
  - 1GB RAM
  - SSL incluido

### Recomendación
Para uso personal: **Eco Dynos** (gratuito)
Para uso profesional: **Basic Dynos** ($7/mes)

## 🔐 Seguridad

### Variables de Entorno
- ✅ **SÍ**: Usar variables de entorno para API keys
- ❌ **NO**: Hardcodear credentials en el código

### HTTPS
- Heroku proporciona HTTPS automáticamente
- Tu app será accesible via `https://tu-app.herokuapp.com`

### Dominio Personalizado
```bash
# Agregar dominio personalizado
heroku domains:add nutria.tudominio.com -a tu-nutria-assistant

# Configurar SSL
heroku certs:auto:enable -a tu-nutria-assistant
```

## 📈 Monitoreo y Métricas

### Heroku Metrics
```bash
# Ver métricas
heroku apps:info -a tu-nutria-assistant

# Alertas por email
heroku notifications:enable -a tu-nutria-assistant
```

### Logs Externos
Considera usar servicios como:
- **Papertrail**: Logs centralizados
- **LogDNA**: Análisis de logs
- **New Relic**: Monitoreo de performance

## 🚀 Deployment Continuo

### GitHub Integration
1. Conecta tu repositorio GitHub en Heroku Dashboard
2. Habilita "Automatic Deploys"
3. Cada push a `main` desplegará automáticamente

### CI/CD con GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Heroku
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "tu-nutria-assistant"
        heroku_email: "tu-email@example.com"
```

## 📞 Soporte

- **Documentación**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **Comunidad**: [help.heroku.com](https://help.heroku.com)
- **Status**: [status.heroku.com](https://status.heroku.com)

---

¡Listo! 🎉 Tu aplicación nutrIA estará disponible en `https://tu-app.herokuapp.com` 