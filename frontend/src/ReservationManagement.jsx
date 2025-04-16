import { useState, useEffect } from 'react';
import { fetchEquipment, fetchMembers, fetchReservations, addReservation } from './api';

export default function ReservationManagement() {
  const [equipment, setEquipment] = useState([]);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState('');
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState({member_id:'',start_time:'',end_time:''});
  const [message, setMessage] = useState('');

  useEffect(() => { loadEquipment(); loadMembers(); }, []);
  useEffect(() => { if(selected) loadReservations(selected); }, [selected]);

  async function loadEquipment() {
    setEquipment(await fetchEquipment());
  }
  async function loadMembers() {
    setMembers(await fetchMembers());
  }
  async function loadReservations(equipment_id) {
    setReservations(await fetchReservations(equipment_id));
  }
  function handleChange(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const res = await addReservation({equipment_id: selected, ...form});
    if (res.error) setMessage(res.error);
    else {
      setMessage('Rezervasyon eklendi.');
      setForm({member_id:'',start_time:'',end_time:''});
      loadReservations(selected);
    }
  }
  return (
    <div>
      <h2>Ekipman Rezervasyonları</h2>
      <div className="form-row">
        <label>Ekipman</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Seçiniz</option>
          {equipment.map(eq=>(<option key={eq.id} value={eq.id}>{eq.name}</option>))}
        </select>
      </div>
      {selected && (
        <>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Üye</label>
              <select name="member_id" value={form.member_id} onChange={handleChange} required>
                <option value="">Seçiniz</option>
                {members.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
            <div className="form-row">
              <label>Başlangıç</label>
              <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Bitiş</label>
              <input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required />
            </div>
            <button type="submit">Ekle</button>
            {message && <div className="message">{message}</div>}
          </form>
          <h3>Rezervasyonlar</h3>
          <table className="member-table">
            <thead>
              <tr>
                <th>Üye</th><th>Başlangıç</th><th>Bitiş</th>
              </tr>
            </thead>
            <tbody>
              {reservations && reservations.length > 0 ? reservations.map(r => (
                <tr key={r.id}>
                  <td>{members.find(m=>m.id===r.member_id)?.name || r.member_id}</td><td>{r.start_time}</td><td>{r.end_time}</td>
                </tr>
              )) : <tr><td colSpan="3">Rezervasyon yok.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
