const { HttpError } = require('../errors');
const admin = require('../models/admin');
const session = require('../models/session');

const isText = (v) => typeof v === 'string' && v.length > 0;

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!isText(username) || !isText(password)) {
    throw new HttpError(400, 'Pola username i password są wymagane.');
  }
  const found = await admin.authenticate(username, password);
  if (!found) {
    throw new HttpError(401, 'Niepoprawna nazwa użytkownika lub hasło.');
  }
  const { token, expiresIn } = await session.create(found.id);
  res.json({ accessToken: token, tokenType: 'Bearer', expiresIn });
}

async function logout(req, res) {
  await session.remove(req.token);
  res.status(204).end();
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!isText(currentPassword) || !isText(newPassword)) {
    throw new HttpError(400, 'Pola currentPassword i newPassword są wymagane.');
  }
  if (!(await admin.checkPassword(req.admin.adminId, currentPassword))) {
    throw new HttpError(403, 'Bieżące hasło jest niepoprawne.');
  }
  if (newPassword.length < admin.MIN_PASSWORD_LENGTH) {
    throw new HttpError(422, `Nowe hasło musi mieć co najmniej ${admin.MIN_PASSWORD_LENGTH} znaków.`,
      [{ field: 'newPassword', message: 'Hasło jest za krótkie.' }]);
  }
  await admin.setPassword(req.admin.adminId, newPassword);
  // other logged-in sessions are closed after the change
  await session.removeOthers(req.admin.adminId, req.token);
  res.status(204).end();
}

module.exports = { login, logout, changePassword };
