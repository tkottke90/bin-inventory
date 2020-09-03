// tslint:disable:object-literal-sort-keys

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("Transations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      itemId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      sourceId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      destinationId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      reason: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Transactions");
  },
};
