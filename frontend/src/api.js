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
// === PAYMENTS ===
export async function addPayment(data) {
  const res = await fetch(`${API_URL}/payments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function fetchPayments(member_id) {
  const res = await fetch(`${API_URL}/payments/${member_id}`, { headers: authHeader() });
  return res.json();
}
// === SERVICES ===
export async function fetchServices() {
  const res = await fetch(`${API_URL}/services`, { headers: authHeader() });
  return res.json();
}
export async function addService(data) {
  const res = await fetch(`${API_URL}/services`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function addServicePayment(data) {
  const res = await fetch(`${API_URL}/service-payment`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
// === INVOICES ===
export async function fetchInvoices(member_id) {
  const res = await fetch(`${API_URL}/invoices/${member_id}`, { headers: authHeader() });
  return res.json();
}
export async function downloadInvoicePDF(invoice_id) {
  const res = await fetch(`${API_URL}/invoice/${invoice_id}/pdf`, { headers: authHeader() });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura_${invoice_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
// === FEEDBACK ===
export async function submitFeedback(data) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function fetchFeedback() {
  const res = await fetch(`${API_URL}/feedback`, { headers: authHeader() });
  return res.json();
}
// === PROMOTIONS ===
export async function fetchPromotions() {
  const res = await fetch(`${API_URL}/promotions`, { headers: authHeader() });
  return res.json();
}
export async function addPromotion(data) {
  const res = await fetch(`${API_URL}/promotions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data)
  });
  return res.json();
}
export async function deletePromotion(id) {
  const res = await fetch(`${API_URL}/promotions/${id}`, { method: 'DELETE', headers: authHeader() });
  return res.json();
}
// === LOYALTY ===
export async function fetchLoyalty(member_id) {
  const res = await fetch(`${API_URL}/loyalty/${member_id}`, { headers: authHeader() });
  return res.json();
}
export async function awardLoyalty(member_id, points) {
  const res = await fetch(`${API_URL}/loyalty/award`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ member_id, points })
  });
  return res.json();
}
export async function redeemLoyalty(member_id, points, reward) {
  const res = await fetch(`${API_URL}/loyalty/redeem`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ member_id, points, reward })
  });
  return res.json();
}
// === REPORTS ===
export async function fetchReports() {
  const res = await fetch(`${API_URL}/reports`, { headers: authHeader() });
  return res.json();
}
export async function fetchReport(id) {
  const res = await fetch(`${API_URL}/reports/${id}`, { headers: authHeader() });
  return res.json();
}
export async function generateMembershipReport() {
  const res = await fetch(`${API_URL}/reports/membership`, { method:'POST', headers: authHeader() });
  return res.json();
}
export async function generateFinancialReport() {
  const res = await fetch(`${API_URL}/reports/financial`, { method:'POST', headers: authHeader() });
  return res.json();
}
export async function generateEquipmentUsageReport() {
  const res = await fetch(`${API_URL}/reports/equipment_usage`, { method:'POST', headers: authHeader() });
  return res.json();
}
export async function downloadReportCSV(id) {
  const res = await fetch(`${API_URL}/reports/${id}/csv`, { headers: authHeader() });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapor_${id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return res.json();
}
