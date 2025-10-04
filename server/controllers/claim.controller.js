const db = require("../models");
const Claim = db.claims;
const Item = db.items;
const User = db.users;
const mailService = require("../services/mail.service");

// Function to create a new claim
exports.create = (req, res) => {
  const claim = {
    proof_description: req.body.proof_description,
    itemId: req.params.itemId,
    claimantId: req.userId
  };

  Claim.create(claim)
    .then(data => {
      Item.findByPk(req.params.itemId, { include: User })
        .then(item => {
          if (item && item.user) {
            mailService.sendClaimNotificationEmail(item.user.email, item);
          }
        });
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({ message: "Error creating claim." });
    });
};

// Function to get all claims for a specific item
exports.findAllForItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const claims = await Claim.findAll({ 
      where: { itemId: itemId },
      // This is the new part: include the claimant's details with each claim
      include: [{
        model: User,
        as: 'claimant',
        attributes: ['id', 'name', 'email']
      }]
    });
    res.send(claims);
  } catch (err) {
    res.status(500).send({ message: "Error retrieving claims." });
  }
};

// Function to update a claim's status (accept/reject)
exports.update = async (req, res) => {
  try {
    const claimId = req.params.claimId;
    const { status, rejection_reason } = req.body; // Can now receive a reason
    const loggedInUserId = req.userId;

    const claim = await Claim.findByPk(claimId, { include: [Item] });
    if (!claim) {
      return res.status(404).send({ message: "Claim not found." });
    }
    // Security Check: Only the finder can update a claim
    if (claim.item.userId !== loggedInUserId) {
      return res.status(403).send({ message: "Forbidden: You are not the finder of this item." });
    }

    // Update the claim with the new status and reason
    await claim.update({ status, rejection_reason });

    const claimant = await User.findByPk(claim.claimantId);
    mailService.sendClaimStatusEmail(claimant.email, claim.item, status);

    res.send({ message: `Claim has been ${status}.` });
  } catch (err) {
    console.error("Error updating claim:", err);
    res.status(500).send({ message: "An error occurred while updating the claim." });
  }
};
// --- THIS IS THE CORRECTED FUNCTION ---
// The security "gatekeeper" for the chat
exports.checkChatAccess = (req, res) => {
  const itemId = req.params.itemId;
  const loggedInUserId = req.userId;

  // The 'include' option must be an array
  Item.findByPk(itemId, { include: [{ model: Claim, as: 'claims' }] })
    .then(item => {
      if (!item) {
        return res.status(404).send({ message: "Item not found." });
      }

      // Case 1: The logged-in user is the person who FOUND the item
      if (item.userId === loggedInUserId) {
        return res.send({ canAccess: true });
      }

      // Case 2: Check if the logged-in user is the claimant of an ACCEPTED claim
      const acceptedClaim = item.claims.find(claim => claim.status === 'accepted' && claim.claimantId === loggedInUserId);
      if (acceptedClaim) {
        return res.send({ canAccess: true });
      }

      // If neither case is true, deny access
      res.status(403).send({ canAccess: false, message: "You do not have permission to access this chat." });
    })
    .catch(err => {
      res.status(500).send({ message: "Error checking chat access." });
    });
};
// -----------------------------------------
