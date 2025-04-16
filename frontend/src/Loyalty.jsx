import { useState, useEffect } from 'react';
import { fetchMembers, fetchLoyalty, awardLoyalty, redeemLoyalty } from './api';

export default function Loyalty() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState('');
  const [loyalty, setLoyalty] = useState({ points: 0, rewards: '' });
  const [awardPoints, setAwardPoints] = useState('');
  const [redeem, setRedeem] = useState({ points: '', reward: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if(selected) loadLoyalty(selected); }, [selected]);

  async function loadMembers() { setMembers(await fetchMembers()); }
  async function loadLoyalty(id) { setLoyalty(await fetchLoyalty(id)); }

  async function handleAward(e) {
    e.preventDefault(); setMessage('');
    const res = await awardLoyalty(selected, parseInt(awardPoints, 10));
    if (!res.error) {
      setMessage('Puan eklendi!');
      setAwardPoints('');
      loadLoyalty(selected);
    } else setMessage(res.error);
  }
  async function handleRedeem(e) {
    e.preventDefault(); setMessage('');
    const res = await redeemLoyalty(selected, parseInt(redeem.points, 10), redeem.reward);
    if (!res.error) {
      setMessage('Ödül verildi!');
      setRedeem({ points: '', reward: '' });
      loadLoyalty(selected);
    } else setMessage(res.error);
  }

  return (
    <div>
      <h2>Sadakat Programı</h2>
      <div className="form-row">
        <label>Üye</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Seçiniz</option>
          {members.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      {selected && (
        <>
          <div style={{margin:'1rem 0'}}>Puan: <b>{loyalty.points}</b> | Ödüller: {loyalty.rewards || '-'} </div>
          <form onSubmit={handleAward} className="form" style={{display:'inline-block',marginRight:16}}>
            <input type="number" value={awardPoints} onChange={e=>setAwardPoints(e.target.value)} placeholder="Puan ekle" min={1} required />
            <button type="submit">Puan Ekle</button>
          </form>
          <form onSubmit={handleRedeem} className="form" style={{display:'inline-block'}}>
            <input type="number" value={redeem.points} onChange={e=>setRedeem(r=>({...r,points:e.target.value}))} placeholder="Harcanacak puan" min={1} required />
            <input type="text" value={redeem.reward} onChange={e=>setRedeem(r=>({...r,reward:e.target.value}))} placeholder="Ödül (örn. ücretsiz ders)" required />
            <button type="submit">Ödül Ver</button>
          </form>
          {message && <div className="message">{message}</div>}
        </>
      )}
    </div>
  );
}
