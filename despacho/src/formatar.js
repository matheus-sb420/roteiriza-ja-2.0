// Formatação compartilhada entre as telas.

// RNF02: a urgência não depende só da cor; cada classe tem símbolo e nome.
export const URGENCIA = {
  atrasado: { simbolo: '▲', nome: 'Atrasado', cor: '#c62828' },
  critico: { simbolo: '!', nome: 'Crítico', cor: '#d98200' },
  normal: { simbolo: '●', nome: 'Normal', cor: '#8a8f8b' },
};

export const STATUS = {
  em_preparo: 'Em preparo',
  pronto: 'Pronto',
  em_rota: 'Em rota',
  entregue: 'Entregue',
  pendente_confirmacao: 'Pendente',
  cancelado: 'Cancelado',
};

// "−02 min" / "+15 min": o sinal e o texto mostram a urgência sem depender da cor.
export function formatarFolga(folga) {
  const sinal = folga < 0 ? '−' : '+';
  return `${sinal}${String(Math.abs(folga)).padStart(2, '0')} min`;
}

export function hora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export const setor = (p) => (p.foraDaArea ? 'Fora da área' : `Anel ${p.anel} · ${p.fatia}`);

// Cores das rotas no mapa e na lateral. Sem verde (cor do sistema), vermelho
// e âmbar (urgência), para uma rota nunca parecer um alerta.
const CORES_ROTAS = ['#1565c0', '#6a1b9a', '#00838f', '#ad1457', '#5d4037', '#283593', '#455a64', '#0277bd'];
export const corDaRota = (indice) => CORES_ROTAS[indice % CORES_ROTAS.length];

// RN28: o pedido é identificado pelo contador do dia ("#8"); o código e a
// plataforma ficam como informação complementar ("2365 · iFood").
export const numeroPedido = (p) => `#${p.numeroDoDia}`;
export const codigoPlataforma = (p) => `${p.codigoExibicao} · ${p.plataforma}`;
export const rotuloPedido = (p) => `${numeroPedido(p)} (${codigoPlataforma(p)})`;

// RN30: ícone da loja no mapa para cada tipo de estabelecimento. A lista de
// tipos aceitos está na API (nucleo/constantes.js); aqui fica só o desenho.
// Emojis antigos o bastante para aparecer no Windows 10 e em celulares de
// alguns anos atrás (por isso o açaí usa a tigela de sorvete).
export const ESTABELECIMENTOS = {
  pizzaria: { nome: 'Pizzaria', icone: '🍕' },
  lanchonete: { nome: 'Lanchonete / hamburgueria', icone: '🍔' },
  pastelaria: { nome: 'Pastelaria', icone: '🥟' },
  acai: { nome: 'Açaí', icone: '🍨' },
  japonesa: { nome: 'Comida japonesa', icone: '🍣' },
  sorveteria: { nome: 'Sorveteria', icone: '🍦' },
  padaria: { nome: 'Padaria', icone: '🥐' },
  cafeteria: { nome: 'Cafeteria', icone: '☕' },
  marmitaria: { nome: 'Marmitaria', icone: '🍱' },
  churrascaria: { nome: 'Churrascaria', icone: '🥩' },
  doceria: { nome: 'Doceria / confeitaria', icone: '🍰' },
  restaurante: { nome: 'Restaurante', icone: '🍽️' },
  mercado: { nome: 'Mercado', icone: '🛒' },
  farmacia: { nome: 'Farmácia', icone: '💊' },
};

export const iconeEstabelecimento = (tipo) => (ESTABELECIMENTOS[tipo] || ESTABELECIMENTOS.pizzaria).icone;
