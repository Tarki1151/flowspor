import { useState, useEffect } from 'react';
import { fetchMembers, fetchInvoices, downloadInvoicePDF } from './api';

export default function Invoices() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState('');
  const [invoices, setInvoices] = useState([]);

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if(selected) loadInvoices(selected); }, [selected]);

  async function loadMembers() {
    setMembers(await fetchMembers());
  }
  async function loadInvoices(member_id) {
    setInvoices(await fetchInvoices(member_id));
  }
  async function handleDownload(invoice_id) {
    await downloadInvoicePDF(invoice_id);
  }
  return (
    <div>
      <h2>Faturalar</h2>
      <div className="form-row">
        <label>Üye</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Seçiniz</option>
          {members.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      {selected && (
        <>
          <h3>Fatura Listesi</h3>
          <table className="member-table">
            <thead>
              <tr><th>Tarih</th><th>Tutar</th><th>PDF</th></tr>
            </thead>
            <tbody>
              {invoices && invoices.length > 0 ? invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.date}</td><td>{inv.amount}</td>
                  <td><button onClick={()=>handleDownload(inv.id)}>PDF İndir</button></td>
                </tr>
              )) : <tr><td colSpan="3">Kayıt yok.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
