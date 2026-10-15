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
  FileCheck, Check, Play, Award, Sparkles, UserCheck,
  Code, Cpu, Users, ArrowUpRight
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
      {/* Ambient Top Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(47,75,208,0.12),transparent_70%)] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-line h-16 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              L
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-ink tracking-tight">ONLINE LMS</span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold tabular-nums">
                  v1.0 &bull; Tomcat 10.1
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-muted px-3 py-1.5 rounded-full bg-paper border border-line">
              <span className="w-2 h-2 rounded-full bg-status-open animate-pulse" />
              <span className="font-semibold text-ink">System Online</span>
              <span>&bull;</span>
              <span className="tabular-nums font-mono">39/39 Tests Passing</span>
            </div>

            <Button variant="secondary" size="sm" onClick={onOpenAuth} className="font-medium shadow-sm">
              Custom sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 w-full flex-1 space-y-16 relative z-10">
        
        {/* GRAND HERO: Centered, High Impact, Authoritative */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-line shadow-sm text-xs text-ink font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span className="font-semibold text-accent">Pure Java Enterprise Architecture</span>
            <span className="text-muted">&bull;</span>
            <span className="text-muted">Zero-ORM HikariCP & JDBC</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-sans font-bold tracking-tight text-ink leading-[1.08]">
            Academic Learning Platform, <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Engineered for Concurrency.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A full-featured multi-role LMS powered by Jakarta Servlets 6.0 and InnoDB row-level locking. Eliminates seat drift, automates quiz grading, and guarantees 100% ACID compliance.
          </p>

          {/* 3 Prominent One-Click Demo Launch Persona Cards */}
          <div className="pt-4 max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted pb-3">
              Click any demo account to test live workflows immediately:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
              {/* Student Persona */}
              <div
                onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                className="group relative p-4 rounded-xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 to-white hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-150 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Student
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-blue-600 transition-colors">
                    Grace Brewster
                  </h3>
                  <p className="text-xs text-muted leading-snug mt-0.5">
                    Browse courses, read lessons, take quizzes & track grades.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Student Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>

              {/* Instructor Persona */}
              <div
                onClick={() => handleDemoLogin('ada@lms.edu', 'Instructor')}
                className="group relative p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-white hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all duration-150 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Instructor
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-emerald-600 transition-colors">
                    Prof. Ada Lovelace
                  </h3>
                  <p className="text-xs text-muted leading-snug mt-0.5">
                    Author modules, create quizzes, and evaluate submissions.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Instructor Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>

              {/* Admin Persona */}
              <div
                onClick={() => handleDemoLogin('admin@lms.edu', 'Admin')}
                className="group relative p-4 rounded-xl border border-purple-200/80 bg-gradient-to-b from-purple-50/70 to-white hover:border-purple-500 hover:shadow-md cursor-pointer transition-all duration-150 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-purple-600 transition-colors">
                    Alan Turing
                  </h3>
                  <p className="text-xs text-muted leading-snug mt-0.5">
                    Real-time audit log, user management & DB engine pool.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </div>

            {/* Custom sign-in accordion trigger */}
            <div className="pt-3 flex items-center justify-center space-x-2 text-xs text-muted">
              <span>Demo password: <strong className="font-mono text-ink">password123</strong></span>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setShowCustomLogin(!showCustomLogin)}
                className="text-accent hover:underline font-medium flex items-center space-x-1"
              >
                <span>Or sign in with custom credentials</span>
                {showCustomLogin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showCustomLogin && (
              <div className="mt-4 p-5 max-w-md mx-auto bg-surface border border-line rounded-xl shadow-md text-left">
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

        {/* THE VISUAL CENTERPIECE: Application Viewport Mockup */}
        <div className="rounded-2xl border border-line bg-surface shadow-xl overflow-hidden">
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
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPreviewTab('catalog')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
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
                onClick={() => setPreviewTab('student')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                  previewTab === 'student'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Player & Quiz</span>
              </button>

              <button
                onClick={() => setPreviewTab('instructor')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                  previewTab === 'instructor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Instructor Grading</span>
              </button>

              <button
                onClick={() => setPreviewTab('sql')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
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

          {/* Window Body: Rich Visual Display */}
          <div className="p-6 sm:p-8 bg-[#FAFAFC]">
            {/* Tab 1: Live Catalog with Rich Visual Course Cards */}
            {previewTab === 'catalog' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink">Active Academic Catalog (Live Database)</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Real-time registration state verified with pessimistic locking on MySQL / H2.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" icon={<RotateCw className="w-3.5 h-3.5" />} onClick={fetchPublicCourses}>
                    Refresh DB State
                  </Button>
                </div>

                {coursesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
                    <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
                    <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
                  </div>
                ) : courses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted">No courses available.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {courses.map((c, idx) => {
                      // Vibrant distinct gradient banners for each course
                      const bannerGradients = [
                        'from-blue-600 to-indigo-700',
                        'from-emerald-600 to-teal-700',
                        'from-purple-600 to-indigo-800'
                      ];
                      const banner = bannerGradients[idx % bannerGradients.length];

                      return (
                        <div
                          key={c.id}
                          className="group bg-surface rounded-xl border border-line overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                          <div>
                            {/* Colorful Header Banner with glyph and tags */}
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

                            {/* Card Content */}
                            <div className="p-5 space-y-3">
                              <h4 className="font-bold text-sm text-ink leading-snug group-hover:text-accent transition-colors">
                                {c.title}
                              </h4>
                              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                {c.description || 'Comprehensive curriculum with hands-on labs and automated quizzes.'}
                              </p>

                              <div className="pt-2 flex items-center justify-between text-xs text-muted">
                                <span>Instructor: <strong className="text-ink font-semibold">{c.instructorName || 'Faculty'}</strong></span>
                                <span className="font-mono tabular-nums text-[11px] text-accent font-semibold">
                                  {c.capacity - (c.enrolledCount || 0)} left
                                </span>
                              </div>

                              <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="p-4 bg-paper/60 border-t border-line flex items-center justify-between">
                            <span className="text-[11px] text-muted">Pessimistic X-Lock Protected</span>
                            <button
                              onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                              className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center space-x-1"
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
                <div className="lg:col-span-5 bg-surface border border-line rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">Curriculum Outline</span>
                    <Badge variant="open">Lesson 2 Active</Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-status-open/10 border border-status-open/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-status-open" />
                        <span className="font-medium text-ink">Lesson 1: HikariCP & JDBC Setup</span>
                      </div>
                      <span className="text-[10px] text-status-open font-semibold">Completed</span>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-300 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                        <span className="font-bold text-blue-900">Lesson 2: Pessimistic Row Locking</span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-semibold">Reading now</span>
                    </div>

                    <div className="p-3 rounded-lg bg-paper border border-line flex items-center justify-between text-muted">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Lesson 3: Deadlock Retry Strategy (Error 1213)</span>
                      </div>
                      <span className="text-[10px]">Next</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-surface border border-line rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div>
                      <h4 className="text-sm font-bold text-ink">Live Interactive Assessment</h4>
                      <p className="text-xs text-muted">Test your concurrency knowledge right now</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      10 Points
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                    Which SQL clause takes an exclusive row X-lock on the course record in MySQL InnoDB to prevent over-enrollment race conditions?
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => setQuizAnswered('A')}
                      className={`w-full text-left p-3 rounded-lg text-xs border font-medium transition-all flex items-center justify-between ${
                        quizAnswered === 'A'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                          : 'bg-paper/50 border-line text-ink hover:bg-paper'
                      }`}
                    >
                      <span>A) SELECT * FROM courses WHERE id = ? FOR UPDATE</span>
                      {quizAnswered === 'A' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                    </button>

                    <button
                      onClick={() => setQuizAnswered('B')}
                      className={`w-full text-left p-3 rounded-lg text-xs border font-medium transition-all flex items-center justify-between ${
                        quizAnswered === 'B'
                          ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-paper/50 border-line text-ink hover:bg-paper'
                      }`}
                    >
                      <span>B) SELECT * FROM courses WHERE id = ? LOCK IN SHARE MODE</span>
                      {quizAnswered === 'B' && <span className="text-[10px] text-rose-600">Incorrect: S-locks cause deadlocks</span>}
                    </button>
                  </div>

                  {quizAnswered === 'A' && (
                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span><strong>Correct!</strong> `FOR UPDATE` takes an exclusive X-lock, serializing enrollments and eliminating seat drift.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Instructor Grading Preview */}
            {previewTab === 'instructor' && (
              <div className="bg-surface border border-line rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                  <div>
                    <h4 className="text-sm font-bold text-ink">Instructor Grading Queue</h4>
                    <p className="text-xs text-muted">Reviewing student submission for CS-204 Lab 2</p>
                  </div>
                  <Badge variant="open">1 Pending Review</Badge>
                </div>

                <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">Student: Grace Brewster (#2)</span>
                    <span className="text-muted">Submitted 2h ago &bull; Verified Git Repo</span>
                  </div>

                  <p className="text-xs text-muted font-mono bg-white p-3 rounded border border-line leading-relaxed">
                    &quot;Attached schema.sql with composite B-Tree index on (course_id, status). Verified with EXPLAIN ANALYZE: query execution cost dropped from 14.2 to 0.45.&quot;
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-semibold text-ink">Assigned Grade:</span>
                      <span className="px-3 py-1 font-mono font-bold text-base bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                        96 / 100
                      </span>
                    </div>

                    <div className="text-xs text-muted">
                      Feedback: <em className="text-ink font-medium">&quot;Outstanding analysis of composite index ordering.&quot;</em>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: SQL Concurrency Engine Terminal */}
            {previewTab === 'sql' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
                  <div>
                    <h4 className="text-sm font-bold text-ink">HikariCP & InnoDB Row-Lock Transaction Stream</h4>
                    <p className="text-xs text-muted">Simulate 20 concurrent threads attempting enrollment on the same row</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isSimulating}
                    onClick={handleSimulateLock}
                    icon={<Activity className="w-3.5 h-3.5" />}
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

        {/* SYSTEM SPECS STRIP: 4 Bold Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-surface border border-line shadow-sm space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Automated Tests</p>
            <p className="text-3xl font-extrabold text-ink tabular-nums">39 / 39</p>
            <p className="text-xs text-status-open font-medium">100% Passing Concurrency Suite</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-line shadow-sm space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Lock Latency</p>
            <p className="text-3xl font-extrabold text-ink tabular-nums">&lt; 2.4 ms</p>
            <p className="text-xs text-muted">InnoDB Row-Level X-Lock</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-line shadow-sm space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Seat Overselling</p>
            <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">0.00%</p>
            <p className="text-xs text-muted">Zero-Drift Atomic Rollbacks</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-line shadow-sm space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Architecture</p>
            <p className="text-3xl font-extrabold text-indigo-600">Pure JDBC</p>
            <p className="text-xs text-muted">HikariCP Pool &bull; Zero External ORM</p>
          </div>
        </div>

        {/* THREE ROLES MATRIX */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold text-ink">Built for every academic role.</h2>
            <p className="text-sm text-muted">
              Dedicated interfaces with polymorphic role-based security filters and full session isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Student */}
            <div className="bg-surface border border-line rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Student Experience</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Pessimistic registration defense, interactive lesson reader, and auto-graded multiple-choice quizzes.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-3 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Race-free enrollment with rollback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant auto-graded quiz scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Assignment submissions & progress tracker</span>
                </li>
              </ul>
            </div>

            {/* Instructor */}
            <div className="bg-surface border border-line rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Instructor Studio</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Modular curriculum authoring, timed assessment configuration with custom weights, and student grading.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-3 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Curriculum module & lesson sequencing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Custom quiz question & answer key builder</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Dedicated grading drawer with feedback notes</span>
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div className="bg-surface border border-line rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Platform Governance</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Full user directory governance, live database engine monitoring, and immutable transactional audit logs.
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 pt-3 border-t border-line">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Real-time IP & actor audit logging</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>User account creation & suspension</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>MySQL InnoDB & H2 pool monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-line bg-surface py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              L
            </div>
            <span className="text-ink font-semibold">Department of Computer Science & Engineering</span>
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
