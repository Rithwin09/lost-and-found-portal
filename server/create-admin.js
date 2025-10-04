// 1. Import all the necessary tools
const db = require("./models");
const bcrypt = require("bcryptjs");
const Admin = db.admins;

/**
 * This is a special, one-time-use script. Its only job is to create the
 * first administrator account in our database safely and securely.
 */
async function createFirstAdmin() {
  try {
    // 2. First, we check if an admin with this email already exists.
    // This makes the script safe to run multiple times without creating duplicate accounts.
    const existingAdmin = await Admin.findOne({ where: { email: 'admin@test.com' } });
    if (existingAdmin) {
      console.log("INFO: An admin account with this email already exists.");
      return; // Stop the script if the admin is already there.
    }

    // 3. If no admin exists, we create one.
    // We securely hash the simple password into a long, unreadable string.
    const hashedPassword = bcrypt.hashSync('adminpass123', 8);

    await Admin.create({
      name: 'Campus Admin',
      email: 'admin@test.com',
      password: hashedPassword
    });

    // 4. Print a clear success message to the terminal.
    console.log("✅ SUCCESS: The first admin account has been created.");
    console.log("   Email: admin@test.com");
    console.log("   Password: adminpass123");

  } catch (err) {
    // 5. If anything goes wrong, we print a clear error message.
    console.error("❌ ERROR: Could not create admin account:", err);
  } finally {
    // 6. This is a critical step. We close the database connection
    //    so the script can exit cleanly after it's finished.
    db.sequelize.close();
  }
}

// 7. This is the starting point. We first connect to the database.
//    Only after a successful connection do we try to run our main function.
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    createFirstAdmin();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
