jest.mock('../src/portas/saida', () => ({
  ...jest.requireActual('../src/portas/saida'),
  pedidoEmRota: jest.fn(),
}));

const { sequelize, Entregador, PosicaoEntregador } = require('../src/models');
const { app, request, limparBanco, tokenAdmin, pedidoContrato, comChave, CENTRO } = require('./apoio/banco');
const { apagarLocalizacoesVencidas } = require('../src/servicos/lgpd');

let tokenAdm;
const admin = (req) => req.set('Authorization', `Bearer ${tokenAdm}`);

async function entregadorLogado(telefone = '19988887777') {
  const { body } = await admin(request(app).post('/api/entregadores')).send({ nome: 'João', telefone });
  const login = await request(app).post('/app/login').send({ telefone, pin: body.pin });
  return { entregadorId: body.entregador.id, token: login.body.token };
}

async function despachar(entregadorId) {
  const r = await comChave(request(app).post('/entrada/pedidos')).send(pedidoContrato());
  await admin(request(app).post(`/api/pedidos/${r.body.id}/pronto`)).send({ pronto: true });
  const { body: rota } = await admin(request(app).post('/api/rotas')).send({ pedidoIds: [r.body.id] });
  await admin(request(app).post(`/api/rotas/${rota.id}/despachar`)).send({ entregadorId });
  return rota.id;
}

const enviar = (token, posicao) =>
  request(app).post('/app/posicao').set('Authorization', `Bearer ${token}`).send(posicao);
const perto = (metrosNorte) => ({
  latitude: CENTRO.latitude + metrosNorte / 111320,
  longitude: CENTRO.longitude,
  precisao: 10,
});

beforeEach(async () => {
  await limparBanco();
  tokenAdm = await tokenAdmin();
});

afterAll(() => sequelize.close());

describe('posição do entregador (RN29)', () => {
  it('grava a posição e mostra o entregador no painel', async () => {
    const { token } = await entregadorLogado();
    const r = await enviar(token, perto(100));
    expect(r.status).toBe(201);

    const painel = await admin(request(app).get('/api/painel'));
    expect(painel.body.localizacoes).toHaveLength(1);
    expect(painel.body.localizacoes[0]).toMatchObject({ nome: 'João', sinal: 'ao_vivo', rotaId: null, trajeto: [] });
  });

  it('em rota, liga os pontos à rota e devolve o trajeto', async () => {
    const { token, entregadorId } = await entregadorLogado();
    const rotaId = await despachar(entregadorId);
    await enviar(token, perto(0));
    await enviar(token, perto(200));
    await enviar(token, perto(400));

    const painel = await admin(request(app).get('/api/painel'));
    const loc = painel.body.localizacoes[0];
    expect(loc.rotaId).toBe(rotaId);
    expect(loc.trajeto).toHaveLength(3);
    expect(await PosicaoEntregador.count({ where: { rotaId } })).toBe(3);
  });

  it('não grava fora de serviço nem com precisão ruim', async () => {
    const { token, entregadorId } = await entregadorLogado();
    const ruim = await enviar(token, { ...perto(0), precisao: 800 });
    expect(ruim.status).toBe(202);
    expect(ruim.body.motivo).toBe('precisao_baixa');

    await Entregador.update({ situacao: 'fora_de_servico' }, { where: { id: entregadorId } });
    const fora = await enviar(token, perto(0));
    expect(fora.body.motivo).toBe('fora_de_servico');
    expect(await PosicaoEntregador.count()).toBe(0);
  });

  it('recusa posição inválida e exige login de entregador', async () => {
    const { token } = await entregadorLogado();
    expect((await enviar(token, { latitude: 'x', longitude: 0 })).status).toBe(422);
    expect((await request(app).post('/app/posicao').send(perto(0))).status).toBe(401);
  });

  it('LGPD: apaga posições mais antigas que o prazo de retenção', async () => {
    const { token, entregadorId } = await entregadorLogado();
    await enviar(token, perto(0));
    await PosicaoEntregador.create({ entregadorId, latitude: 0, longitude: 0, registradaEm: new Date('2020-01-01') });
    expect(await apagarLocalizacoesVencidas()).toBe(1);
    expect(await PosicaoEntregador.count()).toBe(1);
  });
});
