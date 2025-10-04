const db = require("../models");
const Item = db.items;
const Claim = db.claims;
const User = db.users;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const mailService = require("../services/mail.service");
const matchingService = require("../services/matching.service");
const crypto = require('crypto');

// Helper function for pagination. This function is complete and correct.
const getPagination = (page, size) => {
  const limit = size ? +size : 12;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// CREATE for logged-in users. This function is complete and correct.
exports.create = (req, res) => {
  const { title, description, category, status, brand, color, unique_marks, item_size } = req.body;
  const userId = req.userId;
  const item = {
    title, description, category, status, brand, color, unique_marks, item_size,
    userId: userId,
    is_verified: true,
    image_url: req.file ? `uploads/${req.file.filename}` : null
  };
  Item.create(item)
    .then(data => {
      matchingService.findPotentialMatches(data);
      res.send(data);
    })
    .catch(err => res.status(500).send({ message: "Error creating Item." }));
};

// CREATE for guests. This function is complete and correct.
exports.createAsGuest = async (req, res) => {
  try {
    const { title, description, category, color, guest_email, brand, unique_marks, item_size } = req.body;
    const existingUser = await User.findOne({ where: { email: guest_email } });
    if (existingUser) {
      return res.status(409).send({ message: "This email is already registered. Please log in to report an item." });
    }
    const item = {
      title, description, category, color, guest_email, brand, unique_marks, item_size,
      status: 'found',
      is_verified: false,
      image_url: req.file ? `uploads/${req.file.filename}` : null
    };
    const newItem = await Item.create(item);
    const verificationToken = jwt.sign({ id: newItem.id }, "a-very-secret-key", { expiresIn: '1h' });
    mailService.sendVerificationEmail(guest_email, verificationToken);
    res.send({ message: "Guest report submitted! Please check your email to verify." });
  } catch (err) {
    console.error("Error in createAsGuest:", err);
    res.status(500).send({ message: "Error creating guest report." });
  }
};

// FIND ALL items for the homepage. This function is complete and correct.
exports.findAll = (req, res) => {
  const { page, size, search, category, status } = req.query;
  const { limit, offset } = getPagination(page, size);
  
  const condition = {
    is_verified: true,
    is_admin_deleted: false, // <-- THE NEW SECURITY RULE
    [Op.or]: [{ status: 'lost' }, { status: 'found' }]
  };

  if (search) { condition.title = { [Op.like]: `%${search}%` }; }
  if (category) { condition.category = category; }
  if (status) { condition.status = status; }
  Item.findAndCountAll({
    where: condition,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  })
    .then(data => {
      const response = {
        items: data.rows,
        totalItems: data.count,
        currentPage: page ? +page : 0,
        totalPages: Math.ceil(data.count / limit)
      };
      res.send(response);
    })
    .catch(err => res.status(500).send({ message: "Error retrieving items." }));
};

// FIND ONE specific item. This is the corrected version.
exports.findOne = (req, res) => {
  const id = req.params.id;
  Item.findByPk(id, {
    include: [
      { model: User, as: 'user' }, // Now correctly uses the 'as: user' nickname
      { 
        model: Claim, 
        as: 'claims', // And the 'as: claims' nickname
        include: [{ model: User, as: 'claimant' }] // And the nested 'as: claimant' nickname
      }
    ]
  })
    .then(data => {
      if (data) { res.send(data); }
      else { res.status(404).send({ message: `Cannot find Item with id=${id}.` }); }
    })
    .catch(err => {
      console.error("Error in findOne:", err);
      res.status(500).send({ message: "Error retrieving Item with id=" + id });
    });
};

// VERIFY a guest's item. This function is complete and correct.
exports.verifyGuestItem = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send({ message: "Verification token is missing." });
  }
  jwt.verify(token, "a-very-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid or expired token." });
    }
    Item.update({ is_verified: true }, { where: { id: decoded.id } })
    .then(num => {
      if (num == 1) {
        Item.findByPk(decoded.id).then(item => {
          if (item) {
            matchingService.findPotentialMatches(item);
          }
        });
        res.send(`<html><body><h1>Verification Successful!</h1><p>Thank you. Your item report is now public.</p></body></html>`);
      } else {
        res.send("<h1>Verification Failed!</h1><p>Could not find the item to verify.</p>");
      }
    })
    .catch(err => res.status(500).send({ message: "Error verifying item." }));
  });
};

// UPDATE an item's status (Mark as Resolved). This function is complete and correct.
exports.updateStatus = (req, res) => {
  const id = req.params.id;
  const loggedInUserId = req.userId;

  Item.update({ status: 'resolved' }, { where: { id: id } })
    .then(num => {
      if (num == 1) {
        Item.findByPk(id, { include: [{ model: Claim, as: 'claims' }] })
          .then(resolvedItem => {
            if (!resolvedItem) return;
            let ownerId;
            if (resolvedItem.userId === loggedInUserId) {
              ownerId = resolvedItem.userId;
            } else {
              const acceptedClaim = resolvedItem.claims.find(c => c.status === 'accepted' && c.claimantId === loggedInUserId);
              if (acceptedClaim) {
                ownerId = acceptedClaim.claimantId;
              }
            }
            if (ownerId) {
              Item.update({ status: 'resolved' }, {
                where: {
                  userId: ownerId,
                  status: 'lost',
                  category: resolvedItem.category
                }
              });
            }
          });
        res.send({ message: "Item status was updated successfully." });
      } else {
        res.send({ message: `Cannot update Item with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error updating Item with id=" + id });
    });
};

// FIND ALL items for a specific user (My Account). This function is complete and correct.
exports.findAllForUser = (req, res) => {
  const userId = req.userId;
  Item.findAll({ where: { userId: userId }, order: [['createdAt', 'DESC']] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: "Error retrieving items for user." }));
};

// DELETE an item. This function is complete and correct.
exports.delete = (req, res) => {
  const id = req.params.id;
  const loggedInUserId = req.userId;

  Item.findByPk(id)
    .then(item => {
      if (!item) {
        return res.status(404).send({ message: "Item not found." });
      }
      if (item.userId !== loggedInUserId) {
        return res.status(403).send({ message: "Forbidden: You can only delete your own items." });
      }
      Item.destroy({ where: { id: id } })
        .then(num => {
          if (num == 1) {
            res.send({ message: "Item was deleted successfully!" });
          } else {
            res.send({ message: `Cannot delete Item with id=${id}.` });
          }
        })
        .catch(err => res.status(500).send({ message: "Could not delete Item with id=" + id }));
    })
    .catch(err => res.status(500).send({ message: "Error retrieving item to delete." }));
};

