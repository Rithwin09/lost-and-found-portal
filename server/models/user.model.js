module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    name: {
      type: Sequelize.STRING
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
    phoneNumber: {
      type: Sequelize.STRING
    },
    // --- THIS IS THE NEW FIELD ---
    // It can be 'active', 'suspended', or 'banned'
    status: {
      type: Sequelize.STRING,
      defaultValue: 'active' 
    }
    // ---------------------------
  });
  User.associate = (models) => {
    // A User can have many Items, Claims, and Reports
    User.hasMany(models.items, { foreignKey: 'userId' });
    User.hasMany(models.claims, { as: 'claimsMade', foreignKey: 'claimantId' });
    User.hasMany(models.reports, { as: 'reportsMade', foreignKey: 'reporterId' });
    User.hasMany(models.reports, { as: 'reportsAgainst', foreignKey: 'reportedUserId' });
  };

  return User;
};