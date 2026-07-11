// Expo automatically inlines any env var prefixed with EXPO_PUBLIC_ at build time.
// Set this in mobile/.env to your computer's LAN IP when testing on a physical
// device with Expo Go (see README for details) - "localhost" on a phone means
// the phone itself, not your dev machine.
export const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:5000";

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
