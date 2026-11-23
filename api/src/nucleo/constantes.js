// Valores fixos do domínio (seção 4 dos requisitos).
// Ficam no núcleo porque models, portas e algoritmo usam os mesmos valores.

const STATUS_PEDIDO = Object.freeze({
  EM_PREPARO: 'em_preparo',
  PRONTO: 'pronto',
  EM_ROTA: 'em_rota',
  ENTREGUE: 'entregue',
  PENDENTE_CONFIRMACAO: 'pendente_confirmacao',
  CANCELADO: 'cancelado',
});

const TIPO_ENTREGA = Object.freeze({
  PROPRIA: 'propria',
  PLATAFORMA: 'plataforma',
});

const STATUS_ROTA = Object.freeze({
  EM_MONTAGEM: 'em_montagem',
  DESPACHADA: 'despachada',
  CONCLUIDA: 'concluida',
});

const ORIGEM_ROTA = Object.freeze({
  SUGERIDA: 'sugerida',
  MANUAL: 'manual',
});

const SITUACAO_ENTREGADOR = Object.freeze({
  DISPONIVEL: 'disponivel',
  EM_ROTA: 'em_rota',
  FORA_DE_SERVICO: 'fora_de_servico',
});

// Tipo do estabelecimento (RN30): define o ícone da loja no mapa. O ícone de
// cada tipo fica nas telas; aqui só a lista de valores aceitos.
const TIPO_ESTABELECIMENTO = Object.freeze([
  'pizzaria',
  'lanchonete',
  'pastelaria',
  'acai',
  'japonesa',
  'sorveteria',
  'padaria',
  'cafeteria',
  'marmitaria',
  'churrascaria',
  'doceria',
  'restaurante',
  'mercado',
  'farmacia',
]);

// Fatias de 45° no sentido horário a partir do norte (RN10).
const FATIAS = Object.freeze(['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']);

module.exports = {
  STATUS_PEDIDO,
  TIPO_ENTREGA,
  STATUS_ROTA,
  ORIGEM_ROTA,
  SITUACAO_ENTREGADOR,
  TIPO_ESTABELECIMENTO,
  FATIAS,
};
