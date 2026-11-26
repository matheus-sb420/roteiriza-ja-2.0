// Limite de tentativas de login (RNF15).
//
// O app do entregador fica acessível pela internet (túnel https) e o PIN tem
// só 4 dígitos: sem limite, dava para testar os 10 mil PINs de um telefone.
// Depois de 5 erros seguidos para o mesmo telefone (ou usuário), o login fica
// bloqueado por 15 minutos. Acertar zera a contagem.
//
// A contagem fica na memória do servidor (some ao reiniciar a API), o que basta
// para uma loja com um servidor só. A chave é o telefone/usuário, e não o IP:
// pelo túnel, todas as requisições chegam do mesmo endereço.
const { ErroNegocio } = require('../erros');

const MAXIMO_ERROS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;

function criarLimiteTentativas({ maximoErros = MAXIMO_ERROS, bloqueioMs = BLOQUEIO_MS, relogio = Date.now } = {}) {
  const contagens = new Map(); // chave → { erros, bloqueadoAte }

  return {
    // Lança 429 se a chave estiver bloqueada.
    verificar(chave) {
      const c = contagens.get(chave);
      if (!c || !c.bloqueadoAte) return;
      const restanteMs = c.bloqueadoAte - relogio();
      if (restanteMs > 0) {
        const minutos = Math.ceil(restanteMs / 60000);
        throw new ErroNegocio(429, `Muitas tentativas erradas. Tente de novo em ${minutos} min.`);
      }
      contagens.delete(chave); // o bloqueio venceu: recomeça do zero
    },

    registrarErro(chave) {
      const c = contagens.get(chave) || { erros: 0, bloqueadoAte: null };
      c.erros += 1;
      if (c.erros >= maximoErros) c.bloqueadoAte = relogio() + bloqueioMs;
      contagens.set(chave, c);
    },

    limpar(chave) {
      contagens.delete(chave);
    },
  };
}

// Envolve uma função de login: confere o bloqueio antes, conta o erro 401 e
// zera a contagem quando o login dá certo.
async function comLimite(limite, chave, login) {
  limite.verificar(chave);
  try {
    const resultado = await login();
    limite.limpar(chave);
    return resultado;
  } catch (erro) {
    if (erro.status === 401) limite.registrarErro(chave);
    throw erro;
  }
}

module.exports = { MAXIMO_ERROS, BLOQUEIO_MS, criarLimiteTentativas, comLimite };
