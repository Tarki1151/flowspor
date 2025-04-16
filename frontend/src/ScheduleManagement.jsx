import { useState, useEffect } from 'react';
import { fetchStaff, fetchSchedules, addSchedule } from './api';

export default function ScheduleManagement() {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({start_time:'',end_time:'',status:'confirmed'});
  const [message, setMessage] = useState('');

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { if(selected) loadSchedules(selected); }, [selected]);

  async function loadStaff() {
    setStaff(await fetchStaff());
  }
  async function loadSchedules(id) {
    setSchedules(await fetchSchedules(id));
  }
  function handleChange(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const res = await addSchedule({staff_id: selected, ...form});
    if (res.error) setMessage(res.error);
    else {
      setMessage('Vardiya eklendi.');
      setForm({start_time:'',end_time:'',status:'confirmed'});
      loadSchedules(selected);
    }
  }
  return (
    <div>
      <h2>Vardiya Yönetimi</h2>
      <div className="form-row">
        <label>Personel</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Seçiniz</option>
          {staff.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </div>
      {selected && (
        <>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Başlangıç</label>
              <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Bitiş</label>
              <input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Durum</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="confirmed">Onaylı</option>
                <option value="canceled">İptal</option>
              </select>
            </div>
            <button type="submit">Ekle</button>
            {message && <div className="message">{message}</div>}
          </form>
          <h3>Vardiyalar</h3>
          <table className="member-table">
            <thead>
              <tr>
                <th>Başlangıç</th><th>Bitiş</th><th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {schedules && schedules.length > 0 ? schedules.map(s => (
                <tr key={s.id}>
                  <td>{s.start_time}</td><td>{s.end_time}</td><td>{s.status}</td>
                </tr>
              )) : <tr><td colSpan="3">Vardiya yok.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
