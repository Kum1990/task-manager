const { z } = require('zod');

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores are allowed'),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
