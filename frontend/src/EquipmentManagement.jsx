import { useState, useEffect } from 'react';
import { fetchEquipment, addEquipment, updateEquipment, deleteEquipment } from './api';

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({name:'',serial_number:'',purchase_date:'',status:'active',maintenance_interval:30});
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadEquipment(); }, []);

  async function loadEquipment() {
    setEquipment(await fetchEquipment());
  }
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    let res;
    if (editing) {
      res = await updateEquipment(editing, form);
    } else {
      res = await addEquipment(form);
    }
    if (res.error) setMessage(res.error);
    else {
      setMessage(editing ? 'Güncellendi.' : 'Eklendi.');
      setForm({name:'',serial_number:'',purchase_date:'',status:'active',maintenance_interval:30});
      setEditing(null);
      loadEquipment();
    }
  }
  async function handleDelete(id) {
    if (window.confirm('Bu ekipmanı silmek istiyor musunuz?')) {
      await deleteEquipment(id);
      loadEquipment();
    }
  }
  function handleEdit(eq) {
    setEditing(eq.id);
    setForm({
      name: eq.name,
      serial_number: eq.serial_number,
      purchase_date: eq.purchase_date,
      status: eq.status,
      maintenance_interval: eq.maintenance_interval
    });
  }
  return (
    <div>
      <h2>Ekipman Yönetimi</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>İsim</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Seri No</label>
          <input name="serial_number" value={form.serial_number} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Satın Alma</label>
          <input name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Durum</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Aktif</option>
            <option value="under maintenance">Bakımda</option>
          </select>
        </div>
        <div className="form-row">
          <label>Bakım Aralığı (gün)</label>
          <input name="maintenance_interval" type="number" value={form.maintenance_interval} onChange={handleChange} required />
        </div>
        <button type="submit">{editing ? 'Güncelle' : 'Ekle'}</button>
        {editing && <button type="button" onClick={()=>{setEditing(null);setForm({name:'',serial_number:'',purchase_date:'',status:'active',maintenance_interval:30});}}>İptal</button>}
        {message && <div className="message">{message}</div>}
      </form>
      <h3>Ekipman Listesi</h3>
      <table className="member-table">
        <thead>
          <tr>
            <th>İsim</th><th>Seri No</th><th>Satın Alma</th><th>Durum</th><th>Bakım Aralığı</th><th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {equipment && equipment.length > 0 ? equipment.map(eq => (
            <tr key={eq.id}>
              <td>{eq.name}</td><td>{eq.serial_number}</td><td>{eq.purchase_date}</td><td>{eq.status}</td><td>{eq.maintenance_interval}</td>
              <td>
                <button onClick={()=>handleEdit(eq)}>Düzenle</button>
                <button onClick={()=>handleDelete(eq.id)}>Sil</button>
              </td>
            </tr>
          )) : <tr><td colSpan="6">Ekipman yok.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
