import { io } from 'socket.io-client';
export const socket = io('http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket']
});

// Add connection status listeners
socket.on('connect', () => console.log('Connected to WebSocket'));
socket.on('disconnect', () => console.log('Disconnected from WebSocket'));
socket.on('connect_error', (err) => console.log('Connection error:', err));