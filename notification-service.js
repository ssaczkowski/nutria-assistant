// 🦦 nutrIA - Servicio de Notificaciones Simplificado
// Solo archivo local - Sin dependencias externas

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class NotificationService {
  constructor() {
    this.availableMethods = this.checkAvailableMethods();
    console.log('📢 Servicio de notificaciones iniciado (Solo archivo local)');
    console.log('✅ Métodos disponibles:', this.availableMethods.join(', '));
  }

  checkAvailableMethods() {
    const methods = [];
    
    // Solo archivo local está disponible
    methods.push('📁 Archivo local disponible');
    
    return methods;
  }

  async notify({ to, subject, message, userProfile = {}, type = 'direct' }) {
    const notification = {
      timestamp: new Date().toISOString(),
      to: to || 'nutricionista@example.com',
      subject: subject || 'Notificación de nutrIA',
      message: message || 'Sin mensaje',
      userProfile: userProfile,
      type: type,
      id: this.generateId()
    };

    try {
      // Solo usar archivo local
      const result = await this.saveToFile(notification);
      
      console.log(`✅ Notificación guardada: ${result.method}`);
      console.log(`📬 ID: ${notification.id}`);
      
      return {
        success: true,
        method: result.method,
        messageId: notification.id,
        details: result
      };
      
    } catch (error) {
      console.error('❌ Error al guardar notificación:', error.message);
      
      // Fallback a consola si archivo local falla
      console.log('📢 NOTIFICACIÓN (Consola):');
      console.log(`📧 Para: ${notification.to}`);
      console.log(`📝 Asunto: ${notification.subject}`);
      console.log(`💬 Mensaje: ${notification.message}`);
      console.log(`👤 Usuario: ${notification.userProfile.name || 'N/A'}`);
      console.log(`🆔 ID: ${notification.id}`);
      
      return {
        success: true,
        method: 'consola',
        messageId: notification.id,
        details: { method: 'console-fallback' }
      };
    }
  }

  // Guardar en archivo local
  async saveToFile(notification) {
    const notificationsDir = path.join(__dirname, 'notifications');
    
    // Crear directorio si no existe
    if (!fs.existsSync(notificationsDir)) {
      fs.mkdirSync(notificationsDir, { recursive: true });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const filename = `notification-${today}.json`;
    const filepath = path.join(notificationsDir, filename);
    
    let notifications = [];
    
    // Leer archivo existente si existe
    if (fs.existsSync(filepath)) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        notifications = JSON.parse(content);
      } catch (error) {
        console.warn('⚠️  Error al leer archivo existente, creando nuevo');
        notifications = [];
      }
    }
    
    // Agregar nueva notificación
    notifications.push(notification);
    
    // Guardar archivo
    fs.writeFileSync(filepath, JSON.stringify(notifications, null, 2));
    
    console.log(`📁 Guardado en: ${filepath}`);
    console.log(`📊 Total notificaciones hoy: ${notifications.length}`);
    
    return {
      method: 'local-file',
      filename: filename,
      filepath: filepath,
      count: notifications.length
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getServiceInfo() {
    return {
      name: 'nutrIA Notifications (Solo Local)',
      version: '2.0.0',
      methods: ['archivo-local'],
      status: 'active',
      description: 'Servicio simplificado que solo guarda notificaciones en archivo local'
    };
  }
}

module.exports = NotificationService; 