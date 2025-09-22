import { getStudentById } from './studentsService.js';
import { getRulesByMajor } from './rulesService.js';
import { getCourseByKey, getCoursesByKeys, getAllCourses } from './coursesService.js';

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
  // Fetch student and all courses in parallel for efficiency
  const [student, allCourses] = await Promise.all([
    getStudentById(studentId),
    getAllCourses()
  ]);

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

  // Create a Set of all course IDs that are required for the degree
  const allRequiredCourseIds = new Set();
  rules.forEach(rule => {
      if (rule.Courses) {
          rule.Courses.forEach(course => {
              allRequiredCourseIds.add(`${course.Subject}-${course.CourseNumber}`);
          });
      }
  });

  const completedCourseIds = new Set(effectiveCompletedCourses.map(c => `${c.Subject}-${c.CourseNumber}`));

  // --- NEW: Calculate available electives ---
  const availableElectives = allCourses.filter(course => {
      const courseId = `${course.Subject}-${course.CourseNumber}`;
      // An elective is a course that is NOT required and NOT already completed
      return !allRequiredCourseIds.has(courseId) && !completedCourseIds.has(courseId);
  });

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
        rule.AllowedSubjects?.includes(c.Subject) &&
        (!rule.Restrictions || c.CourseNumber >= 3000)
      );
      const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
      isSatisfied = creditsEarned >= rule.MinCredits;
      notes = `${creditsEarned} of ${rule.MinCredits} elective credits completed.`;

      if (!isSatisfied) {
        const restrictionText = rule.Restrictions ? ` (${rule.Restrictions.join(', ')})` : '';
        coursesStillNeededForRule.push({
            Subject: 'ELECTIVE',
            CourseNumber: `(${rule.AllowedSubjects.join('/')})${restrictionText}`
        });
      }
    }

    coursesStillNeededForRule.forEach(course => {
        if (!allCoursesStillNeededKeys.some(c => c.Subject === course.Subject && c.CourseNumber === course.CourseNumber)) {
            if(course.Subject !== 'ELECTIVE') {
                allCoursesStillNeededKeys.push({ Subject: course.Subject, CourseNumber: course.CourseNumber });
            }
        }
    });

    return { requirementType: rule.RequirementType, isSatisfied, notes, coursesStillNeeded: coursesStillNeededForRule };
  });

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
    allRemainingCourses: allRemainingCoursesDetails,
    eligibleNextCourses: eligibleCourses,
    availableElectives: availableElectives // Add the new list to the report
  };
};