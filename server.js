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
