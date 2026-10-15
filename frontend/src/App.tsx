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
  Server, Database, Lock, Layers, Terminal, Activity,
  FileCheck, Check, Play, Award, Sparkles, UserCheck
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

  // Interactive Product Preview Console State
  const [previewTab, setPreviewTab] = useState<'catalog' | 'student' | 'instructor' | 'sql'>('catalog');
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    '[12:35:01] HikariCP: LmsH2Pool initialized with 10 pooled connections (mode=MySQL-InnoDB)',
    '[12:35:02] Thread-1 (Student 2): START TRANSACTION ISOLATION LEVEL REPEATABLE READ',
    '[12:35:02] Thread-1: SELECT * FROM courses WHERE id = 10 FOR UPDATE /* takes row X-Lock */',
    '[12:35:02] Thread-1: Verified capacity (enrolled: 44, capacity: 45) -> slot available',
    '[12:35:02] Thread-2 (Student 3): SELECT * FROM courses WHERE id = 10 FOR UPDATE /* waits for lock */',
    '[12:35:02] Thread-1: UPDATE courses SET enrolled_count = 45 WHERE id = 10',
    '[12:35:02] Thread-1: INSERT INTO enrollments (user_id, course_id, status) VALUES (2, 10, \'ACTIVE\')',
    '[12:35:02] Thread-1: COMMIT -> X-Lock released (elapsed: 1.8ms)',
    '[12:35:02] Thread-2: Lock acquired -> checks capacity (45/45) -> throws CourseFullException (409)',
    '[12:35:02] Audit: Recorded ENROLL_SUCCESS for User 2, ENROLL_BLOCKED for User 3'
  ]);

  const handleSimulateLock = () => {
    setIsSimulating(true);
    const now = new Date().toTimeString().split(' ')[0];
    const newEvents = [
      `[${now}] High-Concurrency Burst: 5 parallel student threads attempting enrollment on Course #10...`,
      `[${now}] HikariCP: Borrowed pooled connections across worker threads in 0.4ms`,
      `[${now}] Thread A acquired InnoDB X-Lock on Course #10. Threads B, C, D wait gracefully.`,
      `[${now}] Thread A committed enrollment. Total seats now: 45/45.`,
      `[${now}] Thread B acquired lock -> detected course is full -> threw 409 Conflict without race drift.`,
      `[${now}] Audit: Recorded tamper-resistant log entry with client IP & user context.`
    ];
    setTimeout(() => {
      setSimulatedLogs((prev) => [...newEvents, ...prev.slice(0, 12)]);
      setIsSimulating(false);
      toast('Concurrent transaction simulation completed: 0 lock drift', 'success');
    }, 450);
  };

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
    <div className="min-h-screen bg-grid-pattern relative overflow-hidden flex flex-col justify-between font-sans">
      {/* Subtle Ambient Radial Lighting at Top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(47,75,208,0.08),transparent_70%)] pointer-events-none" />

      {/* Precision Top Navigation Bar */}
      <header className="bg-surface/95 backdrop-blur-md border-b border-line h-14 sticky top-0 z-30 shadow-none">
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
              Custom sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full flex-1 space-y-14 relative z-10">
        {/* Two-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Heading, Tech Highlights, Interactive Demo Hub */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-control bg-surface border border-line text-xs text-ink font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Pure Java Enterprise Stack &bull; Apache Tomcat 10.1</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-ink font-normal tracking-tight leading-[1.12]">
                Academic learning platform, <span className="text-accent">engineered from scratch.</span>
              </h1>

              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-[55ch]">
                A robust multi-role LMS powered by HikariCP, ACID transactions, and InnoDB row-level locking for zero-drift enrollments, modular curriculum delivery, and automated assessments.
              </p>
            </div>

            {/* Quick Technical Highlights with Green Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink pt-1">
              <div className="flex items-center space-x-2 p-1.5 rounded-control bg-surface border border-line/80 shadow-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">InnoDB Row X-Locking</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded-control bg-surface border border-line/80 shadow-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">Role-Based Security (RBAC)</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded-control bg-surface border border-line/80 shadow-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">Auto-Graded Quizzes</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded-control bg-surface border border-line/80 shadow-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-open flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">Immutable Audit Trail</span>
              </div>
            </div>

            {/* Interactive Demo Personas Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-4 shadow-sm">
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

              {/* 3 Interactive Persona Rows with Distinct Accents */}
              <div className="space-y-2.5">
                {/* Student */}
                <div
                  onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                  className="group p-3 rounded-control border border-line hover:border-blue-400 bg-paper/40 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between shadow-none hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-blue-700 transition-colors">
                          Grace Brewster
                        </p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-blue-100 text-blue-800 font-medium">Student</span>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Read lessons, submit quizzes & assignments
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-blue-500 group-hover:text-blue-700 flex-shrink-0"
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
                  className="group p-3 rounded-control border border-line hover:border-emerald-400 bg-paper/40 hover:bg-emerald-50/30 cursor-pointer transition-all flex items-center justify-between shadow-none hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-emerald-700 transition-colors">
                          Prof. Ada Lovelace
                        </p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-emerald-100 text-emerald-800 font-medium">Instructor</span>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Author modules, draft quizzes & grade submissions
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-emerald-500 group-hover:text-emerald-700 flex-shrink-0"
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
                  className="group p-3 rounded-control border border-line hover:border-purple-400 bg-paper/40 hover:bg-purple-50/30 cursor-pointer transition-all flex items-center justify-between shadow-none hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-control bg-purple-100/70 border border-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-purple-700 transition-colors">
                          Alan Turing
                        </p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-purple-100 text-purple-800 font-medium">Administrator</span>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        Live audit trail, user directory & DB engine pool
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loginLoading}
                    className="group-hover:border-purple-500 group-hover:text-purple-700 flex-shrink-0"
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

          {/* Right Column: Interactive Product Console (Multi-Tab Showcase) */}
          <div className="lg:col-span-7 text-left">
            <div className="bg-surface border border-line rounded-container overflow-hidden shadow-sm">
              {/* Interactive Tabs Header */}
              <div className="flex border-b border-line bg-paper/60 p-1.5 gap-1 text-xs overflow-x-auto">
                <button
                  onClick={() => setPreviewTab('catalog')}
                  className={`px-3 py-1.5 rounded-control font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                    previewTab === 'catalog'
                      ? 'bg-surface text-ink border border-line shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-accent" />
                  <span>Live Catalog</span>
                  <span className="text-[10px] px-1 rounded bg-accent/10 text-accent font-mono tabular-nums">{courses.length}</span>
                </button>

                <button
                  onClick={() => setPreviewTab('student')}
                  className={`px-3 py-1.5 rounded-control font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                    previewTab === 'student'
                      ? 'bg-surface text-ink border border-line shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Player</span>
                </button>

                <button
                  onClick={() => setPreviewTab('instructor')}
                  className={`px-3 py-1.5 rounded-control font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                    previewTab === 'instructor'
                      ? 'bg-surface text-ink border border-line shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instructor Studio</span>
                </button>

                <button
                  onClick={() => setPreviewTab('sql')}
                  className={`px-3 py-1.5 rounded-control font-medium flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                    previewTab === 'sql'
                      ? 'bg-surface text-ink border border-line shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-600" />
                  <span>SQL Lock Inspector</span>
                </button>
              </div>

              {/* Tab 1: Live Catalog */}
              {previewTab === 'catalog' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Open for Live Enrollment
                    </span>
                    <span className="text-[11px] text-muted tabular-nums">
                      {courses.length} active courses in DB
                    </span>
                  </div>

                  {coursesLoading ? (
                    <div className="divide-y divide-line">
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                    </div>
                  ) : coursesError ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-status-full">{coursesError}</p>
                      <Button variant="secondary" size="sm" icon={<RotateCw className="w-3.5 h-3.5" />} onClick={fetchPublicCourses}>
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-line -mx-5 -mb-5">
                      {courses.map((c) => (
                        <div key={c.id} className="p-4 sm:p-5 hover:bg-paper/40 transition-colors duration-75 space-y-2.5">
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

                          <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Interactive Student Player Preview */}
              {previewTab === 'student' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                        Interactive Player Preview
                      </span>
                      <p className="text-xs text-ink font-medium">CS-301: Enterprise Web Architecture</p>
                    </div>
                    <Badge variant="open">Lesson 2 Active</Badge>
                  </div>

                  {/* Curriculum timeline */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-control bg-paper border border-line space-y-1">
                      <p className="font-medium text-ink flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-status-open" />
                        <span>Lesson 1</span>
                      </p>
                      <p className="text-[11px] text-muted truncate">HikariCP Setup</p>
                    </div>
                    <div className="p-2.5 rounded-control bg-blue-50/60 border border-blue-300 space-y-1">
                      <p className="font-medium text-blue-800 flex items-center space-x-1.5">
                        <Play className="w-3 h-3 text-blue-700 fill-blue-700" />
                        <span>Lesson 2</span>
                      </p>
                      <p className="text-[11px] text-blue-700 truncate">Pessimistic Locks</p>
                    </div>
                    <div className="p-2.5 rounded-control bg-paper border border-line space-y-1">
                      <p className="font-medium text-muted flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted" />
                        <span>Quiz 1</span>
                      </p>
                      <p className="text-[11px] text-muted truncate">ACID Isolation</p>
                    </div>
                  </div>

                  {/* Interactive Mini-Quiz */}
                  <div className="p-4 rounded-control bg-surface border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Interactive Knowledge Check</span>
                      <span className="text-[11px] text-muted">10 Points</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Which SQL clause enforces exclusive row-locking in InnoDB under REPEATABLE READ to prevent double-enrollment race conditions?
                    </p>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => setQuizAnswered('A')}
                        className={`w-full text-left p-2.5 rounded-control text-xs border transition-colors flex items-center justify-between ${
                          quizAnswered === 'A'
                            ? 'bg-status-open/10 border-status-open text-status-open font-medium'
                            : 'bg-paper/40 border-line text-ink hover:bg-paper'
                        }`}
                      >
                        <span>A) SELECT * FROM courses WHERE id = ? FOR UPDATE</span>
                        {quizAnswered === 'A' && <Check className="w-4 h-4 text-status-open" />}
                      </button>

                      <button
                        onClick={() => setQuizAnswered('B')}
                        className={`w-full text-left p-2.5 rounded-control text-xs border transition-colors flex items-center justify-between ${
                          quizAnswered === 'B'
                            ? 'bg-status-full/10 border-status-full text-status-full font-medium'
                            : 'bg-paper/40 border-line text-ink hover:bg-paper'
                        }`}
                      >
                        <span>B) SELECT * FROM courses WHERE id = ? LOCK IN SHARE MODE</span>
                        {quizAnswered === 'B' && <span className="text-[10px] text-status-full">Causes S-lock deadlocks</span>}
                      </button>
                    </div>

                    {quizAnswered === 'A' && (
                      <p className="text-[11px] text-status-open bg-status-open/5 p-2 rounded-control border border-status-open/20">
                        &bull; Correct! The exclusive X-Lock prevents concurrent transactions from reading stale seat tallies.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Interactive Instructor Studio Preview */}
              {previewTab === 'instructor' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Instructor Evaluation Drawer
                      </span>
                      <p className="text-xs text-ink font-medium">CS-204: Relational Database Design</p>
                    </div>
                    <Badge variant="neutral">Pending Review</Badge>
                  </div>

                  <div className="p-4 rounded-control bg-paper/50 border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Grace Brewster &bull; Assignment 1</span>
                      <span className="text-[11px] text-muted">Submitted 2h ago</span>
                    </div>
                    <p className="text-xs text-muted bg-surface p-2.5 rounded border border-line font-mono text-[11px] leading-relaxed">
                      &quot;Implemented composite index on (course_id, status) in schema.sql. EXPLAIN plan confirmed index range scan eliminating table scans.&quot;
                    </p>

                    <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted">Grade:</span>
                        <input
                          type="number"
                          value={96}
                          readOnly
                          className="w-16 px-2 py-1 text-xs font-mono font-semibold text-center border border-line rounded bg-surface text-ink"
                        />
                        <span className="text-xs text-muted">/ 100</span>
                      </div>
                      <Badge variant="open">Graded &bull; 96%</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: SQL Concurrency Engine & Terminal Inspector */}
              {previewTab === 'sql' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                        Live InnoDB Transaction Inspector
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isSimulating}
                      onClick={handleSimulateLock}
                      icon={<Activity className="w-3.5 h-3.5" />}
                    >
                      Simulate 5-Thread Lock
                    </Button>
                  </div>

                  {/* Dark Terminal Output Frame */}
                  <div className="bg-[#181C24] text-[#E2E8F0] p-4 rounded-control font-mono text-[11px] leading-relaxed space-y-1.5 max-h-72 overflow-y-auto border border-line shadow-inner">
                    <div className="flex items-center space-x-1.5 pb-2 border-b border-white/10 text-white/50 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                      <span className="ml-2 font-mono">lms-tomcat-worker &bull; HikariPool Connection Stream</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {simulatedLogs.map((log, idx) => (
                        <p
                          key={idx}
                          className={`${
                            log.includes('X-Lock') || log.includes('FOR UPDATE')
                              ? 'text-yellow-300'
                              : log.includes('409') || log.includes('BLOCKED')
                              ? 'text-red-400'
                              : log.includes('COMMIT') || log.includes('SUCCESS')
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Architecture Strip: 4 Hairline Metric Cells */}
        <div className="border border-line rounded-container bg-surface grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line shadow-sm">
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
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-control bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <GraduationCap className="w-4 h-4" />
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
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-control bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <BookOpen className="w-4 h-4" />
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
            <div className="bg-surface border border-line rounded-container p-5 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-control bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <ShieldCheck className="w-4 h-4" />
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
