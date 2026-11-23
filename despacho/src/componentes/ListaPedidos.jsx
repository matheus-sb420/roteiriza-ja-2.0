import { URGENCIA, STATUS, formatarFolga, setor, hora, numeroPedido, codigoPlataforma } from '../formatar';

const FILTROS = [
  ['ativos', 'Todos'],
  ['em_preparo', 'Em preparo'],
  ['pronto', 'Prontos'],
  ['em_rota', 'Em rota'],
  ['livres', 'Fora de rotas'],
];

// Abas da lateral (RF08, RF28), em dois grupos: por tipo de entrega e o que
// pede atenção. "Atrasados" junta própria e plataforma.
const GRUPOS_ABAS = [
  [
    ['propria', 'Entrega própria'],
    ['plataforma', 'Plataforma'],
  ],
  [
    ['atrasados', 'Atrasados'],
    ['pendentes', 'Pendentes'],
    ['cancelados', 'Cancelados'],
  ],
];

// O filtro por status só faz sentido nas abas por tipo de entrega.
const ABAS_COM_FILTRO = ['propria', 'plataforma'];

// Separa os pedidos de cada aba. Pendentes de confirmação só aparecem na aba
// deles; cancelados vêm da API à parte (não estão entre os ativos).
export function pedidosPorAba(pedidos, cancelados) {
  const ativos = pedidos.filter((p) => p.status !== 'pendente_confirmacao');
  return {
    propria: ativos.filter((p) => p.tipoEntrega === 'propria'),
    plataforma: ativos.filter((p) => p.tipoEntrega === 'plataforma'),
    atrasados: ativos.filter((p) => p.classificacao === 'atrasado'),
    pendentes: pedidos.filter((p) => p.status === 'pendente_confirmacao'),
    cancelados,
  };
}

function Identificacao({ pedido }) {
  return (
    <strong>
      {numeroPedido(pedido)} <small>{codigoPlataforma(pedido)}</small>
    </strong>
  );
}

// Pedido em andamento: folga, setor, status e ações (pronto, rota, cancelar).
function ItemPedido({ p, selecionados, aoAlternarSelecao, aoMarcarPronto, aoCancelar }) {
  const u = URGENCIA[p.classificacao];
  const podeSelecionar = p.tipoEntrega === 'propria' && !p.rotaId && ['em_preparo', 'pronto'].includes(p.status);
  return (
    <li className={`item-pedido ${p.status === 'em_preparo' ? 'esmaecido' : ''}`}>
      <span className={`urgencia urgencia-${p.classificacao}`} title={u.nome}>
        {u.simbolo} {formatarFolga(p.folga)}
      </span>
      <div className="item-info">
        <Identificacao pedido={p} />
        <small>
          {setor(p)} · prometido {hora(p.horarioPrometido)}
        </small>
        <small>
          {STATUS[p.status]}
          {p.tipoEntrega === 'plataforma' ? ' · entrega pela plataforma' : ''}
          {p.rotaId ? ` · rota #${p.rotaId}` : ''}
        </small>
      </div>
      <div className="item-acoes">
        {p.status === 'em_preparo' && (
          <button className="primario" onClick={() => aoMarcarPronto(p, true)}>
            Pronto
          </button>
        )}
        {p.status === 'pronto' && (
          <button onClick={() => aoMarcarPronto(p, false)} title="Desmarcar pronto">
            ↺
          </button>
        )}
        {podeSelecionar && (
          <label className="seletor" title="Selecionar para rota manual">
            <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => aoAlternarSelecao(p.id)} />
            rota
          </label>
        )}
        {['em_preparo', 'pronto'].includes(p.status) && (
          <button className="discreto" onClick={() => aoCancelar(p)} title="Cancelar pedido">
            ✕
          </button>
        )}
      </div>
    </li>
  );
}

// Entrega sem confirmação (RN21, RF21): a atendente confirma ou registra o problema.
function ItemPendente({ p, aoResolver }) {
  return (
    <li className="item-pedido item-pendente">
      <div className="item-info">
        <Identificacao pedido={p} />
        <small>{p.endereco}</small>
        <small>
          {setor(p)} · prometido {hora(p.horarioPrometido)}
          {p.rotaId ? ` · rota #${p.rotaId}` : ''}
        </small>
        <div className="botoes">
          <button className="primario" onClick={() => aoResolver(p, { entregue: true })}>
            Foi entregue
          </button>
          <button
            onClick={() => {
              const motivo = window.prompt('Qual foi o problema com esta entrega?');
              if (motivo) aoResolver(p, { motivo });
            }}
          >
            Registrar problema
          </button>
        </div>
      </div>
    </li>
  );
}

// Cancelado no dia: só consulta, sem ações.
function ItemCancelado({ p }) {
  return (
    <li className="item-pedido item-cancelado">
      <div className="item-info">
        <Identificacao pedido={p} />
        <small>{p.endereco}</small>
        <small>
          Pedido às {hora(p.horarioPedido)} · prometido {hora(p.horarioPrometido)}
        </small>
      </div>
    </li>
  );
}

const VAZIO = {
  atrasados: 'Nenhum pedido atrasado.',
  pendentes: 'Nenhuma entrega aguardando confirmação.',
  cancelados: 'Nenhum pedido cancelado hoje.',
};

// Lateral esquerda: resumo do dia, abas e pedidos ordenados pela folga (RF05).
export default function ListaPedidos({
  pedidos,
  cancelados,
  resumoDoDia,
  aba,
  aoMudarAba,
  filtro,
  aoMudarFiltro,
  selecionados,
  aoAlternarSelecao,
  aoMarcarPronto,
  aoCancelar,
  aoResolver,
}) {
  const porAba = pedidosPorAba(pedidos, cancelados);
  const daAba = porAba[aba];
  const visiveis = ABAS_COM_FILTRO.includes(aba)
    ? daAba.filter((p) => {
        if (filtro === 'ativos') return true;
        if (filtro === 'livres') return !p.rotaId;
        return p.status === filtro;
      })
    : daAba;

  return (
    <aside className="lateral lateral-esquerda">
      <p className="resumo-dia">
        <strong>{resumoDoDia.total}</strong> pedidos hoje · {resumoDoDia.porStatus.entregue} entregues
      </p>

      {GRUPOS_ABAS.map((grupo, i) => (
        <div key={i} className="abas">
          {grupo.map(([id, nome]) => {
            const qtd = porAba[id].length;
            // Abas de atenção ganham cor quando têm algo (atrasado = vermelho, pendente = âmbar).
            const alerta = qtd > 0 && (id === 'atrasados' || id === 'pendentes') ? `com-alerta-${id}` : '';
            return (
              <button key={id} className={`${aba === id ? 'ativa' : ''} ${alerta}`} onClick={() => aoMudarAba(id)}>
                {nome} <span className="contagem">{qtd}</span>
              </button>
            );
          })}
        </div>
      ))}

      {ABAS_COM_FILTRO.includes(aba) && (
        <select value={filtro} onChange={(e) => aoMudarFiltro(e.target.value)}>
          {FILTROS.map(([valor, nome]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </select>
      )}

      {visiveis.length === 0 && <p className="vazio">{VAZIO[aba] || 'Nenhum pedido.'}</p>}
      <ul className="lista-pedidos">
        {visiveis.map((p) => {
          if (aba === 'pendentes') return <ItemPendente key={p.id} p={p} aoResolver={aoResolver} />;
          if (aba === 'cancelados') return <ItemCancelado key={p.id} p={p} />;
          return (
            <ItemPedido
              key={p.id}
              p={p}
              selecionados={selecionados}
              aoAlternarSelecao={aoAlternarSelecao}
              aoMarcarPronto={aoMarcarPronto}
              aoCancelar={aoCancelar}
            />
          );
        })}
      </ul>
    </aside>
  );
}
