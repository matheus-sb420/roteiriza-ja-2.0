// Um ponto do trajeto do entregador (RN29).
module.exports = (sequelize, DataTypes) => {
  const PosicaoEntregador = sequelize.define(
    'PosicaoEntregador',
    {
      latitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -90, max: 90 } },
      longitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -180, max: 180 } },
      precisaoM: { type: DataTypes.DOUBLE, allowNull: true, validate: { min: 0 } },
      registradaEm: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'posicoes_entregadores', timestamps: false },
  );

  PosicaoEntregador.associate = (models) => {
    PosicaoEntregador.belongsTo(models.Entregador, { foreignKey: 'entregadorId', as: 'entregador' });
    PosicaoEntregador.belongsTo(models.Rota, { foreignKey: 'rotaId', as: 'rota' });
  };

  return PosicaoEntregador;
};
