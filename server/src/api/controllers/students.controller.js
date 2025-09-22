import * as studentsService from '../../services/studentsService.js';

/**
 * @desc    Get a student by their ID
 * @route   GET /api/students/:studentId
 * @access  Private (Admin)
 */
export const getStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await studentsService.getStudentById(studentId);

    if (student) {
      res.status(200).json(student);
    } else {
      res.status(404).json({ message: `Student with ID '${studentId}' not found.` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching student.', error: error.message });
  }
};

/**
 * @desc    Add an override to a student's record
 * @route   POST /api/students/:studentId/overrides
 * @access  Private (Admin)
 */
export const addStudentOverride = async (req, res) => {
  try {
    const { studentId } = req.params;
    const overrideData = req.body;

    // Basic validation
    if (!overrideData.SubThis || !overrideData.SubFor) {
      return res.status(400).json({ message: 'Override data must include "SubThis" and "SubFor" properties.' });
    }

    const updatedStudent = await studentsService.addOverrideToStudent(studentId, overrideData);
    res.status(200).json({ message: 'Override added successfully.', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding override.', error: error.message });
  }
};

/**
 * @desc    Remove an override from a student's record
 * @route   DELETE /api/students/:studentId/overrides/:overrideIndex
 * @access  Private (Admin)
 */
export const removeStudentOverride = async (req, res) => {
  try {
    const { studentId, overrideIndex } = req.params;
    // Convert index from URL string to a number
    const index = parseInt(overrideIndex, 10);

    if (isNaN(index)) {
      return res.status(400).json({ message: 'Override index must be a number.' });
    }

    const updatedStudent = await studentsService.removeOverrideFromStudent(studentId, index);
    res.status(200).json({ message: 'Override removed successfully.', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing override.', error: error.message });
  }
};

/**
 * @desc    Get a list of all students
 * @route   GET /api/students
 * @access  Private (Admin/User)
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await studentsService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching students.', error: error.message });
  }
};

/**
 * @desc    Add a completed course to a student's record
 * @route   POST /api/students/:studentId/completed-courses
 * @access  Private (Admin)
 */
export const addCompletedCourse = async (req, res) => {
  try {
    const { studentId } = req.params;
    const courseData = req.body;

    // Basic validation
    if (!courseData.Subject || !courseData.CourseNumber || !courseData.Grade) {
      return res.status(400).json({ message: 'Course data must include Subject, CourseNumber, and Grade.' });
    }

    const updatedStudent = await studentsService.addCompletedCourseToStudent(studentId, courseData);
    res.status(200).json({ message: 'Completed course added successfully.', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding completed course.', error: error.message });
  }
};