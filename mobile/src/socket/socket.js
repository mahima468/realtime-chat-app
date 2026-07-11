import { io } from "socket.io-client";
import { SERVER_URL } from "../api/api";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
