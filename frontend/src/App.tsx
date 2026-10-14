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
import { RotateCw } from 'lucide-react';

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
    <div className="min-h-screen bg-paper flex flex-col justify-between font-sans">
      {/* Wordmark & Clean Top Navigation Bar */}
      <header className="bg-surface border-b border-line h-14 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="font-medium text-sm text-ink tracking-tight">Online LMS</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-control bg-paper text-muted border border-line tabular-nums">
              Servlet 6 + JDBC
            </span>
          </div>

          <Button variant="secondary" size="sm" onClick={onOpenAuth}>
            Sign in
          </Button>
        </div>
      </header>

      {/* Main Two-Column Layout (>= 1024px, stacked on mobile) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Headline, Description, Sign-In, Demo Accounts */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight leading-tight max-w-[60ch]">
                Your courses, assignments and grades in one place.
              </h1>
              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-[65ch] mt-3">
                Enroll in open courses, work through lessons, take quizzes and track your results.
                Instructors manage content and grading; admins oversee users and the audit log.
              </p>
            </div>

            {/* Clean Inline Sign-In Card */}
            <div className="bg-surface border border-line rounded-container p-5 space-y-4">
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

                {loginError && (
                  <p className="text-xs text-status-full">{loginError}</p>
                )}

                <Button type="submit" variant="primary" size="md" loading={loginLoading} className="w-full">
                  Sign in
                </Button>
              </form>

              {/* Demo accounts text buttons */}
              <div className="pt-4 border-t border-line space-y-2">
                <p className="text-xs font-medium text-muted">Demo accounts:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loginLoading}
                    onClick={() => handleDemoLogin('grace@student.lms.edu', 'Student')}
                  >
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loginLoading}
                    onClick={() => handleDemoLogin('ada@lms.edu', 'Instructor')}
                  >
                    Instructor
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loginLoading}
                    onClick={() => handleDemoLogin('admin@lms.edu', 'Admin')}
                  >
                    Admin
                  </Button>
                </div>
                <p className="text-[11px] text-muted">Demo password: password123</p>
              </div>
            </div>
          </div>

          {/* Right Column: Open for Enrollment Public Courses List */}
          <div className="lg:col-span-6 text-left">
            <Card
              header={
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-sm font-medium text-ink">Open for enrollment</h2>
                  {!coursesLoading && !coursesError && (
                    <span className="text-xs text-muted tabular-nums">
                      {courses.length} {courses.length === 1 ? 'course' : 'courses'}
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
                    <div key={c.id} className="p-4 hover:bg-paper/40 transition-colors duration-75 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-ink tabular-nums">{c.code}</span>
                            <span className="text-xs text-muted font-normal">&bull;</span>
                            <span className="text-xs font-medium text-ink truncate">{c.title}</span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">Instructor: {c.instructorName}</p>
                        </div>
                        <Badge variant="outline">{c.level}</Badge>
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
      </main>

      {/* Clean Informative Footer */}
      <footer className="border-t border-line bg-surface py-5 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-muted space-y-1">
          <p className="text-ink font-medium">Department of Computer Science & Engineering &bull; Version 1.0.0</p>
          <p>
            Apache Tomcat 10.1 &bull; Jakarta Servlets 6.0 &bull; JDBC 4.x &bull; MySQL 8.x
          </p>
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
