const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const PORT = 8080;
const server = http.createServer(app);

const corsOptions = { origin: "http://localhost:4200" };
app.use(cors(corsOptions));
const io = new Server(server, { cors: corsOptions });

const db = require("./models");
const Message = db.messages;
const Item = db.items; // Import the Item model
db.sequelize.sync();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
require('./routes/user.routes')(app);
require('./routes/item.routes')(app);
require('./routes/message.routes')(app);
require('./routes/claim.routes')(app);
require('./routes/report.routes')(app);
require('./routes/admin.routes')(app);

app.get('/', (req, res) => {
  res.send('Hello from the Lost & Found API!');
});

io.on('connection', (socket) => {
  console.log('A user connected with socket id:', socket.id);

  socket.on('joinRoom', (itemId) => {
    socket.join(itemId);
    console.log(`User ${socket.id} joined room ${itemId}`);
  });

  // --- THIS FUNCTION IS NOW SMARTER ---
  socket.on('sendMessage', async (data) => {
    const { itemId, message, senderId } = data;

    // 1. Before saving, check if the item is frozen
    const item = await Item.findByPk(itemId);
    if (item && item.is_under_review) {
      // If it's frozen, do nothing.
      console.log(`Message blocked for frozen item #${itemId}`);
      return; 
    }

    // 2. If it's not frozen, proceed as normal
    const messageToSave = { body: message, itemId, senderId };
    Message.create(messageToSave)
      .then((savedMessage) => {
        io.to(itemId).emit('receiveMessage', savedMessage);
        console.log(`Message for room ${itemId} saved and broadcasted.`);
      })
      .catch(err => console.error("Error saving message:", err));
  });
  // ------------------------------------
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, userId, itemId } = data;
      const message = await Message.findByPk(messageId);

      // CRITICAL SECURITY CHECK: Only delete if the message exists and the sender is the one who requested the deletion.
      if (message && message.senderId === userId) {
        await message.destroy();
        // If successful, broadcast the ID of the deleted message to everyone in the room.
        io.to(itemId).emit('messageDeleted', { messageId: messageId });
        console.log(`Message ${messageId} deleted and broadcasted to room ${itemId}`);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});