const { Router } = require('express');
const { loginAdministrador } = require('../servicos/autenticacao');
const { criarLimiteTentativas, comLimite } = require('./limite-tentativas');

const router = Router();
const limiteLogin = criarLimiteTentativas();

// RNF15: mesmo limite de tentativas do app, por usuário.
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  res.json(await comLimite(limiteLogin, String(usuario || ''), () => loginAdministrador(usuario, senha)));
});

module.exports = router;
