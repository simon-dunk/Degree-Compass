import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const courseTable = config.db_tables.courses;
const reqsTable = config.db_tables.degree_reqs;

// --- Helper function to generate a random schedule ---
const getRandomSchedule = () => {
    const days = ['MWF', 'TR', 'MW', 'M', 'T', 'W', 'R', 'F'];
    const startHours = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];
    const durations = [50, 75, 110]; // 50 min, 75 min, 1h 50min
    
    const startTime = startHours[Math.floor(Math.random() * startHours.length)];
    const duration = durations[Math.floor(Math.random() * durations.length)];

    const [hour, minute] = startTime.split(':').map(Number);
    const startDate = new Date(0, 0, 0, hour, minute);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    return {
        Days: days[Math.floor(Math.random() * days.length)],
        StartTime: startTime,
        EndTime: endTime
    };
};

const allCourses = [
    // --- GENERAL EDUCATION (Shared Courses) ---
    { Subject: 'ENGL', CourseNumber: 1113, Name: 'English Composition I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ENGL', CourseNumber: 1213, Name: 'English Composition II', Credits: 3, Prerequisites: [{ Subject: 'ENGL', CourseNumber: 1113 }], Schedule: getRandomSchedule() },
    { Subject: 'HIST', CourseNumber: 1483, Name: 'U.S. History to 1877', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'POSC', CourseNumber: 1513, Name: 'American Federal Government', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'COMM', CourseNumber: 1233, Name: 'Speech Communication', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'HUM', CourseNumber: 2113, Name: 'Humanities I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'HUM', CourseNumber: 2223, Name: 'Humanities II', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'PSYC', CourseNumber: 1113, Name: 'General Psychology', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'SOC', CourseNumber: 1113, Name: 'Introduction to Sociology', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'BIOL', CourseNumber: 1114, Name: 'General Biology', Credits: 4, Schedule: getRandomSchedule() },
    { Subject: 'CHEM', CourseNumber: 1315, Name: 'General Chemistry I', Credits: 5, Schedule: getRandomSchedule() },

    // --- CIS MAJOR ---
    { Subject: 'CIS', CourseNumber: 1613, Name: 'Computer Information Systems I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 2103, Name: 'Intermediate Productivity Software', Credits: 3, Prerequisites: [{ Subject: 'CIS', CourseNumber: 1613 }], Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 3123, Name: 'Intermediate Database Analysis', Credits: 3, Prerequisites: [{ Subject: 'CIS', CourseNumber: 2103 }], Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 3323, Name: 'Advanced Database Analysis', Credits: 3, Prerequisites: [{ Subject: 'CIS', CourseNumber: 3123 }], Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 4113, Name: 'Data Communications Technology', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 4413, Name: 'Systems Analysis', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 3533, Name: 'Advanced Business Solutions', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'CIS', CourseNumber: 4981, Name: 'Senior Seminar', Credits: 1, Schedule: getRandomSchedule() },

    // --- MATH MAJOR ---
    { Subject: 'MATH', CourseNumber: 1513, Name: 'College Algebra', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 2614, Name: 'Calculus I', Credits: 4, Prerequisites: [{ Subject: 'MATH', CourseNumber: 1513 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 2624, Name: 'Calculus II', Credits: 4, Prerequisites: [{ Subject: 'MATH', CourseNumber: 2614 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 2634, Name: 'Calculus III', Credits: 4, Prerequisites: [{ Subject: 'MATH', CourseNumber: 2624 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 3703, Name: 'Introduction to Proof', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 3713, Name: 'Abstract Algebra I', Credits: 3, Prerequisites: [{ Subject: 'MATH', CourseNumber: 3703 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 3983, Name: 'Linear Algebra', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 4113, Name: 'Differential Equations', Credits: 3, Prerequisites: [{ Subject: 'MATH', CourseNumber: 2624 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 3913, Name: 'Introduction to Analysis', Credits: 3, Prerequisites: [{ Subject: 'MATH', CourseNumber: 3703 }], Schedule: getRandomSchedule() },
    { Subject: 'MATH', CourseNumber: 4013, Name: 'Abstract Algebra II', Credits: 3, Prerequisites: [{ Subject: 'MATH', CourseNumber: 3713 }], Schedule: getRandomSchedule() },
    
    // --- BISS MAJOR (Business Admin) ---
    { Subject: 'ACCT', CourseNumber: 2103, Name: 'Financial Accounting', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ACCT', CourseNumber: 2203, Name: 'Managerial Accounting', Credits: 3, Prerequisites: [{ Subject: 'ACCT', CourseNumber: 2103 }], Schedule: getRandomSchedule() },
    { Subject: 'ECON', CourseNumber: 2213, Name: 'Principles of Microeconomics', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ECON', CourseNumber: 2313, Name: 'Principles of Macroeconomics', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'BISS', CourseNumber: 3113, Name: 'Management & Org. Behavior', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'BISS', CourseNumber: 3233, Name: 'Principles of Marketing', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'BISS', CourseNumber: 3563, Name: 'Fundamentals of Business Finance', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'BISS', CourseNumber: 4813, Name: 'Strategic Management', Credits: 3, Schedule: getRandomSchedule() },

    // --- ART MAJOR ---
    { Subject: 'ART', CourseNumber: 1213, Name: 'Drawing I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 1233, Name: '2D Design', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 2003, Name: 'Drawing II', Credits: 3, Prerequisites: [{ Subject: 'ART', CourseNumber: 1213 }], Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 2333, Name: '3D Design', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 3213, Name: 'Art History Survey I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 3223, Name: 'Art History Survey II', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 3323, Name: 'Painting I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 3423, Name: 'Ceramics I', Credits: 3, Schedule: getRandomSchedule() },
    { Subject: 'ART', CourseNumber: 4801, Name: 'Capstone Senior Exhibition', Credits: 1, Schedule: getRandomSchedule() },
];

const allDegreeRequirements = [
    // --- CIS REQUIREMENTS ---
    { MajorCode: 'CIS', RequirementType: 'GENERAL_ED', TotalCreditsRequired: 44, Courses: [
        { Subject: 'ENGL', CourseNumber: 1113 }, { Subject: 'ENGL', CourseNumber: 1213 },
        { Subject: 'HIST', CourseNumber: 1483 }, { Subject: 'POSC', CourseNumber: 1513 },
        { Subject: 'COMM', CourseNumber: 1233 }, { Subject: 'HUM', CourseNumber: 2113 },
        { Subject: 'HUM', CourseNumber: 2223 }, { Subject: 'PSYC', CourseNumber: 1113 },
        { Subject: 'BIOL', CourseNumber: 1114 }, { Subject: 'CHEM', CourseNumber: 1315 },
        { Subject: 'MATH', CourseNumber: 1513 },
    ]},
    { MajorCode: 'CIS', RequirementType: 'CORE', TotalCreditsRequired: 25, Courses: [
        { Subject: 'CIS', CourseNumber: 1613 }, { Subject: 'CIS', CourseNumber: 2103 },
        { Subject: 'CIS', CourseNumber: 3123 }, { Subject: 'CIS', CourseNumber: 3323 },
        { Subject: 'CIS', CourseNumber: 4113 }, { Subject: 'CIS', CourseNumber: 4413 },
        { Subject: 'CIS', CourseNumber: 3533 }, { Subject: 'CIS', CourseNumber: 4981 },
    ]},
    { MajorCode: 'CIS', RequirementType: 'BUSINESS_MINOR', TotalCreditsRequired: 21, Courses: [
        { Subject: 'ACCT', CourseNumber: 2103 }, { Subject: 'ACCT', CourseNumber: 2203 },
        { Subject: 'ECON', CourseNumber: 2213 }, { Subject: 'BISS', CourseNumber: 3233 },
        { Subject: 'BISS', CourseNumber: 3113 },
    ]},
    
    // --- MATH REQUIREMENTS ---
    { MajorCode: 'MATH', RequirementType: 'GENERAL_ED', TotalCreditsRequired: 41, Courses: [
        { Subject: 'ENGL', CourseNumber: 1113 }, { Subject: 'ENGL', CourseNumber: 1213 },
        { Subject: 'HIST', CourseNumber: 1483 }, { Subject: 'POSC', CourseNumber: 1513 },
        { Subject: 'COMM', CourseNumber: 1233 }, { Subject: 'HUM', CourseNumber: 2113 },
        { Subject: 'HUM', CourseNumber: 2223 }, { Subject: 'PSYC', CourseNumber: 1113 },
        { Subject: 'BIOL', CourseNumber: 1114 }, { Subject: 'CHEM', CourseNumber: 1315 },
    ]},
    { MajorCode: 'MATH', RequirementType: 'CORE', TotalCreditsRequired: 30, Courses: [
        { Subject: 'MATH', CourseNumber: 2614 }, { Subject: 'MATH', CourseNumber: 2624 },
        { Subject: 'MATH', CourseNumber: 2634 }, { Subject: 'MATH', CourseNumber: 3703 },
        { Subject: 'MATH', CourseNumber: 3713 }, { Subject: 'MATH', CourseNumber: 3983 },
        { Subject: 'MATH', CourseNumber: 4113 },
    ]},
    { MajorCode: 'MATH', RequirementType: 'ELECTIVES', MinCredits: 12, AllowedSubjects: ['MATH'], Restrictions: ['Must be 3000+ level'] },
    
    // --- BISS REQUIREMENTS ---
    { MajorCode: 'BISS', RequirementType: 'GENERAL_ED', TotalCreditsRequired: 42, Courses: [
        { Subject: 'ENGL', CourseNumber: 1113 }, { Subject: 'ENGL', CourseNumber: 1213 },
        { Subject: 'HIST', CourseNumber: 1483 }, { Subject: 'POSC', CourseNumber: 1513 },
        { Subject: 'COMM', CourseNumber: 1233 }, { Subject: 'HUM', CourseNumber: 2113 },
        { Subject: 'HUM', CourseNumber: 2223 }, { Subject: 'PSYC', CourseNumber: 1113 },
        { Subject: 'BIOL', CourseNumber: 1114 }, { Subject: 'MATH', CourseNumber: 1513 },
    ]},
    { MajorCode: 'BISS', RequirementType: 'BUSINESS_CORE', TotalCreditsRequired: 24, Courses: [
        { Subject: 'ACCT', CourseNumber: 2103 }, { Subject: 'ACCT', CourseNumber: 2203 },
        { Subject: 'ECON', CourseNumber: 2213 }, { Subject: 'ECON', CourseNumber: 2313 },
        { Subject: 'BISS', CourseNumber: 3113 }, { Subject: 'BISS', CourseNumber: 3233 },
        { Subject: 'BISS', CourseNumber: 3563 }, { Subject: 'BISS', CourseNumber: 4813 },
    ]},
    { MajorCode: 'BISS', RequirementType: 'ELECTIVES', MinCredits: 21, AllowedSubjects: ['BISS', 'MKT', 'FIN'], Restrictions: ['Must be 3000+ level'] },

    // --- ART REQUIREMENTS ---
    { MajorCode: 'ART', RequirementType: 'GENERAL_ED', TotalCreditsRequired: 40, Courses: [
        { Subject: 'ENGL', CourseNumber: 1113 }, { Subject: 'ENGL', CourseNumber: 1213 },
        { Subject: 'HIST', CourseNumber: 1483 }, { Subject: 'POSC', CourseNumber: 1513 },
        { Subject: 'COMM', CourseNumber: 1233 }, { Subject: 'HUM', CourseNumber: 2113 },
        { Subject: 'HUM', CourseNumber: 2223 }, { Subject: 'PSYC', CourseNumber: 1113 },
        { Subject: 'BIOL', CourseNumber: 1114 }, { Subject: 'MATH', CourseNumber: 1513 },
    ]},
    { MajorCode: 'ART', RequirementType: 'ART_FOUNDATION', TotalCreditsRequired: 12, Courses: [
        { Subject: 'ART', CourseNumber: 1213 }, { Subject: 'ART', CourseNumber: 1233 },
        { Subject: 'ART', CourseNumber: 2003 }, { Subject: 'ART', CourseNumber: 2333 },
    ]},
    { MajorCode: 'ART', RequirementType: 'ART_HISTORY', TotalCreditsRequired: 6, Courses: [
        { Subject: 'ART', CourseNumber: 3213 }, { Subject: 'ART', CourseNumber: 3223 },
    ]},
    { MajorCode: 'ART', RequirementType: 'STUDIO_ELECTIVES', MinCredits: 18, AllowedSubjects: ['ART'], Restrictions: ['Must be 3000+ level'] },
];


const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

export const generateFullDegreeProgram = async () => {
  console.log('Seeding database with 4 full degree programs...');

  const coursePutRequests = allCourses.map(Item => ({ PutRequest: { Item } }));
  const reqsPutRequests = allDegreeRequirements.map(Item => ({ PutRequest: { Item } }));

  const courseChunks = chunkArray(coursePutRequests, 25);
  const reqsChunks = chunkArray(reqsPutRequests, 25);

  try {
    for (const chunk of courseChunks) {
      const params = { RequestItems: { [courseTable]: chunk } };
      await docClient.send(new BatchWriteCommand(params));
    }
    for (const chunk of reqsChunks) {
      const params = { RequestItems: { [reqsTable]: chunk } };
      await docClient.send(new BatchWriteCommand(params));
    }

    return {
      message: `Successfully seeded ${coursePutRequests.length} courses and ${reqsPutRequests.length} degree rules.`
    };
  } catch (error) {
    console.error('Error during mass data generation:', error);
    throw new Error('Could not generate mass data.');
  }
};