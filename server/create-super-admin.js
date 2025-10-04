const db = require("./models");
const bcrypt = require("bcryptjs");
const Admin = db.admins;

async function createFirstSuperAdmin() {
  try {
    await db.sequelize.sync({ force: true }); // This will drop and recreate all tables
    console.log("Tables dropped and synced.");
    
    const hashedPassword = bcrypt.hashSync('Rithwin@09', 8);
    await Admin.create({
      name: 'Super Admin',
      email: 'nrithwinreddy@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
       status: 'active', 
      is_temporary_password: false // <-- THIS IS THE CRITICAL FIX
    });

    console.log("✅ SUCCESS: The first SUPER ADMIN account has been created.");
    console.log("   Email: nrithwinreddy@gmail.com");
    console.log("   Password: Rithwin@09");

  } catch (err) {
    console.error("❌ ERROR: Could not create superadmin account:", err);
  } finally {
    db.sequelize.close();
  }
}

createFirstSuperAdmin();