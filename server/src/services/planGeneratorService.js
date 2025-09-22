import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15;

/**
 * The main path generation algorithm.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - An optional array of courses the user wants to prioritize.
 * @returns {Promise<Array<object>>} A promise that resolves to a semester-by-semester plan.
 */
export const generateDegreePlan = async (studentId, pinnedCourses = [], numSemesters = 8) => {

  const initialAudit = await runDegreeAudit(studentId);
  
  // Create a set of unique course identifiers for easy lookup
  const completedCourseSet = new Set(
    (initialAudit.studentCompletedCourses || []).map(c => `${c.Subject}-${c.CourseNumber}`)
  );

  let remainingCourses = initialAudit.results
    .flatMap(r => r.coursesStillNeeded)
    .filter((course, index, self) => 
      index === self.findIndex(c => c.Subject === course.Subject && c.CourseNumber === course.CourseNumber)
    );

  const generatedPlan = [];
  let semesterCount = 1;
  let simulatedCompletedCourses = [...(initialAudit.studentCompletedCourses || [])];

  // --- LOGIC FOR PINNED COURSES ---
  const firstSemester = { semester: 'Semester 1', courses: [], totalCredits: 0 };
  if (pinnedCourses.length > 0) {
    for (const pinnedCourse of pinnedCourses) {
      const details = await getCourseByKey(pinnedCourse.Subject, pinnedCourse.CourseNumber);
      if (!details) throw new Error(`Pinned course ${pinnedCourse.Subject} ${pinnedCourse.CourseNumber} not found.`);

      // Validate that pinned course is actually needed and its prerequisites are met
      const isNeeded = remainingCourses.some(rc => rc.Subject === details.Subject && rc.CourseNumber === details.CourseNumber);
      const canTake = arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses);

      if (isNeeded && canTake) {
        if (firstSemester.totalCredits + (details.Credits || 3) <= MAX_CREDITS_PER_SEMESTER) {
          firstSemester.courses.push({ ...details });
          firstSemester.totalCredits += (details.Credits || 3);
          
          // Remove from remaining courses and add to simulated completed list
          remainingCourses = remainingCourses.filter(rc => !(rc.Subject === details.Subject && rc.CourseNumber === details.CourseNumber));
          simulatedCompletedCourses.push(details);
        } else {
          // Handle case where pinned courses exceed credit limit (optional)
          console.warn(`Pinned course ${details.Subject} ${details.CourseNumber} exceeds credit limit for the first semester.`);
        }
      } else {
        throw new Error(`Pinned course ${details.Subject} ${details.CourseNumber} is not needed or prerequisites are not met.`);
      }
    }
    generatedPlan.push(firstSemester);
    semesterCount++;
  }
  // --- END OF PINNED COURSES LOGIC ---


  while (remainingCourses.length > 0 && semesterCount <= 8) {
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
      console.error("Could not schedule remaining courses. Possible prerequisite deadlock.");
      generatedPlan.push({ semester: 'Unscheduled', courses: remainingCourses, totalCredits: 0 });
      break;
    }
    
    // If we're on the first semester and it wasn't created by pinned courses, use this one.
    if(semesterCount === 1 && generatedPlan.length === 0) {
        generatedPlan.push({ semester: 'Semester 1', courses: currentSemesterCourses, totalCredits: currentSemesterCredits });
    } else if (currentSemesterCourses.length > 0) { // Otherwise, add a new semester if it has courses
        generatedPlan.push({ semester: `Semester ${semesterCount}`, courses: currentSemesterCourses, totalCredits: currentSemesterCredits });
    }

    simulatedCompletedCourses.push(...currentSemesterCourses);
    remainingCourses = remainingCourses.filter(remCourse => 
        !currentSemesterCourses.some(planCourse => 
            planCourse.Subject === remCourse.Subject && planCourse.CourseNumber === remCourse.CourseNumber
        )
    );

    if (currentSemesterCourses.length > 0) {
      semesterCount++;
    }
  }

  return generatedPlan;
};

// Helper function
const arePrerequisitesMet = (prerequisites, completedCourses) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => 
        completedCourses.some(completed => 
            completed.Subject === prereq.Subject && completed.CourseNumber === prereq.CourseNumber
        )
    );
};