import React, { useMemo, useState } from 'react';
import '../styles/UserModules.css';

const initialTicket = {
  subject: '',
  priority: 'medium',
  message: '',
};

function UserSupportPage() {
  const [ticket, setTicket] = useState(initialTicket);
  const [tickets, setTickets] = useState(() => {
    const raw = window.localStorage.getItem('mm_support_tickets');
    return raw ? JSON.parse(raw) : [];
  });

  const hasTickets = useMemo(() => tickets.length > 0, [tickets.length]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      id: `${Date.now()}`,
      ...ticket,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    const next = [payload, ...tickets];
    setTickets(next);
    window.localStorage.setItem('mm_support_tickets', JSON.stringify(next));
    setTicket(initialTicket);
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Support</h1>
        <p>Raise and track support requests.</p>
      </header>

      <form className="module-form" onSubmit={handleSubmit}>
        <label>
          Subject
          <input value={ticket.subject} onChange={(event) => setTicket({ ...ticket, subject: event.target.value })} required />
        </label>
        <label>
          Priority
          <select value={ticket.priority} onChange={(event) => setTicket({ ...ticket, priority: event.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Message
          <textarea rows={3} value={ticket.message} onChange={(event) => setTicket({ ...ticket, message: event.target.value })} required />
        </label>
        <div className="module-actions">
          <button type="submit">Raise Ticket</button>
        </div>
      </form>

      <div className="module-list">
        {!hasTickets ? (
          <div className="module-card">No tickets yet.</div>
        ) : tickets.map((item) => (
          <div key={item.id} className="module-item">
            <div>
              <strong>{item.subject}</strong>
              <div className="module-meta">{item.priority.toUpperCase()} • {item.message}</div>
            </div>
            <span className="module-badge">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserSupportPage;
