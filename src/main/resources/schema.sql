-- =====================================================================
-- ONLINE LEARNING MANAGEMENT SYSTEM (LMS)
-- Database: lms_db (MySQL 8.x Normalized Relational Schema with Documented Denormalizations)
-- 3rd-Semester CSE Java Web-Based Project (Evaluation: 33 Marks)
-- Storage Engine: InnoDB (Strict ACID Transactions, Row-Level Locking, Foreign Keys)
-- COMPATIBILITY NOTE: CHECK constraints are parsed but only actively enforced in MySQL 8.0.16+.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    bio TEXT,
    avatar_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- LOW-SELECTIVITY INDEX DEFENSE: Although only 3 roles exist, user distribution is heavily skewed
    -- (~95% STUDENT, 4% INSTRUCTOR, 1% ADMIN). MySQL optimizer uses this B-tree index efficiently
    -- for filtering ADMIN and INSTRUCTOR queries where selectivity is ~1-4%.
    INDEX idx_users_role (role),
    -- NOTE: idx_users_email is omitted because 'email UNIQUE' already creates a primary B-Tree index on email.
    CONSTRAINT chk_user_role CHECK (role IN ('STUDENT', 'INSTRUCTOR', 'ADMIN')),
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
) ENGINE=InnoDB;

-- 2. COURSES TABLE
-- ARCHITECTURAL NOTE: 'enrolled_count' is a deliberate counter-cache denormalization.
-- 1. PURPOSE: Provides an O(1) atomic capacity check without expensive COUNT(*) table scans:
--    UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ? AND enrolled_count < capacity
-- 2. CONCURRENCY: Deadlock elimination is achieved by LOCK ACQUISITION ORDER: taking the exclusive (X) lock
--    on courses FIRST before inserting into enrollments prevents InnoDB foreign-key lock upgrade cycles.
-- 3. TRADE-OFF: Concurrent enrollments for the SAME course serialize on that single row (fully acceptable at collegiate scale).
-- 4. RECONCILIATION: A drift-detection reconcile query is provided at the bottom of this schema.
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    instructor_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    level VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    thumbnail_url VARCHAR(255),
    capacity INT NOT NULL DEFAULT 50,
    enrolled_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_courses_instructor (instructor_id),
    -- NOTE: idx_courses_status was dropped to avoid low-selectivity B-tree maintenance, as 'PUBLISHED'
    -- represents the overwhelming majority of catalog queries and the query optimizer favours table/covering scans.
    CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_course_capacity CHECK (capacity > 0),
    CONSTRAINT chk_course_enrolled CHECK (enrolled_count >= 0 AND enrolled_count <= capacity),
    CONSTRAINT chk_course_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_course_level CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
) ENGINE=InnoDB;

-- 3. MODULES TABLE (Composition: Course -> Modules)
CREATE TABLE IF NOT EXISTS modules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- idx_modules_course omitted: uk_course_module_order has course_id as leftmost prefix
    UNIQUE KEY uk_course_module_order (course_id, order_index),
    CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. LESSONS TABLE (Composition: Module -> Lessons)
CREATE TABLE IF NOT EXISTS lessons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    content_body LONGTEXT NOT NULL,
    duration_minutes INT DEFAULT 15,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- idx_lessons_module omitted: uk_module_lesson_order has module_id as leftmost prefix
    UNIQUE KEY uk_module_lesson_order (module_id, order_index),
    CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT chk_lesson_duration CHECK (duration_minutes >= 0)
) ENGINE=InnoDB;

-- 5. ENROLLMENTS TABLE (Compound Unique Key user_id + course_id)
-- SEAT DEFINITION: Only ACTIVE and COMPLETED enrollments hold seats. DROPPED status frees the seat.
-- REACTIVATION: Re-enrolling a DROPPED student updates the existing row to ACTIVE rather than inserting a duplicate.
-- ARCHITECTURAL NOTE: 'progress_percent' is a deliberate counter-cache denormalization:
-- 1. PURPOSE: Avoids multi-table joins (courses->modules->lessons->lesson_progress) on every dashboard page load,
--    enabling O(1) query time for student enrolled lists and progress bars.
-- 2. RECOMPUTATION: Recomputed atomically within the transaction completing a lesson in LessonProgressService.
-- 3. SYNC: Stale progress caused by instructors adding/deleting lessons is reconciled via the query below.
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percent INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- uk_user_course indexes user_id as leftmost prefix, so idx_enrollment_user is redundant
    UNIQUE KEY uk_user_course (user_id, course_id),
    -- COMPOSITE INDEX: (course_id, status) makes seat counting and counter-drift verification index-only (covering index)
    INDEX idx_enrollment_course_status (course_id, status),
    CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT chk_enrollment_progress CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_enrollment_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'DROPPED'))
) ENGINE=InnoDB;

-- 6. LESSON PROGRESS TABLE (Tracking individual student lesson completions)
CREATE TABLE IF NOT EXISTS lesson_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_lesson (user_id, lesson_id),
    CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    instructions TEXT NOT NULL,
    max_points INT NOT NULL DEFAULT 100,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_assignments_course (course_id),
    CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT chk_assignment_points CHECK (max_points > 0)
) ENGINE=InnoDB;

-- 8. SUBMISSIONS TABLE (Assignment submissions with single attempt constraint & status check)
CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    submission_text LONGTEXT NOT NULL,
    file_url VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade DECIMAL(5, 2) DEFAULT NULL,
    feedback TEXT DEFAULT NULL,
    graded_by BIGINT DEFAULT NULL,
    graded_at TIMESTAMP DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    -- uk_assignment_student indexes assignment_id as leftmost prefix, so idx_submissions_assignment is redundant
    UNIQUE KEY uk_assignment_student (assignment_id, student_id),
    INDEX idx_submissions_student (student_id),
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_grader FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_submission_status CHECK (status IN ('SUBMITTED', 'GRADED', 'LATE', 'RESUBMITTED'))
) ENGINE=InnoDB;

-- 9. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    time_limit_minutes INT DEFAULT 30,
    passing_score INT DEFAULT 60,
    max_attempts INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quizzes_course (course_id),
    CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT chk_quiz_time CHECK (time_limit_minutes > 0),
    CONSTRAINT chk_quiz_passing CHECK (passing_score >= 0 AND passing_score <= 100),
    CONSTRAINT chk_quiz_max_attempts CHECK (max_attempts > 0)
) ENGINE=InnoDB;

-- 10. QUIZ QUESTIONS TABLE (Fixed 4-option MCQ schema)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    points INT DEFAULT 10,
    order_index INT DEFAULT 1,
    -- idx_questions_quiz omitted: uk_quiz_question_order indexes quiz_id as leftmost prefix
    UNIQUE KEY uk_quiz_question_order (quiz_id, order_index),
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT chk_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT chk_question_points CHECK (points > 0)
) ENGINE=InnoDB;

-- 11. QUIZ ATTEMPTS TABLE (Stores student quiz attempts with attempt number & immutable evaluation snapshot)
-- Snapshots percentage and passed status at time of attempt so future syllabus adjustments do not invalidate history.
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    score INT NOT NULL,
    total_possible INT NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    passed BOOLEAN NOT NULL,
    answers_json TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- idx_attempts_quiz omitted: uk_quiz_student_attempt indexes quiz_id as leftmost prefix
    INDEX idx_attempts_student (student_id),
    UNIQUE KEY uk_quiz_student_attempt (quiz_id, student_id, attempt_number),
    CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_attempt_number CHECK (attempt_number >= 1)
) ENGINE=InnoDB;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notification_type CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'GRADE', 'ENROLLMENT'))
) ENGINE=InnoDB;

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT DEFAULT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    -- LOW-SELECTIVITY INDEX DEFENSE: Audit logs scale to hundreds of thousands of rows. Security compliance
    -- investigations query specifically for low-frequency critical operations (e.g., 'USER_ROLE_CHANGED',
    -- 'COURSE_DELETED'), making this B-tree index selective and performant.
    INDEX idx_audit_action (action),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- =====================================================================
-- RECONCILIATION & INTEGRITY VERIFICATION QUERIES (For Live Viva Defense)
-- =====================================================================

-- 1. Counter-Cache Drift Audit (Must return 0 rows under normal operation):
-- Detects if enrolled_count drifted due to raw manual edits or ON DELETE CASCADE.
-- Satisfied index-only via composite index idx_enrollment_course_status:
-- SELECT c.id, c.code, c.enrolled_count AS cached_count,
--        COUNT(e.id) AS actual_active_count
-- FROM courses c
-- LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('ACTIVE', 'COMPLETED')
-- GROUP BY c.id, c.code, c.enrolled_count
-- HAVING c.enrolled_count <> actual_active_count;

-- 2. Self-Healing Reconcile Statement (Targeted WHERE clause prevents full-table rewrites):
-- Run during maintenance windows; only touches drifted courses:
-- UPDATE courses c SET enrolled_count = (
--     SELECT COUNT(*) FROM enrollments e
--     WHERE e.course_id = c.id AND e.status IN ('ACTIVE', 'COMPLETED')
-- )
-- WHERE c.enrolled_count <> (
--     SELECT COUNT(*) FROM enrollments e
--     WHERE e.course_id = c.id AND e.status IN ('ACTIVE', 'COMPLETED')
-- );

-- 3. Progress Percent Drift Audit (Detects stale student progress when instructors add/remove lessons):
-- SELECT e.id, e.user_id, e.course_id, e.progress_percent AS cached_progress,
--        ROUND(COALESCE(
--            (SELECT COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = e.course_id), 0)
--             FROM lesson_progress lp
--             JOIN lessons l ON lp.lesson_id = l.id
--             JOIN modules m ON l.module_id = m.id
--             WHERE m.course_id = e.course_id AND lp.user_id = e.user_id AND lp.completed = TRUE),
--        0.00)) AS actual_progress
-- FROM enrollments e
-- WHERE e.status <> 'DROPPED'
-- HAVING cached_progress <> actual_progress;
