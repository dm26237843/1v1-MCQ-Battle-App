import { z } from 'zod';

const optionsSchema = z.array(z.string().min(1)).min(2).max(6);

export const mcqCreateSchema = z
  .object({
    question: z.string().min(10, 'Enter at least 10 characters'),
    options: optionsSchema,
    correctIndex: z.number().int().nonnegative(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.correctIndex >= val.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctIndex'],
        message: 'correctIndex must be a valid index for the provided options',
      });
    }
  });

export const mcqUpdateSchema = z
  .object({
    question: z.string().min(10).optional(),
    options: optionsSchema.optional(),
    correctIndex: z.number().int().nonnegative().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (v) => {
      // If both options and correctIndex provided, ensure index fits
      if (v.options && typeof v.correctIndex === 'number') {
        return v.correctIndex < v.options.length;
      }
      return true;
    },
    { message: 'correctIndex must be a valid index for the updated options', path: ['correctIndex'] }
  );