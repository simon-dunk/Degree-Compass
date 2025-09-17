import express from 'express';
import { 
  getStudent, 
  addStudentOverride, 
  removeStudentOverride // 1. Import new controller
} from '../controllers/students.controller.js';

const router = express.Router();

router.get('/:studentId', getStudent);
router.post('/:studentId/overrides', addStudentOverride);
router.delete('/:studentId/overrides/:overrideIndex', removeStudentOverride); // 2. Add DELETE route

export default router;