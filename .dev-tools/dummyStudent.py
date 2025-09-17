import json
import random
from faker import Faker
import datetime

# Initialize Faker to generate mock data
fake = Faker()

# --- Configuration ---
NUM_STUDENTS = 1  # Number of student records to generate
OUTPUT_FILE = 'dynamodb_students.json'

# --- Data Pools for Realistic Generation ---
MAJORS_AND_SUBJECTS = ['CIS', 'MATH', 'ENGL', 'HIST', 'BIOL', 'CHEM', 'ART', 'PSYC']
SEMESTERS = ['Fall', 'Spring', 'Summer']

# --- Helper Functions ---

def python_to_dynamodb_json(data):
    """
    Recursively converts a Python dictionary or list to DynamoDB JSON format.
    """
    if isinstance(data, dict):
        return {'M': {k: python_to_dynamodb_json(v) for k, v in data.items()}}
    elif isinstance(data, list):
        return {'L': [python_to_dynamodb_json(i) for i in data]}
    elif isinstance(data, str):
        return {'S': data} if data else {'NULL': True}
    elif isinstance(data, (int, float)):
        return {'N': str(data)}
    elif isinstance(data, bool):
        return {'BOOL': data}
    elif data is None:
        return {'NULL': True}
    else:
        return {'S': str(data)}

def create_random_course(subject_pool):
    """Generates a single random course dictionary."""
    return {
        'Subject': random.choice(subject_pool),
        # MODIFIED: CourseNumber is now a number (integer)
        'CourseNumber': random.randint(1000, 4999)
    }

# --- Main Data Generation Function ---

def generate_student_data(student_id):
    """
    Generates a single student record with realistic, randomized data.
    """
    first_name = fake.first_name()
    last_name = fake.last_name()
    grad_year = random.randint(2024, 2028)
    
    completed_courses = []
    for _ in range(random.randint(5, 20)):
        course_year = random.randint(grad_year - 4, grad_year - 1)
        completed_courses.append({
            **create_random_course(MAJORS_AND_SUBJECTS),
            'Grade': round(random.uniform(2.0, 4.0), 2),
            'Semester': random.choice(SEMESTERS),
            'Year': course_year
        })

    grad_plan = {}
    for i in range(random.randint(1, 4)):
        semester_year = grad_year - (i // 2)
        semester_name = f"{SEMESTERS[i % 2]}{semester_year}"
        grad_plan[semester_name] = [
            create_random_course(MAJORS_AND_SUBJECTS) for _ in range(random.randint(2, 5))
        ]

    student = {
        # MODIFIED: StudentId is now a number (integer)
        'StudentId': student_id,
        'FirstName': first_name,
        'LastName': last_name,
        'Email': f"{first_name.lower()}.{last_name.lower()}{random.randint(1,99)}@university.edu",
        'Major': random.sample(MAJORS_AND_SUBJECTS, k=random.randint(1, 2)),
        'Minor': random.sample(MAJORS_AND_SUBJECTS, k=random.randint(0, 1)) if random.choice([True, False]) else [],
        'GraduationYear': grad_year,
        'CompletedCourses': completed_courses,
        'Overrides': [],
        'CurrentSchedule': [create_random_course(MAJORS_AND_SUBJECTS) for _ in range(random.randint(3, 6))],
        'GraduationPlan': grad_plan
    }
    
    if random.random() < 0.2:
        student['Overrides'].append({
            'SubThis': create_random_course(MAJORS_AND_SUBJECTS),
            'SubFor': [create_random_course(MAJORS_AND_SUBJECTS) for _ in range(random.randint(1,2))],
            'ApprovedBy': fake.user_name(),
            'ApprovedDate': fake.date_this_year().isoformat()
        })
        
    return student

# --- Script Execution ---

if __name__ == "__main__":
    all_students_dynamodb = []
    print(f"Generating {NUM_STUDENTS} student records...")

    # Start student IDs from a base number
    for i in range(1000, 1000 + NUM_STUDENTS):
        py_student_record = generate_student_data(i)
        dynamodb_student_item = python_to_dynamodb_json(py_student_record)['M']
        all_students_dynamodb.append(dynamodb_student_item)

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_students_dynamodb, f, indent=2)

    print(f"Successfully generated data for {NUM_STUDENTS} students.")
    print(f"Output saved to '{OUTPUT_FILE}'")