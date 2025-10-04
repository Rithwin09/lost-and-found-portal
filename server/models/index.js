const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import all our models
db.users = require("./user.model.js")(sequelize, Sequelize);
db.items = require("./item.model.js")(sequelize, Sequelize);
db.messages = require("./message.model.js")(sequelize, Sequelize);
db.claims = require("./claim.model.js")(sequelize, Sequelize);
db.reports = require("./report.model.js")(sequelize, Sequelize);
db.admins = require("./admin.model.js")(sequelize, Sequelize);
db.adminPasswordResets = require("./admin-password-reset.model.js")(sequelize, Sequelize);

// --- ALL RELATIONSHIPS (FINAL, CORRECTED VERSION) ---

// User <-> Item
db.users.hasMany(db.items, { foreignKey: 'userId' });
db.items.belongsTo(db.users, { as: 'user', foreignKey: "userId" }); // The 'as: user' nickname is critical

// Message Relationships
db.messages.belongsTo(db.users, { as: 'sender', foreignKey: 'senderId' });
db.users.hasMany(db.messages, { as: 'sentMessages', foreignKey: 'senderId' });
db.messages.belongsTo(db.items, { foreignKey: 'itemId' });
db.items.hasMany(db.messages, { foreignKey: 'itemId' });

// Claim Relationships
db.claims.belongsTo(db.users, { as: 'claimant', foreignKey: 'claimantId' });
db.users.hasMany(db.claims, { as: 'claimsMade', foreignKey: 'claimantId' });
db.claims.belongsTo(db.items, { foreignKey: 'itemId' });
db.items.hasMany(db.claims, { as: 'claims', foreignKey: 'itemId' });

// Report Relationships
db.reports.belongsTo(db.users, { as: 'reporter', foreignKey: 'reporterId' });
db.users.hasMany(db.reports, { as: 'reportsMade', foreignKey: 'reporterId' });
db.reports.belongsTo(db.users, { as: 'reportedUser', foreignKey: 'reportedUserId' });
db.users.hasMany(db.reports, { as: 'reportsAgainst', foreignKey: 'reportedUserId' });
db.reports.belongsTo(db.items, { foreignKey: 'itemId' });
db.items.hasMany(db.reports, { foreignKey: 'itemId' });
db.admins.hasMany(db.adminPasswordResets, { foreignKey: 'adminId' });
db.adminPasswordResets.belongsTo(db.admins, { foreignKey: 'adminId' });

module.exports = db;