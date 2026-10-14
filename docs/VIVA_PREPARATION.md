# Viva Defense Preparation Guide
### Online Learning Management System (LMS)
**Course:** 3rd-Semester CSE Java Web-Based Project  
**Marking Rubric:** 33 Marks Total  

---

## 1. Rubric Category 1: Problem Understanding & Solution Design (8 Marks)

### Q1.1: What is the core problem your project addresses, and why is an LMS significant?
> **Answer:**  
> Modern educational institutions need a centralized, web-accessible system that eliminates paper-based assignments, manual grading errors, and fragmented course distribution. Our Online LMS provides a role-segregated platform with three strictly protected portals:
> 1. **Students:** Discover courses, enroll, track module progress, submit assignments, and take auto-graded MCQ quizzes.
> 2. **Instructors:** Design courses, upload syllabi, review submissions, award grades with custom feedback, and author quizzes.
> 3. **Administrators:** Oversee platform health, toggle active user accounts, inspect security audit logs, and configure system policies.

### Q1.2: Why did you choose a 4-Tier Layered Architecture instead of writing database queries directly in Servlets?
> **Answer:**  
> Writing SQL queries directly inside Servlets violates the **Single Responsibility Principle (SRP)** and causes high coupling. If the database schema changes, web controllers would break.  
> Our 4-Tier design achieves separation of concerns:
> 1. **Servlet Controller Tier:** Handles HTTP request parsing, JSON deserialization, HTTP status codes, and security.
> 2. **Service Tier:** Enforces pure business logic (e.g., course capacity limits, duplicate enrollment prevention, grade validation) and manages transaction boundaries.
> 3. **DAO Tier:** Encapsulates raw JDBC SQL queries, parameter binding, and result set mapping.
> 4. **Database Tier:** Normalizes data into 14 3NF tables and enforces foreign key integrity.

### Q1.3: Why did you not use Spring Boot, Spring Data JPA, or Hibernate ORM?
> **Answer:**  
> In enterprise frameworks like Spring Boot or Hibernate, essential systems programming concepts (such as HTTP request dispatching, session cookies, connection lifecycle management, SQL query generation, and transaction demarcation) are hidden behind annotations like `@RestController`, `@Autowired`, and `@Transactional`.  
> By implementing this project using pure **Jakarta Servlets 6.0** and raw **JDBC 4.x**, we deliberately demonstrate a transparent, ground-up understanding of web computing, socket lifecycles, and relational database mechanics, directly fulfilling the 3rd-semester CSE evaluation requirements.

---

## 2. Rubric Category 2: Core Java Concepts (10 Marks)

### Q2.1: How is Encapsulation demonstrated in your codebase?
> **Answer:**  
> In all model classes (`com.lms.model.User`, `Course`, `Assignment`, `Submission`, etc.), all fields are declared `private`. Access is granted exclusively through public getter and setter methods. Setters contain defensive validation logic (for example, ensuring course capacity is positive and emails conform to standard patterns), protecting the object's internal state from inconsistent mutation.

### Q2.2: How does your project implement Inheritance and runtime Polymorphism?
> **Answer:**  
> We implemented an abstract base class `User` (`com.lms.model.User`) which contains common user fields (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `role`, `status`).  
> We then extend this base class into three specialized subclasses:
> - `StudentUser extends User` (adds `studentId`, `major`, `yearOfStudy`)
> - `InstructorUser extends User` (adds `instructorCode`, `department`, `officeLocation`)
> - `AdminUser extends User` (adds `adminLevel`, `superAdminFlag`)
> 
> **Runtime Polymorphism** is demonstrated in two ways:
> 1. **Abstract Method Overriding:** `User` declares `public abstract String getRoleDashboardUrl()` and `public abstract boolean hasAdministrativePrivileges()`. At runtime, calling `user.getRoleDashboardUrl()` polymorphically executes the subclass implementation (`"/student"`, `"/instructor"`, or `"/admin"`).
> 2. **Strategy Pattern:** The `GradingStrategy` interface is polymorphically implemented by `StandardGradingStrategy` and `WeightedGradingStrategy`, allowing dynamic selection of calculation logic.

### Q2.3: How are Interfaces and Abstraction utilized?
> **Answer:**  
> We separated the contract of every layer from its implementation:
> - We defined 11 DAO interfaces (`UserDao`, `CourseDao`, `EnrollmentDao`, etc.) implemented by JDBC classes (`UserDaoImpl`, `CourseDaoImpl`, etc.).
> - We defined 13 Service interfaces (`UserService`, `CourseService`, etc.) implemented by service classes.
> This abstraction ensures that the higher layers depend only on contracts, never on concrete database implementations.

### Q2.4: Walk through your custom Exception Handling architecture.
> **Answer:**  
> We constructed a structured exception hierarchy rooted at `LmsException` (`RuntimeException`):
> - `AuthenticationException`: Thrown when credentials fail or sessions expire (maps to HTTP 401).
> - `UnauthorizedException`: Thrown when a student attempts instructor actions (maps to HTTP 403).
> - `ResourceNotFoundException`: Thrown when an ID does not exist in the database (maps to HTTP 404).
> - `ValidationException`: Thrown when business rules fail (maps to HTTP 400).
> In `BaseServlet.handleException()`, all exceptions are caught centrally and translated into consistent JSON error responses with the proper HTTP status code.

### Q2.5: Where are Generics and Collections used?
> **Answer:**  
> Throughout our DAO and Service methods, we use type-safe Collections with Generics:
> - `List<Course>` and `List<User>` for tabular database queries.
> - `Map<String, Object>` for dynamic statistics and Jackson JSON payloads.
> - `Optional<User>` and `Optional<Course>` in DAOs to prevent `NullPointerException` when querying by ID or email.

---

## 3. Rubric Category 3: Database Integration (JDBC) (8 Marks)

### Q3.1: What is the difference between `Statement` and `PreparedStatement`? Which did you use, and why?
> **Answer:**  
> - A standard `Statement` compiles and executes raw SQL strings every time. If user input is concatenated into the query (`"SELECT * FROM users WHERE email = '" + input + "'"`), an attacker can supply `' OR '1'='1"` to bypass authentication (SQL Injection).
> - A `PreparedStatement` pre-compiles the SQL template in the database engine using placeholders (`?`). The database strictly treats parameter values as literal data, never executable SQL commands. Furthermore, pre-compiled statements are cached and re-executed with higher performance.
> - In our project, **100% of our database operations use `PreparedStatement`**, guaranteeing zero risk of SQL injection.

### Q3.2: Why is Connection Pooling (HikariCP) necessary instead of calling `DriverManager.getConnection()` for every request?
> **Answer:**  
> Opening a direct TCP connection to a database involves network handshakes, authentication, and memory allocation, which typically takes 50–200 milliseconds. Under high concurrent user traffic, opening and closing connections per HTTP request exhausts database socket limits and degrades performance.  
> **HikariCP** maintains a pool of pre-warmed, active database connections. When a DAO needs a connection, it borrows one in microseconds and returns it to the pool upon closure via try-with-resources.

### Q3.3: How does your application manage Database Transactions and maintain ACID properties?
> **Answer:**  
> In multi-step business operations—such as enrolling a student—we execute multiple database modifications using our reusable `TransactionManager`:
> ```java
> return TransactionManager.execute(conn -> {
>     // 1. Take exclusive (X) row lock on courses FIRST and conditionally increment:
>     // UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ? AND enrolled_count < capacity
>     boolean seatReserved = courseDao.incrementEnrolledCount(conn, courseId);
>     if (!seatReserved) {
>         throw new CourseFullException(courseId, course.getCapacity());
>     }
> 
>     // 2. Insert record into enrollments
>     if (enrollmentDao.exists(conn, userId, courseId)) {
>         throw new AlreadyEnrolledException(userId, courseId);
>     }
>     Enrollment result = enrollmentDao.create(conn, enrollment);
> 
>     // 3. Append security audit trail
>     auditLogDao.create(conn, log);
>     return result;
> });
> ```
> If any step throws an exception, `TransactionManager` invokes `conn.rollback()` with suppressed exception chaining (`ex.addSuppressed(rollbackEx)`), and automatically retries once if a transient MySQL deadlock (SQLState 40001 / Error 1213) occurs.

### Q3.4: How do you prevent InnoDB deadlocks, race conditions, and seat overselling when multiple students enroll simultaneously?
> **Answer:**  
> 1. **Deadlock Prevention (Inverted Lock Order):** In MySQL InnoDB, inserting into `enrollments` first acquires a shared (S) lock on the parent `courses` row for foreign key validation. If two concurrent transactions both hold this S-lock and then both request an exclusive (X) lock to increment `courses.enrolled_count`, they deadlock (MySQL error 1213 / SQLState 40001).  
> **Our solution:** We invert the lock order. We execute `courseDao.incrementEnrolledCount(conn, courseId)` **first**. This acquires the exclusive (X) lock on `courses` immediately, serializing concurrent enrollments for that course without deadlock.
> 2. **Symmetric Lock Order in Unenroll (`dropCourse`):** In `dropCourse`, we also lock `courses` **first** (`courseDao.decrementEnrolledCount`), and **then** update `enrollments.status = 'DROPPED'`. Because every transaction path acquires locks in the identical global sequence (`courses` $\to$ `enrollments`), cross-transaction deadlocks between enrollment and unenrollment are mathematically impossible.
> 3. **Re-enrollment Reactivation:** If a student who previously dropped re-enrolls, we detect the existing row and update its status back to `ACTIVE` instead of inserting a new row, preventing duplicate key violations (`MySQL 1062` on `uk_user_course`).
> 4. **Overselling Prevention:** The increment query is strictly conditional:  
> `UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ? AND enrolled_count < capacity`.  
> We check `executeUpdate() == 1`. If zero rows are updated, the course is completely full, and we throw `CourseFullException` (mapped to **HTTP 409 Conflict**), making overselling physically impossible.

### Q3.5: You claim 3NF, but why does courses have enrolled_count and quiz_attempts have percentage? Isn't that denormalized?
> **Answer:**  
> Our architecture is **normalized to 3NF, with documented deliberate denormalizations** applied for concurrency, locking, and audit integrity:
> 1. `courses.enrolled_count` is a **counter cache**. It makes seat capacity enforcement an $O(1)$ single-row atomic row lock instead of an expensive full-table `COUNT(enrollments)` scan. More importantly, it enables acquiring the exclusive row lock first to eliminate InnoDB foreign-key lock upgrade cycles.
>    * **Trade-off:** Concurrent enrollments for the *same* course serialize on that row, which is a deliberate, acceptable trade-off for collegiate-scale integrity.
>    * **Reconciliation:** To guard against drift from direct DB manipulation or cascade deletes, we maintain a live reconcile query:
>    ```sql
>    SELECT c.id, c.code, c.enrolled_count AS cached_count,
>           COUNT(e.id) AS actual_active_count
>    FROM courses c
>    LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('ACTIVE', 'COMPLETED')
>    GROUP BY c.id, c.code, c.enrolled_count
>    HAVING c.enrolled_count <> actual_active_count;
>    ```
> 2. `quiz_attempts.percentage` and `passed` are an **immutable historical snapshot**. If an instructor later changes the passing score or adds questions to a quiz, past student attempts must retain their evaluated percentage at the time of submission for academic integrity.
> 3. `quiz_questions.option_a` through `option_d` is optimized for standard 4-choice academic multiple-choice exams, eliminating the latency of an unnecessary 15th table join.

### Q3.6: Why is the student notification created outside the enrollment transaction?
> **Answer:**  
> A student alert notification is a non-critical side effect. If a student enrolls successfully, but the notification table fails to insert (e.g. disk or notification constraint issue), rolling back the entire course enrollment would result in a terrible user experience. Therefore, we deliberately separate the critical enrollment ACID boundary from the post-commit, best-effort notification delivery.

### Q3.8: How did you implement Try-With-Resources for resource cleanup?
> **Answer:**  
> In Java 7+, classes implementing `java.lang.AutoCloseable` can be instantiated inside `try (...)`. In all our DAOs:
> ```java
> try (Connection conn = DatabaseConfig.getConnection();
>      PreparedStatement stmt = conn.prepareStatement(sql)) {
>     stmt.setLong(1, id);
>     try (ResultSet rs = stmt.executeQuery()) {
>         if (rs.next()) { ... }
>     }
> }
> ```
> Even if an unexpected `SQLException` is thrown, Java automatically closes the `ResultSet`, `PreparedStatement`, and returns the `Connection` to the Hikari pool, completely eliminating memory and connection leaks.

---

## 4. Rubric Category 4: Servlets and Web Integration (7 Marks)

### Q4.1: Explain the lifecycle of a Jakarta Servlet.
> **Answer:**  
> A Servlet lifecycle is managed by the web container (Tomcat 10.1):
> 1. **Loading and Instantiation:** Tomcat loads the Servlet class and creates an instance.
> 2. **Initialization (`init()`):** Called once when the Servlet is first initialized.
> 3. **Request Handling (`service()`):** For every HTTP request, the container spawns a worker thread, creates `HttpServletRequest` and `HttpServletResponse` objects, and dispatches to `doGet()`, `doPost()`, `doPut()`, or `doDelete()`.
> 4. **Destruction (`destroy()`):** Called once when the server shuts down to release resources.

### Q4.2: How does your application maintain user sessions across HTTP requests?
> **Answer:**  
> HTTP is inherently stateless. We manage state using standard Jakarta `HttpSession`:
> - Upon successful login in `AuthServlet`, we call `request.getSession(true)` and store the authenticated `User` object in session attributes: `session.setAttribute("currentUser", user)`.
> - Tomcat sends a `JSESSIONID` cookie to the browser.
> - Subsequent requests send back the `JSESSIONID` cookie, which Tomcat uses to restore the user session.
> - When the user logs out, we call `session.invalidate()`, clearing all server-side session data and preventing session fixation attacks.

### Q4.3: What is the purpose of Servlet Filters in your architecture?
> **Answer:**  
> Servlet Filters intercept requests before they reach the Servlet and responses before they return to the client:
> - `CorsFilter`: Handles Cross-Origin Resource Sharing by intercepting pre-flight `OPTIONS` requests and attaching `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, and `Access-Control-Allow-Credentials`.
> - `EncodingFilter`: Forces standard UTF-8 character encoding (`request.setCharacterEncoding("UTF-8")` and `response.setCharacterEncoding("UTF-8")`) across all endpoints.

### Q4.4: How are passwords secured in your database?
> **Answer:**  
> Passwords are never stored in plain text. We utilize the **jBCrypt** cryptographic hashing library. During registration or user creation, we generate a cryptographically random salt and hash the password with a cost factor of 12:
> `BCrypt.hashpw(plainTextPassword, BCrypt.gensalt(12))`.  
> During authentication, we verify the hash using `BCrypt.checkpw(enteredPassword, storedHash)`. This is irreversible and protects against rainbow table attacks.

### Q4.5: How does the React frontend integrate with the Servlet backend?
> **Answer:**  
> The React Single Page Application is compiled with Vite into static production assets (`index.html`, JavaScript bundles, CSS stylesheets) and placed directly inside `src/main/webapp/`.  
> Tomcat serves these static assets on `http://localhost:8080/`. When the user performs actions in the UI, React dispatches asynchronous JSON requests to `/api/*` endpoints. Jakarta Servlets process the requests, interact with Services and DAOs, and return structured JSON responses using Jackson Databind.
