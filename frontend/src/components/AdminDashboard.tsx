import React, { useState, useEffect } from 'react';
import { User, Course, AuditLog } from '../types';
import { api } from '../services/api';
import {
  Shield, Users, BookOpen, Activity, Settings, Plus,
  Database, CheckCircle, AlertTriangle, Key, Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'audit' | 'settings'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STUDENT', bio: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [adminStats, usersData, coursesData, logsData, settingsData] = await Promise.all([
        api.getAdminStats(),
        api.getUsers(1, 100),
        api.getCourses(),
        api.getAuditLogs(50),
        api.getSettings()
      ]);
      setStats(adminStats);
      setUsers(usersData.users);
      setCourses(coursesData.courses);
      setAuditLogs(logsData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'STUDENT', bio: '' });
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleToggleCourseStatus = async (courseId: number, currentStatus: string) => {
    try {
      if (currentStatus === 'PUBLISHED') {
        await api.archiveCourse(courseId);
      } else {
        await api.publishCourse(courseId);
      }
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration Console</h1>
            <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
              Admin Level
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">Global oversight: User lifecycle, Course moderation, Audit trail, and System settings</p>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                <h3 className="text-xl font-bold text-slate-900">{stats?.totalUsers ?? users.length}</h3>
                <p className="text-[10px] text-slate-400">{stats?.totalStudents} Students | {stats?.totalInstructors} Instructors</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><BookOpen className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Courses</p>
                <h3 className="text-xl font-bold text-slate-900">{stats?.totalCourses ?? courses.length}</h3>
                <p className="text-[10px] text-slate-400">Total Catalog Listings</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Activity className="w-6 h-6" /></div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrollments</p>
                <h3 className="text-xl font-bold text-slate-900">{stats?.totalEnrollments ?? 0}</h3>
                <p className="text-[10px] text-slate-400">Active Student Enrollments</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl"><Database className="w-6 h-6" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active DB Engine</p>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 break-words leading-tight" title={stats?.databaseType}>
                  {stats?.databaseType ?? 'Relational JDBC'}
                </h3>
                <p className="text-[10px] text-slate-400">HikariCP Pool Managed</p>
              </div>
            </div>
          </div>

          {/* Quick Recent Activity preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span>Recent System Activity Audit</span>
            </h3>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-500 ml-2">by {log.userName || 'System'}</span>
                    <p className="text-[11px] text-slate-500">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Registered Platform Users</h3>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">#{u.id}</td>
                    <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        u.role === 'INSTRUCTOR' ? 'bg-green-100 text-green-800 border border-green-300' :
                        'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Courses Oversight */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">All Courses Across Instructors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Instructor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Enrolled</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{c.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.title}</td>
                    <td className="p-3 text-slate-700">{c.instructorName}</td>
                    <td className="p-3 text-slate-500">{c.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">{c.enrolledCount} / {c.capacity}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleCourseStatus(c.id, c.status)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        {c.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Security & Operational Audit Log Trail</h3>
            <span className="text-xs text-slate-500">Live JDBC table: audit_logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                    <td className="p-3 font-bold text-slate-800">{log.userName || (log.userId ? `User #${log.userId}` : 'System')}</td>
                    <td className="p-3 text-blue-700 font-bold">{log.action}</td>
                    <td className="p-3 text-slate-700">{log.entityName} #{log.entityId || '-'}</td>
                    <td className="p-3 text-slate-600 font-sans text-xs">{log.details}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900 mb-2">System Configuration Settings</h3>
          <p className="text-xs text-slate-500 mb-4">Values stored in MySQL table system_settings</p>

          <div className="divide-y divide-slate-200">
            {settings.map((s) => (
              <div key={s.key} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-800">{s.key}</p>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                </div>
                <span className="font-mono text-xs bg-slate-100 px-3 py-1 rounded font-bold text-slate-800">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Provision System User</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="Dr. Claude Shannon"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="shannon@lms.edu"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Assignment</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg bg-white"
              >
                <option value="STUDENT">STUDENT (Learner)</option>
                <option value="INSTRUCTOR">INSTRUCTOR (Faculty)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-red-600 text-white font-bold rounded-lg shadow-sm">Save User</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
