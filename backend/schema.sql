-- Student Attendance Management System
-- Database Schema

CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Staff / Teachers table
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    staff_id INT,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    class VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES staff(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance_entry (student_id, subject_id, attendance_date)
);

-- ---------------------------------------------------
-- Sample seed data (optional — remove if not needed)
-- Password for staff below is: staff123  (hashed with bcrypt at app level on registration;
-- these inserts use a pre-hashed bcrypt value for "staff123")
-- ---------------------------------------------------

INSERT INTO staff (name, email, password) VALUES
('Mr. Anand Kumar', 'anand.staff@college.edu', '$2b$10$UD8pV6z1kk1Fz9m3d1sM3.WZ0lU9d6C0F9m1e1H2M6QG9c1F4tYQq');
-- NOTE: Use the /api/auth/staff/register endpoint to create real staff accounts with
-- correctly hashed passwords — the value above is illustrative only.

INSERT INTO subjects (subject_name, subject_code, staff_id) VALUES
('Data Structures', 'CS201', 1),
('Database Management Systems', 'CS301', 1),
('Web Technology', 'CS302', 1);

-- Use the /api/auth/student/register endpoint to create real student accounts too.
