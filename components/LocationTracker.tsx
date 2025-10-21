// components/LocationTracker.tsx
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addLocationHistory } from '../services/api';

const LocationTracker: React.FC = () => {
  const { user } = useAuth();
  const watchId = useRef<number | null>(null);
  const lastSentTime = useRef<number>(0);
  
  // Enviar localização a cada 30 segundos
  const SEND_INTERVAL = 30000; 

  useEffect(() => {
    if (user && user.role === 'user' && 'geolocation' in navigator) {
      const handleSuccess = (position: GeolocationPosition) => {
        const now = Date.now();
        if (now - lastSentTime.current > SEND_INTERVAL) {
          lastSentTime.current = now;
          const { latitude, longitude } = position.coords;
          addLocationHistory({
            researcherId: user.profileId,
            latitude,
            longitude,
          });
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        console.warn(`ERROR(${error.code}): ${error.message}`);
        // Se a permissão for negada, para de tentar
        if (error.code === error.PERMISSION_DENIED && watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
      };

      // Inicia o rastreamento
      watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      // Função de limpeza para parar o rastreamento ao desmontar o componente
      return () => {
        if (watchId.current) {
          navigator.geolocation.clearWatch(watchId.current);
        }
      };
    }
  }, [user]);

  // Este componente não renderiza nada na UI
  return null;
};

export default LocationTracker;