import { useState, useEffect } from 'react';
import { fetchInventory, updateInventory } from './api';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({quantity:'',min_quantity:''});
  const [message, setMessage] = useState('');

  useEffect(() => { loadInventory(); }, []);

  async function loadInventory() {
    const res = await fetchInventory();
    setInventory(res.inventory);
    setLowStock(res.lowStock);
  }
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleEdit(eq) {
    setEditId(eq.id);
    setForm({quantity: eq.quantity || '', min_quantity: eq.min_quantity || ''});
  }
  async function handleSubmit(e, equipment_id) {
    e.preventDefault();
    setMessage('');
    const res = await updateInventory(equipment_id, form);
    if (res.error) setMessage(res.error);
    else {
      setMessage('Güncellendi.');
      setEditId(null);
      setForm({quantity:'',min_quantity:''});
      loadInventory();
    }
  }
  return (
    <div>
      <h2>Envanter Yönetimi</h2>
      {lowStock.length > 0 && (
        <div className="alert">Düşük stokta ekipman: {lowStock.map(eq=>eq.name).join(', ')}</div>
      )}
      <table className="member-table">
        <thead>
          <tr>
            <th>İsim</th><th>Seri No</th><th>Stok</th><th>Min Stok</th><th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {inventory && inventory.length > 0 ? inventory.map(eq => (
            <tr key={eq.id}>
              <td>{eq.name}</td><td>{eq.serial_number}</td>
              <td>{editId===eq.id ? (
                <form onSubmit={e=>handleSubmit(e, eq.id)} style={{display:'inline'}}>
                  <input name="quantity" type="number" value={form.quantity} onChange={handleChange} style={{width:60}} required />
                </form>
              ) : eq.quantity}
              </td>
              <td>{editId===eq.id ? (
                <form onSubmit={e=>handleSubmit(e, eq.id)} style={{display:'inline'}}>
                  <input name="min_quantity" type="number" value={form.min_quantity} onChange={handleChange} style={{width:60}} required />
                </form>
              ) : eq.min_quantity}
              </td>
              <td>
                {editId===eq.id ? (
                  <button onClick={()=>{setEditId(null);setForm({quantity:'',min_quantity:''});}}>İptal</button>
                ) : (
                  <button onClick={()=>handleEdit(eq)}>Düzenle</button>
                )}
              </td>
            </tr>
          )) : <tr><td colSpan="5">Envanter yok.</td></tr>}
        </tbody>
      </table>
      {message && <div className="message">{message}</div>}
    </div>
  );
}
