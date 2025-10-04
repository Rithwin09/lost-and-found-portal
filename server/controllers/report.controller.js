const db = require("../models");
const Report = db.reports;
const Message = db.messages;
const User = db.users;
const Item = db.items;

// --- CREATE A NEW REPORT (FINAL, CORRECTED VERSION) ---
exports.create = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { itemId, reportedUserId, reason } = req.body;

    // 1. Get all messages AND the sender's name for each message in ONE single query.
    // This is the new, more powerful, and more reliable logic.
    const messages = await Message.findAll({
      where: { itemId: itemId },
      order: [['createdAt', 'ASC']],
      // This 'include' tells the database to join the 'users' table and get the sender's details.
      include: [{
        model: User,
        as: 'sender', // This 'as' must match the one in your models/index.js
        attributes: ['name'] // We only need the name
      }]
    });

    // 2. Create the chat log using the real names that are now attached to each message.
    // This is much simpler and more reliable than the old mapping logic.
    const chatLog = messages
      .map(msg => {
        // The sender's name is now directly available on the message object.
        const senderName = msg.sender ? msg.sender.name : `Unknown User #${msg.senderId}`;
        return `${senderName}: ${msg.body}`;
      })
      .join('\n');

    // 3. Create the final report in the database.
    await Report.create({
      reason: reason,
      itemId: itemId,
      reporterId: reporterId,
      reportedUserId: reportedUserId,
      chat_log: chatLog
    });

    // 4. Freeze the item's chat so no more messages can be sent.
    await Item.update({ is_under_review: true }, {
      where: { id: itemId }
    });

    res.send({ message: "Report submitted successfully." });
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).send({ message: "Failed to submit report." });
  }
};
// -----------------------------------------------------------

// This function is unchanged and correct.
exports.findAll = (req, res) => {
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