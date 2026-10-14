# Setup, Execution & Deployment Guide
### Online Learning Management System (LMS)
**Course:** 3rd-Semester CSE Java Web-Based Project  

---

## 1. System Requirements & Prerequisites

Before setting up the project, ensure your workstation satisfies the following software prerequisites:

| Requirement | Recommended Version | Minimum Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Java Development Kit (JDK)** | OpenJDK 17 or 21 | JDK 17 | `java -version` |
| **Apache Maven** | 3.9.x | 3.8.x | `mvn -version` |
| **Relational Database** | MySQL 8.0+ *(Optional)* | Embedded H2 included | `mysql --version` |
| **Node.js & npm** *(Frontend Dev Only)* | Node 20.x, npm 10.x | Node 18.x | `node -v` |
| **Web Browser** | Chrome, Edge, Firefox | Any modern browser | - |

> [!NOTE]
> **Zero-Configuration Mode for Evaluators:**
> If MySQL is not installed or running, the application **automatically detects this and starts an embedded in-memory H2 database in MySQL compatibility mode**, auto-executing the full DDL schema and seeding the database with pre-hashed BCrypt users. No manual database setup is required to evaluate the project!

---

## 2. Option A: Instant Run via Embedded Tomcat (Recommended for Viva)

The repository includes a custom embedded Apache Tomcat 10 launcher (`LmsApplicationLauncher`) packaged with Maven.

### Step 1: Open Terminal in Project Root
```powershell
cd C:\Users\abhin\.gemini\antigravity\scratch\online-lms
```

### Step 2: Compile & Launch Embedded Web Server
```powershell
mvn exec:java
```

### Step 3: Access the Application
Once the terminal displays `Tomcat started on port 8080`:
* Open your browser and navigate to: **`http://localhost:8080/index.html`** or **`http://localhost:8080/`**
* Test the REST API directly: **`http://localhost:8080/api/courses`**

---

## 3. Option B: Standalone Apache Tomcat 10 WAR Deployment

If your lab requires deployment to an external Apache Tomcat 10.x installation:

### Step 1: Package the Web Application Archive (WAR)
```powershell
mvn clean package -DskipTests
```
This produces `target/online-lms.war`.

### Step 2: Deploy to Tomcat 10
1. Ensure Apache Tomcat 10.1.x is installed (Tomcat 10 uses the `jakarta.*` namespace required by this project).
2. Copy `target/online-lms.war` into Tomcat's `webapps/` directory:
   ```powershell
   Copy-Item target\online-lms.war C:\apache-tomcat-10.1.x\webapps\
   ```
3. Start Tomcat using `C:\apache-tomcat-10.1.x\bin\startup.bat`.
4. Open the application in your browser:
   * **`http://localhost:8080/online-lms/index.html`**

---

## 4. Option C: Configuring Production MySQL 8.x

If you wish to run against a dedicated MySQL server instance:

### Step 1: Create Database & User
Log into your MySQL client and run:
```sql
CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lms_user'@'localhost' IDENTIFIED BY 'lms_pass123';
GRANT ALL PRIVILEGES ON lms_db.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Execute Schema & Seed Scripts
```powershell
mysql -u lms_user -plms_pass123 lms_db < database/schema.sql
mysql -u lms_user -plms_pass123 lms_db < database/seed.sql
```

### Step 3: Configure Database Connection Properties
Set the following environment variables (or specify them via JVM `-D` flags):
```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USER = "lms_user"
$env:DB_PASSWORD = "lms_pass123"
```
Then start the application using `mvn exec:java`.

---

## 5. Frontend Development & Rebuilding the SPA

The frontend source is located in `frontend/`. If you make changes to React components:

```powershell
cd frontend
# Install dependencies
npm install

# Build production bundle into src/main/webapp
npm run build
```
Vite is preconfigured to compile the bundled JS, CSS, and HTML assets directly into `src/main/webapp/`, ready for Tomcat packaging.

---

## 6. Running the Automated Test Suite

To run all 16 JUnit 5 unit and integration tests:

```powershell
mvn test
```

### Expected Output:
```
[INFO] Running com.lms.CoreJavaOopTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.123 s
[INFO] Running com.lms.JdbcDaoPersistenceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.451 s
[INFO] Running com.lms.ServiceTransactionTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.287 s
[INFO] Running com.lms.ServletRequestHandlingTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.198 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

---

## 7. Troubleshooting & FAQs

### Q1: "Port 8080 is already in use"
* **Diagnosis:** Another web server or prior Tomcat instance is running on port 8080.
* **Solution (Windows):**
  ```powershell
  Get-NetTCPConnection -LocalPort 8080
  Stop-Process -Id <ProcessId> -Force
  ```
  Or change the port in `LmsApplicationLauncher.java` (`DEFAULT_PORT = 8080`).

### Q2: "ClassCastException: jakarta.servlet vs javax.servlet"
* **Diagnosis:** Deploying to an older Tomcat 9 or lower instance that only supports legacy `javax.servlet`.
* **Solution:** This project targets **Jakarta Servlet 6.0** and requires **Apache Tomcat 10.1+**. Always deploy to Tomcat 10+.

### Q3: How do I test the Student, Instructor, and Admin views quickly?
* Use the floating **Viva Demo Bar** at the top of `http://localhost:8080/index.html`. Click any role button to switch personas instantly without typing credentials!
