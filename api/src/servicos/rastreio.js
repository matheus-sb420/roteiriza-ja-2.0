// Localização do entregador (RN29): grava os pontos enviados pelo app e monta,
// para o despacho, onde cada entregador está e o trajeto da rota em andamento.
const { Sequelize, Entregador, Rota, PosicaoEntregador } = require('../models');
const { STATUS_ROTA, SITUACAO_ENTREGADOR } = require('../nucleo/constantes');
const {
  OCULTAR_APOS_MIN,
  validarPosicao,
  precisaoAceitavel,
  situacaoDoSinal,
  simplificarTrajeto,
} = require('../nucleo/rastreio');
const { ErroNegocio, naoEncontrado } = require('../erros');

const { Op } = Sequelize;
const MS_POR_MINUTO = 60 * 1000;

// Motivos para não gravar um ponto válido. O app recebe o motivo e segue
// funcionando; nada disso é erro para o entregador.
const NAO_GRAVADA = Object.freeze({
  FORA_DE_SERVICO: 'fora_de_servico',
  PRECISAO_BAIXA: 'precisao_baixa',
});

async function registrarPosicao(entregadorId, dados, agora = new Date()) {
  const erros = validarPosicao(dados);
  if (erros.length) throw new ErroNegocio(422, 'Posição inválida', { erros });

  const entregador = await Entregador.findByPk(entregadorId);
  if (!entregador) throw naoEncontrado('Entregador');
  // Fora de serviço, a localização não é guardada (LGPD: só durante o trabalho).
  if (entregador.situacao === SITUACAO_ENTREGADOR.FORA_DE_SERVICO) {
    return { gravada: false, motivo: NAO_GRAVADA.FORA_DE_SERVICO };
  }
  if (!precisaoAceitavel(dados.precisao)) return { gravada: false, motivo: NAO_GRAVADA.PRECISAO_BAIXA };

  const rota = await Rota.findOne({ where: { entregadorId, status: STATUS_ROTA.DESPACHADA } });
  await PosicaoEntregador.create({
    entregadorId,
    rotaId: rota ? rota.id : null,
    latitude: dados.latitude,
    longitude: dados.longitude,
    precisaoM: dados.precisao ?? null,
    registradaEm: agora,
  });
  return { gravada: true };
}

// Para o mapa do despacho: última posição de cada entregador com sinal nos
// últimos 30 min e, se ele está numa rota despachada, o trajeto desde a saída.
async function localizacoesAtuais(agora = new Date()) {
  const desde = new Date(agora.getTime() - OCULTAR_APOS_MIN * MS_POR_MINUTO);
  const recentes = await PosicaoEntregador.findAll({
    where: { registradaEm: { [Op.gte]: desde } },
    include: [{ model: Entregador, as: 'entregador', attributes: ['id', 'nome'] }],
    order: [['registradaEm', 'DESC']],
  });

  // A primeira posição de cada entregador (lista do mais novo para o mais antigo).
  const ultimas = new Map();
  for (const p of recentes) if (!ultimas.has(p.entregadorId)) ultimas.set(p.entregadorId, p);
  if (ultimas.size === 0) return [];

  const rotas = await Rota.findAll({
    where: { entregadorId: [...ultimas.keys()], status: STATUS_ROTA.DESPACHADA },
  });
  const rotaDe = new Map(rotas.map((r) => [r.entregadorId, r]));

  const resultado = [];
  for (const [entregadorId, ultima] of ultimas) {
    const rota = rotaDe.get(entregadorId);
    let trajeto = [];
    if (rota) {
      const pontos = await PosicaoEntregador.findAll({
        where: { rotaId: rota.id },
        attributes: ['latitude', 'longitude'],
        order: [['registradaEm', 'ASC']],
        raw: true,
      });
      trajeto = simplificarTrajeto(pontos).map((p) => [p.latitude, p.longitude]);
    }
    resultado.push({
      entregadorId,
      nome: ultima.entregador.nome,
      latitude: ultima.latitude,
      longitude: ultima.longitude,
      precisaoM: ultima.precisaoM,
      registradaEm: ultima.registradaEm,
      sinal: situacaoDoSinal(ultima.registradaEm, agora),
      rotaId: rota ? rota.id : null,
      trajeto,
    });
  }
  return resultado;
}

// LGPD: apaga pontos mais antigos que o prazo de retenção configurado.
async function apagarPosicoesVencidas(prazoDias, agora = new Date()) {
  const limite = new Date(agora.getTime() - prazoDias * 24 * 60 * MS_POR_MINUTO);
  return PosicaoEntregador.destroy({ where: { registradaEm: { [Op.lt]: limite } } });
}

module.exports = { NAO_GRAVADA, registrarPosicao, localizacoesAtuais, apagarPosicoesVencidas };
