import { getStudentById } from './studentsService.js';
import { getRulesByMajor } from './rulesService.js';
import { getCourseByKey } from './coursesService.js';

/**
 * Checks if a student has completed a specific course.
 * @param {object} course - The course to check for.
 * @param {Array<object>} completedCourses - The student's completed courses.
 * @returns {boolean} True if the course is in the completed list.
 */
const hasCompletedCourse = (course, completedCourses) => {
  return completedCourses.some(completed =>
    completed.Subject === course.Subject &&
    completed.CourseNumber === course.CourseNumber
  );
};

/**
 * Checks if a student has met all prerequisites for a given course.
 * @param {Array<object>} prerequisites - The list of prerequisite courses.
 * @param {Array<object>} completedCourses - The student's completed courses.
 * @returns {boolean} True if all prerequisites are met.
 */
const arePrerequisitesMet = (prerequisites, completedCourses) => {
  if (!prerequisites || prerequisites.length === 0) {
    return true; // No prerequisites, so they are met.
  }
  // Check if every course in the prerequisite list has been completed.
  return prerequisites.every(prereq => hasCompletedCourse(prereq, completedCourses));
};


/**
 * The main degree audit engine.
 * @param {string} studentId - The ID of the student to audit.
 * @returns {Promise<object>} A detailed audit report.
 */
export const runDegreeAudit = async (studentId) => {
  // 1. Fetch data and process overrides (no changes here)
  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error(`Student with ID ${studentId} not found.`);
  }
  const majorCode = student.Major[0];
  const rules = await getRulesByMajor(majorCode);

  let effectiveCompletedCourses = [...(student.CompletedCourses || [])];
  if (student.Overrides) {
    for (const override of student.Overrides) {
      const hasTakenSubFor = override.SubFor.some(subCourse =>
        hasCompletedCourse(subCourse, effectiveCompletedCourses)
      );
      if (hasTakenSubFor) {
        effectiveCompletedCourses.push(override.SubThis);
      }
    }
  }
  
  let allCoursesStillNeeded = [];
  const auditResults = rules.map(rule => {
    let isSatisfied = false;
    let notes = '';
    let coursesStillNeeded = [];

    // --- THIS IS THE FIX ---
    // This logic now runs for ANY rule that has a 'Courses' array.
    if (rule.Courses && Array.isArray(rule.Courses)) {
      coursesStillNeeded = rule.Courses.filter(reqCourse => !hasCompletedCourse(reqCourse, effectiveCompletedCourses));
      isSatisfied = coursesStillNeeded.length === 0;
      const ruleTypeName = rule.RequirementType.replace(/_/g, ' ').toLowerCase();
      notes = isSatisfied 
        ? `All ${ruleTypeName} courses completed.` 
        : `${coursesStillNeeded.length} ${ruleTypeName} course(s) remaining.`;
    } 
    // This logic remains for rules that only check for credits (like electives).
    else if (rule.MinCredits) {
      const completedElectives = effectiveCompletedCourses.filter(c =>
        rule.AllowedSubjects.includes(c.Subject) &&
        (!rule.Restrictions || c.CourseNumber >= 3000)
      );
      const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
      isSatisfied = creditsEarned >= rule.MinCredits;
      notes = `${creditsEarned} of ${rule.MinCredits} elective credits completed.`;
    }
    
    allCoursesStillNeeded.push(...coursesStillNeeded);

    return { requirementType: rule.RequirementType, isSatisfied, notes, coursesStillNeeded };
  });

  // 4. & 5. Prerequisite checking and returning the report (no changes here)
  const eligibleCoursesCheck = await Promise.all(
    allCoursesStillNeeded.map(async (neededCourse) => {
      const courseDetails = await getCourseByKey(neededCourse.Subject, neededCourse.CourseNumber);
      const prerequisites = courseDetails?.Prerequisites;
      const canTake = arePrerequisitesMet(prerequisites, effectiveCompletedCourses);
      return { ...neededCourse, canTake };
    })
  );

  const eligibleCourses = eligibleCoursesCheck.filter(course => course.canTake);

  return {
    studentId: student.StudentId,
    major: majorCode,
    auditDate: new Date().toISOString(),
    studentCompletedCourses: student.CompletedCourses || [],
    results: auditResults,
    eligibleNextCourses: eligibleCourses,
  };
};
