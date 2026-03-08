/**
 * Socket.io Context for the driver app.
 * Connects using the same API base URL and auth token from AuthContext.
 * Exposes connection state and reconnection flag for UI feedback.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { io, Socket } from "socket.io-client";

import { useAuth } from "@/contexts/AuthContext";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  reconnecting: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  reconnecting: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { session, apiBaseUrl } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const token = session?.token;

  const destroySocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (mountedRef.current) {
      setSocket(null);
      setConnected(false);
      setReconnecting(false);
    }
  }, []);

  const initSocket = useCallback(() => {
    if (!token || !apiBaseUrl) return;

    destroySocket();

    const newSocket = io(apiBaseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      if (mountedRef.current) {
        setConnected(true);
        setReconnecting(false);
      }
    });

    newSocket.on("disconnect", () => {
      if (mountedRef.current) setConnected(false);
    });

    newSocket.on("connect_error", () => {
      if (mountedRef.current) setConnected(false);
    });

    newSocket.io.on("reconnect_attempt", () => {
      if (mountedRef.current) setReconnecting(true);
    });

    newSocket.io.on("reconnect", () => {
      if (mountedRef.current) {
        setConnected(true);
        setReconnecting(false);
      }
    });

    newSocket.io.on("reconnect_failed", () => {
      if (mountedRef.current) setReconnecting(false);
    });

    socketRef.current = newSocket;
    if (mountedRef.current) setSocket(newSocket);
  }, [token, apiBaseUrl, destroySocket]);

  useEffect(() => {
    initSocket();
    return () => destroySocket();
  }, [initSocket, destroySocket]);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active" && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      destroySocket();
    };
  }, [destroySocket]);

  return (
    <SocketContext.Provider value={{ socket, connected, reconnecting }}>
      {children}
    </SocketContext.Provider>
  );
}
