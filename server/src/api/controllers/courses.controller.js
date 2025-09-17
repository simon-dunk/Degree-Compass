import * as coursesService from '../../services/coursesService.js';

export const getCourses = async (req, res) => {
  try {
    const courses = await coursesService.getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching courses.', error: error.message });
  }
};