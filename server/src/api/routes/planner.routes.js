import express from 'express';
import { getGeneratedPlan } from '../controllers/planner.controller.js';

const router = express.Router();

// POST to generate a new plan
router.post('/generate/:studentId', getGeneratedPlan);

export default router;