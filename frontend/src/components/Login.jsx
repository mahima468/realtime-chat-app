import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    if (trimmed.length > 24) {
      setError("Username must be 24 characters or fewer.");
      return;
    }
    setError("");
    onLogin(trimmed);
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Realtime Chat</h1>
        <p className="login-subtitle">Pick a username to join the room.</p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. alice"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit">Join chat</button>
      </form>
    </div>
  );
}
