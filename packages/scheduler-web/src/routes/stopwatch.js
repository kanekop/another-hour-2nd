// src/routes/stopwatch.js
import express from 'express';
import { toAhMillis } from '../shared/ah-time.js';

const router = express.Router();

router.get('/elapsed', (req, res) => {
  const start = Number(req.query.start);
  const elapsedReal = Date.now() - start;
  const elapsedAh = toAhMillis(elapsedReal);
  res.json({ elapsedAh: elapsedAh });
});

export default router;