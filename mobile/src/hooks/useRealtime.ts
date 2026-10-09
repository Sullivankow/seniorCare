import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { REALTIME_URL } from '../config';
import { useAuth } from '../context/AuthContext';

type Handlers = Record<string, (payload: any) => void>;

/**
 * Se connecte au flux temps réel tant que l'écran est affiché et appelle les handlers
 * correspondant aux évènements reçus.
 *
 * Exemple :
 *   useRealtime({ 'alert:created': (p) => Alert.alert('Urgence', p.seniorName) });
 *
 * Les handlers sont lus via une ref : pas besoin de les mémoïser, la connexion n'est pas recréée.
 */
export function useRealtime(handlers: Handlers) {
  const { token } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;
    const socket = io(REALTIME_URL, {
      auth: { token },
      transports: ['websocket'], // WebSocket direct (plus fiable sur React Native)
      reconnection: true,
    });

    // On écoute chaque évènement déclaré ; l'appel passe toujours par la ref (dernier handler)
    Object.keys(handlersRef.current).forEach((event) => {
      socket.on(event, (payload) => handlersRef.current[event]?.(payload));
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
}
