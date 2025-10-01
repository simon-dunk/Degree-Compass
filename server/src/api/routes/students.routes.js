import express from 'express';
import { 
  getStudent, 
  addStudentOverride, 
  removeStudentOverride,
  getAllStudents,
  addCompletedCourse,
  removeCompletedCourse
} from '../controllers/students.controller.js';

const router = express.Router();

router.get('/:studentId', getStudent);
router.get('/', getAllStudents);
router.post('/:studentId/overrides', addStudentOverride);
router.delete('/:studentId/overrides/:overrideIndex', removeStudentOverride);
router.post('/:studentId/completed-courses', addCompletedCourse);
router.delete('/:studentId/completed-courses/:courseIndex', removeCompletedCourse);

export default router;