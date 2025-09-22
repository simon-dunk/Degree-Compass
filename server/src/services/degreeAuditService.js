import { getStudentById } from './studentsService.js';
import { getRulesByMajor } from './rulesService.js';
import { getCourseByKey, getCoursesByKeys } from './coursesService.js'; // Import getCoursesByKeys

// ... (hasCompletedCourse and arePrerequisitesMet helpers remain the same)
const hasCompletedCourse = (course, completedCourses) => {
  return completedCourses.some(completed =>
    completed.Subject === course.Subject &&
    completed.CourseNumber === course.CourseNumber
  );
};

const arePrerequisitesMet = (prerequisites, completedCourses) => {
  if (!prerequisites || prerequisites.length === 0) {
    return true; 
  }
  return prerequisites.every(prereq => hasCompletedCourse(prereq, completedCourses));
};


/**
 * The main degree audit engine.
 * @param {string} studentId - The ID of the student to audit.
 * @returns {Promise<object>} A detailed audit report.
 */
export const runDegreeAudit = async (studentId) => {
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
  
  let allCoursesStillNeededKeys = [];
  const auditResults = rules.map(rule => {
    let isSatisfied = false;
    let notes = '';
    let coursesStillNeededForRule = [];

    if (rule.Courses && Array.isArray(rule.Courses)) {
      coursesStillNeededForRule = rule.Courses.filter(reqCourse => !hasCompletedCourse(reqCourse, effectiveCompletedCourses));
      isSatisfied = coursesStillNeededForRule.length === 0;
      const ruleTypeName = rule.RequirementType.replace(/_/g, ' ').toLowerCase();
      notes = isSatisfied 
        ? `All ${ruleTypeName} courses completed.` 
        : `${coursesStillNeededForRule.length} ${ruleTypeName} course(s) remaining.`;
    } 
    else if (rule.MinCredits) {
      const completedElectives = effectiveCompletedCourses.filter(c =>
        rule.AllowedSubjects.includes(c.Subject) &&
        (!rule.Restrictions || c.CourseNumber >= 3000)
      );
      const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
      isSatisfied = creditsEarned >= rule.MinCredits;
      notes = `${creditsEarned} of ${rule.MinCredits} elective credits completed.`;
    }
    
    coursesStillNeededForRule.forEach(course => {
        if (!allCoursesStillNeededKeys.some(c => c.Subject === course.Subject && c.CourseNumber === course.CourseNumber)) {
            allCoursesStillNeededKeys.push({ Subject: course.Subject, CourseNumber: course.CourseNumber });
        }
    });

    return { requirementType: rule.RequirementType, isSatisfied, notes, coursesStillNeeded: coursesStillNeededForRule };
  });

  // --- THIS IS THE KEY CHANGE ---
  // Fetch full details for all remaining courses at once.
  const allRemainingCoursesDetails = await getCoursesByKeys(allCoursesStillNeededKeys);

  const eligibleCourses = allRemainingCoursesDetails.filter(course => 
    arePrerequisitesMet(course.Prerequisites, effectiveCompletedCourses)
  );

  return {
    studentId: student.StudentId,
    major: majorCode,
    auditDate: new Date().toISOString(),
    studentCompletedCourses: student.CompletedCourses || [],
    results: auditResults,
    // Return the full course objects for both lists
    allRemainingCourses: allRemainingCoursesDetails, 
    eligibleNextCourses: eligibleCourses,
  };
};