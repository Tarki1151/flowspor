require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();

const cron = require('node-cron');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3001;

// Set SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

app.use(cors());
app.use(bodyParser.json());

// SQLite DB setup
const db = new sqlite3.Database('./gym.db', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('SQLite veritabanına bağlanıldı.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address TEXT,
    membership_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL,
    cancellation_date TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    start_date TEXT NOT NULL,
    salary REAL NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(staff_id) REFERENCES staff(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    hours_worked INTEGER NOT NULL,
    feedback TEXT,
    FOREIGN KEY(staff_id) REFERENCES staff(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    purchase_date TEXT NOT NULL,
    status TEXT NOT NULL,
    maintenance_interval INTEGER NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    equipment_id INTEGER PRIMARY KEY,
    quantity INTEGER NOT NULL,
    min_quantity INTEGER NOT NULL,
    FOREIGN KEY(equipment_id) REFERENCES equipment(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY(equipment_id) REFERENCES equipment(id),
    FOREIGN KEY(member_id) REFERENCES members(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    payment_type TEXT NOT NULL,
    FOREIGN KEY(member_id) REFERENCES members(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(member_id) REFERENCES members(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    data TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    trainer_id INTEGER NOT NULL,
    FOREIGN KEY(trainer_id) REFERENCES staff(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS private_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    trainer_id INTEGER NOT NULL,
    time TEXT NOT NULL,
    FOREIGN KEY(member_id) REFERENCES members(id),
    FOREIGN KEY(trainer_id) REFERENCES staff(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS trainer_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    FOREIGN KEY(trainer_id) REFERENCES staff(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);
  // Admin kullanıcısı yoksa ekle
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
    if (!row) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    }
  });
});

// Helper: Calculate end_date
function calculateEndDate(start, type) {
  const startDate = new Date(start);
  if (type === 'monthly') {
    startDate.setDate(startDate.getDate() + 30);
  } else if (type === 'annual') {
    startDate.setFullYear(startDate.getFullYear() + 1);
  }
  return startDate.toISOString().slice(0, 10);
}


// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });
  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Geçersiz oturum.' });
    req.user = user;
    next();
  });
}

// API: Yönetici Girişi
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Şifre hatalı.' });
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
    res.json({ token });
  });
});

// API: Yönetici Şifre Değiştirme
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.user.username;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE username = ?', [hash, username], function (err) {
      if (err) return res.status(500).json({ error: 'Şifre değiştirme hatası.' });
      res.json({ mesaj: 'Şifre başarıyla değiştirildi.' });
    });
  });
});

// === CLASS & PROGRAM MANAGEMENT ===

// === STAFF MANAGEMENT ===

// Personel ekle
app.post('/api/staff', authenticateToken, (req, res) => {
  const { name, role, email, phone, start_date, salary } = req.body;
  if (!name || !role || !email || !phone || !start_date || !salary) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Geçersiz e-posta.' });
  if (!/^\+?\d{10,14}$/.test(phone)) return res.status(400).json({ error: 'Geçersiz telefon.' });
  db.get('SELECT * FROM staff WHERE email = ?', [email], (err, row) => {
    if (row) return res.status(400).json({ error: 'Bu e-posta ile kayıtlı personel var.' });
    db.run('INSERT INTO staff (name, role, email, phone, start_date, salary) VALUES (?, ?, ?, ?, ?, ?)', [name, role, email, phone, start_date, salary], function(err) {
      if (err) return res.status(500).json({ error: 'Personel eklenemedi.' });
      res.json({ id: this.lastID, name, role, email, phone, start_date, salary });
    });
  });
});

// Personel güncelle
app.put('/api/staff/:id', authenticateToken, (req, res) => {
  const { name, role, email, phone, start_date, salary } = req.body;
  db.run('UPDATE staff SET name=?, role=?, email=?, phone=?, start_date=?, salary=? WHERE id=?', [name, role, email, phone, start_date, salary, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Güncelleme başarısız.' });
    res.json({ mesaj: 'Güncellendi.' });
  });
});

// Personel sil
app.delete('/api/staff/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM staff WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Silme başarısız.' });
    res.json({ mesaj: 'Silindi.' });
  });
});

// Personel listele
app.get('/api/staff', authenticateToken, (req, res) => {
  db.all('SELECT * FROM staff', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});

// === SHIFT SCHEDULING ===
// Çakışma önleyici vardiya ekleme
app.post('/api/schedules', authenticateToken, (req, res) => {
  const { staff_id, start_time, end_time, status } = req.body;
  if (!staff_id || !start_time || !end_time || !status) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.get('SELECT * FROM schedules WHERE staff_id = ? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))', [staff_id, end_time, end_time, start_time, start_time, start_time, end_time], (err, clash) => {
    if (clash) return res.status(400).json({ error: 'Bu personelin bu saatlerde başka bir vardiyası var.' });
    db.run('INSERT INTO schedules (staff_id, start_time, end_time, status) VALUES (?, ?, ?, ?)', [staff_id, start_time, end_time, status], function(err) {
      if (err) return res.status(500).json({ error: 'Vardiya eklenemedi.' });
      res.json({ id: this.lastID, staff_id, start_time, end_time, status });
    });
  });
});

// Vardiya listele
app.get('/api/schedules/:staff_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM schedules WHERE staff_id = ?', [req.params.staff_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});

// === PERFORMANCE ===
// Performans kaydı ekle
app.post('/api/performance', authenticateToken, (req, res) => {
  const { staff_id, date, hours_worked, feedback } = req.body;
  if (!staff_id || !date || !hours_worked) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  db.run('INSERT INTO performance (staff_id, date, hours_worked, feedback) VALUES (?, ?, ?, ?)', [staff_id, date, hours_worked, feedback], function(err) {
    if (err) return res.status(500).json({ error: 'Performans kaydı eklenemedi.' });
    res.json({ id: this.lastID, staff_id, date, hours_worked, feedback });
  });
});
// Personel performans listesi
app.get('/api/performance/:staff_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM performance WHERE staff_id = ?', [req.params.staff_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// Haftalık/aylık ortalama saat
app.get('/api/performance/:staff_id/average', authenticateToken, (req, res) => {
  const { type } = req.query; // 'week' veya 'month'
  let groupBy = type === 'month' ? "%Y-%m" : "%Y-%W";
  db.all(`SELECT strftime('${groupBy}', date) as period, AVG(hours_worked) as avg_hours FROM performance WHERE staff_id = ? GROUP BY period`, [req.params.staff_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// === /STAFF MANAGEMENT ===


// === (Önceki eğitmen ve ders API'leri burada kalacak, staff API'leri ile entegre çalışır) ===

// === EQUIPMENT & INVENTORY MANAGEMENT ===

// Ekipman ekle
app.post('/api/equipment', authenticateToken, (req, res) => {
  const { name, serial_number, purchase_date, status, maintenance_interval } = req.body;
  if (!name || !serial_number || !purchase_date || !status || !maintenance_interval)
    return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.get('SELECT * FROM equipment WHERE serial_number = ?', [serial_number], (err, row) => {
    if (row) return res.status(400).json({ error: 'Bu seri numarası ile kayıtlı ekipman var.' });
    db.run('INSERT INTO equipment (name, serial_number, purchase_date, status, maintenance_interval) VALUES (?, ?, ?, ?, ?)', [name, serial_number, purchase_date, status, maintenance_interval], function(err) {
      if (err) return res.status(500).json({ error: 'Ekipman eklenemedi.' });
      res.json({ id: this.lastID, name, serial_number, purchase_date, status, maintenance_interval });
    });
  });
});
// Ekipman güncelle
app.put('/api/equipment/:id', authenticateToken, (req, res) => {
  const { name, serial_number, purchase_date, status, maintenance_interval } = req.body;
  db.run('UPDATE equipment SET name=?, serial_number=?, purchase_date=?, status=?, maintenance_interval=? WHERE id=?', [name, serial_number, purchase_date, status, maintenance_interval, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Güncelleme başarısız.' });
    res.json({ mesaj: 'Güncellendi.' });
  });
});
// Ekipman sil
app.delete('/api/equipment/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM equipment WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Silme başarısız.' });
    res.json({ mesaj: 'Silindi.' });
  });
});
// Ekipman listele
app.get('/api/equipment', authenticateToken, (req, res) => {
  db.all('SELECT * FROM equipment', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// Envanter ekle/güncelle
app.post('/api/inventory', authenticateToken, (req, res) => {
  const { equipment_id, quantity, min_quantity } = req.body;
  if (!equipment_id || quantity == null || min_quantity == null) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.get('SELECT * FROM inventory WHERE equipment_id = ?', [equipment_id], (err, row) => {
    if (row) {
      db.run('UPDATE inventory SET quantity=?, min_quantity=? WHERE equipment_id=?', [quantity, min_quantity, equipment_id], function(err) {
        if (err) return res.status(500).json({ error: 'Envanter güncellenemedi.' });
        res.json({ mesaj: 'Güncellendi.' });
      });
    } else {
      db.run('INSERT INTO inventory (equipment_id, quantity, min_quantity) VALUES (?, ?, ?)', [equipment_id, quantity, min_quantity], function(err) {
        if (err) return res.status(500).json({ error: 'Envanter eklenemedi.' });
        res.json({ mesaj: 'Eklendi.' });
      });
    }
  });
});
// Envanter listele + düşük stok uyarısı
app.get('/api/inventory', authenticateToken, (req, res) => {
  db.all('SELECT e.*, i.quantity, i.min_quantity FROM equipment e LEFT JOIN inventory i ON e.id = i.equipment_id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    const lowStock = rows.filter(r => r.quantity != null && r.quantity < r.min_quantity);
    res.json({ inventory: rows, lowStock });
  });
});
// Rezervasyon ekle (çakışma önleyici)
app.post('/api/reservations', authenticateToken, (req, res) => {
  const { equipment_id, member_id, start_time, end_time } = req.body;
  if (!equipment_id || !member_id || !start_time || !end_time) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.get('SELECT * FROM reservations WHERE equipment_id = ? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))', [equipment_id, end_time, end_time, start_time, start_time, start_time, end_time], (err, clash) => {
    if (clash) return res.status(400).json({ error: 'Bu ekipman bu saatlerde zaten rezerve.' });
    db.run('INSERT INTO reservations (equipment_id, member_id, start_time, end_time) VALUES (?, ?, ?, ?)', [equipment_id, member_id, start_time, end_time], function(err) {
      if (err) return res.status(500).json({ error: 'Rezervasyon eklenemedi.' });
      res.json({ id: this.lastID, equipment_id, member_id, start_time, end_time });
    });
  });
});
// Rezervasyon listele
app.get('/api/reservations/:equipment_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM reservations WHERE equipment_id = ?', [req.params.equipment_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// Bakım zamanı yaklaşan ekipmanlar (otomatik uyarı)
app.get('/api/equipment/maintenance/upcoming', authenticateToken, (req, res) => {
  db.all('SELECT e.*, i.quantity, i.min_quantity, MAX(r.end_time) as last_res FROM equipment e LEFT JOIN inventory i ON e.id = i.equipment_id LEFT JOIN reservations r ON e.id = r.equipment_id GROUP BY e.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    // Bakım zamanı yaklaşanlar: (son rezervasyon tarihi + bakım aralığı) bugünden azsa
    const today = new Date();
    const upcoming = rows.filter(eq => {
      if (!eq.maintenance_interval || !eq.last_res) return false;
      const nextMaint = new Date(eq.last_res);
      nextMaint.setDate(nextMaint.getDate() + eq.maintenance_interval);
      return (nextMaint - today) / (1000 * 60 * 60 * 24) <= 7; // 7 gün içinde bakım
    });
    res.json({ upcoming });
  });
});
// === /EQUIPMENT & INVENTORY MANAGEMENT ===

// === PAYMENTS, SERVICES, INVOICES ===
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Üyelik ödemesi (simülasyon, gerçek ödeme gateway entegrasyonu için altyapı hazır)
app.post('/api/payments', authenticateToken, (req, res) => {
  const { member_id, amount, payment_type, date } = req.body;
  if (!member_id || !amount || !payment_type) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  const paymentDate = date || new Date().toISOString().slice(0, 10);
  // Üyelik bitişini güncelle (örnek: 1 ay uzat)
  db.run('INSERT INTO payments (member_id, amount, date, payment_type) VALUES (?, ?, ?, ?)', [member_id, amount, paymentDate, payment_type], function(err) {
    if (err) return res.status(500).json({ error: 'Ödeme kaydedilemedi.' });
    db.run('UPDATE members SET end_date = DATE(COALESCE(end_date, ?), "+1 month") WHERE id = ?', [paymentDate, member_id]);
    // Fatura oluştur
    db.run('INSERT INTO invoices (member_id, amount, date) VALUES (?, ?, ?)', [member_id, amount, paymentDate], function(err2) {
      if (err2) return res.status(500).json({ error: 'Fatura oluşturulamadı.' });
      res.json({ mesaj: 'Ödeme ve fatura kaydedildi.', payment_id: this.lastID });
    });
  });
});
// Hizmet ekle
app.post('/api/services', authenticateToken, (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.run('INSERT INTO services (name, price) VALUES (?, ?)', [name, price], function(err) {
    if (err) return res.status(500).json({ error: 'Hizmet eklenemedi.' });
    res.json({ id: this.lastID, name, price });
  });
});
// Hizmet listele
app.get('/api/services', authenticateToken, (req, res) => {
  db.all('SELECT * FROM services', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// Hizmet ödemesi
app.post('/api/service-payment', authenticateToken, (req, res) => {
  const { member_id, service_id, payment_type } = req.body;
  if (!member_id || !service_id || !payment_type) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  db.get('SELECT price FROM services WHERE id=?', [service_id], (err, row) => {
    if (!row) return res.status(400).json({ error: 'Hizmet bulunamadı.' });
    const amount = row.price;
    const paymentDate = new Date().toISOString().slice(0, 10);
    db.run('INSERT INTO payments (member_id, amount, date, payment_type) VALUES (?, ?, ?, ?)', [member_id, amount, paymentDate, payment_type], function(err2) {
      if (err2) return res.status(500).json({ error: 'Ödeme kaydedilemedi.' });
      // Fatura oluştur
      db.run('INSERT INTO invoices (member_id, amount, date) VALUES (?, ?, ?)', [member_id, amount, paymentDate], function(err3) {
        if (err3) return res.status(500).json({ error: 'Fatura oluşturulamadı.' });
        res.json({ mesaj: 'Hizmet ödemesi ve fatura kaydedildi.' });
      });
    });
  });
});
// Ödeme ve fatura listele
app.get('/api/payments/:member_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM payments WHERE member_id = ?', [req.params.member_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
app.get('/api/invoices/:member_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM invoices WHERE member_id = ?', [req.params.member_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});
// Fatura PDF oluştur (PDFKit ile)
app.get('/api/invoice/:invoice_id/pdf', authenticateToken, (req, res) => {
  db.get('SELECT i.*, m.name as member_name FROM invoices i JOIN members m ON i.member_id = m.id WHERE i.id = ?', [req.params.invoice_id], (err, invoice) => {
    if (!invoice) return res.status(404).json({ error: 'Fatura bulunamadı.' });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fatura_${invoice.id}.pdf`);
    doc.text(`Fatura No: ${invoice.id}`);
    doc.text(`Üye: ${invoice.member_name}`);
    doc.text(`Tutar: ${invoice.amount} TL`);
    doc.text(`Tarih: ${invoice.date}`);
    doc.text('Teşekkürler!');
    doc.end();
    doc.pipe(res);
  });
});
// === /PAYMENTS, SERVICES, INVOICES ===

// === REPORTS & ANALYTICS ===
const { Parser } = require('json2csv');

// Üyelik raporu üret
app.post('/api/reports/membership', authenticateToken, (req, res) => {
  // Yeni kayıt, yenileme, iptal (son 12 ay)
  db.all(`SELECT 
    strftime('%Y-%m', created_at) as period,
    COUNT(*) as registrations
    FROM members
    GROUP BY period
    ORDER BY period DESC
    LIMIT 12`, [], (err, regs) => {
    db.all(`SELECT 
      strftime('%Y-%m', end_date) as period,
      COUNT(*) as cancellations
      FROM members WHERE end_date < date('now')
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12`, [], (err2, cancels) => {
      const data = { registrations: regs, cancellations: cancels };
      const date = new Date().toISOString().slice(0, 10);
      db.run('INSERT INTO reports (type, date, data) VALUES (?, ?, ?)', ['membership', date, JSON.stringify(data)], function(err3) {
        if (err3) return res.status(500).json({ error: 'Rapor kaydedilemedi.' });
        res.json({ id: this.lastID, type: 'membership', date, data });
      });
    });
  });
});
// Finansal rapor üret
app.post('/api/reports/financial', authenticateToken, (req, res) => {
  db.get('SELECT SUM(amount) as revenue FROM payments', [], (err, rev) => {
    db.get('SELECT SUM(salary) as expenses FROM staff', [], (err2, exp) => {
      const profit = (rev?.revenue || 0) - (exp?.expenses || 0);
      const data = { revenue: rev?.revenue || 0, expenses: exp?.expenses || 0, profit };
      const date = new Date().toISOString().slice(0, 10);
      db.run('INSERT INTO reports (type, date, data) VALUES (?, ?, ?)', ['financial', date, JSON.stringify(data)], function(err3) {
        if (err3) return res.status(500).json({ error: 'Rapor kaydedilemedi.' });
        res.json({ id: this.lastID, type: 'financial', date, data });
      });
    });
  });
});
// Ekipman kullanım raporu üret
app.post('/api/reports/equipment_usage', authenticateToken, (req, res) => {
  db.all(`SELECT equipment_id, COUNT(*) as usage_count FROM reservations GROUP BY equipment_id ORDER BY usage_count DESC`, [], (err, rows) => {
    db.all('SELECT id, name FROM equipment', [], (err2, eqs) => {
      const usage = rows.map(r => ({ ...r, name: eqs.find(e => e.id === r.equipment_id)?.name || '' }));
      const date = new Date().toISOString().slice(0, 10);
      db.run('INSERT INTO reports (type, date, data) VALUES (?, ?, ?)', ['equipment_usage', date, JSON.stringify(usage)], function(err3) {
        if (err3) return res.status(500).json({ error: 'Rapor kaydedilemedi.' });
        res.json({ id: this.lastID, type: 'equipment_usage', date, data: usage });
      });
    });
  });
});
// Raporları listele
app.get('/api/reports', authenticateToken, (req, res) => {
  db.all('SELECT * FROM reports ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data) })));
  });
});
// Tekil rapor getir
app.get('/api/reports/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM reports WHERE id=?', [req.params.id], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Rapor bulunamadı.' });
    res.json({ ...row, data: JSON.parse(row.data) });
  });
});
// Raporu CSV olarak dışa aktar
app.get('/api/reports/:id/csv', authenticateToken, (req, res) => {
  db.get('SELECT * FROM reports WHERE id=?', [req.params.id], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Rapor bulunamadı.' });
    let data = JSON.parse(row.data);
    if (!Array.isArray(data)) data = [data];
    const parser = new Parser();
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${row.id}.csv`);
    res.send(csv);
  });
});
// === /REPORTS & ANALYTICS ===

// Eğitmen müsaitlik ekle
app.post('/api/trainer-availability', authenticateToken, (req, res) => {
  const { trainer_id, day, time } = req.body;
  db.run('INSERT INTO trainer_availability (trainer_id, day, time) VALUES (?, ?, ?)', [trainer_id, day, time], function(err) {
    if (err) return res.status(500).json({ error: 'Müsaitlik eklenemedi.' });
    res.json({ id: this.lastID, trainer_id, day, time });
  });
});

// Eğitmen müsaitlikleri getir
app.get('/api/trainer-availability/:trainer_id', authenticateToken, (req, res) => {
  db.all('SELECT * FROM trainer_availability WHERE trainer_id = ?', [req.params.trainer_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Veri alınamadı.' });
    res.json(rows);
  });
});

// Grup dersi ekle
app.post('/api/classes', authenticateToken, (req, res) => {
  const { name, date, time, capacity, trainer_id } = req.body;
  // Eğitmen uygun mu kontrolü
  db.get('SELECT * FROM trainer_availability WHERE trainer_id = ? AND day = ? AND time = ?', [trainer_id, getDayOfWeek(date), time], (err, row) => {
    if (!row) return res.status(400).json({ error: 'Eğitmen bu saatte uygun değil.' });
    db.run('INSERT INTO classes (name, date, time, capacity, trainer_id) VALUES (?, ?, ?, ?, ?)', [name, date, time, capacity, trainer_id], function(err) {
      if (err) return res.status(500).json({ error: 'Ders eklenemedi.' });
      res.json({ id: this.lastID, name, date, time, capacity, trainer_id });
    });
  });
});

// Grup dersine üye kaydı
app.post('/api/classes/:class_id/register', authenticateToken, (req, res) => {
  const { member_id } = req.body;
  // Kapasite kontrolü
  db.get('SELECT capacity, (SELECT COUNT(*) FROM private_lessons WHERE class_id = ?) as count FROM classes WHERE id = ?', [req.params.class_id, req.params.class_id], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Ders bulunamadı.' });
    if (row.count >= row.capacity) return res.status(400).json({ error: 'Kapasite dolu.' });
    db.run('INSERT INTO private_lessons (member_id, class_id) VALUES (?, ?)', [member_id, req.params.class_id], function(err) {
      if (err) return res.status(500).json({ error: 'Kayıt eklenemedi.' });
      res.json({ mesaj: 'Kaydınız başarıyla gerçekleştirildi.' });
    });
  });
});

// Özel ders rezervasyonu
app.post('/api/private-lessons', authenticateToken, (req, res) => {
  const { member_id, trainer_id, time } = req.body;
  const day = getDayOfWeek(time.split('T')[0]);
  const lessonTime = time.split('T')[1].slice(0,5);
  // Eğitmen müsait mi?
  db.get('SELECT * FROM trainer_availability WHERE trainer_id = ? AND day = ? AND time = ?', [trainer_id, day, lessonTime], (err, avail) => {
    if (!avail) return res.status(400).json({ error: 'Eğitmen bu saatte uygun değil.' });
    // Çakışma kontrolü
    db.get('SELECT * FROM private_lessons WHERE trainer_id = ? AND time = ?', [trainer_id, time], (err, clash) => {
      if (clash) return res.status(400).json({ error: 'Bu saatte başka bir özel ders var.' });
      db.run('INSERT INTO private_lessons (member_id, trainer_id, time) VALUES (?, ?, ?)', [member_id, trainer_id, time], function(err) {
        if (err) return res.status(500).json({ error: 'Rezervasyon eklenemedi.' });
        res.json({ id: this.lastID, mesaj: 'Özel ders rezervasyonu başarılı.' });
      });
    });
  });
});

function getDayOfWeek(dateStr) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr).getDay()];
}

// === /CLASS & PROGRAM MANAGEMENT ===

// API: Üye Kaydı
app.post('/api/members', [
  body('first_name').notEmpty().withMessage('İsim zorunludur.'),
  body('last_name').notEmpty().withMessage('Soyisim zorunludur.'),
  body('email').isEmail().withMessage('Geçersiz e-posta.'),
  body('phone').matches(/^\+?\d{10,14}$/).withMessage('Geçersiz telefon numarası.'),
  body('membership_type').isIn(['monthly', 'annual']).withMessage('Geçersiz üyelik tipi.'),
  body('start_date').isISO8601().withMessage('Geçersiz başlangıç tarihi.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { first_name, last_name, email, phone, address, membership_type, start_date } = req.body;
  email = email.toLowerCase();

  // Duplicate email kontrolü
  db.get('SELECT * FROM members WHERE email = ?', [email], async (err, row) => {
    if (row) {
      return res.status(400).json({ error: 'Bu e-posta ile kayıtlı bir üye zaten var.' });
    }
    const end_date = calculateEndDate(start_date, membership_type);
    db.run(`INSERT INTO members (first_name, last_name, email, phone, address, membership_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, address, membership_type, start_date, end_date, 'active'],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Kayıt sırasında hata oluştu.' });
        }
        res.json({ id: this.lastID, mesaj: 'Üyelik başarıyla oluşturuldu.' });
      }
    );
  });
});

// API: Üyeleri Listele
app.get('/api/members', authenticateToken, (req, res) => {
  db.all('SELECT * FROM members', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Veriler alınamadı.' });
    }
    res.json(rows);
  });
});

// API: Üyelik Yenileme
app.post('/api/members/:id/renew', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM members WHERE id = ?', [id], (err, row) => {
    if (!row) {
      return res.status(404).json({ error: 'Üye bulunamadı.' });
    }
    if (row.status === 'canceled') {
      return res.status(400).json({ error: 'İptal edilmiş üyelik yenilenemez.' });
    }
    const new_end_date = calculateEndDate(row.end_date, row.membership_type);
    db.run('UPDATE members SET end_date = ?, status = ? WHERE id = ?', [new_end_date, 'active', id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Yenileme sırasında hata oluştu.' });
      }
      res.json({ mesaj: 'Üyelik başarıyla yenilendi.' });
    });
  });
});

// API: Üyelik İptali
app.post('/api/members/:id/cancel', authenticateToken, (req, res) => {
  const id = req.params.id;
  const today = new Date().toISOString().slice(0, 10);
  db.run('UPDATE members SET status = ?, cancellation_date = ? WHERE id = ?', ['canceled', today, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'İptal sırasında hata oluştu.' });
    }
    res.json({ mesaj: 'Üyelik başarıyla iptal edildi.' });
  });
});

// API: Üye Silme
app.delete('/api/members/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM members WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Silme sırasında hata oluştu.' });
    }
    res.json({ mesaj: 'Üye başarıyla silindi.' });
  });
});

// API: Üye Bilgisi
app.get('/api/members/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM members WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Veri alınamadı.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Üye bulunamadı.' });
    }
    res.json(row);
  });
});

// CRON: Üyelik Durum Takibi ve Yenileme Bildirimi
cron.schedule('0 3 * * *', () => {
  const today = new Date().toISOString().slice(0, 10);
  // Expire old memberships
  db.run("UPDATE members SET status = 'expired' WHERE end_date < ? AND status = 'active'", [today]);
  // Notify for renewals (7 gün kala)
  db.all("SELECT * FROM members WHERE status = 'active' AND end_date = ?", [
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  ], (err, rows) => {
    if (rows && process.env.SENDGRID_API_KEY) {
      rows.forEach(member => {
        // Not: Email şifreli olduğu için burada gerçek e-posta yerine log mesajı kullanıyoruz.
        const msg = {
          to: 'test@example.com', // Gerçek uygulamada çözüm için şifrelenmemiş e-posta gerekir
          from: 'noreply@gymapp.com',
          subject: 'Üyelik Yenileme Hatırlatması',
          text: `Sayın ${member.first_name} ${member.last_name},\nÜyeliğinizin bitiş tarihi yaklaşıyor. Lütfen yenilemeyi unutmayınız!`,
        };
        sgMail.send(msg).catch(err => console.error('E-posta gönderilemedi:', err));
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Gym Yönetim API ${PORT} portunda çalışıyor.`);
});
