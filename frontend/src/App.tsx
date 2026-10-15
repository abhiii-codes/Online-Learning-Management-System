import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import { AppShell } from './components/AppShell';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { StudentDashboard } from './components/StudentDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Badge } from './components/ui/Badge';
import { Card } from './components/ui/Card';
import { SkeletonRow } from './components/ui/Skeleton';
import { SeatBar } from './components/ui/SeatBar';
import { Course, Notification } from './types';
import { api } from './services/api';
import {
  RotateCw, GraduationCap, BookOpen, ShieldCheck,
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Server, Database, Lock, Layers
} from 'lucide-react';

const LandingPage: React.FC<{
  onOpenAuth: () => void;
}> = ({ onOpenAuth }) => {
  const { login, switchDemoUser } = useAuth();
  const { toast } = useToast();

  // Sign-in form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);

  // Public courses catalog state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const fetchPublicCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const res = await api.getCourses('', '', 'PUBLISHED');
      setCourses(res.courses || []);
    } catch (err: any) {
      setCoursesError(err.message || 'Could not load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCourses();
  }, []);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(email, password);
      toast('Signed in successfully', 'success');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, roleName: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      await switchDemoUser(demoEmail);
      toast(`Signed in as ${roleName}`, 'success');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in to demo account');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col justify-between font-sans">
      {/* Precision Top Navigation Bar */}
      <header className="bg-surface/90 backdrop-blur-sm border-b border-line h-14 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-control bg-accent text-white flex items-center justify-center font-serif font-bold text-sm shadow-none">
              L
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-ink tracking-tight">ONLINE LMS</span>
              <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded-control bg-paper text-muted border border-line tabular-nums">
                Jakarta Servlet 6.0 &bull; JDBC
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-status-open animate-pulse" />
              <span className="font-medium text-ink">System Online</span>
              <span>&bull;</span>
              <span className="tabular-nums">39 Tests Passing</span>
            </div>

            <Button variant="secondary" size="sm" onClick={onOpenAuth}>
              Sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full flex-1 space-y-14">
        {/* Two-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Heading, Tech Highlights, Interactive Demo Hub */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-control bg-surface border border-line text-xs text-ink font-medium">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Pure Java Enterprise Stack &bull; Apache Tomcat 10.1</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-ink font-normal tracking-tight leading-[1.12]">
                Academic learning platform, engineered from scratch.
              </h1>

              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-[62ch]">
                A robust multi-role LMS powered by HikariCP, ACID transactions, and InnoDB row-level locking for zero-drift enrollments, modular lessons, and automated assessments.
              </p>
            </div>

            {/* Quick Technical Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink pt-1">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-status-open flex-shrink-0" />
                <span>InnoDB Row Pessimistic Locking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-status-open flex-shrink-0" />
                <span>Multi-Role Access Control (RBAC)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-status-open flex-shrink-0" />
                <span>Automated Quiz & Homework Grading</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-status-open flex-shrink-0" />
                <span>Real-time Tamper-Proof Audit Trail</span>
              </div>
            </div>

            {/* Interactive Demo Personas Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Try a Demo Account
                  </h3>
                  <p className="text-xs text-ink font-medium mt-0.5">Instant one-click access with seeded academic data</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-control bg-paper text-muted border border-line font-mono tabular-nums">
                  pass: password123
                </span>
              </div>

              {/* 3 Interactive Persona Rows */}
              <div className="space-y-2.5">
                {/* Student */}
                <div
                  onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                  className="group p-3 rounded-control border border-line hover:border-accent bg-paper/40 hover:bg-surface cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-accent/10 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                          Grace Brewster
                        </p>
                        <Badge variant="outline">Student</Badge>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Enrolled student &bull; Read lessons, submit quizzes & assignments
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-accent group-hover:text-accent flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin('grace@student.lms.edu', 'Student');
                    }}
                  >
                    Launch &rarr;
                  </Button>
                </div>

                {/* Instructor */}
                <div
                  onClick={() => handleDemoLogin('ada@lms.edu', 'Instructor')}
                  className="group p-3 rounded-control border border-line hover:border-accent bg-paper/40 hover:bg-surface cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-accent/10 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                          Prof. Ada Lovelace
                        </p>
                        <Badge variant="outline">Instructor</Badge>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Course author &bull; Edit curriculum, draft quizzes & grade submissions
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-accent group-hover:text-accent flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin('ada@lms.edu', 'Instructor');
                    }}
                  >
                    Launch &rarr;
                  </Button>
                </div>

                {/* Admin */}
                <div
                  onClick={() => handleDemoLogin('admin@lms.edu', 'Admin')}
                  className="group p-3 rounded-control border border-line hover:border-accent bg-paper/40 hover:bg-surface cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-accent/10 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                          Alan Turing
                        </p>
                        <Badge variant="outline">Administrator</Badge>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Governance &bull; Live audit log, user directory & DB engine pool
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-accent group-hover:text-accent flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin('admin@lms.edu', 'Admin');
                    }}
                  >
                    Launch &rarr;
                  </Button>
                </div>
              </div>

              {/* Collapsible Custom Login Accordion */}
              <div className="pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowCustomLogin(!showCustomLogin)}
                  className="text-xs font-medium text-muted hover:text-ink flex items-center justify-between w-full py-1 transition-colors"
                >
                  <span>Or sign in with custom credentials</span>
                  {showCustomLogin ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showCustomLogin && (
                  <form onSubmit={handleInlineLogin} className="space-y-3 pt-3">
                    <Input
                      label="Email address"
                      type="email"
                      placeholder="name@example.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loginLoading}
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginLoading}
                      required
                    />
                    {loginError && <p className="text-xs text-status-full">{loginError}</p>}
                    <Button type="submit" variant="primary" size="md" loading={loginLoading} className="w-full">
                      Sign in
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Open for Enrollment Public Courses List */}
          <div className="lg:col-span-6 text-left">
            <Card
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <h2 className="text-sm font-semibold text-ink">Active Course Catalog</h2>
                  </div>
                  {!coursesLoading && !coursesError && (
                    <span className="text-xs text-muted tabular-nums">
                      {courses.length} {courses.length === 1 ? 'course open' : 'courses open'}
                    </span>
                  )}
                </div>
              }
            >
              {coursesLoading ? (
                <div className="divide-y divide-line">
                  <SkeletonRow cols={3} />
                  <SkeletonRow cols={3} />
                  <SkeletonRow cols={3} />
                  <SkeletonRow cols={3} />
                </div>
              ) : coursesError ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-status-full">{coursesError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCw className="w-3.5 h-3.5" />}
                    onClick={fetchPublicCourses}
                  >
                    Retry
                  </Button>
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No courses are open for enrollment yet.
                </div>
              ) : (
                <div className="divide-y divide-line -m-5">
                  {courses.map((c) => (
                    <div key={c.id} className="p-4 sm:p-5 hover:bg-paper/40 transition-colors duration-75 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-semibold text-accent px-1.5 py-0.5 rounded-control bg-accent/5 border border-accent/20 tabular-nums">
                              {c.code}
                            </span>
                            <span className="text-xs text-muted font-normal">&bull;</span>
                            <span className="text-xs font-medium text-muted">{c.category || 'Computer Science'}</span>
                          </div>
                          <h3 className="text-sm font-medium text-ink leading-snug">
                            {c.title}
                          </h3>
                        </div>
                        <Badge variant="outline">{c.level}</Badge>
                      </div>

                      <div className="text-xs text-muted flex items-center justify-between">
                        <span>Instructor: <strong className="text-ink font-normal">{c.instructorName || 'Faculty'}</strong></span>
                        <span className="tabular-nums text-[11px] text-muted">
                          {c.capacity - (c.enrolledCount || 0)} seats left
                        </span>
                      </div>

                      {/* Animated SeatBar with text */}
                      <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* System Architecture Strip: 4 Hairline Metric Cells */}
        <div className="border border-line rounded-container bg-surface grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line">
          <div className="p-5 space-y-1">
            <p className="text-xs text-muted font-normal">Automated Test Coverage</p>
            <p className="text-2xl font-serif text-ink tabular-nums">39 / 39</p>
            <p className="text-[11px] text-muted">JUnit 5 & Mockito test suite verified</p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-muted font-normal">Concurrency Isolation</p>
            <p className="text-2xl font-serif text-ink">ACID X-Lock</p>
            <p className="text-[11px] text-muted">InnoDB row-locking with 1213 retries</p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-muted font-normal">Data Access Engine</p>
            <p className="text-2xl font-serif text-ink">Pure JDBC 4.x</p>
            <p className="text-[11px] text-muted">HikariCP pool with zero ORM overhead</p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-muted font-normal">Servlet Specification</p>
            <p className="text-2xl font-serif text-ink">Jakarta 6.0</p>
            <p className="text-[11px] text-muted">Apache Tomcat 10.1 Web Runtime</p>
          </div>
        </div>

        {/* Capabilities by Role Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-serif text-ink font-normal">
              Engineered for every academic role.
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Polymorphic role-based security filters provide dedicated interfaces and granular permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Student Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5">
              <div className="w-8 h-8 rounded-control bg-paper border border-line flex items-center justify-center text-ink">
                <GraduationCap className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Student Experience</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Race-free catalog registration, curriculum reading with lesson tracking, and timed interactive assessments.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-2 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Concurrent registration with rollback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Instant auto-graded quiz scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Homework submission & grade tracking</span>
                </li>
              </ul>
            </div>

            {/* Instructor Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5">
              <div className="w-8 h-8 rounded-control bg-paper border border-line flex items-center justify-center text-ink">
                <BookOpen className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Instructor Studio</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Modular course authoring, assessment creation with custom weights, and student submission grading.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-2 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Curriculum module & lesson sequencing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Multiple-choice quiz question builder</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Dedicated grading drawer with feedback</span>
                </li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5">
              <div className="w-8 h-8 rounded-control bg-paper border border-line flex items-center justify-center text-ink">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Platform Governance</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Complete user directory administration, live database engine monitoring, and immutable transactional audit logs.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-2 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Real-time IP & actor audit logging</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>Role governance & user management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                  <span>MySQL InnoDB & H2 pool monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Informative Academic Footer */}
      <footer className="border-t border-line bg-surface py-6 mt-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-control bg-accent text-white flex items-center justify-center font-serif font-bold text-[11px]">
              L
            </div>
            <span className="text-ink font-medium">Department of Computer Science & Engineering</span>
            <span>&bull;</span>
            <span className="tabular-nums">Version 1.0.0</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-muted tabular-nums">
            <span>Apache Tomcat 10.1</span>
            <span>&bull;</span>
            <span>Jakarta Servlets 6.0</span>
            <span>&bull;</span>
            <span>JDBC 4.x</span>
            <span>&bull;</span>
            <span>MySQL 8.x / H2</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifsModal, setShowNotifsModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  const fetchNotifications = async () => {
    if (user) {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Set default active tab based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') setActiveTab('my');
      else if (user.role === 'INSTRUCTOR') setActiveTab('courses');
      else if (user.role === 'ADMIN') setActiveTab('overview');
    }
  }, [user]);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifications();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-2.5">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-muted">Connecting to server...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {user ? (
        <AppShell
          onOpenNotifications={() => setShowNotifsModal(true)}
          unreadNotifsCount={unreadCount}
          activeNavTab={activeTab}
          onNavTabChange={(tab) => setActiveTab(tab)}
          pageTitle={
            user.role === 'STUDENT'
              ? 'Student learning'
              : user.role === 'INSTRUCTOR'
              ? 'Instructor studio'
              : 'Administration'
          }
        >
          {user.role === 'ADMIN' && <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />}
          {user.role === 'INSTRUCTOR' && <InstructorDashboard activeTab={activeTab} onTabChange={setActiveTab} />}
          {user.role === 'STUDENT' && <StudentDashboard activeTab={activeTab} onTabChange={setActiveTab} />}
        </AppShell>
      ) : (
        <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
      )}

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <NotificationsModal
        isOpen={showNotifsModal}
        onClose={() => setShowNotifsModal(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </AuthProvider>
  );
};
