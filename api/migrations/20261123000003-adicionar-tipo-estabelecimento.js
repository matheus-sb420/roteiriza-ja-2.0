'use strict';

// Tipo do estabelecimento (RN30): escolhe o ícone da loja no mapa (pizza,
// hambúrguer, pastel, açaí…). Quem já usa o sistema continua como pizzaria.
//
// Sem CHECK no banco, ao contrário dos status: a lista de tipos é de
// apresentação e deve crescer só com mudança de código (constantes.js),
// sem precisar de migration. O model valida com isIn.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('configuracoes', 'tipo_estabelecimento', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pizzaria',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('configuracoes', 'tipo_estabelecimento');
  },
};
