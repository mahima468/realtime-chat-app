import { io } from "socket.io-client";
import { SERVER_URL } from "../api/api";

// autoConnect is false so we only open the socket once the user has
// "logged in" with a username, and can cleanly reconnect otherwise.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
