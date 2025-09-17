import express from 'express';
import { getAuditReport } from '../controllers/audit.controller.js';

const router = express.Router();

// GET a full degree audit report for a student
router.get('/:studentId', getAuditReport);

export default router;