# 🎬 Configuración del Splash Screen - nutrIA

## 📱 Nuevo Splash Screen Implementado

He creado un espectacular splash screen animado para nutrIA que incluye:

### ✨ **Características del Splash Screen**

- 🎯 **Logo animado** con anillos de pulsación
- 🎨 **Gradiente de fondo** cyan → teal → emerald  
- 📊 **Barra de carga animada** con transiciones suaves
- 🌟 **Partículas flotantes** con emojis de fitness y nutrición
- ⏱️ **Duración**: 3 segundos + fade out suave
- 💫 **Animaciones**: bounce, pulse, ping effects
- 🎭 **Fallback**: Si no encuentra el GIF, muestra emoji 🦦

## 🖼️ **Cómo Usar Tu GIF Personalizado**

### **Paso 1: Preparar tu GIF**
El GIF que subiste muestra un personaje fitness con mancuerna - ¡perfecto para nutrIA!

### **Paso 2: Reemplazar la imagen**
```bash
# Navegar al directorio público
cd frontend/public/

# Reemplazar con tu GIF real
# (Actualmente uso nutria-icon.png como placeholder)
cp tu-gif-real.gif nutria-splash.gif
```

### **Paso 3: Optimizar el GIF (Opcional)**
Para mejor rendimiento, recomiendo:
- **Tamaño**: 300x300px máximo
- **Duración**: 2-3 segundos loop
- **Peso**: Menos de 1MB
- **Formato**: GIF optimizado

## 🎨 **Estructura Visual del Splash**

```
┌─────────────────────────────────────┐
│        Fondo Gradiente              │
│                                     │
│    ┌─────────────────────────┐      │
│    │    🎯 Logo Animado      │      │
│    │   (Tu GIF aquí)         │      │
│    │  + Anillos pulsantes    │      │
│    └─────────────────────────┘      │
│                                     │
│         nutrIA                      │
│   Tu asistente personal             │
│                                     │
│    ▓▓▓▓▓▓▓▓▓▓░░░░░               │
│      Barra de carga                 │
│                                     │
│  Preparando tu experiencia...       │
│                                     │
│    🥗  🍎  🥑  🏃‍♂️  💪  ⚡        │
│      Partículas flotantes           │
└─────────────────────────────────────┘
```

## 🔧 **Personalización Avanzada**

### **Cambiar duración del splash:**
```typescript
// En frontend/src/components/SplashScreen.tsx
// Línea ~20
const timer = setTimeout(() => {
  setFadeOut(true);
  setTimeout(() => {
    onComplete();
  }, 500);
}, 3000); // ← Cambiar este valor (3000ms = 3 segundos)
```

### **Modificar colores del gradiente:**
```typescript
// Línea ~25
className="fixed inset-0 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600"
//                                    ↑ Cambiar estos colores
```

### **Personalizar partículas:**
```typescript
// Línea ~94
{['🥗', '🍎', '🥑', '🏃‍♂️', '💪', '⚡'][i]}
//   ↑ Cambiar estos emojis
```

## 🚀 **Estado Actual**

✅ **Splash Screen**: Completamente funcional  
✅ **Animaciones**: Implementadas con Tailwind CSS  
✅ **Responsive**: Adaptable a móviles  
✅ **Fallback**: Sistema de respaldo incluido  
✅ **Performance**: Optimizado con React hooks  
⏳ **Pendiente**: Reemplazar con tu GIF real  

## 📱 **Experiencia de Usuario**

1. **Carga inicial** → Muestra splash screen
2. **3 segundos** → Animaciones completas  
3. **Fade out** → Transición suave
4. **Chat Interface** → Aplicación principal

## 💡 **Tips Adicionales**

- El GIF se reproduce automáticamente al cargar
- Si el archivo no existe, usa fallback con emoji
- Las animaciones son compatibles con mobile
- El splash se muestra solo al inicio (no en recargas)

¡Tu splash screen está listo! Solo necesitas reemplazar `nutria-splash.gif` con tu GIF real para completar la experiencia. 🎉 