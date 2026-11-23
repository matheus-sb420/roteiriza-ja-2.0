const { criarApp } = require('./app');
const { porta } = require('./config/env');
const { apagarDadosVencidos, apagarLocalizacoesVencidas } = require('./servicos/lgpd');

const UMA_HORA = 60 * 60 * 1000;

// RN20: confere de hora em hora se há dados de clientes para apagar.
async function rodarLimpezaLgpd() {
  try {
    const apagados = await apagarDadosVencidos();
    if (apagados > 0) console.log(`LGPD: dados de ${apagados} pedido(s) apagados`);
    const posicoes = await apagarLocalizacoesVencidas();
    if (posicoes > 0) console.log(`LGPD: ${posicoes} posição(ões) de entregadores apagadas`);
  } catch (erro) {
    console.error('LGPD: falha ao apagar dados vencidos', erro.message);
  }
}

criarApp().listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
  rodarLimpezaLgpd();
  setInterval(rodarLimpezaLgpd, UMA_HORA);
});
