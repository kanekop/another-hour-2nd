// src/routes/timer.js
import express from 'express';
import { fromAhMillis } from '../shared/ah-time.js';

const router = express.Router();

router.get('/remaining', (req, res) => {
  const end = Number(req.query.end);
  const remainingReal = Math.max(0, end - Date.now());
  const remainingAh = fromAhMillis(remainingReal);
  res.json({ remainingAh: remainingAh });
});

export default router;