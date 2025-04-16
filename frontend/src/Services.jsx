import { useState, useEffect } from 'react';
import { fetchServices, addService, fetchMembers, addServicePayment } from './api';

export default function Services() {
  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({name:'',price:''});
  const [payForm, setPayForm] = useState({member_id:'',service_id:'',payment_type:'cash'});
  const [message, setMessage] = useState('');

  useEffect(() => { loadServices(); loadMembers(); }, []);

  async function loadServices() { setServices(await fetchServices()); }
  async function loadMembers() { setMembers(await fetchMembers()); }

  function handleChange(e) { setForm({...form, [e.target.name]: e.target.value}); }
  function handlePayChange(e) { setPayForm({...payForm, [e.target.name]: e.target.value}); }

  async function handleSubmit(e) {
    e.preventDefault(); setMessage('');
    const res = await addService(form);
    if (res.error) setMessage(res.error);
    else { setMessage('Hizmet eklendi.'); setForm({name:'',price:''}); loadServices(); }
  }
  async function handlePaySubmit(e) {
    e.preventDefault(); setMessage('');
    const res = await addServicePayment(payForm);
    if (res.error) setMessage(res.error);
    else { setMessage('Hizmet ödemesi kaydedildi.'); setPayForm({member_id:'',service_id:'',payment_type:'cash'}); }
  }

  return (
    <div>
      <h2>Hizmetler</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>Hizmet Adı</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Fiyat</label>
          <input name="price" type="number" value={form.price} onChange={handleChange} required />
        </div>
        <button type="submit">Ekle</button>
      </form>
      <h3>Hizmet Listesi</h3>
      <table className="member-table">
        <thead>
          <tr><th>Ad</th><th>Fiyat</th></tr>
        </thead>
        <tbody>
          {services && services.length > 0 ? services.map(s => (
            <tr key={s.id}><td>{s.name}</td><td>{s.price}</td></tr>
          )) : <tr><td colSpan="2">Kayıt yok.</td></tr>}
        </tbody>
      </table>
      <h3>Hizmet Ödemesi</h3>
      <form onSubmit={handlePaySubmit} className="form">
        <div className="form-row">
          <label>Üye</label>
          <select name="member_id" value={payForm.member_id} onChange={handlePayChange} required>
            <option value="">Seçiniz</option>
            {members.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </div>
        <div className="form-row">
          <label>Hizmet</label>
          <select name="service_id" value={payForm.service_id} onChange={handlePayChange} required>
            <option value="">Seçiniz</option>
            {services.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        <div className="form-row">
          <label>Ödeme Tipi</label>
          <select name="payment_type" value={payForm.payment_type} onChange={handlePayChange}>
            <option value="cash">Nakit</option>
            <option value="credit card">Kredi Kartı</option>
          </select>
        </div>
        <button type="submit">Kaydet</button>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
}
