const db = require("../models");
const Message = db.messages;

// Function to save a new message to the database
exports.create = (req, res) => {
  const message = {
    body: req.body.body,
    itemId: req.params.itemId,
    senderId: req.body.senderId 
  };

  Message.create(message)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({ message: "Error saving message." });
    });
};

// Function to get all messages for a specific item
exports.findAllForItem = (req, res) => {
  const itemId = req.params.itemId;

  Message.findAll({ where: { itemId: itemId } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving messages." });
    });
};
// --- NEW FUNCTION TO DELETE A MESSAGE ---
exports.delete = (req, res) => {
  const id = req.params.messageId; // Get the message's ID from the URL

  // Find the message by its ID and destroy it
  Message.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Message was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete Message with id=${id}. Maybe it was not found.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Message with id=" + id });
    });
};