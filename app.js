const express = require('express');
const { pool } = require('./db');
const { requireJsonResponse, requireJsonBody } = require('./middleware/content');
const { notFound, errorHandler } = require('./errors');

const app = express();
const port = process.env.PORT || 3000;
// on the hosting the server has to listen on the address from IP
const host = process.env.IP || '::';

app.disable('x-powered-by');

// content checks go before the body is parsed
app.use('/api', requireJsonResponse, requireJsonBody);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Aplikacja serwerowa działa na porcie ${port}.`);
  pool.query('SELECT 1')
    .then(() => console.log('Połączono z bazą danych.'))
    .catch((err) => console.error(`Błąd połączenia z bazą danych:\n\t${err.message}`));
});
