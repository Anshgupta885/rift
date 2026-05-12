const express = require('express');
const { register } = require('../controllers/registercontroller');
const { login, logout } = require('../controllers/authcontroller');

const router = express.Router();

router.post('/user/register', async (req, res) => {
  return register(req, res);
});

router.post('/user/login', async (req, res) => {
  return login(req, res);
});

router.get('/user/logout', async (req, res) => {
  return logout(req, res);
});

module.exports = router;
