const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const mailService = require("../services/mail.service");
const { Op } = require("sequelize");
const crypto = require('crypto');
const validatePassword = require("../middleware/password-validator");

const Admin = db.admins;
const User = db.users;
const Report = db.reports;
const Item = db.items;
const Claim = db.claims;
const getPagination = (page, size) => {
  const limit = size ? +size : 20; // Let's show 20 users per page
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// This function is unchanged and correct
exports.login = (req, res) => {
  Admin.findOne({ where: { email: req.body.email } })
  .then(admin => {
    if (!admin) {
      return res.status(404).send({ message: "Admin Not found." });
    }
    if (admin.password === 'SETUP_PENDING') {
      return res.status(401).send({ 
        message: "Account setup is not complete. Please use the setup link from your invitation email."
      });
    }
    const passwordIsValid = bcrypt.compareSync(req.body.password, admin.password);
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
    }
    const token = jwt.sign({ id: admin.id, role: admin.role }, "a-very-secret-key-for-admins", { expiresIn: 86400 });
    res.status(200).send({ id: admin.id, name: admin.name, email: admin.email, accessToken: token, role: admin.role });
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};

// --- THIS IS THE NEW INVITATION FUNCTION ---
exports.sendAdminInvitation = async (req, res) => {
    try {
        const { name, email } = req.body;
        const existingAdmin = await Admin.findOne({ where: { email } });
        if (existingAdmin) {
            return res.status(409).send({ message: "This email is already in use by an administrator." });
        }
        const newAdmin = await Admin.create({ name, email, password: 'SETUP_PENDING' });
        const setupToken = jwt.sign({ id: newAdmin.id }, "a-super-secret-setup-key", { expiresIn: '24h' });
        mailService.sendAdminInvitationEmail(email, name, setupToken);
        res.send({ message: `An invitation email has been sent to ${email}.` });
    } catch (err) {
        res.status(500).send({ message: "Failed to send invitation." });
    }
};

// --- THIS IS THE NEW ACCOUNT SETUP FUNCTION ---
exports.setupAdminAccount = (req, res) => {
    const { token, password } = req.body;
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).send({ message: passwordCheck.message });
    }
    if (!token) {
        return res.status(400).send({ message: "Setup token is missing." });
    }
    jwt.verify(token, "a-super-secret-setup-key", (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
        }
        const newHashedPassword = bcrypt.hashSync(password, 8);
        Admin.update(
            { password: newHashedPassword, status: "active" },
            { where: { id: decoded.id } }
        )
        .then(([num]) => {
            if (num === 1) {
                res.send({ message: "Account setup successful! You can now log in." });
            } else {
                res.status(404).send({ message: "Admin account not found." });
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error setting up account." });
        });
    });
};
 


// ... (All your other admin functions for reports and users are here and correct)
exports.findAllAdmins = (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  const loggedInAdminId = req.userId;
  let condition = { id: { [Op.ne]: loggedInAdminId } };
  if (search) {
    condition[Op.and] = { [Op.or]: [ { name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } } ] };
  }
  Admin.findAndCountAll({ where: condition, limit, offset, order: [['createdAt', 'DESC']], attributes: { exclude: ['password'] } })
    .then(data => {
      const response = { admins: data.rows, totalPages: Math.ceil(data.count / limit) };
      res.send(response);
    })
    .catch(err => res.status(500).send({ message: "Error retrieving admins." }));
};

exports.updateReportStatus = (req, res) => {
  const reportId = req.params.reportId;
  const newStatus = req.body.status;
  Report.update({ status: newStatus }, { where: { id: reportId } })
  .then(num => {
    if (num == 1) { res.send({ message: "Report status updated successfully." }); }
    else { res.status(404).send({ message: `Cannot update Report with id=${reportId}.` }); }
  })
  .catch(err => res.status(500).send({ message: "Error updating Report status." }));
};


// This function is now correct
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status } = req.body;
    const user = await User.findByPk(userId);
    if (!user) { return res.status(404).send({ message: "User not found." }); }
    const previousStatus = user.status;
    await user.update({ status: status });
    if (status === 'suspended') { mailService.sendGeneralSuspensionEmail(user.email, user.name); }
    else if (status === 'banned') { mailService.sendGeneralBanEmail(user.email, user.name); }
    else if (status === 'active') {
      if (previousStatus === 'suspended') { mailService.sendUnsuspendEmail(user.email, user.name); }
      else if (previousStatus === 'banned') { mailService.sendUnbanEmail(user.email, user.name); }
    }
    res.send({ message: `User status updated to ${status}.` });
  } catch (err) {
    res.status(500).send({ message: "Error updating User status." });
  }
};

// ----------------------------------------------------

// This is a new function to get the list of all users
exports.findAllUsers = (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  const condition = search ? { [Op.or]: [ { name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } } ] } : null;
  User.findAndCountAll({ where: condition, limit, offset, order: [['createdAt', 'DESC']] })
    .then(data => {
      const response = { users: data.rows, totalPages: Math.ceil(data.count / limit) };
      res.send(response);
    })
    .catch(err => res.status(500).send({ message: "Error retrieving users." }));
};
// This function is now correct
exports.sendWarning = (req, res) => {
  const userId = req.params.userId;
  User.findByPk(userId)
    .then(user => {
      if (!user) { return res.status(404).send({ message: "User not found." }); }
      mailService.sendWarningEmail(user.email, user.name);
      res.send({ message: "Warning email sent successfully." });
    })
    .catch(err => res.status(500).send({ message: "Error sending warning email." }));
};
// --- THIS IS THE NEW, SMARTER FUNCTION FOR SUSPEND/BAN ---
const suspendOrBanUserAndInitiateHandoff = async (res, report, userToModerate, item, newStatus) => {
  try {
    // 1. Update the user's status first
    await userToModerate.update({ status: newStatus });

    // 2. This is the role-aware logic
    const finder = await User.findByPk(item.userId);
    const acceptedClaim = await Claim.findOne({ where: { itemId: item.id, status: 'accepted' } });
    
    if (!acceptedClaim) {
      // Handle cases where there's no accepted claim
      if (newStatus === 'suspended') { mailService.sendGeneralSuspensionEmail(userToModerate.email, userToModerate.name); }
      else if (newStatus === 'banned') { mailService.sendGeneralBanEmail(userToModerate.email, userToModerate.name); }
    } else {
        const claimant = await User.findByPk(acceptedClaim.claimantId);
        if (finder.id === userToModerate.id) {
            // SCENARIO A: The FINDER was moderated.
            const handoffCode = `LFP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            await item.update({ handoff_code: handoffCode });
            
            // Send email to the Finder (as before)
            if (newStatus === 'suspended') { mailService.sendSuspensionEmailWithHandoff(finder.email, finder.name, item, handoffCode); }
            else if (newStatus === 'banned') { mailService.sendBanEmailWithHandoff(finder.email, finder.name, item, handoffCode); }
            
            // --- ADD THIS NEW LINE ---
            // This sends the new email to the Claimant at the same time
            mailService.sendHandoffNoticeToClaimant(claimant.email, claimant.name, item, handoffCode, newStatus);
            // -------------------------

        } else {
            // SCENARIO B: The CLAIMANT was moderated. The claim is now void.
            await acceptedClaim.update({ status: 'rejected', rejection_reason: 'Claim voided by administrator action.' });
            mailService.sendClaimVoidedToFinder(finder.email, finder.name, item);
            if (newStatus === 'suspended') { mailService.sendGeneralSuspensionEmail(claimant.email, claimant.name); }
            else if (newStatus === 'banned') { mailService.sendGeneralBanEmail(claimant.email, claimant.name); }
        }
    }

    // 3. Close the report
    await report.update({ status: 'closed' });

    res.send({ message: `User has been ${newStatus} and the process is complete.` });
  } catch (err) {
    console.error(`Error during moderation process:`, err);
    res.status(500).send({ message: "An error occurred during moderation." });
  }
};
// This is the public "manager" function. It is now correct.
exports.moderateUser = async (req, res) => {
  try {
    const { reportId, newStatus } = req.body;
    const report = await Report.findOne({
      where: { id: reportId },
      include: [ { model: User, as: 'reporter' }, { model: User, as: 'reportedUser' }, { model: Item, as: 'item' } ]
    });
    if (!report || !report.reportedUser || !report.item) {
      return res.status(404).send({ message: "Report data is incomplete." });
    }
    // This correctly calls our internal tool to do the real work.
    suspendOrBanUserAndInitiateHandoff(res, report, report.reportedUser, report.item, newStatus);
  } catch (err) {
    res.status(500).send({ message: "An error occurred during moderation." });
  }
};
// --- THIS IS THE FIRST NEW FUNCTION ---
// Allows an admin to get a master list of ALL items
exports.findAllItems = (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  const condition = search ? { [Op.or]: [ { title: { [Op.like]: `%${search}%` } }, { category: { [Op.like]: `%${search}%` } }, { brand: { [Op.like]: `%${search}%` } } ] } : null;
  Item.findAndCountAll({ where: condition, limit, offset, order: [['createdAt', 'DESC']], include: [ { model: User, as: 'user', attributes: ['name', 'email'] }, { model: Claim, as: 'claims', attributes: ['status', 'rejection_reason'] } ] })
    .then(data => {
      const response = { items: data.rows, totalPages: Math.ceil(data.count / limit) };
      res.send(response);
    })
    .catch(err => res.status(500).send({ message: "Error retrieving items." }));
};
// --- THIS IS THE SECOND NEW FUNCTION ---
// Allows an admin to edit any item's details
exports.updateItem = (req, res) => {
  const id = req.params.id;
  Item.update(req.body, { where: { id: id } })
    .then(num => {
      if (num == 1) { res.send({ message: "Item was updated successfully." }); }
      else { res.status(404).send({ message: `Cannot update Item with id=${id}.` }); }
    })
    .catch(err => res.status(500).send({ message: "Error updating Item." }));
};

// --- THIS IS THE THIRD NEW FUNCTION ---
// Allows an admin to delete any item
exports.deleteItem = (req, res) => {
  const id = req.params.id;
  Item.update({ is_admin_deleted: true }, { where: { id: id } })
    .then(num => {
      if (num == 1) { res.send({ message: "Item was successfully marked as deleted by admin." }); }
      else { res.status(404).send({ message: `Cannot delete Item with id=${id}.` }); }
    })
    .catch(err => res.status(500).send({ message: "Error deleting Item." }));
};

// --- THIS IS THE FOURTH NEW FUNCTION ---
// Allows an admin to manually verify a guest's item
exports.verifyItem = (req, res) => {
  const id = req.params.id;
  Item.update({ is_verified: true }, { where: { id: id } })
    .then(num => {
      if (num == 1) { res.send({ message: "Item has been manually verified." }); }
      else { res.status(404).send({ message: `Cannot verify Item with id=${id}.` }); }
    })
    .catch(err => res.status(500).send({ message: "Error verifying Item." }));
};

exports.removeClaimsFromItem = (req, res) => {
  const itemId = req.params.id;
  Claim.destroy({ where: { itemId: itemId } })
  .then(nums => {
    res.send({ message: `${nums} claims were removed successfully.` });
  })
  .catch(err => res.status(500).send({ message: "An error occurred while removing claims." }));
};

exports.getProfile = (req, res) => {
  Admin.findByPk(req.userId, { attributes: { exclude: ['password'] } })
  .then(admin => {
    if (!admin) { return res.status(404).send({ message: "Admin Not found." }); }
    res.status(200).send(admin);
  })
  .catch(err => res.status(500).send({ message: err.message }));
};

exports.getProfile = (req, res) => {
  // The verifyToken middleware has already found the admin and attached their ID
  Admin.findByPk(req.userId, {
    attributes: { exclude: ['password'] } // Exclude the password for security
  })
  .then(admin => {
    if (!admin) {
      return res.status(404).send({ message: "Admin Not found." });
    }
    res.status(200).send(admin);
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};

exports.deleteAdmin = (req, res) => {
  const adminIdToDelete = req.params.id;
  const superAdminId = req.userId;
  if (parseInt(adminIdToDelete) === superAdminId) {
    return res.status(400).send({ message: "Action forbidden: You cannot delete your own account." });
  }
  Admin.destroy({ where: { id: adminIdToDelete } })
    .then(num => {
      if (num == 1) { res.send({ message: "Administrator account was deleted successfully." }); }
      else { res.status(404).send({ message: `Cannot delete Administrator with id=${adminIdToDelete}.` }); }
    })
    .catch(err => res.status(500).send({ message: "Could not delete Administrator." }));
};
exports.findAll = (req, res) => {
  Report.findAll()
    .then(reports => res.send(reports))
    .catch(err => res.status(500).send({ message: "Error retrieving reports." }));
};

exports.findAllReports = (req, res) => {
  Report.findAll({
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'reportedUser', attributes: ['id', 'name', 'email'] },
      { model: Item, as: 'item', attributes: ['id', 'title'] }
    ],
    order: [['createdAt', 'DESC']]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({ message: "Error retrieving reports." });
  });
};

exports.warnAndUnfreeze = async (req, res) => {
  try {
    const { userId, itemId, reportId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) { return res.status(404).send({ message: "User not found." }); }
    mailService.sendWarningEmail(user.email, user.name);
    await Item.update({ is_under_review: false }, { where: { id: itemId } });
    await Report.update({ status: 'closed' }, { where: { id: reportId } });
    res.send({ message: "Warning sent, and chat has been unfrozen." });
  } catch (err) {
    res.status(500).send({ message: "An error occurred while processing the request." });
  }
};

// Add these two new functions to admin.controller.js

// Function to get all items awaiting handoff
// Function to get all items awaiting handoff (CORRECTED ALIASES)
exports.getHandoffItems = async (req, res) => {
  try {
    const { search } = req.query;

    const searchCondition = search
      ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }] }
      : null;

    const items = await Item.findAll({
      where: searchCondition,
      include: [
        {
          model: User,
          as: 'user', // CHANGED from 'Finder' to match your model
          where: {
            status: { [Op.or]: ['suspended', 'banned'] }
          },
          required: true 
        },
        {
          model: Claim,
          as: 'claims', // CHANGED from 'Claims' to match your model
          required: true,
          include: [{
            model: User,
            as: 'claimant' // CHANGED from 'Claimant' to match your model
          }]
        }
      ]
    });

    res.status(200).send(items);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


