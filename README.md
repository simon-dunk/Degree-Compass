# Degree-Compass
A smart academic planner that helps students visualize their weekly schedule and generate potential pathways to graduation.


Of course. Here is all the information from our previous conversations combined into a single, organized markdown file with a table of contents, database schemas, and JSON examples.

-----

# Academic Planning Suite Documentation

This document provides a comprehensive overview of the database design and core features for the Academic Planning Suite project.

## Table of Contents

1.  [Project Overview](#project-overview)
      * [Project Goal](#project-goal)
      * [Core Application Modules](#core-application-modules)
2.  [Database Design](#database-design)
      * [Course Database](#course-database)
          * [Table Structure](#table-structure)
          * [Entry Example](#entry-example)
      * [Student Database](#student-database)
          * [Table Structure](#table-structure-1)
          * [Entry Example](#entry-example-1)

-----

## Project Overview

This section describes the high-level goals and features of the application.

### Project Goal

The primary objective is to create a robust system that tracks individual student data—including classes taken, degree overrides, and majors—to facilitate academic planning.

### Core Application Modules

The application is comprised of three main components that interact with the central databases:

  * **Rules Engine (Admin Page):** An administrative interface for setting and updating the graduation requirements that form the logic of a degree plan. Admins can also use this module to grant manual overrides to individual students for specific requirements.

  * **Degree Planner Page:** A student-facing tool where users can view their academic progress against their declared major's requirements. The planner identifies missing courses and generates potential "paths" or semester plans to help students complete their degree on time.

  * **Schedule Builder Page:** A tool that allows students to create a course schedule for an upcoming semester. Students can either manually select courses from the `Course Database` or import a `.csv` file, potentially one exported from the Degree Planner.

-----

## Database Design

The application relies on two primary NoSQL-style databases: one for all available courses and one for individual student records.

### Course Database

This database acts as a master catalog of all courses offered by the institution.

#### Table Structure

The design uses a composite key to uniquely identify each course.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **Primary Key** | String | The subject or department of the course (e.g., `MATH`, `CIS`). |
| **Partition Key** | Number / String | The unique course number within that subject (e.g., `2703`). |
| **Data** | Object / JSON | A flexible object containing all other course details. |

#### Entry Example

Below is an example of a single entry for a math course.

  * **Primary Key**: `MATH`
  * **Partition Key**: `2703`
  * **Data**:
    ```json
    {
      "Name": "Trig 1",
      "Time": {
        "Start": "12:30",
        "End": "13:45"
      },
      "PreReqs": [
        {
          "Subject": "MATH",
          "Course": 1003
        }
      ],
      "Days": "TR",
      "Prof": "Dr. Tucker"
    }
    ```

### Student Database

This database stores all academic and degree-related information for each individual student.

#### Table Structure

This table uses a simple key-value model where the student's ID is the key.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **Key** | Number / String | The unique student ID (e.g., `1234`). |
| **Data** | Object / JSON | An object containing the student's complete academic record. |

#### Entry Example

Below is an example of a single student record.

  * **Key**: `1234`
  * **Data**:
    ```json
    {
      "Major": [
        "CIS"
      ],
      "Minor": [],
      "Taken": [
        {
          "Subject": "CIS",
          "Course": 2703,
          "Grade": 3.5
        }
      ],
      "Overrides": [
        {
          "SubThis": {
            "Subject": "CIS",
            "Course": 2723
          },
          "SubFor": [
            {
              "Subject": "CIS",
              "Course": 2143
            },
            {
              "Subject": "CIS",
              "Course": 3023
            }
          ]
        }
      ]
    }
    ```