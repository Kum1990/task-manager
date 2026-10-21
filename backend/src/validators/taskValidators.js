const { z } = require('zod');

const TASK_STATUSES = ['todo', 'in_progress', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .nullable(),
};

const createTaskSchema = z.object({
  title: fields.title,
  description: fields.description.default(''),
  status: fields.status.default('todo'),
  priority: fields.priority.default('medium'),
  dueDate: fields.dueDate.optional(),
});

const updateTaskSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  });

module.exports = { TASK_STATUSES, TASK_PRIORITIES, createTaskSchema, updateTaskSchema };
