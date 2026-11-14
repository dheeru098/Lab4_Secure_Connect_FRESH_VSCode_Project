require('dotenv').config();
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const { Server } = require('socket.io');
const { connect } = require('./src/db');
const authRoutes = require('./src/routes/auth');
const notesRoutes = require('./src/routes/notes');
const setupChat = require('./src/chat');

const app = express();
const port = Number(process.env.PORT) || 5000;
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.get('/', (req, res) => res.json({ name: 'Secure Connect and Communication Platform', status: 'running' }));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });
  console.error(error.message);
  res.status(500).json({ message: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, { serveClient: true });
setupChat(io);

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('REPLACE_WITH_')) {
    throw new Error('Set MONGODB_URI and JWT_SECRET (32 or more random characters) in your .env file');
  }
  await connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  server.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

start().catch(error => {
  console.error('Startup failed:', error.message);
  process.exitCode = 1;
});
