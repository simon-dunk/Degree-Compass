import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15;

/**
 * A simple path generation algorithm.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - An optional array of courses the user wants to prioritize.
 * @returns {Promise<Array<object>>} A promise that resolves to a semester-by-semester plan.
 */
export const generateDegreePlan = async (studentId, pinnedCourses = []) => {
  // 1. Get the initial state from the degree audit
  const initialAudit = await runDegreeAudit(studentId);
  
  let remainingCourses = initialAudit.results
    .flatMap(r => r.coursesStillNeeded)
    // Create a unique list of remaining courses by stringifying them
    .filter((course, index, self) => 
      index === self.findIndex(c => 
        c.Subject === course.Subject && c.CourseNumber === course.CourseNumber
      )
    );

  let coursesInPlan = [...initialAudit.eligibleNextCourses]; // Start with currently eligible courses
  let completedCoursesForSim = [...(initialAudit.studentCompletedCourses || [])]; // Use a simulation list
  
  const generatedPlan = [];
  let semesterCount = 1;

  // --- Handle Pinned Courses (Future Feature) ---
  // For now, we acknowledge them but don't have special logic yet.
  if (pinnedCourses.length > 0) {
    console.log('Pinned courses received:', pinnedCourses);
  }

  // 2. Loop until all remaining courses are placed in the plan
  while (remainingCourses.length > 0 && semesterCount <= 8) { // Safety break after 8 semesters
    let currentSemesterCredits = 0;
    const currentSemesterCourses = [];

    // Find courses that can be taken this semester
    const eligibleNow = [];
    for (const course of remainingCourses) {
        const details = await getCourseByKey(course.Subject, course.CourseNumber);
        const canTake = arePrerequisitesMet(details?.Prerequisites, completedCoursesForSim);
        if (canTake) {
            eligibleNow.push({ ...course, Credits: details?.Credits || 3 });
        }
    }
    
    // 3. Greedily add eligible courses to the current semester
    for (const course of eligibleNow) {
        if (currentSemesterCredits + course.Credits <= MAX_CREDITS_PER_SEMESTER) {
            currentSemesterCourses.push(course);
            currentSemesterCredits += course.Credits;
        }
    }

    if (currentSemesterCourses.length === 0 && remainingCourses.length > 0) {
        console.error("No eligible courses could be found, breaking to prevent infinite loop.");
        break; // Or handle error appropriately
    }

    // 4. Finalize the semester
    generatedPlan.push({
      semester: `Semester ${semesterCount}`,
      courses: currentSemesterCourses,
      totalCredits: currentSemesterCredits,
    });

    // 5. Update state for the next loop iteration
    completedCoursesForSim.push(...currentSemesterCourses);
    remainingCourses = remainingCourses.filter(remCourse => 
        !currentSemesterCourses.some(planCourse => 
            planCourse.Subject === remCourse.Subject && planCourse.CourseNumber === remCourse.CourseNumber
        )
    );

    semesterCount++;
  }

  return generatedPlan;
};

// Helper function (can be extracted to a shared utils file)
const arePrerequisitesMet = (prerequisites, completedCourses) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => 
        completedCourses.some(completed => 
            completed.Subject === prereq.Subject && completed.CourseNumber === prereq.CourseNumber
        )
    );
};