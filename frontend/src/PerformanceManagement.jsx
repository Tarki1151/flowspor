import { useState, useEffect } from 'react';
import { fetchStaff, fetchPerformance, addPerformance, fetchPerformanceAverage } from './api';

export default function PerformanceManagement() {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState('');
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({date:'',hours_worked:'',feedback:''});
  const [message, setMessage] = useState('');
  const [averages, setAverages] = useState([]);
  const [avgType, setAvgType] = useState('week');

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { if(selected) { loadRecords(selected); loadAverages(selected, avgType); } }, [selected, avgType]);

  async function loadStaff() {
    setStaff(await fetchStaff());
  }
  async function loadRecords(id) {
    setRecords(await fetchPerformance(id));
  }
  async function loadAverages(id, type) {
    setAverages(await fetchPerformanceAverage(id, type));
  }
  function handleChange(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const res = await addPerformance({staff_id: selected, ...form});
    if (res.error) setMessage(res.error);
    else {
      setMessage('Kayıt eklendi.');
      setForm({date:'',hours_worked:'',feedback:''});
      loadRecords(selected);
      loadAverages(selected, avgType);
    }
  }
  return (
    <div>
      <h2>Performans Takibi</h2>
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
              <label>Tarih</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Çalışılan Saat</label>
              <input name="hours_worked" type="number" value={form.hours_worked} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Geri Bildirim</label>
              <input name="feedback" value={form.feedback} onChange={handleChange} />
            </div>
            <button type="submit">Ekle</button>
            {message && <div className="message">{message}</div>}
          </form>
          <h3>Performans Kayıtları</h3>
          <table className="member-table">
            <thead>
              <tr>
                <th>Tarih</th><th>Saat</th><th>Geri Bildirim</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? records.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.hours_worked}</td><td>{r.feedback}</td>
                </tr>
              )) : <tr><td colSpan="3">Kayıt yok.</td></tr>}
            </tbody>
          </table>
          <h3>Ortalama Saat</h3>
          <div className="form-row">
            <label>Tip</label>
            <select value={avgType} onChange={e=>setAvgType(e.target.value)}>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
            </select>
          </div>
          <table className="member-table">
            <thead>
              <tr><th>Dönem</th><th>Ortalama Saat</th></tr>
            </thead>
            <tbody>
              {averages && averages.length > 0 ? averages.map(a => (
                <tr key={a.period}><td>{a.period}</td><td>{parseFloat(a.avg_hours).toFixed(2)}</td></tr>
              )) : <tr><td colSpan="2">Veri yok.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
