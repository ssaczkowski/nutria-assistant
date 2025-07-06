# 🔒 SECURITY - Guía de Seguridad para nutrIA

## 🚨 INFORMACIÓN IMPORTANTE

Este proyecto maneja información sensible y requiere configuración segura antes del deployment.

## 📋 CHECKLIST DE SEGURIDAD

### ✅ **Antes de Deployment**

- [ ] **API Keys**: Nunca hardcodear API keys en el código
- [ ] **Información Personal**: Eliminar datos personales del código
- [ ] **Archivos .env**: Excluir de Git y configurar valores reales
- [ ] **Logs**: Limpiar logs con información sensible
- [ ] **Configuración Git**: Verificar email y usuario correctos

### ✅ **Variables de Entorno Requeridas**

```bash
# Archivo .env (NO incluir en Git)
OPENAI_API_KEY=sk-your-real-api-key-here
NODE_ENV=production
NOTIFICATION_METHOD=local
NOTIFICATION_TYPE=file
```

### ✅ **Información a Personalizar**

1. **Perfil de Usuario**: Configurar desde la interfaz
2. **Datos del Nutricionista**: Configurar desde la interfaz
3. **Configuración Regional**: Adaptar zona horaria si es necesario

## 🛡️ **BUENAS PRÁCTICAS**

### **API Keys**
- Usar variables de entorno
- Rotar keys regularmente
- Revocar keys comprometidas inmediatamente
- Nunca compartir keys en código o documentación

### **Información Personal**
- No hardcodear datos personales
- Usar valores por defecto genéricos
- Permitir configuración desde interfaz
- Documentar datos de ejemplo claramente

### **Archivos Sensibles**
- Configurar .gitignore apropiadamente
- Usar archivos .env.example
- Limpiar logs regularmente
- Revisar commits antes de push

## 🔍 **VERIFICACIÓN PRE-DEPLOYMENT**

### **Comando de Verificación**
```bash
# Verificar que no hay información sensible
grep -r "sk-" . --exclude-dir=node_modules
grep -r "@.*\.com" . --exclude-dir=node_modules
grep -r "password\|secret\|token" . --exclude-dir=node_modules
```

### **Archivos a Revisar**
- `frontend/src/components/ChatInterface.tsx`
- `README.md`
- `NOTIFICACIONES-LOCALES.md`
- `env.example`
- `logs/`
- `notifications/`

## 📞 **CONTACTO**

Si encuentras vulnerabilidades de seguridad, por favor contacta de forma privada antes de divulgar públicamente.

## 📝 **CHANGELOG DE SEGURIDAD**

- **v1.0.0**: Implementación inicial de medidas de seguridad
- Eliminación de información personal hardcodeada
- Configuración segura de variables de entorno
- Documentación de buenas prácticas 