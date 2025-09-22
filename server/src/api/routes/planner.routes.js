import express from 'express';
import { getGeneratedSemester } from '../controllers/planner.controller.js';

const router = express.Router();

// POST to generate a new plan for the next semester
router.post('/generate-semester', getGeneratedSemester);

export default router;