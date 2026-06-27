import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);
        setMode('login');
        setForm({ name: '', email: '', password: '' });
        return;
      }
      const { data } = await api.post('/auth/login', form);
      login(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="auth-header">
          <span className="logo">INKSYNC</span>
          <p className="auth-sub">Write together, in real time.</p>
        </div>

        <div className="mode-toggle">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              className={`toggle-btn ${mode === m ? 'active' : ''}`}
              onClick={() => { setMode(m); setError(''); }}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={submit}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'register' && (
              <div className="field">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handle} placeholder="Your name" required />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
