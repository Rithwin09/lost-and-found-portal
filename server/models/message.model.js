module.exports = (sequelize, Sequelize) => {
  const Message = sequelize.define("message", {
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    }
    // We will add columns for the sender and item later when we define relationships
  });

  return Message;
};