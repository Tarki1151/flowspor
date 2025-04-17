import React, { useState, useEffect } from 'react';
import MainNavigation from './MainNavigation';
import ThemeSettings from './ThemeSettings';
import AddMember from './AddMember';
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

import logo from './TARABYA MARTE-500x.png';

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
  const [screen, setScreen] = useState('members');
  const [navOpen, setNavOpen] = useState(window.innerWidth > 900);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setNavOpen(true);
      else setNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  // Logo header
  const logoHeader = (
    <div style={{textAlign:'center', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
      <img src={logo} alt="Tarabya Marte Fight Academy Logo" style={{maxWidth:'220px', height:'auto', aspectRatio:'1/1', objectFit:'contain'}} />
    </div>
  );

  // Scroll to top on screen change (mobile UX)
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <h2>{tr.appTitle}</h2>
        <div style={{display:'flex',gap:6}}>
          <button style={{background:'var(--primary)',color:'#fff',marginRight:8}} onClick={()=>setThemeOpen(true)} title="Tema Ayarları">🎨</button>
          <button style={{background:'#607d8b',marginRight:8}} onClick={()=>setShowPwChange(v=>!v)}>Şifre Değiştir</button>
          <button style={{background:'#d7263d'}} onClick={()=>{removeToken();setIsLoggedIn(false);}}>Çıkış</button>
        </div>
      </div>
      {themeOpen && <ThemeSettings onClose={()=>setThemeOpen(false)} />}
      <MainNavigation screen={screen} setScreen={setScreen} navOpen={navOpen} setNavOpen={setNavOpen} />
      {loading && <div className="loader" aria-label="Yükleniyor"></div>}

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
        <button style={{background:'var(--primary)',color:'#fff',borderRadius:8}} onClick={()=>setScreen('addmember')} title="Üye Ekle">➕</button>
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
          {/* Üye listeleme burada kalacak, üye ekleme yeni sayfada olacak */}
          <h3>{tr.memberList}</h3>
        </>
      )}
      {screen === 'addmember' && (
        <AddMember onSuccess={()=>setScreen('members')} />
      )}
      {screen === 'staff' && <StaffManagement />}

      {screen === 'performance' && <PerformanceManagement />}
      {screen === 'equipment' && <EquipmentManagement />}
      {screen === 'inventory' && <InventoryManagement />}
      {screen === 'reservation' && <ReservationManagement />}
      {screen === 'payments' && <Payments />}
      {screen === 'services' && <Services />}
      {screen === 'invoices' && <Invoices />}
      {screen === 'reports' && <Reports />}
      {screen === 'feedback' && <Feedback />}
      {screen === 'promotions' && <Promotions />}
      {screen === 'loyalty' && <Loyalty />}

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
                </tr>
              )) : <tr><td colSpan="5">Üye yok.</td></tr>}
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
import PerformanceManagement from './PerformanceManagement';
import EquipmentManagement from './EquipmentManagement';
import InventoryManagement from './InventoryManagement';
import ReservationManagement from './ReservationManagement';
import Payments from './Payments';
import Services from './Services';
import Invoices from './Invoices';
import Reports from './Reports';
import Feedback from './Feedback';
import Promotions from './Promotions';
import Loyalty from './Loyalty';

export default App;
