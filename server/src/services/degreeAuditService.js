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
  // 1. Fetch Student and Degree Rules
  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error(`Student with ID ${studentId} not found.`);
  }
  const majorCode = student.Major[0];
  const rules = await getRulesByMajor(majorCode);

  // 2. Process Overrides to create an effective list of completed courses
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
  
  // 3. Process each requirement rule and identify all remaining courses
  let allCoursesStillNeeded = [];
  const auditResults = rules.map(rule => {
    let isSatisfied = false;
    let notes = '';
    let coursesStillNeeded = [];

    if (rule.RequirementType === 'CORE') {
      coursesStillNeeded = rule.Courses.filter(reqCourse => !hasCompletedCourse(reqCourse, effectiveCompletedCourses));
      isSatisfied = coursesStillNeeded.length === 0;
      notes = isSatisfied ? 'All core courses completed.' : `${coursesStillNeeded.length} core course(s) remaining.`;
    } 
    else if (rule.RequirementType === 'ELECTIVES') {
      const completedElectives = effectiveCompletedCourses.filter(c =>
        rule.AllowedSubjects.includes(c.Subject) &&
        (!rule.Restrictions || c.CourseNumber >= 3000)
      );
      const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
      isSatisfied = creditsEarned >= rule.MinCredits;
      notes = `${creditsEarned} of ${rule.MinCredits} elective credits completed.`;
      // Note: Elective "courses still needed" is more complex (path generation), so we'll leave it empty for now.
    }
    
    // Add the needed courses from this rule to our master list
    allCoursesStillNeeded.push(...coursesStillNeeded);

    return { requirementType: rule.RequirementType, isSatisfied, notes, coursesStillNeeded };
  });

  // 4. Determine which of the needed courses are eligible to be taken next
  const eligibleCoursesCheck = await Promise.all(
    allCoursesStillNeeded.map(async (neededCourse) => {
      const courseDetails = await getCourseByKey(neededCourse.Subject, neededCourse.CourseNumber);
      const prerequisites = courseDetails?.Prerequisites;
      const canTake = arePrerequisitesMet(prerequisites, effectiveCompletedCourses);
      return { ...neededCourse, canTake };
    })
  );

  const eligibleCourses = eligibleCoursesCheck.filter(course => course.canTake);

  // 5. Structure and return the final report
  return {
    studentId: student.StudentId,
    major: majorCode,
    auditDate: new Date().toISOString(),
    studentCompletedCourses: student.CompletedCourses || [],
    results: auditResults,
    eligibleNextCourses: eligibleCourses, // Add the new list to our report
  };
};