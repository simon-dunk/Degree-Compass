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
  const [student, allCourses] = await Promise.all([
    getStudentById(studentId),
    getAllCourses()
  ]);

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found.`);
  }
  const majorCode = student.Major[0];
  const originalRules = await getRulesByMajor(majorCode);

  // --- THIS IS THE FIX ---
  // Deep copy the rules to create a temporary, modified set for this specific student.
  let effectiveRules = JSON.parse(JSON.stringify(originalRules));

  // If the student has overrides, modify the effective rules before running the audit.
  if (student.Overrides) {
    const subMap = new Map();
    student.Overrides.forEach(override => {
      // Key: The course to be replaced (e.g., "CIS-2103")
      const subThisId = `${override.SubThis.Subject}-${override.SubThis.CourseNumber}`;
      // Value: The course that will take its place (e.g., { Subject: "ART", CourseNumber: 1213 })
      const subForCourse = override.SubFor[0]; 
      subMap.set(subThisId, subForCourse);
    });

    // Iterate through the copied rules and apply the substitutions.
    effectiveRules = effectiveRules.map(rule => {
      if (rule.Courses) {
        rule.Courses = rule.Courses.map(course => {
          const courseId = `${course.Subject}-${course.CourseNumber}`;
          if (subMap.has(courseId)) {
            return subMap.get(courseId); // Replace the original requirement
          }
          return course; // Keep the original course
        });
      }
      return rule;
    });
  }
  
  const effectiveCompletedCourses = [...(student.CompletedCourses || [])];

  const allRequiredCourseIds = new Set();
  effectiveRules.forEach(rule => { // Use the modified rules
      if (rule.Courses) {
          rule.Courses.forEach(course => {
              allRequiredCourseIds.add(`${course.Subject}-${course.CourseNumber}`);
          });
      }
  });

  const completedCourseIds = new Set(effectiveCompletedCourses.map(c => `${c.Subject}-${c.CourseNumber}`));

  const availableElectives = allCourses.filter(course => {
      const courseId = `${course.Subject}-${course.CourseNumber}`;
      return !allRequiredCourseIds.has(courseId) && !completedCourseIds.has(courseId);
  });

  let allCoursesStillNeededKeys = [];
  const auditResults = effectiveRules.map(rule => { // Use the modified rules
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
    
    return { ...rule, isSatisfied, notes, coursesStillNeeded: coursesStillNeededForRule };
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
    availableElectives: availableElectives
  };
};