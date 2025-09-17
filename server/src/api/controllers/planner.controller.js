import { generateDegreePlan } from '../../services/planGeneratorService.js';

/**
 * @desc    Generate a degree plan for a student
 * @route   POST /api/planner/generate/:studentId
 * @access  Public
 */
export const getGeneratedPlan = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { pinnedCourses } = req.body; // Get pinned courses from request body

    const plan = await generateDegreePlan(studentId, pinnedCourses);
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate plan.', error: error.message });
  }
};