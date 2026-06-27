import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { BASE_URL } from '../api';

export default function Editor() {
  const { room_code } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [docMeta, setDocMeta] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [showAccess, setShowAccess] = useState(false);
  const [accessInput, setAccessInput] = useState('');
  const [accessMsg, setAccessMsg] = useState('');
  const socketRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    // Fetch doc meta
    api.get(`/docs/room/${room_code}`)
      .then(({ data }) => setDocMeta(data))
      .catch(() => navigate('/dashboard'));

    // Connect socket
    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('join-room', room_code);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));

    socket.on('load-document', (initialContent) => {
      setContent(initialContent || '');
    });

    socket.on('receive-changes', (newContent) => {
      isRemoteUpdate.current = true;
      setContent(newContent);
    });

    socket.on('room-users', (users) => setOnlineUsers(users));

    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/dashboard');
    });

    return () => socket.disconnect();
  }, [room_code]);

  const handleChange = useCallback((e) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    const val = e.target.value;
    setContent(val);
    socketRef.current?.emit('edit-text', { room_code, content: val });
  }, [room_code]);

  const grantAccess = async (e) => {
    e.preventDefault();
    setAccessMsg('');
    try {
      await api.post('/docs/room/access/grant', {
        room_code,
        user_id_to_add: accessInput.trim(),
      });
      setAccessMsg('Access granted.');
      setAccessInput('');
    } catch (err) {
      setAccessMsg(err.response?.data?.message || 'Failed.');
    }
  };

  const statusColor = { connected: '#22c55e', disconnected: '#ef4444', connecting: '#f59e0b', error: '#ef4444' };

  return (
    <div className="editor-page">
      <header className="editor-header">
        <button className="btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div className="doc-info">
          <span className="doc-title">{docMeta?.title || 'Loading...'}</span>
          <span className="room-code-badge">{room_code}</span>
        </div>

        <div className="editor-controls">
          <div className="status-indicator">
            <span className="status-dot" style={{ background: statusColor[status] }} />
            <span className="status-text">{status}</span>
          </div>

          <div className="presence">
            <AnimatePresence>
              {onlineUsers.slice(0, 5).map((uid, i) => (
                <motion.div
                  key={uid}
                  className="avatar"
                  title={uid}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  style={{ zIndex: 10 - i }}
                >
                  {uid.slice(-2).toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>
            {onlineUsers.length > 5 && (
              <div className="avatar avatar-overflow">+{onlineUsers.length - 5}</div>
            )}
          </div>

          <button className="btn-outline sm" onClick={() => setShowAccess(v => !v)}>
            Share
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAccess && (
          <motion.div
            className="access-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={grantAccess} className="access-form">
              <input
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                placeholder="User ID to grant access"
                required
              />
              <button className="btn-primary sm" type="submit">Grant</button>
            </form>
            {accessMsg && <span className="access-msg">{accessMsg}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="editor-body">
        <textarea
          className="editor-textarea"
          value={content}
          onChange={handleChange}
          placeholder="Start writing..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
