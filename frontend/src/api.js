// Backend API ile iletişim
import { getToken } from './auth';
const API_URL = "http://localhost:3001/api";

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMembers() {
  const res = await fetch(`${API_URL}/members`, { headers: authHeader() });
  return res.json();
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

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return res.json();
}
