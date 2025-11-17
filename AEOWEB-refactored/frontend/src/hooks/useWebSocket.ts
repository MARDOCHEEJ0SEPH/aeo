import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketState {
  connected: boolean;
  metrics: any;
  socket: Socket | null;
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    metrics: null,
    socket: null,
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setState((prev) => ({ ...prev, connected: true, socket }));
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('metrics:update', (data) => {
      setState((prev) => ({ ...prev, metrics: data }));
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event: string, data: any) => {
    if (state.socket?.connected) {
      state.socket.emit(event, data);
    }
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (state.socket) {
      state.socket.on(event, callback);
      return () => {
        state.socket?.off(event, callback);
      };
    }
  };

  return {
    ...state,
    emit,
    subscribe,
  };
}
