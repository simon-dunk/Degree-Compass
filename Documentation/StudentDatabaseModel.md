### Student Database Table
```javascript
// Table Name: StudentDatabase
// Primary Key: StudentId (Partition Key only)
const studentTableSchema = {
  TableName: 'StudentDatabase',
  KeySchema: [
    { AttributeName: 'StudentId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'StudentId', AttributeType: 'S' },
    { AttributeName: 'Major', AttributeType: 'S' },
    { AttributeName: 'GraduationYear', AttributeType: 'N' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'MajorIndex',
      KeySchema: [
        { AttributeName: 'Major', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'GraduationYearIndex',
      KeySchema: [
        { AttributeName: 'GraduationYear', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ]
};

// Example Item
const studentItem = {
  StudentId: '1234',
  FirstName: 'John',
  LastName: 'Doe',
  Email: 'john.doe@university.edu',
  Major: ['CIS'],
  Minor: [],
  GraduationYear: 2025,
  CompletedCourses: [
    {
      Subject: 'CIS',
      CourseNumber: '2703',
      Grade: 3.5,
      Semester: 'Fall',
      Year: 2023
    }
  ],
  Overrides: [
    {
      SubThis: { Subject: 'CIS', CourseNumber: '2723' },
      SubFor: [
        { Subject: 'CIS', CourseNumber: '2143' },
        { Subject: 'CIS', CourseNumber: '3023' }
      ],
      ApprovedBy: 'admin123',
      ApprovedDate: '2024-01-15'
    }
  ],
  CurrentSchedule: [
    { Subject: 'MATH', CourseNumber: '2703' }
  ],
  GraduationPlan: {
    'Fall2024': [
      { Subject: 'CIS', CourseNumber: '3023' }
    ],
    'Spring2025': [
      { Subject: 'CIS', CourseNumber: '4023' }
    ]
  }
};
```
