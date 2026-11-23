import { SITUACAO } from '../useLocalizacao';

// Faixa no topo da rota com a situação da localização (RN29). Na primeira vez,
// explica o motivo antes de o navegador perguntar.
export default function AvisoLocalizacao({ situacao, aoPermitir }) {
  switch (situacao) {
    case SITUACAO.PEDIR:
      return (
        <section className="localizacao localizacao-pedir">
          <p>
            <strong>📍 Compartilhar sua localização</strong>
            <br />A pizzaria acompanha sua rota no mapa enquanto você trabalha. Fora de serviço, nada é guardado.
          </p>
          <button className="botao-grande primario" onClick={aoPermitir}>
            Permitir localização
          </button>
        </section>
      );
    case SITUACAO.BUSCANDO:
      return <p className="localizacao localizacao-info">📍 Procurando sinal de GPS…</p>;
    case SITUACAO.ATIVA:
      return (
        <p className="localizacao localizacao-ativa">
          📍 Localização ativa. Deixe o app aberto na tela durante a rota.
        </p>
      );
    case SITUACAO.NEGADA:
      return (
        <p className="localizacao localizacao-alerta">
          📍 A localização está bloqueada. Para liberar: toque no cadeado ao lado do endereço, em{' '}
          <strong>Permissões → Localização → Permitir</strong>, e abra o app de novo.
        </p>
      );
    case SITUACAO.SEM_HTTPS:
      return (
        <p className="localizacao localizacao-alerta">
          📍 A localização só funciona quando o app é aberto por um endereço seguro (https). Avise a pizzaria.
        </p>
      );
    case SITUACAO.INDISPONIVEL:
      return <p className="localizacao localizacao-alerta">📍 Este celular não informa a localização.</p>;
    default:
      return null;
  }
}
