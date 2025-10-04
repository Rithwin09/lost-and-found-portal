module.exports = (sequelize, Sequelize) => {
  const Report = sequelize.define("report", {
    reason: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    chat_log: {
      type: Sequelize.TEXT, // We will store a snapshot of the chat here
      allowNull: false
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'open' // Can be 'open', 'reviewing', or 'closed'
    }
  });

  return Report;
};