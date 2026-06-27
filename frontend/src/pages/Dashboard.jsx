import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newDoc, setNewDoc] = useState({ name: '', title: '' });
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/docs/my-rooms');
      setRooms(data.documents);
    } catch {
      setError('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/docs/create', newDoc);
      navigate(`/editor/${data.doc_created.room_code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim()) navigate(`/editor/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <span className="logo">INKSYNC</span>
        <button className="btn-ghost" onClick={logout}>Sign out</button>
      </header>

      <main className="dash-main">
        <div className="dash-actions">
          <form onSubmit={joinRoom} className="join-form">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter room code"
              maxLength={6}
              className="code-input"
            />
            <button className="btn-primary" type="submit">Join</button>
          </form>

          <button className="btn-outline" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Cancel' : '+ New room'}
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.form
              className="create-form"
              onSubmit={createRoom}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <input
                placeholder="Document name"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                required
              />
              <input
                placeholder="Title (optional)"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              />
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create room'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && <p className="error-msg">{error}</p>}

        <section className="rooms-section">
          <h2 className="section-label">My rooms</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : rooms.length === 0 ? (
            <p className="muted">No rooms yet. Create one to get started.</p>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.room_code}
                  className="room-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/editor/${room.room_code}`)}
                >
                  <p className="room-title">{room.title}</p>
                  <span className="room-code">{room.room_code}</span>
                  <p className="room-meta">{room.authorized_users?.length || 0} member{room.authorized_users?.length !== 1 ? 's' : ''}</p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
