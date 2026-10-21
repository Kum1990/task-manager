const { z } = require('zod');

const clientLogSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string().min(1).max(1000),
  context: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
});

module.exports = { clientLogSchema };
