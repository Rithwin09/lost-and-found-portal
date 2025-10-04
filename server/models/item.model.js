module.exports = (sequelize, Sequelize) => {
  const Item = sequelize.define("item", {
    // ... (All your existing columns: title, description, etc., are here)
    title: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: false },
    category: { type: Sequelize.STRING, allowNull: false },
    status: { type: Sequelize.STRING, allowNull: false },
    brand: { type: Sequelize.STRING },
    color: { type: Sequelize.STRING, allowNull: false },
    unique_marks: { type: Sequelize.STRING },
    item_size: { type: Sequelize.STRING },
    image_url: { type: Sequelize.STRING },
    guest_email: { type: Sequelize.STRING },
    is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
    is_under_review: { type: Sequelize.BOOLEAN, defaultValue: false },
    handoff_code: { type: Sequelize.STRING, allowNull: true },

    // --- THIS IS THE NEW "SOFT DELETE" SWITCH ---
    is_admin_deleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false // The item is not deleted by default
    }
    // ------------------------------------------
  });
  Item.associate = (models) => {
    // An Item belongs to one User and can have many Claims and Reports
    Item.belongsTo(models.users, { as: 'user', foreignKey: 'userId' });
    Item.hasMany(models.claims, { as: 'claims', foreignKey: 'itemId' });
    Item.hasMany(models.reports, { foreignKey: 'itemId' });
  };

  return Item;
};