import { defineCollection, z } from 'astro:content';

const stories = defineCollection({
  type: 'content', // 'content' or 'data'
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string(),
    lang: z.enum(['ja', 'en'])
  })
});

export const collections = { stories }; 