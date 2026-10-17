-- =====================================================================
-- ONLINE LEARNING MANAGEMENT SYSTEM (LMS)
-- Seed Data: Sample Courses, Users, Modules, Lessons, Quizzes, Assignments
-- Default password for all seed users: "password123"
-- =====================================================================

-- 1. SEED USERS (Admin, Instructors, Students)
INSERT INTO users (id, name, email, password_hash, role, bio, status) VALUES
(1, 'Virat Kohli', 'admin@lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'ADMIN', 'System Administrator and Academic Governance Lead.', 'ACTIVE'),
(2, 'Prof. Aditya Awasthi', 'aditya@lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'INSTRUCTOR', 'Professor of Object-Oriented Software Engineering and Java Systems.', 'ACTIVE'),
(3, 'Dr. Rajesh Sharma', 'rajesh@lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'INSTRUCTOR', 'Associate Professor specializing in Relational Databases and SQL.', 'ACTIVE'),
(4, 'Abhinav Singh', 'abhinav@student.lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'STUDENT', '3rd-Semester CSE Student enthusiastic about backend engineering.', 'ACTIVE'),
(5, 'Akash Yadav', 'akash@student.lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'STUDENT', 'Undergraduate student interested in OS, concurrency, and architecture.', 'ACTIVE'),
(6, 'Priya Patel', 'priya@student.lms.edu', '$2a$10$e8m4aF4ZtS0F4mF8Z0xKCe3ZkUfX7rM94zUeN9l6XjYV123abc456', 'STUDENT', 'Student passionate about computational algorithms and data pipelines.', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. SEED COURSES
INSERT INTO courses (id, title, code, description, category, instructor_id, status, level, capacity, enrolled_count) VALUES
(1, 'Object-Oriented Programming with Java', 'CS-201', 'In-depth study of Core Java, OOP principles, Collections, Generics, and Robust Exception Handling.', 'Computer Science', 2, 'PUBLISHED', 'INTERMEDIATE', 60, 2),
(2, 'Relational Database Design & JDBC Integration', 'CS-204', 'Relational theory, 3NF normalization, JDBC connection management, PreparedStatements, and HikariCP pooling.', 'Database Systems', 3, 'PUBLISHED', 'INTERMEDIATE', 50, 2),
(3, 'Enterprise Web Architecture with Jakarta Servlets', 'CS-301', 'Building high-performance HTTP web backends using Jakarta Servlets, Filters, Sessions, and REST APIs.', 'Web Engineering', 2, 'PUBLISHED', 'ADVANCED', 45, 1)
ON DUPLICATE KEY UPDATE enrolled_count=VALUES(enrolled_count);

-- 3. SEED MODULES
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
(1, 1, 'Module 1: Foundations of OOP in Java', 'Encapsulation, Class design, access specifiers, and immutability.', 1),
(2, 1, 'Module 2: Inheritance & Runtime Polymorphism', 'Abstract classes, method overriding, dynamic method dispatch, and interface contracts.', 2),
(3, 1, 'Module 3: Generics and Java Collections Framework', 'Type safety, List, Set, Map hierarchies, and stream pipelines.', 3),
(4, 2, 'Module 1: Relational Modeling & Normalization', 'Entity-relationship modeling, functional dependencies, 1NF to 3NF.', 1),
(5, 2, 'Module 2: JDBC API & Connection Pooling', 'DriverManager, DataSource, PreparedStatement, ResultSet, and HikariCP.', 2),
(6, 3, 'Module 1: Jakarta Servlet Lifecycle & HTTP', 'Request/Response cycle, doGet/doPost, URL mapping, and status codes.', 1),
(7, 3, 'Module 2: Filters, Sessions & Security', 'Web filters, server-side session management, authentication guards.', 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 4. SEED LESSONS
INSERT INTO lessons (id, module_id, title, content_type, content_body, duration_minutes, order_index) VALUES
(1, 1, '1.1 Encapsulation and Domain Integrity', 'TEXT', 'Encapsulation is the bundling of data with the methods that operate on that data. In Java, we declare fields as private and provide public getters and setters with business validation.', 20, 1),
(2, 1, '1.2 Constructors and Object Lifecycle', 'TEXT', 'Detailed examination of parameterized constructors, constructor chaining with this(), and garbage collection mechanics.', 25, 2),
(3, 2, '2.1 Abstract Classes vs Interfaces', 'TEXT', 'Abstract classes define an is-a relationship with shared state and method implementations, whereas interfaces represent pure behavioral contracts.', 30, 1),
(4, 2, '2.2 Dynamic Method Dispatch & Polymorphism', 'TEXT', 'How the JVM resolves overridden method calls at runtime using the method table (vtable).', 25, 2),
(5, 4, '1.1 Relational Integrity and Normal Forms', 'TEXT', 'First, Second, and Third Normal Forms (3NF) eliminate insertion, update, and deletion anomalies through relation decomposition.', 30, 1),
(6, 5, '2.1 PreparedStatements and SQL Injection Defense', 'TEXT', 'Why Statement concatenations are dangerous, how the database pre-compiles query execution plans, and how parameters are sanitized.', 25, 1),
(7, 6, '1.1 Servlet Container Architecture', 'TEXT', 'How Apache Tomcat accepts TCP connections, wraps them in HttpServletRequest/HttpServletResponse objects, and delegates to service().', 35, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 5. SEED ENROLLMENTS
INSERT INTO enrollments (id, user_id, course_id, progress_percent, status) VALUES
(1, 4, 1, 65, 'ACTIVE'),
(2, 4, 2, 40, 'ACTIVE'),
(3, 5, 1, 85, 'ACTIVE'),
(4, 5, 3, 20, 'ACTIVE'),
(5, 6, 2, 90, 'ACTIVE')
ON DUPLICATE KEY UPDATE progress_percent=VALUES(progress_percent);

-- 6. SEED ASSIGNMENTS
INSERT INTO assignments (id, course_id, title, instructions, max_points, due_date) VALUES
(1, 1, 'Lab 1: Polymorphic Shape Hierarchy', 'Implement an abstract Shape base class with Circle, Rectangle, and Triangle subclasses. Calculate area and perimeter polymorphically.', 100, '2026-12-31 23:59:59'),
(2, 2, 'Lab 2: HikariCP Connection Pool Benchmarking', 'Write a Java application that compares raw DriverManager connections against HikariCP connection pooling over 1,000 queries.', 100, '2026-12-31 23:59:59'),
(3, 3, 'Lab 3: RESTful Jakarta Servlet Controller', 'Build a Jakarta Servlet endpoint handling GET, POST, PUT, and DELETE for course management with Jackson JSON responses.', 100, '2026-12-31 23:59:59')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 7. SEED SUBMISSIONS
INSERT INTO submissions (id, assignment_id, student_id, submission_text, grade, feedback, graded_by, graded_at, status) VALUES
(1, 1, 4, 'public class Circle extends Shape { @Override public double area() { return Math.PI * radius * radius; } }', 95.0, 'Excellent clean implementation and proper use of @Override annotation.', 2, CURRENT_TIMESTAMP, 'GRADED'),
(2, 1, 5, 'Polymorphic hierarchy implemented using interface Shape with default methods for rendering.', 88.0, 'Good solution, remember to add parameter bounds validation.', 2, CURRENT_TIMESTAMP, 'GRADED')
ON DUPLICATE KEY UPDATE grade=VALUES(grade);

-- 8. SEED QUIZZES
INSERT INTO quizzes (id, course_id, title, description, time_limit_minutes, passing_score) VALUES
(1, 1, 'Core Java OOP Concepts Quiz', 'Test your knowledge on Encapsulation, Inheritance, Polymorphism, and Abstraction.', 20, 60),
(2, 2, 'JDBC & Database Architecture Quiz', 'Evaluation of PreparedStatements, connection pooling, transactions, and SQL.', 25, 60)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 9. SEED QUIZ QUESTIONS
INSERT INTO quiz_questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points, order_index) VALUES
(1, 1, 'Which Java keyword prevents a class from being subclassed and a method from being overridden?', 'static', 'final', 'abstract', 'synchronized', 'B', 10, 1),
(2, 1, 'What is the primary benefit of runtime polymorphism in object-oriented design?', 'Code duplication', 'Compile-time memory allocation', 'Decoupling client code from specific concrete subclasses', 'Disabling dynamic dispatch', 'C', 10, 2),
(3, 1, 'Which collection interface should you use to guarantee uniquely stored elements?', 'List', 'Map', 'Set', 'Queue', 'C', 10, 3),
(4, 2, 'Why are PreparedStatements immune to SQL Injection when properly used?', 'They automatically encrypt the SQL string', 'Parameters are transmitted separately from the pre-compiled query template', 'They run in isolation from the database catalog', 'They only allow SELECT queries', 'B', 10, 1),
(5, 2, 'What method must be called on a JDBC Connection to begin an explicit database transaction?', 'conn.beginTransaction()', 'conn.commit()', 'conn.setAutoCommit(false)', 'conn.setTransactionIsolation(0)', 'C', 10, 2)
ON DUPLICATE KEY UPDATE question_text=VALUES(question_text);

-- 10. SYSTEM SETTINGS
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('APP_NAME', 'Online Learning Management System', 'Application display name'),
('ACADEMIC_YEAR', '2026-2027', 'Active academic year'),
('MAX_COURSE_CAPACITY', '100', 'Default maximum enrollment per course'),
('ENABLE_PUBLIC_REGISTRATION', 'true', 'Permit self-service student sign up')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 11. INITIAL AUDIT LOGS
INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details, ip_address) VALUES
(1, 'SYSTEM_STARTUP', 'APPLICATION', NULL, 'LMS Application initialized successfully.', '127.0.0.1'),
(1, 'SEED_DATA_LOADED', 'DATABASE', NULL, 'Default courses, instructors, and student accounts provisioned.', '127.0.0.1');

-- 12. INITIAL NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type) VALUES
(4, 'Welcome to Online LMS', 'Welcome Abhinav! You are enrolled in CS-201 and CS-204.', 'INFO'),
(4, 'Grade Published', 'Your submission for Lab 1: Polymorphic Shape Hierarchy has been graded: 95/100.', 'GRADE'),
(5, 'Course Announcement', 'Welcome Akash! New lesson materials are available in CS-201.', 'INFO');
