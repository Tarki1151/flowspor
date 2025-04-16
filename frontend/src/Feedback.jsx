import { useState, useEffect } from 'react';
import { fetchMembers, submitFeedback, fetchFeedback } from './api';

export default function Feedback() {
  const [members, setMembers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [form, setForm] = useState({ member_id: '', comment: '', rating: 5, anonymous: false });
  const [message, setMessage] = useState('');

  useEffect(() => { loadMembers(); loadFeedbacks(); }, []);
  async function loadMembers() { setMembers(await fetchMembers()); }
  async function loadFeedbacks() { setFeedbacks(await fetchFeedback()); }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }
  async function handleSubmit(e) {
    e.preventDefault(); setMessage('');
    const res = await submitFeedback(form);
    if (!res.error) {
      setMessage('Geri bildirim kaydedildi!');
      setForm({ member_id: '', comment: '', rating: 5, anonymous: false });
      loadFeedbacks();
    } else setMessage(res.error);
  }
  return (
    <div>
      <h2>Geri Bildirim</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>Üye</label>
          <select name="member_id" value={form.member_id} onChange={handleChange} disabled={form.anonymous} required={!form.anonymous}>
            <option value="">Seçiniz</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Yorum</label>
          <textarea name="comment" value={form.comment} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Puan</label>
          <select name="rating" value={form.rating} onChange={handleChange}>
            {[5,4,3,2,1].map(n=>(<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} /> Anonim gönder
          </label>
        </div>
        <button type="submit">Gönder</button>
        {message && <div className="message">{message}</div>}
      </form>
      <h3>Geri Bildirimler</h3>
      <table className="member-table">
        <thead><tr><th>Tarih</th><th>Üye</th><th>Puan</th><th>Yorum</th></tr></thead>
        <tbody>
          {feedbacks && feedbacks.length > 0 ? feedbacks.map(f => (
            <tr key={f.id}>
              <td>{f.date}</td>
              <td>{f.anonymous ? 'Anonim' : (members.find(m=>m.id===f.member_id)?.name || 'Üye')}</td>
              <td>{f.rating}</td>
              <td>{f.comment}</td>
            </tr>
          )) : <tr><td colSpan="4">Kayıt yok.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
