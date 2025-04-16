// Backend API ile iletişim
import { getToken } from './auth';
const API_URL = "http://localhost:3001/api";

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function addMember(data) {
  const res = await fetch(`${API_URL}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function renewMember(id) {
  const res = await fetch(`${API_URL}/members/${id}/renew`, { method: "POST", headers: authHeader() });
  return res.json();
}

export async function cancelMember(id) {
  const res = await fetch(`${API_URL}/members/${id}/cancel`, { method: "POST", headers: authHeader() });
  return res.json();
}

export async function deleteMember(id) {
  const res = await fetch(`${API_URL}/members/${id}`, { method: "DELETE", headers: authHeader() });
  return res.json();
}

export async function getMember(id) {
  const res = await fetch(`${API_URL}/members/${id}`, { headers: authHeader() });
  return res.json();
}

// === STAFF ===
export async function fetchStaff() {
  const res = await fetch(`${API_URL}/staff`, { headers: authHeader() });
  return res.json();
}
export async function addStaff(data) {
  const res = await fetch(`${API_URL}/staff`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function updateStaff(id, data) {
  const res = await fetch(`${API_URL}/staff/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function deleteStaff(id) {
  const res = await fetch(`${API_URL}/staff/${id}`, {
    method: 'DELETE', headers: authHeader()
  });
  return res.json();
}
// === SCHEDULES ===
export async function fetchSchedules(staff_id) {
  const res = await fetch(`${API_URL}/schedules/${staff_id}`, { headers: authHeader() });
  return res.json();
}
export async function addSchedule(data) {
  const res = await fetch(`${API_URL}/schedules`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
// === PERFORMANCE ===
export async function fetchPerformance(staff_id) {
  const res = await fetch(`${API_URL}/performance/${staff_id}`, { headers: authHeader() });
  return res.json();
}
export async function addPerformance(data) {
  const res = await fetch(`${API_URL}/performance`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function fetchPerformanceAverage(staff_id, type) {
  const res = await fetch(`${API_URL}/performance/${staff_id}/average?type=${type}`, { headers: authHeader() });
  return res.json();
}

// === EQUIPMENT ===
export async function fetchEquipment() {
  const res = await fetch(`${API_URL}/equipment`, { headers: authHeader() });
  return res.json();
}
export async function addEquipment(data) {
  const res = await fetch(`${API_URL}/equipment`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function updateEquipment(id, data) {
  const res = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function deleteEquipment(id) {
  const res = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'DELETE', headers: authHeader()
  });
  return res.json();
}
// === INVENTORY ===
export async function fetchInventory() {
  const res = await fetch(`${API_URL}/inventory`, { headers: authHeader() });
  return res.json();
}
export async function updateInventory(equipment_id, data) {
  const res = await fetch(`${API_URL}/inventory`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({equipment_id, ...data})
  });
  return res.json();
}
// === RESERVATIONS ===
export async function fetchReservations(equipment_id) {
  const res = await fetch(`${API_URL}/reservations/${equipment_id}`, { headers: authHeader() });
  return res.json();
}
export async function addReservation(data) {
  const res = await fetch(`${API_URL}/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
// === MEMBERS (for reservation) ===
export async function fetchMembers() {
  const res = await fetch(`${API_URL}/members`, { headers: authHeader() });
  return res.json();
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return res.json();
}
