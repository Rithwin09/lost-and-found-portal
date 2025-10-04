module.exports = (sequelize, Sequelize) => {
  const AdminPasswordReset = sequelize.define("admin_password_reset", {
    token: {
      type: Sequelize.STRING,
      allowNull: false
    },
    is_approved: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return AdminPasswordReset;
};