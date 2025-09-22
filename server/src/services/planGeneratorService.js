import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15;

/**
 * Generates a single, optimal semester.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - Courses the user wants in this semester.
 * @param {Array<object>} [previouslyPlannedCourses=[]] - All courses taken or locked in previous semesters.
 * @returns {Promise<object|null>} A promise that resolves to a single semester object or null.
 */
export const generateNextSemesterPlan = async (studentId, pinnedCourses = [], previouslyPlannedCourses = []) => {
  const audit = await runDegreeAudit(studentId);

  // Combine student's actual completed courses with previously planned ones for a full history
  const simulatedCompletedCourses = [
    ...(audit.studentCompletedCourses || []),
    ...previouslyPlannedCourses,
  ];

  let remainingCourses = audit.results
    .flatMap(r => r.coursesStillNeeded)
    .filter(neededCourse => 
        !previouslyPlannedCourses.some(planned => 
            planned.Subject === neededCourse.Subject && planned.CourseNumber === neededCourse.CourseNumber
        )
    );
  
  if (remainingCourses.length === 0) {
    return null; // No more courses to plan
  }

  let currentSemesterCredits = 0;
  const currentSemesterCourses = [];

  // 1. Handle Pinned Courses first
  if (pinnedCourses.length > 0) {
    for (const pinned of pinnedCourses) {
      const details = await getCourseByKey(pinned.Subject, pinned.CourseNumber);
      if (!details) throw new Error(`Pinned course ${pinned.Subject} ${pinned.CourseNumber} not found.`);

      const canTake = arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses);
      if (canTake && (currentSemesterCredits + (details.Credits || 3) <= MAX_CREDITS_PER_SEMESTER)) {
        currentSemesterCourses.push(details);
        currentSemesterCredits += (details.Credits || 3);
      } else {
        throw new Error(`Cannot schedule pinned course ${details.Subject} ${details.CourseNumber}. Prerequisites not met or credit limit exceeded.`);
      }
    }
  }

  // 2. Fill the rest of the semester
  const courseDetailsPromises = remainingCourses.map(course => getCourseByKey(course.Subject, course.CourseNumber));
  const allCourseDetails = await Promise.all(courseDetailsPromises);

  const eligibleNow = allCourseDetails.filter(details => {
    if (!details) return false;
    // Ensure it's not already in the semester from pinning
    const isAlreadyPinned = currentSemesterCourses.some(c => c.Subject === details.Subject && c.CourseNumber === details.CourseNumber);
    if (isAlreadyPinned) return false;
    
    // Check prerequisites against all previously completed/planned courses
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

// Helper function (no changes)
const arePrerequisitesMet = (prerequisites, completedCourses) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => 
        completedCourses.some(completed => 
            completed.Subject === prereq.Subject && completed.CourseNumber === prereq.CourseNumber
        )
    );
};