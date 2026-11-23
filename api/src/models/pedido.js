const { QueryTypes } = require('sequelize');
const { STATUS_PEDIDO, TIPO_ENTREGA, FATIAS } = require('../nucleo/constantes');
const { diaOperacional } = require('../nucleo/contador');

// Próximo número do contador do dia (RN28). Um único comando lê e incrementa o
// contador, então dois pedidos simultâneos nunca pegam o mesmo número.
async function proximoNumeroDoDia(sequelize, dia, transaction) {
  const [linha] = await sequelize.query(
    `INSERT INTO contadores_pedidos (dia_operacional, ultimo_numero) VALUES (:dia, 1)
     ON CONFLICT (dia_operacional)
     DO UPDATE SET ultimo_numero = contadores_pedidos.ultimo_numero + 1
     RETURNING ultimo_numero`,
    { replacements: { dia }, type: QueryTypes.SELECT, transaction },
  );
  return linha.ultimo_numero;
}

module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define(
    'Pedido',
    {
      plataforma: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      codigoExibicao: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      origem: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },

      // Contador do dia (RN28): "#8" na tela. Preenchido sozinho ao criar o pedido.
      diaOperacional: { type: DataTypes.DATEONLY, allowNull: false },
      numeroDoDia: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },

      // Podem virar null quando o prazo de retenção vence (RN20).
      clienteNome: { type: DataTypes.STRING, allowNull: true },
      clienteTelefone: { type: DataTypes.STRING, allowNull: true },
      endereco: { type: DataTypes.STRING, allowNull: true },
      dadosClienteApagadosEm: { type: DataTypes.DATE, allowNull: true },

      latitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -90, max: 90 } },
      longitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -180, max: 180 } },
      anel: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1 } },
      fatia: { type: DataTypes.STRING(2), allowNull: true, validate: { isIn: [FATIAS] } },

      horarioPedido: { type: DataTypes.DATE, allowNull: false },
      horarioPrometido: { type: DataTypes.DATE, allowNull: false },
      tipoEntrega: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [Object.values(TIPO_ENTREGA)] },
      },
      exigeCodigo: { type: DataTypes.BOOLEAN, allowNull: false },
      localizador: { type: DataTypes.STRING, allowNull: true },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: STATUS_PEDIDO.EM_PREPARO,
        validate: { isIn: [Object.values(STATUS_PEDIDO)] },
      },
      horarioPronto: { type: DataTypes.DATE, allowNull: true },
      horarioEntrega: { type: DataTypes.DATE, allowNull: true },
      motivoProblema: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'pedidos',
      hooks: {
        // Todo pedido novo ganha o próximo número do dia, venha de onde vier
        // (porta de entrada, cadastro manual, testes). Roda antes da validação
        // porque os dois campos são obrigatórios.
        async beforeValidate(pedido, opcoes) {
          if (!pedido.isNewRecord || pedido.numeroDoDia) return;
          pedido.diaOperacional = pedido.diaOperacional || diaOperacional(new Date());
          pedido.numeroDoDia = await proximoNumeroDoDia(sequelize, pedido.diaOperacional, opcoes.transaction);
        },
      },
    },
  );

  Pedido.associate = (models) => {
    Pedido.hasMany(models.Parada, { foreignKey: 'pedidoId', as: 'paradas' });
  };

  return Pedido;
};
