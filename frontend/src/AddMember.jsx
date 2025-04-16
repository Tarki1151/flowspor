import React, { useState } from "react";
import tr from "./i18n";
import { addMember } from "./api";

export default function AddMember({ onSuccess }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', membership_type: 'monthly', start_date: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (onSuccess) onSuccess();
    } else {
      setMessage(res.error || tr.registrationError);
    }
    setLoading(false);
  }

  return (
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
          <option value="monthly">Aylık</option>
          <option value="quarterly">3 Aylık</option>
          <option value="yearly">Yıllık</option>
        </select>
      </div>
      <div className="form-row">
        <label>{tr.startDate}</label>
        <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
        {errors.start_date && <span className="error">{errors.start_date}</span>}
      </div>
      <button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : tr.save}</button>
      {message && <div className={message.includes('başarı') ? 'message':'error'}>{message}</div>}
    </form>
  );
}
