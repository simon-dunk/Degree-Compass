import { runDegreeAudit } from './degreeAuditService.js';
import { getCourseByKey, getCoursesByKeys } from './coursesService.js';

const MAX_CREDITS_PER_SEMESTER = 15; // Define your credit limit

// Helper function to check prerequisites
const arePrerequisitesMet = (prerequisites, completedCourses) => {
    // If prerequisites are null, undefined, or empty, they are met.
    if (!prerequisites || !Array.isArray(prerequisites) || prerequisites.length === 0) {
        return true;
    }
    // Create a Set of completed course IDs for efficient lookup.
    const completedIds = new Set(
        (completedCourses || []).map(c => `${c.Subject}-${c.CourseNumber}`)
    );
    // Ensure every prerequisite is present in the completed set.
    return prerequisites.every(prereq => {
        // Handle potentially malformed prerequisite entries
        if (!prereq || typeof prereq.Subject !== 'string' || typeof prereq.CourseNumber !== 'number') {
            console.warn(`Malformed prerequisite found: ${JSON.stringify(prereq)}. Assuming NOT met.`);
            return false;
        }
        const prereqId = `${prereq.Subject}-${prereq.CourseNumber}`;
        return completedIds.has(prereqId);
    });
};


/**
 * Generates a single, optimal semester plan.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - Courses the user wants in this semester [{ Subject, CourseNumber }].
 * @param {Array<object>} [previouslyPlannedCourses=[]] - All courses taken or locked in previous semesters.
 * @returns {Promise<object|null>} A promise that resolves to a single semester object { courses: [], totalCredits: number } or null if planning is complete.
 */
export const generateNextSemesterPlan = async (studentId, pinnedCourses = [], previouslyPlannedCourses = []) => {
  console.log(`Generating semester for student ${studentId}...`);
  console.log(`Pinned courses: ${JSON.stringify(pinnedCourses)}`);
  console.log(`Previously planned: ${previouslyPlannedCourses?.length || 0} courses`);

  let audit;
  try {
      audit = await runDegreeAudit(studentId);
      if (!audit) {
          throw new Error("Degree audit failed to return data.");
      }
  } catch (auditError) {
      console.error(`Error running degree audit for ${studentId}:`, auditError);
      throw new Error(`Failed to run degree audit: ${auditError.message}`); // Re-throw to send 500
  }

  // Combine completed courses and courses planned in prior locked semesters
  const simulatedCompletedCourses = [
    ...(audit.studentCompletedCourses || []),
    ...(previouslyPlannedCourses || []), // Ensure it's an array
  ];
  const completedOrPreviouslyPlannedIds = new Set(
    simulatedCompletedCourses.map(c => `${c.Subject}-${c.CourseNumber}`)
  );

  // --- Gather all potential courses (required remaining + available electives) ---
  // Filter out any that are already completed or planned previously
  const potentialCourseRefs = [
      ...(audit.allRemainingCourses || []),
      ...(audit.availableElectives || [])
    ].filter(courseRef => {
        if (!courseRef || !courseRef.Subject || typeof courseRef.CourseNumber === 'undefined') {
            console.warn(`Invalid course reference found in audit: ${JSON.stringify(courseRef)}. Skipping.`);
            return false;
        }
        const courseId = `${courseRef.Subject}-${courseRef.CourseNumber}`;
        return !completedOrPreviouslyPlannedIds.has(courseId);
    });

  // Extract keys and fetch full details (Credits, Prerequisites)
  const potentialCourseKeys = potentialCourseRefs.map(c => ({ Subject: c.Subject, CourseNumber: c.CourseNumber }));
  let potentialCourseDetailsList = [];
  if (potentialCourseKeys.length > 0) {
      try {
          potentialCourseDetailsList = await getCoursesByKeys(potentialCourseKeys);
      } catch (courseFetchError) {
          console.error("Error fetching potential course details:", courseFetchError);
          // Decide if you want to throw (500) or continue with potentially missing details
          throw new Error(`Failed to fetch course details: ${courseFetchError.message}`);
      }
  }
  const potentialCourseDetailsMap = new Map(potentialCourseDetailsList.map(c => [`${c.Subject}-${c.CourseNumber}`, c]));
  console.log(`Found ${potentialCourseDetailsMap.size} potential courses with details.`);

  let currentSemesterCredits = 0;
  const currentSemesterCourses = [];
  const addedCourseIds = new Set(); // Track courses added *in this semester*

  // --- 1. Handle ALL Pinned Courses first ---
  const pinnedCoursesDetails = []; // Store details of successfully pinned courses for later addition to simulatedCompleted
  if (pinnedCourses && pinnedCourses.length > 0) {
    console.log("Processing pinned courses...");
    for (const pinned of pinnedCourses) {
        if (!pinned || !pinned.Subject || typeof pinned.CourseNumber === 'undefined') {
            throw new Error(`Invalid pinned course data received: ${JSON.stringify(pinned)}`);
        }
        const courseId = `${pinned.Subject}-${pinned.CourseNumber}`;
        let details = potentialCourseDetailsMap.get(courseId);

        // If not found in bulk fetch, try fetching individually (safety net)
        if (!details) {
            console.warn(`Pinned course ${courseId} not found in initial batch, fetching individually.`);
            try {
                details = await getCourseByKey(pinned.Subject, pinned.CourseNumber);
                if (details) {
                    potentialCourseDetailsMap.set(courseId, details); // Cache it
                } else {
                     throw new Error(`Pinned course ${courseId} does not exist in the CourseDatabase.`);
                }
            } catch (fetchError) {
                 throw new Error(`Error fetching details for pinned course ${courseId}: ${fetchError.message}`);
            }
        }

        // Use default credits if missing, but log a warning
        let credits = details.Credits;
        if (typeof credits !== 'number' || isNaN(credits)) {
            console.warn(`Course ${courseId} is missing valid 'Credits'. Defaulting to 3.`);
            credits = 3;
        }

        if (addedCourseIds.has(courseId)) {
            console.log(`Pinned course ${courseId} was already added this semester. Skipping duplicate.`);
            continue;
        }

        const canTake = arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses);

        if (canTake) {
            if (currentSemesterCredits + credits <= MAX_CREDITS_PER_SEMESTER) {
                console.log(`Adding pinned course: ${courseId} (${credits} credits)`);
                currentSemesterCourses.push(details);
                currentSemesterCredits += credits;
                addedCourseIds.add(courseId);
                pinnedCoursesDetails.push(details); // Add to temp list
            } else {
                throw new Error(`Cannot schedule pinned course ${courseId}: Exceeds maximum credits (${MAX_CREDITS_PER_SEMESTER}) for the semester.`);
            }
        } else {
            const prereqsStr = details.Prerequisites?.map(p => `${p.Subject} ${p.CourseNumber}`).join(', ') || 'None listed';
            throw new Error(`Cannot schedule pinned course ${courseId}: Prerequisites (${prereqsStr}) not met based on completed/previously planned courses.`);
        }
    }
    // Add successfully pinned courses to simulatedCompleted for subsequent checks
    simulatedCompletedCourses.push(...pinnedCoursesDetails);
    console.log(`Completed processing pinned courses. Current credits: ${currentSemesterCredits}`);
  }


  // --- 2. Identify remaining unsatisfied requirements (course-specific & credit-based) ---
  // Recalculate based on currently simulated completed courses (including pinned)
  const unsatisfiedRequirements = (audit.results || []).filter(req => {
      if (!req) return false; // Safety check
      if (req.isSatisfied) return false; // Already met

      if (req.Courses && Array.isArray(req.Courses)) {
          // Check if *all* specific courses for this req are now met
          return req.Courses.some(course =>
              !simulatedCompletedCourses.some(completed =>
                  completed.Subject === course.Subject && completed.CourseNumber === course.CourseNumber
              )
          );
      } else if (req.MinCredits) {
          // Recalculate earned elective credits based on current simulation
          const completedElectives = simulatedCompletedCourses.filter(c =>
              Array.isArray(req.AllowedSubjects) && req.AllowedSubjects.includes(c.Subject) && // Check AllowedSubjects is array
              (!Array.isArray(req.Restrictions) || !req.Restrictions.length || (c.CourseNumber && c.CourseNumber >= 3000)) // Basic 3000+ check if restriction exists
              // TODO: Implement more specific restriction checks if needed
          );
          const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
          return creditsEarned < req.MinCredits;
      }
      return false; // If rule has neither Courses nor MinCredits, consider it satisfied or invalid
  });

  const requiredCourseNeedsIds = new Set(
      unsatisfiedRequirements
          .filter(req => req.Courses && Array.isArray(req.Courses))
          .flatMap(req => req.coursesStillNeeded || []) // Use pre-calculated list if available
          .filter(course => course && course.Subject !== 'ELECTIVE') // Filter out placeholders and invalid entries
          .map(course => `${course.Subject}-${course.CourseNumber}`)
  );
  console.log(`Unsatisfied required course IDs: ${[...requiredCourseNeedsIds].join(', ')}`);


  // --- 3. Prioritize eligible REQUIRED courses for unsatisfied requirements ---
  const eligibleRequiredNow = potentialCourseDetailsList.filter(details => {
      if (!details) return false; // Safety check
      const courseId = `${details.Subject}-${details.CourseNumber}`;
      return requiredCourseNeedsIds.has(courseId) && // Is it still required?
             !addedCourseIds.has(courseId) && // Isn't already added this semester?
             arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses); // Prereqs met?
  });

  // Sort eligible required courses (e.g., lower level first)
  eligibleRequiredNow.sort((a, b) => (a.CourseNumber || 0) - (b.CourseNumber || 0));

  console.log(`Eligible required courses now: ${eligibleRequiredNow.map(c=>c.Subject+'-'+c.CourseNumber).join(', ')}`);
  for (const course of eligibleRequiredNow) {
      if (!course) continue; // Safety check
      let credits = course.Credits;
        if (typeof credits !== 'number' || isNaN(credits)) {
            console.warn(`Course ${course.Subject}-${course.CourseNumber} is missing valid 'Credits'. Defaulting to 3.`);
            credits = 3;
        }

      if (currentSemesterCredits + credits <= MAX_CREDITS_PER_SEMESTER) {
          const courseId = `${course.Subject}-${course.CourseNumber}`;
          console.log(`Adding required course: ${courseId} (${credits} credits)`);
          currentSemesterCourses.push(course);
          currentSemesterCredits += credits;
          addedCourseIds.add(courseId);
          simulatedCompletedCourses.push(course); // Update for subsequent checks
      } else {
          console.log(`Skipping required course ${course.Subject}-${course.CourseNumber} due to credit limit.`);
      }
  }
  console.log(`After adding required courses. Current credits: ${currentSemesterCredits}`);


  // --- 4. Fill remaining credits with eligible ELECTIVES if needed ---
  const needsElectiveCredits = unsatisfiedRequirements.some(req => req && req.MinCredits > 0);
  console.log(`Needs elective credits: ${needsElectiveCredits}`);

  if (needsElectiveCredits && currentSemesterCredits < MAX_CREDITS_PER_SEMESTER) {
      const electiveRules = unsatisfiedRequirements.filter(req => req && req.MinCredits > 0);

      const eligibleElectives = potentialCourseDetailsList.filter(details => {
          if (!details) return false; // Safety check
          const courseId = `${details.Subject}-${details.CourseNumber}`;
          // Check if it's NOT a required course AND NOT already added AND prereqs are met
          // AND matches *at least one* unsatisfied elective rule's criteria
          return !requiredCourseNeedsIds.has(courseId) &&
                 !addedCourseIds.has(courseId) &&
                 arePrerequisitesMet(details.Prerequisites, simulatedCompletedCourses) &&
                 electiveRules.some(rule =>
                     (!Array.isArray(rule.AllowedSubjects) || rule.AllowedSubjects.length === 0 || rule.AllowedSubjects.includes(details.Subject)) &&
                     // TODO: Implement more specific restriction checks based on rule.Restrictions
                     (!Array.isArray(rule.Restrictions) || !rule.Restrictions.length || (details.CourseNumber && details.CourseNumber >= 3000)) // Basic 3000+ check
                 );
      });

      // Sort electives (e.g., lower level first)
      eligibleElectives.sort((a, b) => (a.CourseNumber || 0) - (b.CourseNumber || 0));

      console.log(`Eligible electives: ${eligibleElectives.map(c=>c.Subject+'-'+c.CourseNumber).join(', ')}`);
      for (const course of eligibleElectives) {
          if (!course) continue; // Safety check
           let credits = course.Credits;
            if (typeof credits !== 'number' || isNaN(credits)) {
                console.warn(`Course ${course.Subject}-${course.CourseNumber} is missing valid 'Credits'. Defaulting to 3.`);
                credits = 3;
            }

          if (currentSemesterCredits + credits <= MAX_CREDITS_PER_SEMESTER) {
              const courseId = `${course.Subject}-${course.CourseNumber}`;
              console.log(`Adding elective course: ${courseId} (${credits} credits)`);
              currentSemesterCourses.push(course);
              currentSemesterCredits += credits;
              addedCourseIds.add(courseId);
              simulatedCompletedCourses.push(course); // Update for subsequent checks
          } else {
              // Stop adding electives if we hit the credit limit
              console.log(`Stopping elective add due to credit limit.`);
              break;
          }
      }
      console.log(`After adding electives. Current credits: ${currentSemesterCredits}`);
  }


  // --- 5. Return the generated semester or null/empty ---
  if (currentSemesterCourses.length === 0) {
      // Check if there were *any* requirements left at all before this semester's planning attempt
      const trulyFinished = audit.results.every(req => {
          if (!req) return true; // Skip invalid reqs
          const stillNeeded = (req.coursesStillNeeded || []).filter(courseRef => {
              if (!courseRef || !courseRef.Subject || typeof courseRef.CourseNumber === 'undefined') return false;
              const courseId = `${courseRef.Subject}-${courseRef.CourseNumber}`;
              return !completedOrPreviouslyPlannedIds.has(courseId); // Check against original completed/planned list
          });
          // Also check MinCredits requirements again based on the original list
          if (req.MinCredits > 0) {
              const completedElectives = (audit.studentCompletedCourses || [])
                  .concat(previouslyPlannedCourses || [])
                  .filter(c =>
                      Array.isArray(req.AllowedSubjects) && req.AllowedSubjects.includes(c.Subject) &&
                      (!Array.isArray(req.Restrictions) || !req.Restrictions.length || (c.CourseNumber && c.CourseNumber >= 3000))
                  );
              const creditsEarned = completedElectives.reduce((sum, course) => sum + (course.Credits || 3), 0);
              return stillNeeded.length === 0 && creditsEarned >= req.MinCredits;
          }

          return stillNeeded.length === 0;
      });

      if (trulyFinished && (!pinnedCourses || pinnedCourses.length === 0)) {
          console.log("No required courses remaining and no courses pinned. Planning complete.");
          return null; // Truly finished or nothing to add
      } else {
           console.log("Could not add any suitable courses this semester (prerequisites, credit limits, or requirements mismatch). Returning empty semester.");
           return { courses: [], totalCredits: 0 }; // Indicate calculation happened but nothing fit
      }
  }

  console.log(`Generated semester with ${currentSemesterCourses.length} courses, ${currentSemesterCredits} credits.`);
  return { courses: currentSemesterCourses, totalCredits: currentSemesterCredits };
};