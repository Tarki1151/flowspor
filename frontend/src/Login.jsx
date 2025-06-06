import { useState } from 'react';
import { setToken } from './auth';
import logo from './TARABYA MARTE-500x.png';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      onLogin();
    } else {
      setError(data.error || 'Giriş başarısız.');
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <div style={{textAlign:'center', marginBottom:'1.3rem'}}>
        <img src={logo} alt="Tarabya Marte Fight Academy Logo" style={{maxWidth:'200px', height:'auto', aspectRatio:'1/1', objectFit:'contain'}} />
      </div>
      <h2 className="login-title">Yönetici Girişi</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label className="login-label">Kullanıcı Adı</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label className="login-label">Şifre</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>Giriş</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div style={{marginTop:'1rem',color:'#888',fontSize:'0.95em'}}>Varsayılan: admin / admin123</div>
    </div>
  );
}
