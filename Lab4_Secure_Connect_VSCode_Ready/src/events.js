const { EventEmitter } = require('node:events');
const events = new EventEmitter();

events.on('user:registered', ({ username }) => console.log(`[event] User registered: ${username}`));
events.on('user:login', ({ username }) => console.log(`[event] User logged in: ${username}`));
events.on('note:created', ({ username }) => console.log(`[event] Note created by ${username}`));
events.on('note:updated', ({ username }) => console.log(`[event] Note updated by ${username}`));
events.on('note:deleted', ({ username }) => console.log(`[event] Note deleted by ${username}`));
events.on('chat:message', ({ room, username, text }) => console.log(`[${room}] ${username}: ${text}`));

module.exports = events;
