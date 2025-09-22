import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15;

/**
 * Generates a single, optimal semester.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - Courses the user wants in this semester (can be required or elective).
 * @param {Array<object>} [previouslyPlannedCourses=[]] - All courses taken or locked in previous semesters.
 * @returns {Promise<object|null>} A promise that resolves to a single semester object or null.
 */
export const generateNextSemesterPlan = async (studentId, pinnedCourses = [], previouslyPlannedCourses = []) => {
  const audit = await runDegreeAudit(studentId);

  const simulatedCompletedCourses = [
    ...(audit.studentCompletedCourses || []),
    ...previouslyPlannedCourses,
  ];

  let remainingRequiredCourses = audit.allRemainingCourses.filter(neededCourse =>
    !previouslyPlannedCourses.some(planned =>
        planned.Subject === neededCourse.Subject && planned.CourseNumber === neededCourse.CourseNumber
    )
  );
  
  // If there are no courses left to plan (required or pinned), we are done.
  if (remainingRequiredCourses.length === 0 && pinnedCourses.length === 0) {
    return null;
  }

  let currentSemesterCredits = 0;
  const currentSemesterCourses = [];

  // 1. Handle ALL Pinned Courses first
  if (pinnedCourses.length > 0) {
    for (const pinned of pinnedCourses) {
      const details = await getCourseByKey(pinned.Subject, pinned.CourseNumber);
      if (!details) throw new Error(`Pinned course ${pinned.Subject} ${pinned.CourseNumber} not found.`);

      const canTake = arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses);

      if (canTake && (currentSemesterCredits + (details.Credits || 3) <= MAX_CREDITS_PER_SEMESTER)) {
        currentSemesterCourses.push(details);
        currentSemesterCredits += (details.Credits || 3);
        simulatedCompletedCourses.push(details); // Add to simulated completed list immediately
      } else {
        throw new Error(`Cannot schedule pinned course ${details.Subject} ${details.CourseNumber}. Prerequisites not met or credit limit exceeded.`);
      }
    }
  }

  // 2. Filter out any remaining courses that were already added via pinning
  remainingRequiredCourses = remainingRequiredCourses.filter(rc =>
      !currentSemesterCourses.some(csc => csc.Subject === rc.Subject && csc.CourseNumber === csc.CourseNumber)
  );

  // 3. Fill the rest of the semester with eligible REQUIRED courses
  const eligibleNow = remainingRequiredCourses.filter(details => {
    if (!details) return false;
    return arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses);
  });

  for (const course of eligibleNow) {
    if (currentSemesterCredits + (course.Credits || 3) <= MAX_CREDITS_PER_SEMESTER) {
      currentSemesterCourses.push(course);
      currentSemesterCredits += (course.Credits || 3);
    }
  }

  if (currentSemesterCourses.length === 0) {
      return null;
  }
  
  return { courses: currentSemesterCourses, totalCredits: currentSemesterCredits };
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