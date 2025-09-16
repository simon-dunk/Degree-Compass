import express from 'express';
import {
  getDegreeRules,
  createOrUpdateDegreeRule,
  deleteDegreeRule,
} from '../controllers/rules.controller.js';

const router = express.Router();

// GET all rules for a specific major
router.get('/:majorCode', getDegreeRules);

// POST a new rule or fully update an existing one
router.post('/', createOrUpdateDegreeRule);

// DELETE a specific rule
router.delete('/:majorCode/:requirementType', deleteDegreeRule);

export default router;