module.exports = (sequelize, Sequelize) => {
  const Admin = sequelize.define("admin", {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.STRING,
      defaultValue: 'admin'
    },
    // --- THIS IS THE NEW, SMARTER STATUS COLUMN (YOUR DESIGN) ---
    status: {
      type: Sequelize.STRING,
      defaultValue: 'pending' // 'pending', 'active'
    }
    // ---------------------------------------------------------
  });

  return Admin;
};