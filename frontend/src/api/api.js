const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

/**
 * Fetch full chat history from the backend.
 * Used on mount so messages survive a page refresh.
 */
export async function fetchMessageHistory() {
  const res = await fetch(`${SERVER_URL}/api/messages`);
  if (!res.ok) {
    throw new Error(`Failed to load chat history (status ${res.status})`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || "Failed to load chat history");
  }
  return body.data;
}

/**
 * Fallback REST send, kept in case a client wants to send without
 * a live socket connection. The primary send path in the app uses
 * the socket directly for instant delivery + typing/ack support.
 */
export async function sendMessageRest(username, text) {
  const res = await fetch(`${SERVER_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, text }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send message (status ${res.status})`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || "Failed to send message");
  }
  return body.data;
}

export { SERVER_URL };
