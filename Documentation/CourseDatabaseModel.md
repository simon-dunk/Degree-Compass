### Course Database Table
```javascript
// Table Name: CourseDatabase
// Primary Key: Subject (Partition Key) + CourseNumber (Sort Key)
const courseTableSchema = {
  TableName: 'CourseDatabase',
  KeySchema: [
    { AttributeName: 'Subject', KeyType: 'HASH' },      // Partition Key
    { AttributeName: 'CourseNumber', KeyType: 'RANGE' }  // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'Subject', AttributeType: 'S' },
    { AttributeName: 'CourseNumber', AttributeType: 'S' },
    { AttributeName: 'Semester', AttributeType: 'S' },
    { AttributeName: 'Professor', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'SemesterIndex',
      KeySchema: [
        { AttributeName: 'Semester', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'ProfessorIndex',
      KeySchema: [
        { AttributeName: 'Professor', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ]
};

// Example Item
const courseItem = {
  Subject: 'MATH',
  CourseNumber: '2703',
  Name: 'Trig 1',
  Credits: 3,
  Schedule: {
    Days: 'TR',
    StartTime: '12:30',
    EndTime: '13:45'
  },
  Prerequisites: [
    { Subject: 'MATH', CourseNumber: '1003' }
  ],
  Professor: 'Dr. Tucker',
  Semester: 'Fall',
  Year: 2024,
  MaxEnrollment: 30,
  CurrentEnrollment: 25
};
```

