const { pontoADistancia } = require('../../src/nucleo/geo');
const {
  validarPosicao,
  precisaoAceitavel,
  situacaoDoSinal,
  simplificarTrajeto,
  SINAL,
} = require('../../src/nucleo/rastreio');

describe('validação da posição enviada pelo app (RN29)', () => {
  it('aceita latitude, longitude e precisão válidas', () => {
    expect(validarPosicao({ latitude: -22.89, longitude: -47.05, precisao: 12 })).toEqual([]);
    expect(validarPosicao({ latitude: -22.89, longitude: -47.05 })).toEqual([]);
  });

  it('recusa valores fora do intervalo ou que não são números', () => {
    expect(validarPosicao({ latitude: 91, longitude: 0 })).toHaveLength(1);
    expect(validarPosicao({ latitude: '-22', longitude: -47 })).toHaveLength(1);
    expect(validarPosicao({ latitude: 0, longitude: 0, precisao: -1 })).toHaveLength(1);
    expect(validarPosicao(null)).toHaveLength(1);
  });

  it('descarta pontos imprecisos (acima de 100 m)', () => {
    expect(precisaoAceitavel(30)).toBe(true);
    expect(precisaoAceitavel(100)).toBe(true);
    expect(precisaoAceitavel(450)).toBe(false);
    expect(precisaoAceitavel(undefined)).toBe(true);
  });
});

describe('situação do sinal', () => {
  const agora = new Date('2026-11-23T23:00:00Z');
  const haMinutos = (m) => new Date(agora.getTime() - m * 60 * 1000);

  it('ao vivo até 2 min, sem sinal até 30 min, oculto depois', () => {
    expect(situacaoDoSinal(haMinutos(1), agora)).toBe(SINAL.AO_VIVO);
    expect(situacaoDoSinal(haMinutos(2), agora)).toBe(SINAL.AO_VIVO);
    expect(situacaoDoSinal(haMinutos(10), agora)).toBe(SINAL.SEM_SINAL);
    expect(situacaoDoSinal(haMinutos(31), agora)).toBeNull();
  });
});

describe('simplificação do trajeto', () => {
  const origem = { latitude: -22.85, longitude: -47.05 };
  const aMetros = (m) => pontoADistancia(origem, m / 1000, 90);

  it('ignora pontos a menos de 15 m do anterior, mas mantém o primeiro e o último', () => {
    const pontos = [origem, aMetros(5), aMetros(10), aMetros(40), aMetros(45), aMetros(48)];
    const r = simplificarTrajeto(pontos);
    expect(r).toEqual([origem, aMetros(40), aMetros(48)]);
  });

  it('com até 2 pontos, devolve os mesmos pontos', () => {
    expect(simplificarTrajeto([origem])).toEqual([origem]);
    expect(simplificarTrajeto([])).toEqual([]);
  });
});
