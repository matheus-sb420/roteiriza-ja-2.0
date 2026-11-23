'use strict';

// Contador de pedidos do dia (RN28).
//
// - pedidos.dia_operacional + pedidos.numero_do_dia: o número curto (#1, #2…)
//   mostrado no mapa no lugar do código da plataforma. Únicos juntos.
// - contadores_pedidos: uma linha por dia com o último número usado. O próximo
//   número sai de um único comando (INSERT … ON CONFLICT … RETURNING), que o
//   PostgreSQL executa de forma atômica: dois pedidos chegando no mesmo
//   instante nunca recebem o mesmo número.
//
// Pedidos já existentes são numerados pela ordem de criação, dia a dia, com a
// mesma regra da virada às 6h (horário de São Paulo).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'contadores_pedidos',
        {
          dia_operacional: { type: Sequelize.DATEONLY, primaryKey: true },
          ultimo_numero: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pedidos',
        'dia_operacional',
        { type: Sequelize.DATEONLY, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pedidos',
        'numero_do_dia',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      // Numera os pedidos antigos e registra o último número de cada dia.
      await queryInterface.sequelize.query(
        `UPDATE pedidos p
            SET dia_operacional = n.dia, numero_do_dia = n.numero
           FROM (
             SELECT id,
                    dia,
                    ROW_NUMBER() OVER (PARTITION BY dia ORDER BY created_at, id) AS numero
               FROM (
                 SELECT id, created_at,
                        ((created_at AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '6 hours')::date AS dia
                   FROM pedidos
               ) d
           ) n
          WHERE p.id = n.id`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `INSERT INTO contadores_pedidos (dia_operacional, ultimo_numero)
         SELECT dia_operacional, MAX(numero_do_dia) FROM pedidos GROUP BY dia_operacional`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'pedidos',
        'dia_operacional',
        { type: Sequelize.DATEONLY, allowNull: false },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pedidos',
        'numero_do_dia',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction },
      );
      await queryInterface.addIndex('pedidos', ['dia_operacional', 'numero_do_dia'], {
        unique: true,
        name: 'pedidos_numero_do_dia_unico',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('pedidos', 'pedidos_numero_do_dia_unico', { transaction });
      await queryInterface.removeColumn('pedidos', 'numero_do_dia', { transaction });
      await queryInterface.removeColumn('pedidos', 'dia_operacional', { transaction });
      await queryInterface.dropTable('contadores_pedidos', { transaction });
    });
  },
};
