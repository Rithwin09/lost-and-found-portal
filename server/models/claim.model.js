module.exports = (sequelize, Sequelize) => {
  const Claim = sequelize.define("claim", {
    proof_description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'pending' // 'pending', 'accepted', or 'rejected'
    },
    // --- THIS IS THE CRITICAL FIELD ---
    rejection_reason: {
      type: Sequelize.TEXT,
      allowNull: true // This will be null unless the claim is rejected
    }
    // ---------------------------------
  });
  Claim.associate = (models) => {
    // A Claim belongs to one Item and one User (the claimant)
    Claim.belongsTo(models.items, { foreignKey: 'itemId' });
    Claim.belongsTo(models.users, { as: 'claimant', foreignKey: 'claimantId' });
  };

  return Claim;
};