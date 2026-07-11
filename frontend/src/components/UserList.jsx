export default function UserList({ onlineUsers, currentUsername, connected }) {
  return (
    <aside className="user-list">
      <div className="user-list-header">
        <span
          className={`connection-dot ${connected ? "online" : "offline"}`}
        />
        {connected ? "Connected" : "Reconnecting..."}
      </div>
      <h3>Online ({onlineUsers.length})</h3>
      <ul>
        {onlineUsers.map((name) => (
          <li key={name} className={name === currentUsername ? "me" : ""}>
            <span className="status-dot" />
            {name}
            {name === currentUsername && " (you)"}
          </li>
        ))}
      </ul>
    </aside>
  );
}
