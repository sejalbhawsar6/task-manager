const mongoose = require('mongoose');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const { STATUSES, PRIORITIES } = Task;
const EDITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pickFields = (body = {}) => {
  const data = {};
  EDITABLE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  if (data.dueDate === '') data.dueDate = null;
  return data;
};

const findOwnTask = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Task not found');
  const task = await Task.findOne({ _id: id, user: userId });
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
};

// GET /api/tasks?status=&priority=&search=&sort=newest|oldest|due|priority
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, sort = 'newest' } = req.query;
  const filter = { user: req.user._id };

  if (status && STATUSES.includes(status)) filter.status = status;
  if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    due: { dueDate: 1, createdAt: -1 },
  };

  let tasks = await Task.find(filter).sort(sortMap[sort] || sortMap.newest).lean();

  if (sort === 'due') {
    // Tasks without a due date go to the end.
    tasks = [...tasks.filter((t) => t.dueDate), ...tasks.filter((t) => !t.dueDate)];
  } else if (sort === 'priority') {
    tasks.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }

  res.json({ tasks });
});

// GET /api/tasks/stats?today=YYYY-MM-DD
// The client sends its own "today" so overdue counts match the user's time zone.
const getStats = asyncHandler(async (req, res) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.today || '')
    ? req.query.today
    : new Date().toISOString().slice(0, 10);
  const startOfToday = new Date(`${today}T00:00:00.000Z`);

  const [byStatus, overdue] = await Promise.all([
    Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ user: req.user._id, status: { $ne: 'done' }, dueDate: { $lt: startOfToday } }),
  ]);

  const stats = { total: 0, todo: 0, 'in-progress': 0, done: 0, overdue };
  byStatus.forEach(({ _id, count }) => {
    stats[_id] = count;
    stats.total += count;
  });
  res.json({ stats });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const task = new Task({ ...pickFields(req.body), user: req.user._id });
  await task.save();
  res.status(201).json({ task });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req.params.id, req.user._id);
  Object.assign(task, pickFields(req.body));
  await task.save();
  res.json({ task });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req.params.id, req.user._id);
  await task.deleteOne();
  res.json({ message: 'Task deleted', id: task._id });
});

module.exports = { getTasks, getStats, createTask, updateTask, deleteTask };
