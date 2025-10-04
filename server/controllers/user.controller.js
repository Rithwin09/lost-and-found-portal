const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const mailService = require("../services/mail.service");
const { Op } = require("sequelize");
const validatePassword = require("../middleware/password-validator");

const User = db.users;
const Item = db.items;
const Claim = db.claims;

// Function to handle new user registration
// --- THIS IS THE NEW, SMARTER REGISTER FUNCTION ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // 2. Validate the password first
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).send({ message: passwordCheck.message });
    }

    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(409).send({ message: "Failed! Email is already in use." });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = await User.create({
      name, email, phoneNumber,
      password: hashedPassword
    });

    await Item.update(
      { userId: newUser.id, guest_email: null },
      { where: { guest_email: email } }
    );

    res.send({ message: "User was registered successfully!" });
  } catch (err) {
    res.status(500).send({ message: "Error creating User." });
  }
};
// --------------------------------------------------


// Function for user login
exports.login = (req, res) => {
  User.findOne({ where: { email: req.body.email } })
  .then(user => {
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // NEW SECURITY CHECK: Is the user's account active?
    if (user.status !== 'active') {
      return res.status(403).send({ message: `Your account has been ${user.status}. Please contact an administrator.` });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
    }
    
    const token = jwt.sign({ id: user.id, role: 'user' }, "a-very-secret-key", { expiresIn: 86400 });
    
    res.status(200).send({ id: user.id, name: user.name, email: user.email, accessToken: token });
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};
// Function to handle the initial "Forgot Password" request
exports.forgotPassword = (req, res) => {
  User.findOne({ where: { email: req.body.email } })
    .then(user => {
      if (!user) {
        // We send a generic message for security, to not reveal which emails are registered
        return res.status(200).send({ message: "If an account with that email exists, a password reset link has been sent." });
      }
      const resetToken = jwt.sign({ id: user.id }, "a-different-very-secret-key", { expiresIn: '15m' });
      mailService.sendPasswordResetEmail(user.email, resetToken);
      res.send({ message: "If an account with that email exists, a password reset link has been sent." });
    })
    .catch(err => {
      res.status(500).send({ message: "Error processing forgot password request." });
    });
};

// Function to handle the final password reset from the email link
exports.resetPassword = (req, res) => {
  const { token, password } = req.body;
  if (!token) {
    return res.status(400).send({ message: "Reset token is missing." });
  }
  jwt.verify(token, "a-different-very-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
    }
    const newHashedPassword = bcrypt.hashSync(password, 8);
    User.update({ password: newHashedPassword }, {
      where: { id: decoded.id }
    })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Password was reset successfully!" });
      } else {
        res.send({ message: `Cannot reset password for user. Maybe user was not found.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error resetting password." });
    });
  });
};

// Function to get all conversations for the logged-in user
exports.getMyConversations = async (req, res) => {
  const loggedInUserId = req.userId;
  try {
    // Search 1: Find items where the user is the FINDER and there's an accepted claim
    const foundItemsConversations = await Item.findAll({
      where: {
        userId: loggedInUserId,
        '$claims.status$': 'accepted'
      },
      include: [{ model: Claim, as: 'claims', required: true }]
    });

    // Search 2: Find items where the user is the ACCEPTED CLAIMANT
    const claimedItemsConversations = await Item.findAll({
      where: {
        '$claims.claimantId$': loggedInUserId,
        '$claims.status$': 'accepted'
      },
      include: [{ model: Claim, as: 'claims', required: true }]
    });

    // Combine and format the results
    const allConversations = [...foundItemsConversations, ...claimedItemsConversations];
    
    // Remove duplicates in case a user claims their own item (edge case)
    const uniqueConversations = Array.from(new Map(allConversations.map(item => [item.id, item])).values());

    const formattedConversations = uniqueConversations.map(item => {
      const role = (item.userId === loggedInUserId) ? 'Finder' : 'Claimant';
      return { item: item, role: role };
    });

    res.send(formattedConversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).send({ message: "Error fetching conversations." });
  }
};

exports.getProfile = (req, res) => {
  // The verifyToken middleware has already found the user and attached their ID to req.userId
  User.findByPk(req.userId, {
    // We explicitly exclude the password for security
    attributes: { exclude: ['password'] }
  })
  .then(user => {
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    res.status(200).send(user);
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};
exports.getProfile = (req, res) => {
  User.findByPk(req.userId, {
    attributes: { exclude: ['password'] }
  })
  .then(user => {
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    res.status(200).send(user);
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};

