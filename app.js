const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
// na hostingu serwer musi nasluchiwac na adresie z IP
const host = process.env.IP || '::';

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, host, () => console.log(`Aplikacja serwerowa działa na porcie ${port}.`));
