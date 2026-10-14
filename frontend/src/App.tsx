import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { StudentDashboard } from './components/StudentDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Notification } from './types';
import { api } from './services/api';
import {
  BookOpen, Shield, Code, Database, Server, CheckCircle2,
  Layers, Users, ArrowRight, Award, FileText, CheckSquare, GraduationCap
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading, switchDemoUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifsModal, setShowNotifsModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Connecting to Jakarta Servlet Container...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenNotifications={() => setShowNotifsModal(true)}
          unreadNotifsCount={unreadCount}
        />

        {user ? (
          <main>
            {user.role === 'ADMIN' && <AdminDashboard />}
            {user.role === 'INSTRUCTOR' && <InstructorDashboard />}
            {user.role === 'STUDENT' && <StudentDashboard />}
          </main>
        ) : (
          /* Product-First Landing Screen */
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
                Modern Online Learning & Course Management System
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Browse courses, take quizzes, submit assignments and track your progress, with separate dashboards for students, instructors and admins.
              </p>

              {/* Primary Action Card: Quick Evaluation & Sign In */}
              <div className="mt-5 p-5 sm:p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 text-left max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Try a demo account</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Pick a role to sign in with a seeded demo account.</p>
                  </div>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="self-start sm:self-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Custom Login &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {/* Student Role */}
                  <button
                    onClick={() => switchDemoUser('grace@student.lms.edu')}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition w-full"
                  >
                    <GraduationCap className="w-4 h-4 text-white" />
                    <span>Student Portal</span>
                  </button>

                  {/* Instructor Role */}
                  <button
                    onClick={() => switchDemoUser('ada@lms.edu')}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-bold rounded-xl shadow transition w-full"
                  >
                    <Award className="w-4 h-4 text-white" />
                    <span>Instructor Portal</span>
                  </button>

                  {/* Admin Role - Fixed Amber-500 with text-slate-900 */}
                  <button
                    onClick={() => switchDemoUser('admin@lms.edu')}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl shadow transition w-full"
                  >
                    <Shield className="w-4 h-4 text-slate-900" />
                    <span>Admin Portal</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-3 text-center">
                  Demo password: <code className="text-amber-400 font-mono font-semibold">password123</code>
                </p>
              </div>
            </div>

            {/* "What You Can Do" Feature Strip */}
            <div className="mt-10 sm:mt-12 max-w-5xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">What You Can Do in Online LMS</h2>
                <p className="text-xs text-slate-600 mt-1">Full academic course lifecycle supported across three dedicated roles</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg w-fit mb-2.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Course Catalog & Syllabi</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Browse courses with category filtering, track modules and video lessons, and monitor real-time completion.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg w-fit mb-2.5">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Interactive MCQ Quizzes</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Take timed multiple-choice assessments with immediate server-side scoring, percentage calculation, and history.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg w-fit mb-2.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Assignments & Grading</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Students submit text notes and file attachments; instructors evaluate submissions with custom feedback and grades.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg w-fit mb-2.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Governance & Audit Logs</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Administrators inspect system audit logs, toggle user permissions, and configure runtime platform policies.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* High-Contrast Informative Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-900">
            Online Learning Management System (LMS)
          </p>
          <p className="text-slate-600">
            Powered by <strong>Apache Tomcat 10.1</strong> &bull; <strong>Jakarta Servlets 6.0</strong> &bull; <strong>JDBC 4.x (HikariCP)</strong> &bull; <strong>MySQL 8.x / Embedded H2</strong> &bull; <strong>Java 17+</strong>
          </p>
          <p className="text-xs text-slate-600">
            Department of Computer Science & Engineering &bull; Version 1.0.0
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <NotificationsModal
        isOpen={showNotifsModal}
        onClose={() => setShowNotifsModal(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};
