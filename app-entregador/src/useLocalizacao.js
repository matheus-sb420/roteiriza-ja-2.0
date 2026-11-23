import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Localização do entregador (RN29).
//
// O navegador só entrega a posição com o app aberto e na tela: com a tela
// apagada ou o app em segundo plano, o envio para. Por isso, durante o uso,
// pedimos para manter a tela ligada (Wake Lock) e avisamos o entregador.
// A geolocalização também só funciona em endereço seguro (https ou localhost).

// Envia no máximo a cada 15 s, ou antes disso se andou 30 m. Parado, reenvia
// a cada 30 s para o despacho saber que o sinal continua ativo.
const INTERVALO_MINIMO_MS = 15000;
const DISTANCIA_MINIMA_M = 30;
const REENVIO_PARADO_MS = 30000;

export const SITUACAO = {
  VERIFICANDO: 'verificando',
  PEDIR: 'pedir', // ainda não perguntamos; mostra o botão "Permitir localização"
  BUSCANDO: 'buscando', // permitido, esperando o primeiro sinal de GPS
  ATIVA: 'ativa',
  NEGADA: 'negada',
  SEM_HTTPS: 'sem_https',
  INDISPONIVEL: 'indisponivel',
};

// Distância em metros (haversine), para decidir se vale enviar de novo.
function distanciaM(a, b) {
  const r = (g) => (g * Math.PI) / 180;
  const dLat = r(b.latitude - a.latitude);
  const dLon = r(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function useLocalizacao() {
  const [situacao, setSituacao] = useState(SITUACAO.VERIFICANDO);
  const observador = useRef(null);
  const ultimaLida = useRef(null);
  const ultimaEnviada = useRef(null);
  const travaTela = useRef(null);

  const enviar = useCallback(async (posicao, forcar = false) => {
    const agora = Date.now();
    const anterior = ultimaEnviada.current;
    if (!forcar && anterior) {
      const cedo = agora - anterior.quando < INTERVALO_MINIMO_MS;
      const perto = distanciaM(anterior, posicao) < DISTANCIA_MINIMA_M;
      if (cedo && perto) return;
    }
    ultimaEnviada.current = { ...posicao, quando: agora };
    try {
      await api('/app/posicao', { metodo: 'POST', corpo: posicao });
    } catch {
      // Sem internet por um momento: o próximo ponto tenta de novo.
      ultimaEnviada.current = anterior;
    }
  }, []);

  const manterTelaLigada = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        travaTela.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Sem suporte ou bateria fraca: segue sem a trava.
    }
  }, []);

  const iniciar = useCallback(() => {
    if (observador.current !== null) return;
    setSituacao(SITUACAO.BUSCANDO);
    observador.current = navigator.geolocation.watchPosition(
      (p) => {
        const posicao = { latitude: p.coords.latitude, longitude: p.coords.longitude, precisao: p.coords.accuracy };
        ultimaLida.current = posicao;
        setSituacao(SITUACAO.ATIVA);
        enviar(posicao);
      },
      (erro) => {
        if (erro.code === erro.PERMISSION_DENIED) {
          navigator.geolocation.clearWatch(observador.current);
          observador.current = null;
          setSituacao(SITUACAO.NEGADA);
        } else {
          // Sem sinal de GPS ou demorou: o navegador continua tentando.
          setSituacao(SITUACAO.BUSCANDO);
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
    manterTelaLigada();
  }, [enviar, manterTelaLigada]);

  // Ao abrir: confere se dá para usar e se a permissão já foi dada antes.
  useEffect(() => {
    if (!window.isSecureContext) return setSituacao(SITUACAO.SEM_HTTPS);
    if (!('geolocation' in navigator)) return setSituacao(SITUACAO.INDISPONIVEL);

    let cancelado = false;
    const decidir = (estado) => {
      if (cancelado) return;
      if (estado === 'granted') iniciar();
      else if (estado === 'denied') setSituacao(SITUACAO.NEGADA);
      else setSituacao(SITUACAO.PEDIR);
    };
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((p) => decidir(p.state))
        .catch(() => decidir('prompt'));
    } else {
      decidir('prompt');
    }
    return () => {
      cancelado = true;
    };
  }, [iniciar]);

  // Parado no lugar, o GPS não manda pontos novos: reenvia o último de tempos
  // em tempos. Ao voltar para o app, envia na hora e liga a trava de tela de novo.
  useEffect(() => {
    const id = setInterval(() => {
      if (ultimaLida.current) enviar(ultimaLida.current, true);
    }, REENVIO_PARADO_MS);
    const aoVoltar = () => {
      if (document.visibilityState !== 'visible' || observador.current === null) return;
      if (ultimaLida.current) enviar(ultimaLida.current, true);
      manterTelaLigada();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [enviar, manterTelaLigada]);

  // Ao sair do app (logout), para o GPS e libera a tela.
  useEffect(
    () => () => {
      if (observador.current !== null) navigator.geolocation.clearWatch(observador.current);
      travaTela.current?.release?.().catch(() => {});
    },
    [],
  );

  return { situacao, iniciar };
}
