import { useState, useEffect } from 'react';
import tr from './i18n';
import {
  fetchMembers,
  addMember,
  renewMember,
  cancelMember,
  deleteMember,
  getMember,
  changePassword
} from './api';
import Login from './Login';
import { getToken, removeToken } from './auth';
import './App.css';

function App() {
  const [members, setMembers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailMember, setDetailMember] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    membership_type: 'monthly',
    start_date: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) loadMembers();
  }, [isLoggedIn]);

  async function loadMembers() {
    setLoading(true);
    const data = await fetchMembers();
    setMembers(data);
    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    let errs = {};
    if (!form.first_name) errs.first_name = tr.validation.required;
    if (!form.last_name) errs.last_name = tr.validation.required;
    if (!form.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) errs.email = tr.validation.invalidEmail;
    if (!form.phone.match(/^\+?\d{10,14}$/)) errs.phone = tr.validation.invalidPhone;
    if (!form.membership_type) errs.membership_type = tr.validation.required;
    if (!form.start_date) errs.start_date = tr.validation.required;
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const res = await addMember(form);
    if (res.id) {
      setMessage(tr.registrationSuccess);
      setForm({
        first_name: '', last_name: '', email: '', phone: '', address: '', membership_type: 'monthly', start_date: ''
      });
      loadMembers();
    } else {
      setMessage(res.error || tr.registrationError);
    }
    setLoading(false);
  }

  async function handleRenew(id) {
    await renewMember(id);
    loadMembers();
  }

  async function handleCancel(id) {
    await cancelMember(id);
    loadMembers();
  }

  async function handleDelete(id) {
    if (window.confirm('Bu üyeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      await deleteMember(id);
      loadMembers();
    }
  }

  // Filtrelenmiş üyeler
  const filteredMembers = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.first_name.toLowerCase().includes(query) ||
      m.last_name.toLowerCase().includes(query) ||
      (m.email && m.email.toLowerCase().includes(query));
    const matchesStatus = statusFilter ? m.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Navigation state
  const [screen, setScreen] = useState('members');
  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <h2>{tr.appTitle}</h2>
        <div>
          <button style={{background:'#607d8b',marginRight:8}} onClick={()=>setShowPwChange(v=>!v)}>Şifre Değiştir</button>
          <button style={{background:'#d7263d'}} onClick={()=>{removeToken();setIsLoggedIn(false);}}>Çıkış</button>
        </div>
      </div>
      <nav style={{marginBottom:'1rem',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
        <button onClick={()=>setScreen('members')} style={{fontWeight:screen==='members'?'bold':'normal'}}>Üye Yönetimi</button>
        <button onClick={()=>setScreen('staff')} style={{fontWeight:screen==='staff'?'bold':'normal'}}>Personel</button>
        <button onClick={()=>setScreen('schedule')} style={{fontWeight:screen==='schedule'?'bold':'normal'}}>Vardiya</button>
        <button onClick={()=>setScreen('performance')} style={{fontWeight:screen==='performance'?'bold':'normal'}}>Performans</button>
        <button onClick={()=>setScreen('equipment')} style={{fontWeight:screen==='equipment'?'bold':'normal'}}>Ekipman</button>
        <button onClick={()=>setScreen('inventory')} style={{fontWeight:screen==='inventory'?'bold':'normal'}}>Envanter</button>
        <button onClick={()=>setScreen('reservation')} style={{fontWeight:screen==='reservation'?'bold':'normal'}}>Rezervasyon</button>
        <button onClick={()=>setScreen('payments')} style={{fontWeight:screen==='payments'?'bold':'normal'}}>Ödemeler</button>
        <button onClick={()=>setScreen('services')} style={{fontWeight:screen==='services'?'bold':'normal'}}>Hizmetler</button>
        <button onClick={()=>setScreen('invoices')} style={{fontWeight:screen==='invoices'?'bold':'normal'}}>Faturalar</button>
      </nav>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
        <input
          type="text"
          placeholder="İsim, soyisim veya e-posta ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{flex:1,padding:'0.5rem',borderRadius:6,border:'1px solid #bbb'}}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{padding:'0.5rem',borderRadius:6,border:'1px solid #bbb'}}
        >
          <option value="">Tümü</option>
          <option value="active">{tr.active}</option>
          <option value="expired">{tr.expired}</option>
          <option value="canceled">{tr.canceled}</option>
        </select>
      </div>
      {showPwChange && (
        <form onSubmit={async e=>{
          e.preventDefault();
          setPwMsg("");
          const res = await changePassword(pwOld, pwNew);
          setPwMsg(res.mesaj || res.error);
          if (res.mesaj) setPwOld("");
        }} className="form" style={{marginBottom:16}}>
          <h3>Şifre Değiştir</h3>
          <div className="form-row">
            <label>Mevcut Şifre</label>
            <input type="password" value={pwOld} onChange={e=>setPwOld(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Yeni Şifre</label>
            <input type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} />
          </div>
          <button type="submit">Kaydet</button>
          {pwMsg && <div className={pwMsg.includes('başarı') ? 'message':'error'}>{pwMsg}</div>}
        </form>
      )}
      {screen === 'members' && (
        <>
      <form onSubmit={handleSubmit} className="form">
        <h3>{tr.addMember}</h3>
        <div className="form-row">
          <label>{tr.firstName}</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} />
          {errors.first_name && <span className="error">{errors.first_name}</span>}
        </div>
        <div className="form-row">
          <label>{tr.lastName}</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} />
          {errors.last_name && <span className="error">{errors.last_name}</span>}
        </div>
        <div className="form-row">
          <label>{tr.email}</label>
          <input name="email" value={form.email} onChange={handleChange} />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <div className="form-row">
          <label>{tr.phone}</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>
        <div className="form-row">
          <label>{tr.address}</label>
          <input name="address" value={form.address} onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>{tr.membershipType}</label>
          <select name="membership_type" value={form.membership_type} onChange={handleChange}>
            <option value="monthly">{tr.monthly}</option>
            <option value="annual">{tr.annual}</option>
          </select>
        </div>
        <div className="form-row">
          <label>{tr.startDate}</label>
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} />
          {errors.start_date && <span className="error">{errors.start_date}</span>}
        </div>
        <button type="submit" disabled={loading}>{tr.save}</button>
        {message && <div className="message">{message}</div>}
      </form>
      <h3>{tr.memberList}</h3>
      </>
      )}
      {screen === 'staff' && <StaffManagement />}
      {screen === 'schedule' && <ScheduleManagement />}
      {screen === 'performance' && <PerformanceManagement />}
      {screen === 'equipment' && <EquipmentManagement />}
      {screen === 'inventory' && <InventoryManagement />}
      {screen === 'reservation' && <ReservationManagement />}
      {screen === 'payments' && <Payments />}
      {screen === 'services' && <Services />}
      {screen === 'invoices' && <Invoices />}

      {loading ? <div>Yükleniyor...</div> : (
        <div className="table-scroll">
          <table className="member-table">
            <thead>
              <tr>
                <th>{tr.firstName}</th>
                <th>{tr.lastName}</th>
                <th>{tr.email}</th>
                <th>{tr.phone}</th>
                <th>{tr.membershipType}</th>
                <th>{tr.startDate}</th>
                <th>{tr.endDate}</th>
                <th>{tr.status}</th>
                <th>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers && filteredMembers.length > 0 ? filteredMembers.map(m => (
                <tr key={m.id}>
                  <td>{m.first_name}</td>
                  <td>{m.last_name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone}</td>
                  <td>{m.membership_type === 'monthly' ? tr.monthly : tr.annual}</td>
                  <td>{m.start_date}</td>
                  <td>{m.end_date}</td>
                  <td>{tr[m.status] || m.status}</td>
                  <td>
                    <button onClick={() => handleRenew(m.id)} disabled={m.status !== 'expired'}>{tr.renew}</button>
                    <button onClick={() => handleCancel(m.id)} disabled={m.status === 'canceled'}>{tr.cancel}</button>
                    <button onClick={() => handleDelete(m.id)}>{tr.delete}</button>
                    <button style={{background:'#607d8b'}} onClick={async()=>{
                      const data = await getMember(m.id);
                      setDetailMember(data);
                      setDetailOpen(true);
                    }}>{tr.details}</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="9">Üye yok.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {detailOpen && detailMember && (
        <div className="modal-bg" onClick={()=>setDetailOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Üye Detayları</h3>
            <div className="modal-row"><b>{tr.firstName}:</b> {detailMember.first_name}</div>
            <div className="modal-row"><b>{tr.lastName}:</b> {detailMember.last_name}</div>
            <div className="modal-row"><b>{tr.email}:</b> {detailMember.email}</div>
            <div className="modal-row"><b>{tr.phone}:</b> {detailMember.phone}</div>
            <div className="modal-row"><b>{tr.address}:</b> {detailMember.address}</div>
            <div className="modal-row"><b>{tr.membershipType}:</b> {detailMember.membership_type === 'monthly' ? tr.monthly : tr.annual}</div>
            <div className="modal-row"><b>{tr.startDate}:</b> {detailMember.start_date}</div>
            <div className="modal-row"><b>{tr.endDate}:</b> {detailMember.end_date}</div>
            <div className="modal-row"><b>{tr.status}:</b> {tr[detailMember.status] || detailMember.status}</div>
            {detailMember.cancellation_date && (
              <div className="modal-row"><b>İptal Tarihi:</b> {detailMember.cancellation_date}</div>
            )}
            <button onClick={()=>setDetailOpen(false)}>{tr.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}

import StaffManagement from './StaffManagement';
import ScheduleManagement from './ScheduleManagement';
import PerformanceManagement from './PerformanceManagement';
import EquipmentManagement from './EquipmentManagement';
import InventoryManagement from './InventoryManagement';
import ReservationManagement from './ReservationManagement';
import Payments from './Payments';
import Services from './Services';
import Invoices from './Invoices';

export default App;
