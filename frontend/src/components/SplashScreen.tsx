import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Animar la barra de carga inmediatamente
    setTimeout(() => {
      setLoadingProgress(100);
    }, 100);

    // Duración del splash screen (3 segundos)
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Esperar a que termine la animación de fade out
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        {/* Logo animado con el GIF */}
        <div className="mb-8 relative">
          <div className="w-48 h-48 mx-auto bg-white rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
            <img 
              src="/nutria-splash.gif" 
              alt="nutrIA mascot" 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback si no se encuentra el GIF
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            {/* Fallback con emoji */}
            <div 
              className="w-full h-full flex items-center justify-center text-8xl hidden"
              style={{ display: 'none' }}
            >
              🦦
            </div>
          </div>
          
          {/* Anillos de pulsación */}
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-30 animate-ping"></div>
          <div className="absolute inset-4 rounded-full border-2 border-white opacity-40 animate-ping" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Título principal */}
        <h1 className="text-6xl font-bold text-white mb-4 animate-bounce">
          nutr<span className="text-yellow-300">IA</span>
        </h1>
        
        {/* Subtítulo */}
        <p className="text-xl text-white/90 mb-8 animate-pulse">
          Tu asistente personal de nutrición
        </p>

        {/* Barra de carga animada */}
        <div className="w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-[3000ms] ease-in-out"
            style={{
              width: `${loadingProgress}%`
            }}
          ></div>
        </div>

        {/* Texto de carga */}
        <p className="text-white/80 mt-4 text-sm animate-pulse">
          Preparando tu experiencia nutricional...
        </p>

        {/* Partículas flotantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/20 text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🥗', '🍎', '🥑', '🏃‍♂️', '💪', '⚡'][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 