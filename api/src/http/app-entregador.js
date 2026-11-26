// Endpoints usados pelo app do entregador.
const { Router } = require('express');
const { loginEntregador } = require('../servicos/autenticacao');
const entregas = require('../servicos/entregas');
const { registrarPosicao } = require('../servicos/rastreio');
const { exigirEntregador } = require('./middlewares');
const { criarLimiteTentativas, comLimite } = require('./limite-tentativas');

const router = Router();
const limiteLogin = criarLimiteTentativas();

// RNF15: 5 PINs errados para o mesmo telefone bloqueiam o login por 15 min.
router.post('/login', async (req, res) => {
  const { telefone, pin } = req.body;
  const chave = String(telefone || '').replace(/\D/g, '');
  res.json(await comLimite(limiteLogin, chave, () => loginEntregador(telefone, pin)));
});

router.get('/rota', exigirEntregador, async (req, res) => {
  res.json(await entregas.rotaDoEntregador(req.usuario.id));
});

router.post('/paradas/:pedidoId/confirmar', exigirEntregador, async (req, res) => {
  res.json(await entregas.confirmarEntrega(req.usuario.id, Number(req.params.pedidoId), req.body.codigo));
});

// RN29: o app envia a posição do entregador enquanto está aberto.
router.post('/posicao', exigirEntregador, async (req, res) => {
  const resultado = await registrarPosicao(req.usuario.id, req.body);
  res.status(resultado.gravada ? 201 : 202).json(resultado);
});

module.exports = router;
