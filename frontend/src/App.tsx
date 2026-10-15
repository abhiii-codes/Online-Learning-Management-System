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
import { SYSTEM_METRICS, TEST_SUITE_SUMMARY } from './config/stats';
import {
  RotateCw, GraduationCap, BookOpen, ShieldCheck,
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Database, Lock, Terminal, Activity,
  Check, Play, Award, Cpu, Copy, Sun, Moon, Github
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, isDark, onToggleDark }) => {
  const { user, login, switchDemoUser } = useAuth();
  const { toast } = useToast();

  // Sign-in form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Interactive Product Preview Console State
  const [previewTab, setPreviewTab] = useState<'catalog' | 'student' | 'instructor' | 'sql'>('catalog');
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    '[12:50:01] HikariCP: LmsH2Pool initialized with 10 pooled connections (mode=MySQL-InnoDB)',
    '[12:50:02] Thread-1 (Student 2): START TRANSACTION ISOLATION LEVEL REPEATABLE READ',
    '[12:50:02] Thread-1: SELECT * FROM courses WHERE id = 10 FOR UPDATE /* takes row X-Lock */',
    '[12:50:02] Thread-1: Verified capacity (enrolled: 44, capacity: 45) -> slot available',
    '[12:50:02] Thread-2 (Student 3): SELECT * FROM courses WHERE id = 10 FOR UPDATE /* waits for lock */',
    '[12:50:02] Thread-1: UPDATE courses SET enrolled_count = 45 WHERE id = 10',
    '[12:50:02] Thread-1: INSERT INTO enrollments (user_id, course_id, status) VALUES (2, 10, \'ACTIVE\')',
    '[12:50:02] Thread-1: COMMIT -> X-Lock released (elapsed: 1.8ms)',
    '[12:50:02] Thread-2: Lock acquired -> checks capacity (45/45) -> throws CourseFullException (409)',
    '[12:50:02] Audit: Recorded ENROLL_SUCCESS for User 2, ENROLL_BLOCKED for User 3'
  ]);

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

  // Live seat counter for visual anchor (CS-301)
  const cs301Course = courses.find((c) => c.code === 'CS-301') || courses[0];
  const cs301SeatsLeft = cs301Course
    ? Math.max(0, cs301Course.capacity - (cs301Course.enrolledCount || 0))
    : 44;

  const handleCopyPassword = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('password123');
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 1500);
    }
  };

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

  const handleEnrollClick = async (courseId: number, courseCode: string) => {
    if (!user) {
      toast('Sign in as student first to enroll in courses. Click Grace Brewster above to test.', 'info');
      return;
    }
    if (user.role !== 'STUDENT') {
      toast('Only student accounts can enroll in courses.', 'error');
      return;
    }
    try {
      await api.enroll(courseId);
      toast(`Enrolled in ${courseCode}! Seat lock acquired and verified.`, 'success');
      // Update local state smoothly to animate seat count and progress bar
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c
        )
      );
    } catch (err: any) {
      toast(err.message || 'Enrollment failed', 'error');
    }
  };

  const handleSimulateLock = () => {
    setIsSimulating(true);
    const now = new Date().toTimeString().split(' ')[0];
    const newEvents = [
      `[${now}] High-Concurrency Spike: 20 parallel student threads attempting enrollment on Course #10...`,
      `[${now}] HikariCP: Dispatched worker connections across thread pool in 0.3ms`,
      `[${now}] Thread A acquired InnoDB X-Lock on Course #10. Threads B, C, D wait on lock queue.`,
      `[${now}] Thread A committed enrollment. Total seats now: 45/45.`,
      `[${now}] Thread B acquired lock -> detected course is full -> threw 409 Conflict without race drift.`,
      `[${now}] Audit: Recorded tamper-resistant audit entry with client IP & user context.`
    ];
    setTimeout(() => {
      setSimulatedLogs((prev) => [...newEvents, ...prev.slice(0, 10)]);
      setIsSimulating(false);
      // Simulate live seat update on CS-301 if available
      setCourses((prev) =>
        prev.map((c) =>
          c.code === 'CS-301' && c.enrolledCount < c.capacity
            ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 }
            : c
        )
      );
      toast('Concurrent transaction simulation completed: 0 lock drift', 'success');
    }, 450);
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'automated-tests':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'lock-latency':
        return <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'seat-overselling':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'architecture':
        return <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern relative overflow-hidden flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Ambient Top Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(47,75,208,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_70%)] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-line dark:border-slate-800 h-16 sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              L
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-ink dark:text-white tracking-tight">ONLINE LMS</span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900 font-semibold tabular-nums">
                  v1.0 &bull; Tomcat 10.1
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Same constant from stats config used in navbar */}
            <div className="hidden md:flex items-center space-x-2 text-xs text-muted dark:text-slate-400 px-3 py-1.5 rounded-full bg-paper dark:bg-slate-800 border border-line dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-ink dark:text-slate-200">System Online</span>
              <span>&bull;</span>
              <span className="tabular-nums font-mono">{TEST_SUITE_SUMMARY}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-muted hover:text-ink dark:text-slate-400 dark:hover:text-white bg-paper dark:bg-slate-800 border border-line dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Ghost / Outline style in dark mode */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenAuth}
              className="font-medium shadow-sm dark:bg-transparent dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open custom sign in dialog"
            >
              Custom sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex-1 space-y-12 sm:space-y-14 relative z-10">
        
        {/* HERO: Centered, Clean Gradient, Tight 2-Line Subtext & Live Anchor */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Top Pill updated to Pure Java · Zero-ORM */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800/90 border border-line dark:border-slate-700 shadow-sm text-xs text-muted dark:text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span className="font-semibold text-ink dark:text-slate-200">Pure Java &bull; Zero-ORM</span>
            <span>&bull;</span>
            <span>HikariCP & JDBC</span>
          </div>

          {/* Headline with lighter gradient in dark mode */}
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-sans font-bold tracking-tight text-ink dark:text-white leading-[1.12]">
            Academic Learning Platform, <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Engineered for Concurrency.
            </span>
          </h1>

          {/* Shortened subtext: at most 2 lines */}
          <p className="text-sm sm:text-base text-muted dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Multi-role academic platform powered by Jakarta Servlets 6.0 and MySQL InnoDB (H2 in demo mode). Eliminates seat drift with atomic transactions and auto-grades assessments.
          </p>

          {/* Live Seat Counter Visual Anchor: "Live from DB" */}
          <div className="flex items-center justify-center pt-1">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-900/60 shadow-sm text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-ink dark:text-slate-200">CS-301</span>
              <span className="text-muted dark:text-slate-500">&bull;</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums transition-all duration-300">
                {cs301SeatsLeft} seats left
              </span>
              <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                Live from DB
              </span>
            </div>
          </div>

          {/* 3 Prominent One-Click Demo Launch Persona Cards */}
          <div className="pt-3 max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-slate-400 pb-3">
              Click any demo account to test live workflows immediately:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left items-stretch">
              {/* Student Persona: Blue top border, hover lift, high-contrast email chip */}
              <div
                onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                className="group relative p-4 rounded-xl border border-line dark:border-slate-800 border-t-4 border-t-blue-500 bg-surface dark:bg-slate-900 hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-200 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Student
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Grace Brewster
                    </h3>
                    <div className="mt-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-paper dark:bg-slate-800 px-2 py-0.5 rounded border border-line dark:border-slate-700 select-all w-fit font-medium">
                      grace@student.lms.edu
                    </div>
                    <p className="text-xs text-muted dark:text-slate-400 leading-snug mt-1.5">
                      Browse courses, read lessons, take quizzes & track grades.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDemoLogin('grace@student.lms.edu', 'Student');
                  }}
                  aria-label="Launch Student Portal as Grace Brewster"
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none transition-colors"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Instructor Persona: Green top border, hover lift, high-contrast email chip */}
              <div
                onClick={() => handleDemoLogin('ada@lms.edu', 'Instructor')}
                className="group relative p-4 rounded-xl border border-line dark:border-slate-800 border-t-4 border-t-emerald-500 bg-surface dark:bg-slate-900 hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-200 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Instructor
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Prof. Ada Lovelace
                    </h3>
                    <div className="mt-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-paper dark:bg-slate-800 px-2 py-0.5 rounded border border-line dark:border-slate-700 select-all w-fit font-medium">
                      ada@lms.edu
                    </div>
                    <p className="text-xs text-muted dark:text-slate-400 leading-snug mt-1.5">
                      Author modules, create quizzes, and evaluate submissions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDemoLogin('ada@lms.edu', 'Instructor');
                  }}
                  aria-label="Launch Instructor Studio as Ada Lovelace"
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none transition-colors"
                >
                  <span>Launch Instructor Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Admin Persona: Purple top border, hover lift, high-contrast email chip */}
              <div
                onClick={() => handleDemoLogin('admin@lms.edu', 'Admin')}
                className="group relative p-4 rounded-xl border border-line dark:border-slate-800 border-t-4 border-t-purple-500 bg-surface dark:bg-slate-900 hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-200 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                      Admin
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Alan Turing
                    </h3>
                    <div className="mt-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-paper dark:bg-slate-800 px-2 py-0.5 rounded border border-line dark:border-slate-700 select-all w-fit font-medium">
                      admin@lms.edu
                    </div>
                    <p className="text-xs text-muted dark:text-slate-400 leading-snug mt-1.5">
                      Real-time audit log, user management & DB engine pool.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDemoLogin('admin@lms.edu', 'Admin');
                  }}
                  aria-label="Launch Admin Console as Alan Turing"
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none transition-colors"
                >
                  <span>Launch Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom sign-in accordion & Copy Password Chip */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted dark:text-slate-400">
              <span>Demo password:</span>
              <button
                type="button"
                onClick={handleCopyPassword}
                aria-label="Copy demo password password123 to clipboard"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-slate-200 hover:border-accent hover:text-accent font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <span>password123</span>
                {copiedPassword ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans">Copied!</span>
                ) : (
                  <Copy className="w-3 h-3 text-muted dark:text-slate-400" />
                )}
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setShowCustomLogin(!showCustomLogin)}
                className="text-accent dark:text-blue-400 hover:underline font-medium flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
                aria-label="Toggle custom credentials login form"
              >
                <span>Or sign in with custom credentials</span>
                {showCustomLogin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showCustomLogin && (
              <div className="mt-4 p-5 max-w-md mx-auto bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl shadow-md text-left transition-colors duration-200">
                <form onSubmit={handleInlineLogin} className="space-y-3.5">
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
              </div>
            )}
          </div>
        </div>

        {/* APPLICATION VIEWPORT MOCKUP: Live Sandbox */}
        <div className="rounded-2xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-xl overflow-hidden transition-colors duration-200">
          {/* Mockup Window Chrome Header */}
          <div className="bg-[#1E2330] text-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-sm" />
              <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                https://online-lms.edu/interactive-sandbox
              </span>
            </div>

            {/* 4 Interactive Feature Showcase Tabs */}
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setPreviewTab('catalog')}
                aria-label="View live course catalog tab"
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                  previewTab === 'catalog'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Live Course Catalog</span>
                <span className="text-[10px] px-1 rounded bg-black/20 font-mono">{courses.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('student')}
                aria-label="View student player and quiz tab"
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                  previewTab === 'student'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Player & Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('instructor')}
                aria-label="View instructor grading drawer tab"
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                  previewTab === 'instructor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Instructor Grading</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('sql')}
                aria-label="View SQL concurrency engine terminal tab"
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                  previewTab === 'sql'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>SQL Concurrency Engine</span>
              </button>
            </div>
          </div>

          {/* Window Body */}
          <div className="p-5 sm:p-8 bg-[#FAFAFC] dark:bg-slate-900/60 transition-colors duration-200">
            {/* Tab 1: Live Catalog with Consistent Gradient Saturation & Animated SeatBars */}
            {previewTab === 'catalog' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-line dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-ink dark:text-white">Active Academic Catalog (Live Database)</h3>
                    <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                      Real-time registration state verified with pessimistic locking on MySQL InnoDB (H2 in demo mode).
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCw className="w-3.5 h-3.5" />}
                    onClick={fetchPublicCourses}
                    aria-label="Refresh database courses state"
                  >
                    Refresh DB State
                  </Button>
                </div>

                {coursesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  </div>
                ) : courses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted dark:text-slate-400">No courses available.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {courses.map((c, idx) => {
                      // Balanced, consistent saturation headers
                      const bannerGradients = [
                        'from-blue-600 to-indigo-600',
                        'from-emerald-600 to-teal-600',
                        'from-purple-600 to-indigo-600'
                      ];
                      const banner = bannerGradients[idx % bannerGradients.length];

                      return (
                        <div
                          key={c.id}
                          className="group bg-surface dark:bg-slate-900 rounded-xl border border-line dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                          <div>
                            {/* Course Banner */}
                            <div className={`p-4 bg-gradient-to-r ${banner} text-white flex items-center justify-between`}>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-xs bg-black/20 px-2 py-0.5 rounded">
                                  {c.code}
                                </span>
                                <span className="text-[11px] font-medium opacity-90">{c.category || 'Computer Science'}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20">
                                {c.level}
                              </span>
                            </div>

                            {/* Card Content with Seats-Left SeatBar */}
                            <div className="p-5 space-y-3">
                              <h4 className="font-bold text-sm text-ink dark:text-white leading-snug group-hover:text-accent dark:group-hover:text-blue-400 transition-colors">
                                {c.title}
                              </h4>
                              <p className="text-xs text-muted dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {c.description || 'Comprehensive curriculum with hands-on labs and automated quizzes.'}
                              </p>

                              <div className="pt-2 flex items-center justify-between text-xs text-muted dark:text-slate-400">
                                <span>Instructor: <strong className="text-ink dark:text-slate-200 font-semibold">{c.instructorName || 'Faculty'}</strong></span>
                              </div>

                              {/* Availability colored SeatBar showing seats left */}
                              <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="p-4 bg-paper/60 dark:bg-slate-800/40 border-t border-line dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-muted dark:text-slate-400">Pessimistic X-Lock</span>
                            <button
                              type="button"
                              onClick={() => handleEnrollClick(c.id, c.code)}
                              aria-label={`Enroll in ${c.title} as Student`}
                              className="text-xs font-semibold text-accent dark:text-blue-400 hover:text-accent-hover dark:hover:text-blue-300 flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-2 py-1 transition-colors"
                            >
                              <span>Enroll as Student</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Interactive Student Player & Live Quiz Preview */}
            {previewTab === 'student' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line dark:border-slate-800">
                    <span className="text-xs font-bold text-ink dark:text-white uppercase tracking-wider">Curriculum Outline</span>
                    <Badge variant="open">Lesson 2 Active</Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-ink dark:text-slate-200">Lesson 1: HikariCP & JDBC Setup</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Completed</span>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                        <span className="font-bold text-blue-900 dark:text-blue-200">Lesson 2: Pessimistic Row Locking</span>
                      </div>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold">Reading now</span>
                    </div>

                    <div className="p-3 rounded-lg bg-paper dark:bg-slate-800/60 border border-line dark:border-slate-700 flex items-center justify-between text-muted dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Lesson 3: Deadlock Retry Strategy (Error 1213)</span>
                      </div>
                      <span className="text-[10px]">Next</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-ink dark:text-white">Live Interactive Assessment</h4>
                      <p className="text-xs text-muted dark:text-slate-400">Test your concurrency knowledge right now</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      10 Points
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-ink dark:text-slate-200 leading-relaxed font-medium">
                    Which SQL clause takes an exclusive row X-lock on the course record in MySQL InnoDB (H2 in demo mode) to prevent over-enrollment race conditions?
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setQuizAnswered('A')}
                      aria-label="Select answer A"
                      className={`w-full text-left p-3 rounded-lg text-xs border font-medium transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                        quizAnswered === 'A'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                          : 'bg-paper/50 dark:bg-slate-800/50 border-line dark:border-slate-700 text-ink dark:text-slate-200 hover:bg-paper dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>A) SELECT * FROM courses WHERE id = ? FOR UPDATE</span>
                      {quizAnswered === 'A' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 font-bold" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuizAnswered('B')}
                      aria-label="Select answer B"
                      className={`w-full text-left p-3 rounded-lg text-xs border font-medium transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                        quizAnswered === 'B'
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-800 dark:text-rose-300'
                          : 'bg-paper/50 dark:bg-slate-800/50 border-line dark:border-slate-700 text-ink dark:text-slate-200 hover:bg-paper dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>B) SELECT * FROM courses WHERE id = ? LOCK IN SHARE MODE</span>
                      {quizAnswered === 'B' && <span className="text-[10px] text-rose-600 dark:text-rose-400">Incorrect: S-locks cause deadlocks</span>}
                    </button>
                  </div>

                  {quizAnswered === 'A' && (
                    <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span><strong>Correct!</strong> `FOR UPDATE` takes an exclusive X-lock, serializing enrollments and eliminating seat drift.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Instructor Grading Preview */}
            {previewTab === 'instructor' && (
              <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-ink dark:text-white">Instructor Grading Queue</h4>
                    <p className="text-xs text-muted dark:text-slate-400">Reviewing student submission for CS-204 Lab 2</p>
                  </div>
                  <Badge variant="open">1 Pending Review</Badge>
                </div>

                <div className="p-4 rounded-xl bg-paper/60 dark:bg-slate-800/60 border border-line dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink dark:text-white">Student: Grace Brewster (#2)</span>
                    <span className="text-muted dark:text-slate-400">Submitted 2h ago &bull; Verified Git Repo</span>
                  </div>

                  <p className="text-xs text-muted dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded border border-line dark:border-slate-700 leading-relaxed">
                    &quot;Attached schema.sql with composite B-Tree index on (course_id, status). Verified with EXPLAIN ANALYZE: query execution cost dropped from 14.2 to 0.45.&quot;
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-semibold text-ink dark:text-slate-200">Assigned Grade:</span>
                      <span className="px-3 py-1 font-mono font-bold text-base bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                        96 / 100
                      </span>
                    </div>

                    <div className="text-xs text-muted dark:text-slate-400">
                      Feedback: <em className="text-ink dark:text-slate-200 font-medium">&quot;Outstanding analysis of composite index ordering.&quot;</em>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: SQL Concurrency Engine Terminal */}
            {previewTab === 'sql' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-ink dark:text-white">HikariCP & MySQL InnoDB (H2 in demo mode) Transaction Stream</h4>
                    <p className="text-xs text-muted dark:text-slate-400">Simulate 20 concurrent threads attempting enrollment on the same row</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isSimulating}
                    onClick={handleSimulateLock}
                    icon={<Activity className="w-3.5 h-3.5" />}
                    aria-label="Simulate 20-thread concurrency spike"
                  >
                    Simulate 20-Thread Spike
                  </Button>
                </div>

                <div className="bg-[#10141E] text-slate-200 p-5 rounded-xl font-mono text-xs leading-relaxed max-h-80 overflow-y-auto border border-slate-700 shadow-inner space-y-1.5">
                  {simulatedLogs.map((log, idx) => (
                    <p
                      key={idx}
                      className={`${
                        log.includes('X-Lock') || log.includes('FOR UPDATE')
                          ? 'text-amber-300 font-semibold'
                          : log.includes('409') || log.includes('BLOCKED')
                          ? 'text-rose-400'
                          : log.includes('COMMIT') || log.includes('SUCCESS')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }`}
                    >
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM SPECS STRIP: Read directly from config/stats.ts with Icons & Audited Provenance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="p-5 sm:p-6 rounded-xl bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 shadow-sm space-y-1.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              title={metric.source}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider">
                  {metric.label}
                </p>
                {getMetricIcon(metric.id)}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tabular-nums">
                {metric.value ?? '—'}
              </p>
              <p className="text-xs text-muted dark:text-slate-400 font-medium">
                {metric.caption}
              </p>
            </div>
          ))}
        </div>

        {/* THREE ROLES MATRIX: Gap reduced by ~30%, checklist trimmed to max ~5 words per item */}
        <div className="space-y-6 pt-2">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-white">Built for every academic role.</h2>
            {/* Updated copy: role-based access filters */}
            <p className="text-xs sm:text-sm text-muted dark:text-slate-400">
              Dedicated interfaces with role-based access filters and full session isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Student Experience */}
            <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink dark:text-white">Student Experience</h3>
                <p className="text-xs text-muted dark:text-slate-400 leading-relaxed mt-1">
                  Pessimistic registration defense, interactive lesson reader, and auto-graded multiple-choice quizzes.
                </p>
              </div>
              <ul className="text-xs text-muted dark:text-slate-300 space-y-2.5 pt-3 border-t border-line dark:border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Race-free enrollment with rollback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Instant auto-graded quiz scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Track assignment progress & grades</span>
                </li>
              </ul>
            </div>

            {/* Instructor Studio */}
            <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink dark:text-white">Instructor Studio</h3>
                <p className="text-xs text-muted dark:text-slate-400 leading-relaxed mt-1">
                  Modular curriculum authoring, timed assessment configuration with custom weights, and student grading.
                </p>
              </div>
              <ul className="text-xs text-muted dark:text-slate-300 space-y-2.5 pt-3 border-t border-line dark:border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Modular course curriculum authoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Custom quiz & answer builder</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Dedicated grading drawer & feedback</span>
                </li>
              </ul>
            </div>

            {/* Platform Governance */}
            <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink dark:text-white">Platform Governance</h3>
                {/* Updated copy: audit logs */}
                <p className="text-xs text-muted dark:text-slate-400 leading-relaxed mt-1">
                  Full user directory governance, live database engine monitoring, and audit logs.
                </p>
              </div>
              <ul className="text-xs text-muted dark:text-slate-300 space-y-2.5 pt-3 border-t border-line dark:border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Real-time actor audit logging</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>User directory & role governance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Live DB connection telemetry</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* MINIMAL FOOTER: Project Name, Tech Stack Line, GitHub Link Placeholder, Review 1 Credit */}
      <footer className="border-t border-line dark:border-slate-800 bg-surface dark:bg-slate-900 py-6 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted dark:text-slate-400">
          <div className="flex items-center space-x-2.5">
            <span className="text-ink dark:text-white font-bold tracking-tight">Online LMS</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200/50 dark:border-blue-900/50">
              Review 1
            </span>
          </div>

          <div className="text-center font-mono text-[11px] text-muted dark:text-slate-400">
            Jakarta Servlets 6.0 &bull; JDBC 4.x &bull; MySQL (H2 fallback) &bull; React 18
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="#github-repo"
              onClick={(e) => {
                e.preventDefault();
                toast('Repository link: CSE Third Semester Pure Java Project', 'info');
              }}
              aria-label="View source repository on GitHub"
              className="hover:text-ink dark:hover:text-white flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-1.5 py-0.5 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
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

  // Dark mode state: persisted in localStorage and defaults to system preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

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
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-slate-900 transition-colors">
        <div className="text-center space-y-2.5">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-muted dark:text-slate-400">Connecting to server...</p>
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
        <LandingPage
          onOpenAuth={() => setShowAuthModal(true)}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
        />
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
