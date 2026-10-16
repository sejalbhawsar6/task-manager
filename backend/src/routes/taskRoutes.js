const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getTasks, getStats, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.get('/', getTasks);
router.get('/stats', getStats);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
