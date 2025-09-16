### Degree Requirements Table (Subject to Change)
```javascript
// Table Name: DegreeRequirements
// Primary Key: MajorCode (Partition Key) + RequirementType (Sort Key)
const degreeRequirementsSchema = {
  TableName: 'DegreeRequirements',
  KeySchema: [
    { AttributeName: 'MajorCode', KeyType: 'HASH' },
    { AttributeName: 'RequirementType', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'MajorCode', AttributeType: 'S' },
    { AttributeName: 'RequirementType', AttributeType: 'S' }
  ]
};

// Example Items
const degreeRequirementItems = [
  {
    MajorCode: 'CIS',
    RequirementType: 'CORE',
    Courses: [
      { Subject: 'CIS', CourseNumber: '1103', Credits: 3 },
      { Subject: 'CIS', CourseNumber: '2143', Credits: 3 },
      { Subject: 'CIS', CourseNumber: '2703', Credits: 3 }
    ],
    TotalCreditsRequired: 42
  },
  {
    MajorCode: 'CIS',
    RequirementType: 'ELECTIVES',
    MinCredits: 18,
    AllowedSubjects: ['CIS', 'MATH', 'STAT'],
    Restrictions: ['Must be 3000+ level']
  },
  {
    MajorCode: 'CIS',
    RequirementType: 'GENERAL_ED',
    Categories: {
      'Math': { MinCredits: 6, Courses: ['MATH-1003', 'MATH-2703'] },
      'English': { MinCredits: 6, Courses: ['ENGL-1113', 'ENGL-1213'] }
    }
  }
];
```

## 🚀 DynamoDB Service Implementation

### Database Config
