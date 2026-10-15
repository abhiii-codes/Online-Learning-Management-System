const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();

pptx.layout = 'LAYOUT_16x9';
pptx.author = 'CSE Department - 3rd Semester';
pptx.company = 'Computer Science & Engineering';
pptx.title = 'Online Learning Management System (LMS) - Review 1';

// Theme Colors
const BG_DARK = '0F172A';
const CARD_BG = '1E293B';
const ACCENT_BLUE = '38BDF8';
const PRIMARY_BLUE = '2563EB';
const ACCENT_GREEN = '10B981';
const TEXT_LIGHT = 'F8FAFC';
const TEXT_MUTED = '94A3B8';
const CARD_LIGHT = 'F1F5F9';
const BORDER_COLOR = '334155';

function addHeader(slide, title, category) {
    // Header banner
    slide.addText(category.toUpperCase(), {
        x: 0.8, y: 0.5, w: 10, h: 0.3,
        fontSize: 11, fontFace: 'Arial', color: ACCENT_BLUE, bold: true, letterSpacing: 2
    });
    slide.addText(title, {
        x: 0.8, y: 0.8, w: 11.5, h: 0.6,
        fontSize: 24, fontFace: 'Arial', color: TEXT_LIGHT, bold: true
    });
    // Accent rule
    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.8, y: 1.45, w: 11.7, h: 0.04, fill: { color: PRIMARY_BLUE }
    });
}

// -------------------------------------------------------------
// SLIDE 1: Title Slide
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };

    // Decorative shape
    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.8, y: 1.5, w: 0.15, h: 3.5, fill: { color: ACCENT_BLUE }
    });

    slide.addText('ONLINE LEARNING MANAGEMENT SYSTEM (LMS)', {
        x: 1.2, y: 1.5, w: 10.5, h: 1.2,
        fontSize: 32, fontFace: 'Arial', color: TEXT_LIGHT, bold: true
    });

    slide.addText('A Pure Java Web Application using Jakarta Servlets 6.0, JDBC & MySQL\n3rd-Semester Computer Science & Engineering Project — Review 1 Presentation', {
        x: 1.2, y: 2.8, w: 10.5, h: 1.0,
        fontSize: 16, fontFace: 'Arial', color: TEXT_MUTED
    });

    // Evaluation rubric badges
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 1.2, y: 4.2, w: 10.8, h: 1.2, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });

    slide.addText([
        { text: 'Academic Marking Rubric Coverage (33 Marks Total):\n', options: { bold: true, color: ACCENT_BLUE, fontSize: 13 } },
        { text: '• Problem Understanding & Design (8M)   • Core Java Concepts (10M)   • Database & JDBC (8M)   • Servlets & Web (7M)', options: { color: TEXT_LIGHT, fontSize: 13 } }
    ], { x: 1.5, y: 4.3, w: 10.2, h: 1.0 });

    slide.addText('Team: 3rd Sem CSE Batch | Technologies: Java 17+, Jakarta Servlets 6.0, Tomcat 10.1, JDBC, HikariCP, React 18', {
        x: 1.2, y: 6.2, w: 10.5, h: 0.4,
        fontSize: 11, fontFace: 'Arial', color: TEXT_MUTED
    });
}

// -------------------------------------------------------------
// SLIDE 2: Problem Statement
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Problem Statement & Motivation', 'Academic Context');

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('The Educational Problem', {
        x: 1.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_BLUE, bold: true
    });
    slide.addText([
        { text: '• Fragmented Academic Workflows: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Institutions struggle with disconnected tools for course materials, assignments, and grades.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Lack of Role Segregation: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Need strict security barriers preventing students from viewing other students\' grades and instructors from editing unauthorized courses.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Manual Grading Inefficiencies: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Instructors spend hours manually grading MCQ quizzes without instant automated score calculations.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.6, w: 5.0, h: 3.8, fontSize: 13 });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('The Engineering Objective', {
        x: 7.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_GREEN, bold: true
    });
    slide.addText([
        { text: '• Zero Magic Frameworks: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Strictly avoid Spring Boot or ORM (Hibernate) to demonstrate foundational engineering concepts directly.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Robust Architecture: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Build a production-grade 4-Tier web system using Jakarta Servlets 6.0 and direct JDBC 4.x.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Transparent Systems Mechanics: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Master connection lifecycles, PreparedStatements, explicit JDBC transactions, HTTP sessions, and Core OOP.', options: { color: TEXT_MUTED } }
    ], { x: 7.1, y: 2.6, w: 5.1, h: 3.8, fontSize: 13 });
}

// -------------------------------------------------------------
// SLIDE 3: Objectives & Solution Overview
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Project Objectives & Proposed Solution', 'System Overview');

    const cards = [
        { title: '1. Modular 4-Tier Architecture', text: 'Decoupled Presentation (React), Controller (Jakarta Servlets), Service (Business Rules), and DAO (JDBC) layers.', col: ACCENT_BLUE, x: 0.8, y: 1.8 },
        { title: '2. Comprehensive Role Workflows', text: 'Tailored dashboards for Students, Instructors, and Administrators with session-based security and authorization.', col: ACCENT_GREEN, x: 6.8, y: 1.8 },
        { title: '3. Real JDBC Persistence', text: '100% PreparedStatements, HikariCP connection pooling, and multi-operation ACID transaction management.', col: ACCENT_BLUE, x: 0.8, y: 4.3 },
        { title: '4. Core Java Excellence', text: 'Meaningful Encapsulation, User Inheritance, Runtime Polymorphic strategies, Custom Exceptions, and Generics.', col: ACCENT_GREEN, x: 6.8, y: 4.3 }
    ];

    cards.forEach(c => {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: c.x, y: c.y, w: 5.7, h: 2.3, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(c.title, {
            x: c.x + 0.3, y: c.y + 0.25, w: 5.1, h: 0.35, fontSize: 16, fontFace: 'Arial', color: c.col, bold: true
        });
        slide.addText(c.text, {
            x: c.x + 0.3, y: c.y + 0.75, w: 5.1, h: 1.3, fontSize: 13, fontFace: 'Arial', color: TEXT_LIGHT
        });
    });
}

// -------------------------------------------------------------
// SLIDE 4: User Roles & System Actors
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'User Roles & Personas', 'Functional Scope');

    const roles = [
        {
            role: 'STUDENT PORTAL',
            badge: 'Learner Experience',
            color: ACCENT_BLUE,
            x: 0.8,
            items: [
                'Browse published course catalog with live search',
                'Enroll in courses (duplicate & capacity checked)',
                'Access modules, video lessons, & syllabus notes',
                'Submit assignments (text notes & file attachments)',
                'Take interactive MCQ quizzes with instant scoring',
                'Track personal course completion percentages'
            ]
        },
        {
            role: 'INSTRUCTOR PORTAL',
            badge: 'Content & Grading',
            color: ACCENT_GREEN,
            x: 4.8,
            items: [
                'Create, update, & publish academic courses',
                'Design structured modules and syllabus lessons',
                'Create assignments with due dates and points',
                'Review student submissions & submit grades/feedback',
                'Author 4-option MCQ quizzes with answer keys',
                'View course analytics (enrollment count, averages)'
            ]
        },
        {
            role: 'ADMINISTRATOR PORTAL',
            badge: 'Governance & Security',
            color: 'F59E0B',
            x: 8.8,
            items: [
                'System-wide statistics and metric cards',
                'User account lifecycle management (create/toggle)',
                'Inspect security audit logs with IP & timestamps',
                'Configure system runtime flags & policies',
                'Enforce role-based security boundaries',
                'Monitor database health & platform activity'
            ]
        }
    ];

    roles.forEach(r => {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: r.x, y: 1.8, w: 3.7, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(r.role, {
            x: r.x + 0.25, y: 2.0, w: 3.2, h: 0.35, fontSize: 16, fontFace: 'Arial', color: r.color, bold: true
        });
        slide.addText(r.badge, {
            x: r.x + 0.25, y: 2.4, w: 3.2, h: 0.25, fontSize: 11, fontFace: 'Arial', color: TEXT_MUTED
        });
        const bullets = r.items.map(i => ({ text: `• ${i}\n\n`, options: { color: TEXT_LIGHT, fontSize: 11 } }));
        slide.addText(bullets, {
            x: r.x + 0.25, y: 2.8, w: 3.2, h: 3.6
        });
    });
}

// -------------------------------------------------------------
// SLIDE 5: System Architecture
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Decoupled 4-Tier Layered Architecture', 'System Architecture');

    const layers = [
        { num: 'TIER 1', name: 'Presentation Tier (Client)', desc: 'React 18 + TypeScript SPA | Tailwind CSS | Viva Demo Persona Switcher | REST Client', col: ACCENT_BLUE, y: 1.8 },
        { num: 'TIER 2', name: 'Servlet Controller Tier', desc: '14 Jakarta Servlets 6.0 | BaseServlet Exception Mapping | CorsFilter | SecurityUtils Session Guards', col: '60A5FA', y: 3.0 },
        { num: 'TIER 3', name: 'Business Service Tier', desc: '13 Service Interfaces & AppContext Registry | Business Rules | Explicit JDBC Transaction Demarcation', col: ACCENT_GREEN, y: 4.2 },
        { num: 'TIER 4', name: 'Data Access & Storage Tier', desc: '11 JDBC DAOs | 100% PreparedStatements | HikariCP Pool | MySQL 8.x (14 Tables, 3NF Normalized)', col: '34D399', y: 5.4 }
    ];

    layers.forEach(l => {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: 0.8, y: l.y, w: 11.7, h: 1.0, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: 0.8, y: l.y, w: 0.15, h: 1.0, fill: { color: l.col }
        });
        slide.addText(l.num, {
            x: 1.2, y: l.y + 0.15, w: 1.5, h: 0.3, fontSize: 12, fontFace: 'Arial', color: l.col, bold: true
        });
        slide.addText(l.name, {
            x: 2.8, y: l.y + 0.15, w: 4.5, h: 0.3, fontSize: 15, fontFace: 'Arial', color: TEXT_LIGHT, bold: true
        });
        slide.addText(l.desc, {
            x: 1.2, y: l.y + 0.5, w: 11.0, h: 0.4, fontSize: 12, fontFace: 'Arial', color: TEXT_MUTED
        });
    });
}

// -------------------------------------------------------------
// SLIDE 6: Core Java Concepts
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Demonstration of Core Java Concepts', 'Marking Rubric: 10 Marks');

    const oop = [
        {
            title: '1. Encapsulation & Composition',
            col: ACCENT_BLUE,
            items: [
                'Private fields in all entity models (User, Course, Module, Assignment)',
                'Defensive setters validating email format, capacity, and score boundaries',
                'Natural composition: Course contains Modules; Module contains Lessons'
            ]
        },
        {
            title: '2. Inheritance & User Hierarchy',
            col: ACCENT_GREEN,
            items: [
                'Abstract base class User with common identity fields',
                'StudentUser extends User (studentId, major, yearOfStudy)',
                'InstructorUser extends User (department, officeLocation)',
                'AdminUser extends User (adminLevel, superAdminFlag)'
            ]
        },
        {
            title: '3. Runtime Polymorphism & Strategies',
            col: ACCENT_BLUE,
            items: [
                'Polymorphic abstract methods: getRoleDashboardUrl() & hasAdministrativePrivileges()',
                'Interchangeable GradingStrategy interface pattern',
                'StandardGradingStrategy (point sum) vs WeightedGradingStrategy (weighted weights)'
            ]
        },
        {
            title: '4. Abstraction, Generics & Exceptions',
            col: ACCENT_GREEN,
            items: [
                '11 DAO interfaces and 13 Service interfaces decoupling contracts',
                'Type-safe Collections and Generics: List<Course>, Map<String, Object>, Optional<T>',
                'Custom LmsException hierarchy with centralized HTTP translation in BaseServlet'
            ]
        }
    ];

    oop.forEach((item, idx) => {
        const x = idx % 2 === 0 ? 0.8 : 6.8;
        const y = idx < 2 ? 1.8 : 4.3;
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: x, y: y, w: 5.7, h: 2.3, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(item.title, {
            x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.35, fontSize: 15, fontFace: 'Arial', color: item.col, bold: true
        });
        const bullets = item.items.map(b => ({ text: `• ${b}\n\n`, options: { color: TEXT_LIGHT, fontSize: 11 } }));
        slide.addText(bullets, {
            x: x + 0.3, y: y + 0.65, w: 5.1, h: 1.5
        });
    });
}

// -------------------------------------------------------------
// SLIDE 7: Database & JDBC Integration
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Direct JDBC Persistence & Concurrency Control', 'Marking Rubric: 8 Marks');

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('Key JDBC Persistence Mechanics', {
        x: 1.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_BLUE, bold: true
    });
    slide.addText([
        { text: '• 100% Parameterized Statements: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'All queries use PreparedStatement placeholders (?). Dynamic concatenation is strictly forbidden, ensuring zero SQL injection vulnerability.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Deterministic Resource Management: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Java try-with-resources guarantees connections, statements, and result sets close deterministically, preventing database pool leaks.\n\n', options: { color: TEXT_MUTED } },
        { text: '• HikariCP Connection Pooling: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Sub-millisecond borrowing with dual DB failover (MySQL 8.x + Embedded H2).\n\n', options: { color: TEXT_MUTED } },
        { text: '• Auto-Generated Key Retrieval: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Uses Statement.RETURN_GENERATED_KEYS to bind primary IDs immediately upon insert.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.5, w: 5.0, h: 3.9, fontSize: 12 });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('Deadlock-Free Transactions (ACID)', {
        x: 7.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_GREEN, bold: true
    });
    slide.addText([
        { text: '• Reusable TransactionManager: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Functional template managing setAutoCommit(false), commit(), rollback suppression (addSuppressed), and retry on MySQL Error 1213.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Inverted Lock Order (Deadlock Fix): ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Executes incrementEnrolledCount FIRST to acquire parent X-lock before child FK S-lock, eliminating InnoDB lock-escalation deadlocks.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Atomic Capacity Enforcement: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'UPDATE ... WHERE enrolled_count < capacity prevents overselling seats; throws CourseFullException (HTTP 400).\n\n', options: { color: TEXT_MUTED } },
        { text: '• Decoupled Best-Effort Notification: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Notification dispatch occurs post-commit so email delays never abort valid transactions.', options: { color: TEXT_MUTED } }
    ], { x: 7.1, y: 2.5, w: 5.1, h: 3.9, fontSize: 11 });
}

// -------------------------------------------------------------
// SLIDE 8: Servlets & Web Integration
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Jakarta Servlets 6.0 & Web Integration', 'Marking Rubric: 7 Marks');

    const servlets = [
        {
            title: '14 Jakarta Servlet Endpoints',
            items: [
                'AuthServlet, UserServlet, CourseServlet, ModuleServlet, LessonServlet',
                'EnrollmentServlet, AssignmentServlet, SubmissionServlet, QuizServlet',
                'ProgressServlet, NotificationServlet, AnalyticsServlet, AuditLogServlet, SystemSettingServlet'
            ]
        },
        {
            title: 'BaseServlet Uniform Architecture',
            items: [
                'All servlets extend BaseServlet for centralized JSON parsing and output envelopes',
                'Standard HTTP methods (doGet, doPost, doPut, doDelete) mapped to REST verbs',
                'Centralized error translation translating custom exceptions to HTTP 400/401/403/404/500'
            ]
        },
        {
            title: 'Security & Session Management',
            items: [
                'Stateful Jakarta HttpSession management with JSESSIONID cookies',
                'SecurityUtils guard methods enforcing authenticated roles per endpoint',
                'Explicit session invalidation upon logout (session.invalidate()) preventing fixation'
            ]
        },
        {
            title: 'Servlet Filters & CORS Support',
            items: [
                'CorsFilter intercepts requests for pre-flight OPTIONS, headers, and credentials',
                'EncodingFilter ensures consistent UTF-8 character encoding across all responses',
                'Production React SPA served directly from Tomcat web container root'
            ]
        }
    ];

    servlets.forEach((s, idx) => {
        const x = idx % 2 === 0 ? 0.8 : 6.8;
        const y = idx < 2 ? 1.8 : 4.3;
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: x, y: y, w: 5.7, h: 2.3, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(s.title, {
            x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.35, fontSize: 15, fontFace: 'Arial', color: ACCENT_BLUE, bold: true
        });
        const bullets = s.items.map(b => ({ text: `• ${b}\n\n`, options: { color: TEXT_LIGHT, fontSize: 11 } }));
        slide.addText(bullets, {
            x: x + 0.3, y: y + 0.65, w: 5.1, h: 1.5
        });
    });
}

// -------------------------------------------------------------
// SLIDE 9: Database Schema & Design
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Relational Database Schema & 3NF Architecture', 'Database Engineering');

    const groups = [
        {
            title: 'User & Security Domain',
            col: ACCENT_BLUE,
            x: 0.8,
            tables: '• users (Auth, Roles, Polymorphic Attributes)\n• notifications (System Alerts, Read States)\n• audit_logs (Security Timestamps, Actions, IP)\n• system_settings (Key-Value Configs)'
        },
        {
            title: 'Curriculum & Content Domain',
            col: ACCENT_GREEN,
            x: 4.8,
            tables: '• courses (Codes, Titles, Instructor FK, Capacity)\n• modules (Course Syllabus Ordering Index)\n• lessons (Durations, Notes, Content Video URLs)\n• lesson_progress (Student Completion Status)'
        },
        {
            title: 'Assessments & Grading Domain',
            col: 'F59E0B',
            x: 8.8,
            tables: '• enrollments (Compound Unique Key user_id + course_id)\n• assignments (Due Dates, Max Score Limits)\n• submissions (Student Text, Grades, Feedback)\n• quizzes, quiz_questions, quiz_attempts'
        }
    ];

    groups.forEach(g => {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: g.x, y: 1.8, w: 3.7, h: 3.5, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(g.title, {
            x: g.x + 0.25, y: 2.0, w: 3.2, h: 0.35, fontSize: 15, fontFace: 'Arial', color: g.col, bold: true
        });
        slide.addText(g.tables, {
            x: g.x + 0.25, y: 2.5, w: 3.2, h: 2.6, fontSize: 12, fontFace: 'Arial', color: TEXT_LIGHT
        });
    });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: 5.5, w: 11.7, h: 1.1, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText([
        { text: '3NF Normalization & Deliberate Denormalization: ', options: { bold: true, color: ACCENT_BLUE, fontSize: 12 } },
        { text: 'Core entities are normalized to 3NF. Derived columns (courses.enrolled_count, enrollments.progress_percentage) serve as documented counter-caches enabling O(1) capacity enforcement and deadlock elimination. Dual database support (MySQL 8.x + Embedded H2).', options: { color: TEXT_LIGHT, fontSize: 12 } }
    ], { x: 1.1, y: 5.65, w: 11.1, h: 0.8 });
}

// -------------------------------------------------------------
// SLIDE 10: Current Status & Live Verification
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Current Implementation Status & Live Server', 'Project Milestones');

    const statusCards = [
        { title: 'Backend Engine & DAOs', stat: '100% Complete', desc: '14 Servlets, 13 Services, 11 DAOs fully operational with JDBC.', col: ACCENT_GREEN, x: 0.8, y: 1.8 },
        { title: 'Frontend Dashboards', stat: '100% Complete', desc: 'React 18 + TS SPA with Student, Instructor, & Admin portals.', col: ACCENT_GREEN, x: 4.8, y: 1.8 },
        { title: 'Automated Tests', stat: '39/39 Passed', desc: 'JUnit 5 suites verifying OOP, DAOs, Deadlock-Free Transactions, and Servlets.', col: ACCENT_GREEN, x: 8.8, y: 1.8 },
        { title: 'Embedded Web Server', stat: 'Running (Port 8080)', desc: 'Tomcat 10.1 web container active and delivering HTTP 200.', col: ACCENT_BLUE, x: 0.8, y: 4.3 },
        { title: 'Deployable Artifact', stat: 'online-lms.war', desc: 'Standard Jakarta WAR compiled and ready for Tomcat deployment.', col: ACCENT_BLUE, x: 4.8, y: 4.3 },
        { title: 'Academic Rubric Match', stat: '33/33 Marks', desc: 'Full alignment with all four 3rd-Semester CSE project criteria.', col: 'F59E0B', x: 8.8, y: 4.3 }
    ];

    statusCards.forEach(c => {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: c.x, y: c.y, w: 3.7, h: 2.3, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(c.title, {
            x: c.x + 0.25, y: c.y + 0.2, w: 3.2, h: 0.3, fontSize: 14, fontFace: 'Arial', color: TEXT_MUTED
        });
        slide.addText(c.stat, {
            x: c.x + 0.25, y: c.y + 0.55, w: 3.2, h: 0.45, fontSize: 18, fontFace: 'Arial', color: c.col, bold: true
        });
        slide.addText(c.desc, {
            x: c.x + 0.25, y: c.y + 1.1, w: 3.2, h: 1.0, fontSize: 12, fontFace: 'Arial', color: TEXT_LIGHT
        });
    });
}

// -------------------------------------------------------------
// SLIDE 11: Testing Performed
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Verification & Testing Methodology', 'Testing & Quality Assurance');

    const tests = [
        {
            suite: 'CoreJavaOopTest (8 Tests)',
            result: 'PASSED',
            desc: 'Verifies encapsulation accessors, Student/Instructor/Admin inheritance, runtime polymorphic strategy calculations, Comparable, and custom LmsException behaviors.'
        },
        {
            suite: 'JdbcDaoPersistenceTest (6 Tests)',
            result: 'PASSED',
            desc: 'Validates direct JDBC PreparedStatement execution, user password hash lookups, course insertions, and SQL unique constraint validations.'
        },
        {
            suite: 'ServiceTransactionTest (12 Tests)',
            result: 'PASSED',
            desc: 'Verifies TransactionManager execution, 20-thread concurrency test (0 oversells), rollback suppression, capacity enforcement, and symmetric dropCourse.'
        },
        {
            suite: 'ServletRequestHandlingTest (13 Tests)',
            result: 'PASSED',
            desc: 'Tests BaseServlet JSON response dispatching, AuthFilter role-based access control, and error handling for unauthorized requests (400, 401, 403, 404, 409, 415).'
        }
    ];

    tests.forEach((t, idx) => {
        const y = 1.8 + idx * 1.25;
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: 0.8, y: y, w: 11.7, h: 1.1, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
        });
        slide.addText(t.suite, {
            x: 1.1, y: y + 0.15, w: 5.0, h: 0.35, fontSize: 15, fontFace: 'Arial', color: ACCENT_BLUE, bold: true
        });
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: 10.5, y: y + 0.15, w: 1.7, h: 0.35, fill: { color: '065F46' }
        });
        slide.addText(t.result, {
            x: 10.5, y: y + 0.15, w: 1.7, h: 0.35, fontSize: 12, fontFace: 'Arial', color: ACCENT_GREEN, bold: true, align: 'center'
        });
        slide.addText(t.desc, {
            x: 1.1, y: y + 0.55, w: 10.5, h: 0.45, fontSize: 12, fontFace: 'Arial', color: TEXT_LIGHT
        });
    });
}

// -------------------------------------------------------------
// SLIDE 12: Future Scope & Conclusion
// -------------------------------------------------------------
{
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, 'Future Scope & Academic Conclusion', 'Roadmap & Summary');

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('Future Scope (Review 2 & Final)', {
        x: 1.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_BLUE, bold: true
    });
    slide.addText([
        { text: '• WebRTC Live Classroom: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Integrate browser-based video lectures and virtual whiteboard sessions.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Automated Plagiarism Detection: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'N-gram similarity analysis on student code and text submissions.\n\n', options: { color: TEXT_MUTED } },
        { text: '• AI Quiz Generation: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Automated MCQ generation from uploaded syllabus lecture notes.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Mobile Companion App: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Native mobile client leveraging existing Jakarta Servlet REST APIs.', options: { color: TEXT_MUTED } }
    ], { x: 1.1, y: 2.6, w: 5.0, h: 3.8, fontSize: 12 });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 }
    });
    slide.addText('Conclusion & Evaluation Readiness', {
        x: 7.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 18, fontFace: 'Arial', color: ACCENT_GREEN, bold: true
    });
    slide.addText([
        { text: '• Full Rubric Satisfaction: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'All 33 marks across Problem Understanding, Core Java, JDBC, and Servlets are demonstrated.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Tested & Verifiable: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Application is currently live on port 8080 and backed by 39 passing automated tests.\n\n', options: { color: TEXT_MUTED } },
        { text: '• Complete Academic Deliverables: ', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Comprehensive README, System Architecture, ERD, Setup Guide, Viva Guide, and Presentation Deck provided.\n\n', options: { color: TEXT_MUTED } },
        { text: 'Ready for Review 1 Committee Evaluation & Viva Defense.', options: { bold: true, color: ACCENT_GREEN } }
    ], { x: 7.1, y: 2.6, w: 5.1, h: 3.8, fontSize: 12 });
}

const outputPath = path.resolve(__dirname, '../docs/Review1_Presentation.pptx');
pptx.writeFile({ fileName: outputPath })
    .then(fileName => {
        console.log(`Successfully generated presentation: ${fileName}`);
    })
    .catch(err => {
        console.error('Error generating presentation:', err);
        process.exit(1);
    });
