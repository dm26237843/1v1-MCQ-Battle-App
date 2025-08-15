import { z } from 'zod';

const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const signupSchema = z.object({
  username: z.string().min(3).max(32).regex(usernameRegex, 'Only letters, digits, underscore'),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});

const baseLogin = z.object({
  password: z.string().min(1),
});

export const loginSchema = z.union([
  baseLogin.extend({ email: z.string().email(), username: z.string().optional() }),
  baseLogin.extend({ username: z.string().min(3), email: z.string().optional() }),
]);