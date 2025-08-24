import { io } from "socket.io-client";

export function createSocket() {
  const token = localStorage.getItem("token");
  const socket = io("http://localhost:8500", {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function decodeUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}
