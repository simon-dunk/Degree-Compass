import express from 'express';
import {
  getDegreeRules,
  createOrUpdateDegreeRule,
  deleteDegreeRule,
  getAllMajorCodes, // <-- Import the new controller
} from '../controllers/rules.controller.js';

const router = express.Router();

// GET a list of all unique majors that have rules
router.get('/majors/all', getAllMajorCodes); // <-- Add this route first

// GET all rules for a specific major
router.get('/:majorCode', getDegreeRules);

// POST a new rule or fully update an existing one
router.post('/', createOrUpdateDegreeRule);

// DELETE a specific rule
router.delete('/:majorCode/:requirementType', deleteDegreeRule);

export default router;