const { diaOperacional } = require('../../src/nucleo/contador');

// Horários em UTC; São Paulo é UTC−3. A virada do contador é às 6h locais (09:00 UTC).
describe('dia de operação do contador de pedidos (RN28)', () => {
  it('um pedido da noite pertence ao próprio dia', () => {
    // Sexta 20/11/2026 às 20h em São Paulo.
    expect(diaOperacional('2026-11-20T23:00:00Z')).toBe('2026-11-20');
  });

  it('depois da meia-noite, até as 6h, ainda conta como o dia anterior', () => {
    // Sábado 21/11 às 0h30 e às 5h59 em São Paulo: ainda é a noite de sexta.
    expect(diaOperacional('2026-11-21T03:30:00Z')).toBe('2026-11-20');
    expect(diaOperacional('2026-11-21T08:59:59Z')).toBe('2026-11-20');
  });

  it('às 6h começa um novo dia de operação', () => {
    expect(diaOperacional('2026-11-21T09:00:00Z')).toBe('2026-11-21');
  });

  it('aceita Date ou texto', () => {
    expect(diaOperacional(new Date('2026-11-20T23:00:00Z'))).toBe('2026-11-20');
  });
});
