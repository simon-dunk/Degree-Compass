import { generateNextSemesterPlan } from '../../services/planGeneratorService.js';

/**
 * @desc    Generate the next optimal semester for a student
 * @route   POST /api/planner/generate-semester
 * @access  Public
 */
export const getGeneratedSemester = async (req, res) => {
  try {
    const { studentId, pinnedCourses, previouslyPlannedCourses } = req.body;
    const semester = await generateNextSemesterPlan(studentId, pinnedCourses, previouslyPlannedCourses);
    res.status(200).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate semester.', error: error.message });
  }
};