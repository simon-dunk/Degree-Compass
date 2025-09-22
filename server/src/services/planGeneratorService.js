import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15;

// Helper function to check if prerequisites are met
const arePrerequisitesMet = (prerequisites, completedCourses) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => 
        completedCourses.some(completed => 
            completed.Subject === prereq.Subject && completed.CourseNumber === prereq.CourseNumber
        )
    );
};

/**
 * The main path generation algorithm.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - An optional array of courses the user wants to prioritize.
 * @param {number} [numSemesters=8] - The desired length of the plan in semesters.
 * @returns {Promise<Array<object>>} A promise that resolves to a semester-by-semester plan.
 */
export const generateDegreePlan = async (studentId, pinnedCourses = [], numSemesters = 8) => {
  const initialAudit = await runDegreeAudit(studentId);
  
  let remainingCourses = initialAudit.results
    .flatMap(r => r.coursesStillNeeded)
    .filter((course, index, self) => 
      index === self.findIndex(c => 
        c.Subject === course.Subject && c.CourseNumber === course.CourseNumber
      )
    );

  let simulatedCompletedCourses = [...(initialAudit.studentCompletedCourses || [])];
  const generatedPlan = [];
  let semesterCount = 1;

  // --- LOGIC FOR PINNED COURSES ---
  // (This is a placeholder for future implementation; for now, it doesn't affect the logic)
  if (pinnedCourses.length > 0) {
    console.log('Pinned courses received:', pinnedCourses);
  }

  // --- Main Generation Loop ---
  while (remainingCourses.length > 0 && semesterCount <= numSemesters) {
    let currentSemesterCredits = 0;
    const currentSemesterCourses = [];

    const courseDetailsPromises = remainingCourses.map(course => getCourseByKey(course.Subject, course.CourseNumber));
    const remainingCourseDetails = await Promise.all(courseDetailsPromises);

    const eligibleNow = remainingCourseDetails.filter(details => 
        details && arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses)
    );
    
    for (const course of eligibleNow) {
        if (currentSemesterCredits + (course.Credits || 3) <= MAX_CREDITS_PER_SEMESTER) {
            currentSemesterCourses.push(course);
            currentSemesterCredits += (course.Credits || 3);
        }
    }

    if (currentSemesterCourses.length === 0 && remainingCourses.length > 0) {
        console.error("No eligible courses could be found, breaking to prevent infinite loop.");
        break;
    }

    if (currentSemesterCourses.length > 0) {
        generatedPlan.push({
            semester: `Semester ${semesterCount}`,
            courses: currentSemesterCourses,
            totalCredits: currentSemesterCredits,
        });

        simulatedCompletedCourses.push(...currentSemesterCourses);
        remainingCourses = remainingCourses.filter(remCourse => 
            !currentSemesterCourses.some(planCourse => 
                planCourse.Subject === remCourse.Subject && planCourse.CourseNumber === remCourse.CourseNumber
            )
        );

        semesterCount++;
    } else {
        // If no courses could be scheduled, break the loop to avoid an empty semester
        break;
    }
  }

  // Add any leftover courses to an "Unscheduled" list
  if (remainingCourses.length > 0) {
      generatedPlan.push({
          semester: 'Unscheduled',
          courses: remainingCourses,
          totalCredits: remainingCourses.reduce((sum, course) => sum + (course.Credits || 3), 0)
      });
  }

  return generatedPlan;
};