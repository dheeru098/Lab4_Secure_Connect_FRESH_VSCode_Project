const jwt = require('jsonwebtoken');
const { userFromToken } = require('./middleware/auth');
const events = require('./events');

function setupChat(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      socket.user = await userFromToken(token);
      next();
    } catch (error) {
      next(new Error('Invalid or missing JWT'));
    }
  });

  io.on('connection', socket => {
    const username = socket.user.username;
    console.log(`User connected: ${socket.id} (${username})`);
    socket.join('general');
    socket.emit('chat:joined', { room: 'general' });

    socket.on('chat:join', (data, acknowledge) => {
      const room = typeof data === 'string' ? data : data && data.room;
      if (typeof room !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(room)) {
        if (typeof acknowledge === 'function') acknowledge({ error: 'Invalid room' });
        return;
      }
      socket.join(room);
      socket.emit('chat:joined', { room });
      if (typeof acknowledge === 'function') acknowledge({ joined: room });
    });

    socket.on('chat:message', (payload, acknowledge) => {
      const room = payload && payload.room;
      const text = payload && payload.text;
      if (typeof room !== 'string' || !socket.rooms.has(room) || typeof text !== 'string' || !text.trim() || text.length > 1000) {
        if (typeof acknowledge === 'function') acknowledge({ error: 'Invalid message or room' });
        return;
      }
      const message = { room, username, text: text.trim(), sentAt: new Date().toISOString() };
      io.to(room).emit('chat:message', message);
      events.emit('chat:message', message);
      if (typeof acknowledge === 'function') acknowledge({ delivered: true });
    });

    socket.on('disconnect', () => console.log(`User disconnected: ${socket.id} (${username})`));
  });
}

module.exports = setupChat;
