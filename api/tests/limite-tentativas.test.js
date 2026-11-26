const { criarLimiteTentativas, comLimite } = require('../src/http/limite-tentativas');
const { ErroNegocio } = require('../src/erros');

// Relógio controlado pelo teste.
function relogioFalso() {
  let agora = 0;
  const relogio = () => agora;
  relogio.avancarMin = (m) => {
    agora += m * 60 * 1000;
  };
  return relogio;
}

const loginErrado = () => Promise.reject(new ErroNegocio(401, 'Telefone ou PIN inválidos'));
const loginCerto = () => Promise.resolve({ token: 'ok' });

describe('limite de tentativas de login (RNF15)', () => {
  it('bloqueia depois de 5 erros e libera depois de 15 min', async () => {
    const relogio = relogioFalso();
    const limite = criarLimiteTentativas({ relogio });
    for (let i = 0; i < 5; i++) await expect(comLimite(limite, '19911', loginErrado)).rejects.toMatchObject({ status: 401 });

    // Bloqueado: nem o PIN certo entra.
    await expect(comLimite(limite, '19911', loginCerto)).rejects.toMatchObject({ status: 429 });

    relogio.avancarMin(15);
    await expect(comLimite(limite, '19911', loginCerto)).resolves.toEqual({ token: 'ok' });
  });

  it('acertar zera a contagem', async () => {
    const limite = criarLimiteTentativas({ relogio: relogioFalso() });
    for (let i = 0; i < 4; i++) await expect(comLimite(limite, 'a', loginErrado)).rejects.toMatchObject({ status: 401 });
    await comLimite(limite, 'a', loginCerto);
    for (let i = 0; i < 4; i++) await expect(comLimite(limite, 'a', loginErrado)).rejects.toMatchObject({ status: 401 });
    await expect(comLimite(limite, 'a', loginCerto)).resolves.toEqual({ token: 'ok' });
  });

  it('cada telefone tem a sua contagem', async () => {
    const limite = criarLimiteTentativas({ relogio: relogioFalso() });
    for (let i = 0; i < 5; i++) await expect(comLimite(limite, 'x', loginErrado)).rejects.toMatchObject({ status: 401 });
    await expect(comLimite(limite, 'y', loginCerto)).resolves.toEqual({ token: 'ok' });
  });

  it('outros erros (ex.: banco fora do ar) não contam como tentativa', async () => {
    const limite = criarLimiteTentativas({ relogio: relogioFalso() });
    const falhaBanco = () => Promise.reject(new Error('conexão recusada'));
    for (let i = 0; i < 6; i++) await expect(comLimite(limite, 'z', falhaBanco)).rejects.toThrow('conexão recusada');
    await expect(comLimite(limite, 'z', loginCerto)).resolves.toEqual({ token: 'ok' });
  });
});
