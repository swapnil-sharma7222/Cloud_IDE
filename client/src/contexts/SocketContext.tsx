import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams } from 'react-router-dom';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | undefined;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  userId: undefined,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { userId } = useParams<{ userId: string }>();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Create single socket connection with userId
    const socket = io('http://localhost:4200', {
      query: { userId },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, userId }}>
      {children}
    </SocketContext.Provider>
  );
};