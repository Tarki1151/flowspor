import { useState, useEffect } from 'react';
import { fetchStaff, addStaff, updateStaff, deleteStaff } from './api';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({name:'',role:'',email:'',phone:'',start_date:'',salary:''});
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const data = await fetchStaff();
    setStaff(data);
  }
  function handleChange(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    let res;
    if (editing) {
      res = await updateStaff(editing, form);
    } else {
      res = await addStaff(form);
    }
    if (res.error) setMessage(res.error);
    else {
      setMessage(editing ? 'Güncellendi.' : 'Eklendi.');
      setForm({name:'',role:'',email:'',phone:'',start_date:'',salary:''});
      setEditing(null);
      loadStaff();
    }
  }
  async function handleDelete(id) {
    if (window.confirm('Bu personeli silmek istiyor musunuz?')) {
      await deleteStaff(id);
      loadStaff();
    }
  }
  function handleEdit(staff) {
    setEditing(staff.id);
    setForm({
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      start_date: staff.start_date,
      salary: staff.salary
    });
  }
  return (
    <div>
      <h2>Personel Yönetimi</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>İsim</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Rol</label>
          <input name="role" value={form.role} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>E-posta</label>
          <input name="email" value={form.email} onChange={handleChange} required type="email" />
        </div>
        <div className="form-row">
          <label>Telefon</label>
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>İşe Başlama</label>
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Maaş</label>
          <input name="salary" type="number" value={form.salary} onChange={handleChange} required />
        </div>
        <button type="submit">{editing ? 'Güncelle' : 'Ekle'}</button>
        {editing && <button type="button" onClick={()=>{setEditing(null);setForm({name:'',role:'',email:'',phone:'',start_date:'',salary:''});}}>İptal</button>}
        {message && <div className="message">{message}</div>}
      </form>
      <h3>Personel Listesi</h3>
      <table className="member-table">
        <thead>
          <tr>
            <th>İsim</th><th>Rol</th><th>E-posta</th><th>Telefon</th><th>Başlangıç</th><th>Maaş</th><th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {staff && staff.length > 0 ? staff.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td><td>{s.role}</td><td>{s.email}</td><td>{s.phone}</td><td>{s.start_date}</td><td>{s.salary}</td>
              <td>
                <button onClick={()=>handleEdit(s)}>Düzenle</button>
                <button onClick={()=>handleDelete(s.id)}>Sil</button>
              </td>
            </tr>
          )) : <tr><td colSpan="7">Personel yok.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
