import { useState, useEffect } from 'react';
import { fetchMembers, addPayment, fetchPayments } from './api';

export default function Payments() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({amount:'',payment_type:'cash'});
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if(selected) loadPayments(selected); }, [selected]);

  async function loadMembers() {
    setMembers(await fetchMembers());
  }
  async function loadPayments(member_id) {
    setPayments(await fetchPayments(member_id));
  }
  function handleChange(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const res = await addPayment({member_id: selected, ...form});
    if (res.error) setMessage(res.error);
    else {
      setMessage('Ödeme kaydedildi.');
      setForm({amount:'',payment_type:'cash'});
      loadPayments(selected);
    }
  }
  return (
    <div>
      <h2>Ödemeler</h2>
      <div className="form-row">
        <label>Üye</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Seçiniz</option>
          {members.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      {selected && (
        <>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Tutar</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Ödeme Tipi</label>
              <select name="payment_type" value={form.payment_type} onChange={handleChange}>
                <option value="cash">Nakit</option>
                <option value="credit card">Kredi Kartı</option>
              </select>
            </div>
            <button type="submit">Ekle</button>
            {message && <div className="message">{message}</div>}
          </form>
          <h3>Geçmiş Ödemeler</h3>
          <table className="member-table">
            <thead>
              <tr><th>Tarih</th><th>Tutar</th><th>Tip</th></tr>
            </thead>
            <tbody>
              {payments && payments.length > 0 ? payments.map(p => (
                <tr key={p.id}>
                  <td>{p.date}</td><td>{p.amount}</td><td>{p.payment_type}</td>
                </tr>
              )) : <tr><td colSpan="3">Kayıt yok.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
