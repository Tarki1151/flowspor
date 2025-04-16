import { useState, useEffect } from 'react';
import { fetchPromotions, addPromotion, deletePromotion } from './api';

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState({ name: '', discount: '', start_date: '', end_date: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { loadPromotions(); }, []);
  async function loadPromotions() { setPromotions(await fetchPromotions()); }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function handleSubmit(e) {
    e.preventDefault(); setMessage('');
    const res = await addPromotion(form);
    if (!res.error) {
      setMessage('Promosyon eklendi!');
      setForm({ name: '', discount: '', start_date: '', end_date: '' });
      loadPromotions();
    } else setMessage(res.error);
  }
  async function handleDelete(id) {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
    await deletePromotion(id); loadPromotions();
  }
  return (
    <div>
      <h2>Promosyonlar</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>Ad</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>İndirim (%)</label>
          <input name="discount" type="number" value={form.discount} onChange={handleChange} required min={1} max={100} />
        </div>
        <div className="form-row">
          <label>Başlangıç</label>
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Bitiş</label>
          <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
        </div>
        <button type="submit">Ekle</button>
        {message && <div className="message">{message}</div>}
      </form>
      <h3>Mevcut Promosyonlar</h3>
      <table className="member-table">
        <thead><tr><th>Ad</th><th>İndirim</th><th>Başlangıç</th><th>Bitiş</th><th></th></tr></thead>
        <tbody>
          {promotions && promotions.length > 0 ? promotions.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.discount}%</td>
              <td>{p.start_date}</td>
              <td>{p.end_date}</td>
              <td><button onClick={()=>handleDelete(p.id)}>Sil</button></td>
            </tr>
          )) : <tr><td colSpan="5">Kayıt yok.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
