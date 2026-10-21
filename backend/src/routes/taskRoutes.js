const express = require('express');
const taskController = require('../controllers/taskController');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidators');

const router = express.Router();

router.get('/', taskController.list);
router.post('/', validate(createTaskSchema), taskController.create);
router.get('/:id', taskController.getOne);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', taskController.remove);

module.exports = router;
