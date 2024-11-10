require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Pool } = require('pg');
const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

let accessControlEnabled = true;
let sanitizationEnabled = true;

app.use((req, res, next) => {
    req.user = req.cookies.user || null;
    next();
});

app.get('/', (req, res) => {
    res.render('index', { user: req.user, accessControlEnabled });
});

app.post('/enable-access-control', (req, res) => {
    accessControlEnabled = true;
    res.sendStatus(200);
});

app.post('/disable-access-control', (req, res) => {
    accessControlEnabled = false;
    res.sendStatus(200);
});

app.post('/login', (req, res) => {
    const { role } = req.body;
    res.cookie('user', { role });
    res.json({ role });
});

app.get('/user/:id', (req, res) => {
    const { id } = req.params;
    const { user } = req;
    if (!user || user.id !== id) {
        return res.status(403).send("Pristup odbijen - nemate pristup ovim podacima.");
    }
    res.render('user-profile', { user });
});

app.get('/bac', (req, res) => {
    res.render('bac', { user: req.user, accessControlEnabled });
});

app.get('/xss', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM comments');
        const comments = result.rows;
        res.render('xss', { user: req.user, comments, sanitizationEnabled });
    } catch (error) {
        console.error('Greška pri dohvaćanju komentara:', error);
        res.status(500).send('Došlo je do pogreške pri dohvaćanju komentara.');
    }
});

app.post('/enable-sanitization', (req, res) => {
    sanitizationEnabled = true;
    res.json({ sanitizationEnabled });
});

app.post('/disable-sanitization', (req, res) => {
    sanitizationEnabled = false;
    res.json({ sanitizationEnabled });
});

app.get('/get-sanitization-status', (req, res) => {
    res.json({ sanitizationEnabled });
});

app.post('/add-comment', (req, res) => {
    const { user_name, comment } = req.body;
    if (!user_name || !comment) {
        return res.status(400).json({ error: "Korisničko ime i komentar su obavezna polja." });
    }
    const sanitizedUserName = sanitizationEnabled ? sanitizeInput(user_name) : user_name;
    const sanitizedComment = sanitizationEnabled ? sanitizeInput(comment) : comment;
    pool.query('INSERT INTO comments (user_name, comment) VALUES ($1, $2)', [sanitizedUserName, sanitizedComment])
        .then(() => res.json({ message: 'Komentar je uspješno dodan!' }))
        .catch(err => res.status(500).send('Greška pri spremanju komentara'));
});

function sanitizeInput(text) {
    return text.replace(/[&<>"'\/]/g, match => {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            case '/': return '&#47;';
            case '{': return '&#123;';
            case '}': return '&#125;';
            case '`': return '&#96;';
            case '=': return '&#61;';
            case '(': return '&#40;';
            case ')': return '&#41;';
            case ';': return '&#59;';
            case '+': return '&#43;';
            default: return match;
        }
    });
}

app.get('/admin', (req, res) => {
    if (accessControlEnabled && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).send("Pristup odbijen - nemate potrebne privilegije.");
    }
    res.render('admin', { user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
