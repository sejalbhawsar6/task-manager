const mongoose = require('mongoose');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const { STATUSES, PRIORITIES } = Task;
const EDITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];
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

// Sort orders run inside MongoDB, so they also work with pagination.
const SORT_STAGES = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  due: { noDue: 1, dueDate: 1, createdAt: -1, _id: -1 }, // tasks without a due date go last
  priority: { priorityRank: 1, createdAt: -1, _id: -1 }, // high -> medium -> low
};

const HELPER_FIELDS = { priorityRank: 0, noDue: 0 };

// GET /api/tasks?status=&priority=&search=&sort=newest|oldest|due|priority&page=1&limit=10
// The client can send ?offset=N instead of ?page (used by "Load more").
// Without ?page or ?offset the API returns every task (old behaviour), so older clients keep working.
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, sort = 'newest', page, limit, offset } = req.query;
  const filter = { user: req.user._id };

  if (status && STATUSES.includes(status)) filter.status = status;
  if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'high'] }, then: 0 },
              { case: { $eq: ['$priority', 'medium'] }, then: 1 },
            ],
            default: 2,
          },
        },
        noDue: { $cond: [{ $ifNull: ['$dueDate', false] }, 0, 1] },
      },
    },
    { $sort: SORT_STAGES[sort] || SORT_STAGES.newest },
  ];

  if (page === undefined && offset === undefined) {
    const tasks = await Task.aggregate([...pipeline, { $project: HELPER_FIELDS }]);
    return res.json({ tasks });
  }

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const skip = offset !== undefined ? Math.max(parseInt(offset, 10) || 0, 0) : (pageNum - 1) * limitNum;

  const [result] = await Task.aggregate([
    ...pipeline,
    {
      $facet: {
        tasks: [{ $skip: skip }, { $limit: limitNum }, { $project: HELPER_FIELDS }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result.total[0]?.count || 0;
  res.json({
    tasks: result.tasks,
    page: Math.floor(skip / limitNum) + 1,
    limit: limitNum,
    total,
    hasMore: skip + result.tasks.length < total,
  });
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
