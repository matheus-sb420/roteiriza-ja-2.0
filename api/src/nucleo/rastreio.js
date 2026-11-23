// Localização do entregador (RN29): regras puras, sem banco.
const { distanciaKm } = require('./geo');

// Posições com precisão pior que isso são descartadas: num celular sem GPS
// (só Wi-Fi ou antena) o ponto pode "pular" centenas de metros e o trajeto
// no mapa viraria um zigue-zague sem sentido.
const PRECISAO_MAXIMA_M = 100;

// Até 2 min sem receber posição: "ao vivo". Até 30 min: "sem sinal" (o pino
// fica esmaecido, com o tempo desde o último ponto). Depois disso, some do mapa.
const SINAL_AO_VIVO_MIN = 2;
const OCULTAR_APOS_MIN = 30;

// Pontos do trajeto mais próximos que isso do anterior não são desenhados
// (entregador parado no semáforo ou na porta do cliente).
const DISTANCIA_MINIMA_TRAJETO_M = 15;

const SINAL = Object.freeze({ AO_VIVO: 'ao_vivo', SEM_SINAL: 'sem_sinal' });

const MS_POR_MINUTO = 60 * 1000;
const ehNumero = (v) => typeof v === 'number' && Number.isFinite(v);

// Confere o que o app enviou. Devolve a lista de erros (vazia = válido).
function validarPosicao(dados) {
  const erros = [];
  if (!dados || typeof dados !== 'object') return ['corpo da requisição ausente'];
  if (!ehNumero(dados.latitude) || dados.latitude < -90 || dados.latitude > 90) {
    erros.push('latitude deve ser um número entre -90 e 90');
  }
  if (!ehNumero(dados.longitude) || dados.longitude < -180 || dados.longitude > 180) {
    erros.push('longitude deve ser um número entre -180 e 180');
  }
  if (dados.precisao !== undefined && dados.precisao !== null && (!ehNumero(dados.precisao) || dados.precisao < 0)) {
    erros.push('precisao deve ser um número de metros maior ou igual a 0');
  }
  return erros;
}

// A posição é boa o bastante para entrar no trajeto?
const precisaoAceitavel = (precisao) => precisao === undefined || precisao === null || precisao <= PRECISAO_MAXIMA_M;

// Situação do sinal pelo horário do último ponto; null = não mostrar no mapa.
function situacaoDoSinal(registradaEm, agora) {
  const minutos = (new Date(agora) - new Date(registradaEm)) / MS_POR_MINUTO;
  if (minutos <= SINAL_AO_VIVO_MIN) return SINAL.AO_VIVO;
  if (minutos <= OCULTAR_APOS_MIN) return SINAL.SEM_SINAL;
  return null;
}

// Reduz o trajeto para o mapa: mantém um ponto só quando ele está a pelo
// menos 15 m do último mantido. O último ponto real sempre entra, para a linha
// terminar onde o entregador está. Pontos em ordem cronológica.
function simplificarTrajeto(pontos) {
  if (pontos.length <= 2) return pontos.slice();
  const resultado = [pontos[0]];
  for (let i = 1; i < pontos.length - 1; i++) {
    const ultimo = resultado[resultado.length - 1];
    if (distanciaKm(ultimo, pontos[i]) * 1000 >= DISTANCIA_MINIMA_TRAJETO_M) resultado.push(pontos[i]);
  }
  resultado.push(pontos[pontos.length - 1]);
  return resultado;
}

module.exports = {
  PRECISAO_MAXIMA_M,
  SINAL_AO_VIVO_MIN,
  OCULTAR_APOS_MIN,
  DISTANCIA_MINIMA_TRAJETO_M,
  SINAL,
  validarPosicao,
  precisaoAceitavel,
  situacaoDoSinal,
  simplificarTrajeto,
};
