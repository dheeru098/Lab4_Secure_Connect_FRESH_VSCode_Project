const express = require('express');
const { db, ObjectId, validId } = require('../db');
const { authenticate } = require('../middleware/auth');
const events = require('../events');

const router = express.Router();
router.use(authenticate);

function display(note) {
  return {
    _id: String(note._id),
    title: note.title,
    content: note.content,
    owner: String(note.owner),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

function validateFields(body, requireBoth) {
  const changes = {};
  if (body && Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 150) return null;
    changes.title = body.title.trim();
  }
  if (body && Object.hasOwn(body, 'content')) {
    if (typeof body.content !== 'string' || !body.content.trim() || body.content.trim().length > 10000) return null;
    changes.content = body.content.trim();
  }
  if (!Object.keys(changes).length || (requireBoth && (!changes.title || !changes.content))) return null;
  return changes;
}

router.get('/', async (req, res, next) => {
  try {
    const notes = await db().collection('notes').find({ owner: req.user._id }).sort({ createdAt: -1 }).toArray();
    res.json(notes.map(display));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const fields = validateFields(req.body, true);
    if (!fields) return res.status(400).json({ message: 'Valid title and content are required' });
    const time = new Date();
    const note = { ...fields, owner: req.user._id, createdAt: time, updatedAt: time };
    const result = await db().collection('notes').insertOne(note);
    events.emit('note:created', { username: req.user.username, noteId: String(result.insertedId) });
    res.status(201).json(display({ ...note, _id: result.insertedId }));
  } catch (error) { next(error); }
});

router.param('id', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ message: 'Invalid note ID' });
  next();
});

router.get('/:id', async (req, res, next) => {
  try {
    const note = await db().collection('notes').findOne({ _id: new ObjectId(req.params.id), owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(display(note));
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const changes = validateFields(req.body, false);
    if (!changes) return res.status(400).json({ message: 'Provide a valid title or content' });
    const filter = { _id: new ObjectId(req.params.id), owner: req.user._id };
    const result = await db().collection('notes').updateOne(filter, { $set: { ...changes, updatedAt: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ message: 'Note not found' });
    const note = await db().collection('notes').findOne(filter);
    events.emit('note:updated', { username: req.user.username, noteId: req.params.id });
    res.json(display(note));
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db().collection('notes').deleteOne({ _id: new ObjectId(req.params.id), owner: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Note not found' });
    events.emit('note:deleted', { username: req.user.username, noteId: req.params.id });
    res.json({ message: 'Note deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
