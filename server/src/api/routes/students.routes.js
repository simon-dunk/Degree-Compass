import express from 'express';
import { 
  getStudent, 
  addStudentOverride, 
  removeStudentOverride,
  getAllStudents
} from '../controllers/students.controller.js';

const router = express.Router();

router.get('/:studentId', getStudent);
router.get('/', getAllStudents);
router.post('/:studentId/overrides', addStudentOverride);
router.delete('/:studentId/overrides/:overrideIndex', removeStudentOverride); // 2. Add DELETE route

export default router;