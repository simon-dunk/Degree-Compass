# Degree-Compass Development Plan

Based on your documentation, I'll provide a comprehensive development plan for your Academic Planning Suite. This is an excellent foundation for a smart academic planner!

## 🎯 Project Analysis

Your application has three well-defined modules:
1. **Rules Engine (Admin)** - Manage graduation requirements
2. **Degree Planner** - Student progress tracking and path generation
3. **Schedule Builder** - Semester course scheduling

## 🏗️ Recommended Development Phases

### Phase 1: Foundation & Core Database Operations
**Priority: HIGH | Duration: 2-3 weeks**

#### Backend Setup
```javascript
// Enhanced server.js structure
const express = require('express');
const cors = require('cors');
const app = express();

// Database connection (recommend MongoDB or DynamoDB)
const courseRoutes = require('./api/routes/course.routes');
const studentRoutes = require('./api/routes/student.routes');
const rulesRoutes = require('./api/routes/rules.routes');

app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rules', rulesRoutes);
```

#### Database Models
```javascript
// models/Course.js
const courseSchema = {
  subject: String,        // "MATH"
  courseNumber: String,   // "2703"
  name: String,          // "Trig 1"
  credits: Number,
  schedule: {
    days: String,        // "TR"
    startTime: String,   // "12:30"
    endTime: String,     // "13:45"
    professor: String
  },
  prerequisites: [{
    subject: String,
    courseNumber: String
  }],
  semester: String,      // "Fall", "Spring", "Summer"
  year: Number
};

// models/Student.js
const studentSchema = {
  studentId: String,
  majors: [String],
  minors: [String],
  completedCourses: [{
    subject: String,
    courseNumber: String,
    grade: Number,
    semester: String,
    year: Number
  }],
  overrides: [{
    substituteCourse: {
      subject: String,
      courseNumber: String
    },
    replacedCourses: [{
      subject: String,
      courseNumber: String
    }]
  }],
  graduationPlan: [{
    semester: String,
    year: Number,
    courses: [String]
  }]
};
```

### Phase 2: Rules Engine (Admin Module)
**Priority: HIGH | Duration: 2-3 weeks**

#### Core Features
```javascript
// models/DegreeRequirements.js
const degreeRequirementsSchema = {
  majorCode: String,     // "CIS", "MATH"
  totalCredits: Number,  // 120
  requirements: {
    core: [{
      subject: String,
      courseNumber: String,
      credits: Number
    }],
    electives: {
      minCredits: Number,
      allowedSubjects: [String],
      restrictions: [String]
    },
    prerequisites: {
      math: { minLevel: String },
      english: { minLevel: String }
    }
  },
  lastUpdated: Date,
  updatedBy: String
};
```

#### Admin Interface Components
```jsx
// components/admin/RequirementsEditor.js
const RequirementsEditor = ({ majorCode }) => {
  const [requirements, setRequirements] = useState(null);
  
  const addCoreRequirement = () => {
    // Add required course logic
  };
  
  const addOverride = (studentId, override) => {
    // Manual override logic for individual students
  };
  
  return (
    <div className="requirements-editor">
      <h2>Edit Requirements for {majorCode}</h2>
      {/* Core requirements section */}
      {/* Electives section */}
      {/* Override management */}
    </div>
  );
};
```

### Phase 3: Student Database & Course Catalog
**Priority: HIGH | Duration: 2 weeks**

#### API Endpoints
```javascript
// api/controllers/student.controller.js
exports.getStudentProgress = async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    const requirements = await DegreeRequirements.find({
      majorCode: { $in: student.majors }
    });
    
    const progress = calculateProgress(student, requirements);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCompletedCourses = async (req, res) => {
  // Update student's completed courses
};
```

### Phase 4: Degree Planner Module
**Priority: MEDIUM | Duration: 3-4 weeks**

#### Path Generation Algorithm
```javascript
// services/pathGenerationService.js
class PathGenerator {
  constructor(student, requirements) {
    this.student = student;
    this.requirements = requirements;
  }
  
  generateOptimalPaths() {
    const remainingCourses = this.calculateRemainingCourses();
    const availableSemesters = this.getAvailableSemesters();
    
    // Algorithm to generate multiple graduation paths
    return this.createPaths(remainingCourses, availableSemesters);
  }
  
  validatePrerequisites(course, plannedCourses) {
    // Check if prerequisites are satisfied
  }
  
  calculateEarliestGraduation() {
    // Find shortest path to graduation
  }
}
```

#### Planner Interface
```jsx
// pages/PlannerPage.js
const PlannerPage = () => {
  const [studentData, setStudentData] = useState(null);
  const [graduationPaths, setGraduationPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  
  useEffect(() => {
    loadStudentProgress();
    generatePaths();
  }, []);
  
  return (
    <div className="planner-container">
      <ProgressSummary progress={studentData?.progress} />
      <PathSelector paths={graduationPaths} onSelect={setSelectedPath} />
      <SemesterPlan path={selectedPath} />
    </div>
  );
};
```

### Phase 5: Schedule Builder Module
**Priority: MEDIUM | Duration: 2-3 weeks**

#### Schedule Conflict Detection
```javascript
// services/scheduleService.js
class ScheduleBuilder {
  constructor(semester, year) {
    this.semester = semester;
    this.year = year;
    this.schedule = [];
  }
  
  addCourse(course) {
    if (this.hasTimeConflict(course)) {
      throw new Error('Time conflict detected');
    }
    
    if (!this.prerequisitesMet(course)) {
      throw new Error('Prerequisites not satisfied');
    }
    
    this.schedule.push(course);
  }
  
  hasTimeConflict(newCourse) {
    return this.schedule.some(existingCourse => 
      this.timesOverlap(existingCourse.schedule, newCourse.schedule)
    );
  }
  
  exportToCSV() {
    // Generate CSV for course registration
  }
}
```

## 🛠️ Technical Implementation Recommendations

### Database Choice
```javascript
// For NoSQL (MongoDB) - Recommended
const mongoose = require('mongoose');

// For SQL alternative
const { Sequelize, DataTypes } = require('sequelize');
```

### State Management
```javascript
// Redux store structure
const store = {
  student: {
    profile: {},
    progress: {},
    schedule: []
  },
  courses: {
    catalog: [],
    filtered: []
  },
  admin: {
    requirements: {},
    overrides: []
  }
};
```

### Key Components Architecture
```
src/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── CourseCard.js
│   │   └── LoadingSpinner.js
│   ├── admin/
│   │   ├── RequirementsEditor.js
│   │   └── OverrideManager.js
│   ├── planner/
│   │   ├── ProgressTracker.js
│   │   ├── PathGenerator.js
│   │   └── SemesterView.js
│   └── schedule/
│       ├── ScheduleGrid.js
│       ├── CourseSelector.js
│       └── ConflictDetector.js
```

## 🚀 MVP Feature Checklist

### Phase 1 MVP
- [ ] Basic course database CRUD operations
- [ ] Student profile management
- [ ] Simple progress tracking

### Phase 2 MVP
- [ ] Degree requirements management
- [ ] Basic admin interface
- [ ] Manual override system

### Phase 3 MVP
- [ ] Graduation path generation
- [ ] Visual progress indicators
- [ ] Course prerequisite validation

### Phase 4 MVP
- [ ] Schedule builder with conflict detection
- [ ] CSV import/export functionality
- [ ] Integration between all modules

## 📊 Next Steps

1. **Set up development environment** with the provided file structure
2. **Choose your database** (MongoDB recommended for your JSON structure)
3. **Implement Phase 1** core database operations
4. **Create basic UI components** using your style guide
5. **Build and test each module incrementally**

Would you like me to elaborate on any specific phase or provide more detailed code examples for particular components?
