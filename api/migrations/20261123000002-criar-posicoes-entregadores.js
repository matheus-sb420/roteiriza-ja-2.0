'use strict';

// Posições do entregador enviadas pelo app (RN29). Cada linha é um ponto do
// trajeto; a última é onde o entregador está agora. "rota_id" liga o ponto à
// rota despachada naquele momento, para desenhar o trajeto da rota no mapa.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posicoes_entregadores', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      entregador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'entregadores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rota_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'rotas', key: 'id' },
        onUpdate: 'CASCADE',
        // Desfazer a rota não apaga o histórico de onde o entregador passou.
        onDelete: 'SET NULL',
      },
      latitude: { type: Sequelize.DOUBLE, allowNull: false },
      longitude: { type: Sequelize.DOUBLE, allowNull: false },
      // Precisão informada pelo celular, em metros (quanto menor, melhor).
      precisao_m: { type: Sequelize.DOUBLE, allowNull: true },
      // Horário do servidor ao receber: não depende do relógio do celular.
      registrada_em: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('posicoes_entregadores', ['entregador_id', 'registrada_em']);
    await queryInterface.addIndex('posicoes_entregadores', ['rota_id', 'registrada_em']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('posicoes_entregadores');
  },
};
