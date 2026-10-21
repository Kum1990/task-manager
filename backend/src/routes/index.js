const express = require('express');
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');
const healthController = require('../controllers/healthController');
const logController = require('../controllers/logController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { clientLogSchema } = require('../validators/logValidators');

const router = express.Router();

router.get('/health', healthController.liveness);
router.get('/ready', healthController.readiness);
router.post('/logs', validate(clientLogSchema), logController.ingest);
router.use('/auth', authRoutes);
router.use('/tasks', authenticate, taskRoutes);

module.exports = router;
