// Contador de pedidos do dia (RN28): #1, #2, #3… na ordem em que os pedidos
// chegam ao sistema. Substitui o código da plataforma como identificação
// principal na tela, porque os códigos do iFood (4 dígitos) e do 99Food
// (6 dígitos) se misturam e se repetem ao longo da noite.
//
// O contador reinicia a cada "dia de operação". A virada é às 6h da manhã, e
// não à meia-noite, para que um expediente que passa da meia-noite continue
// com a mesma numeração (o pedido da 0h30 de sábado ainda é da sexta).

const FUSO_PIZZARIA = 'America/Sao_Paulo';
const HORA_VIRADA_CONTADOR = 6;

const MS_POR_HORA = 60 * 60 * 1000;

// Formato "AAAA-MM-DD", o mesmo de uma coluna DATE do banco.
const formatoData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_PIZZARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Dia de operação a que pertence o instante "agora": a data no fuso da
// pizzaria, contando que o dia só termina às 6h da manhã seguinte.
function diaOperacional(agora) {
  const recuado = new Date(new Date(agora).getTime() - HORA_VIRADA_CONTADOR * MS_POR_HORA);
  return formatoData.format(recuado);
}

module.exports = { FUSO_PIZZARIA, HORA_VIRADA_CONTADOR, diaOperacional };
