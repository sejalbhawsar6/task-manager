const mongoose = require('mongoose');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title can be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description can be at most 1000 characters'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: 'Invalid priority' },
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, createdAt: -1 });

// Keep completedAt in sync with the status.
taskSchema.pre('save', function syncCompletedAt() {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'done' ? new Date() : null;
  }
});

const Task = mongoose.model('Task', taskSchema);
Task.STATUSES = STATUSES;
Task.PRIORITIES = PRIORITIES;

module.exports = Task;
