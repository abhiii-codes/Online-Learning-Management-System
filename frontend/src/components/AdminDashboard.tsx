import React, { useState, useEffect } from 'react';
import { User, Course, AuditLog } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Table, TableHead, TableHeader, TableRow, TableCell } from './ui/Table';
import { EmptyState } from './ui/EmptyState';
import { SkeletonRow } from './ui/Skeleton';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import {
  Users, BookOpen, Shield, FileText, Settings, Plus,
  Search, RotateCw, CheckCircle2, AlertTriangle, Eye
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return dateString;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 30) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab = 'overview',
  onTabChange,
}) => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  // Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STUDENT', bio: '' });
  const [creatingUser, setCreatingUser] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [adminStats, usersData, coursesData, logsData, settingsData] = await Promise.all([
        api.getAdminStats(),
        api.getUsers(1, 100),
        api.getCourses(),
        api.getAuditLogs(50),
        api.getSettings(),
      ]);
      setStats(adminStats);
      setUsers(usersData.users || []);
      setCourses(coursesData.courses || []);
      setAuditLogs(logsData || []);
      setSettings(settingsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await api.createUser(newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'STUDENT', bio: '' });
      toast('User account created', 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to create user', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUser(user.id, {
        name: user.name,
        role: user.role,
        bio: user.bio,
        status: nextStatus,
      });
      toast(`User marked ${nextStatus.toLowerCase()}`, 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Status change failed', 'error');
    }
  };

  const handleCourseStatusToggle = async (course: Course) => {
    try {
      if (course.status === 'PUBLISHED') {
        await api.archiveCourse(course.id);
        toast('Course archived', 'success');
      } else {
        await api.publishCourse(course.id);
        toast('Course published', 'success');
      }
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to update course', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'courses', label: 'Courses' },
            { id: 'audit', label: 'Audit log' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors ${
                currentTab === tab.id
                  ? 'bg-surface text-ink border border-line shadow-none'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentTab === 'users' && (
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddUser(true)}>
            Add user
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-container text-xs text-status-full flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* ONE Summary Strip: 4 cells separated by hairlines */}
      <div className="border border-line rounded-container bg-surface grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line">
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Total users</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {loading ? '-' : stats?.totalUsers ?? users.length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Active courses</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {loading ? '-' : stats?.totalCourses ?? courses.length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Active enrollments</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {loading ? '-' : stats?.activeEnrollments ?? 0}
          </p>
        </div>
        <div className="p-4 sm:p-5 min-w-0">
          <p className="text-xs text-muted font-normal">Database engine</p>
          <p className="text-sm font-medium text-ink mt-1 truncate" title={stats?.databaseEngine || 'MySQL / H2 Pool'}>
            {loading ? '-' : stats?.databaseEngine || 'MySQL 8.x'}
          </p>
        </div>
      </div>

      {/* Tab: Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Audit Entries snippet */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-medium text-ink">Recent system activity</h3>
                <Button variant="ghost" size="sm" onClick={() => handleTabClick('audit')}>
                  View all &rarr;
                </Button>
              </div>
            }
          >
            {loading ? (
              <div className="divide-y divide-line">
                <SkeletonRow cols={4} />
                <SkeletonRow cols={4} />
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState title="No activity recorded" description="Audit logs will appear here as users interact with the platform." />
            ) : (
              <div className="divide-y divide-line -m-5">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-paper/30">
                    <div className="min-w-0 pr-4">
                      <p className="font-medium text-ink truncate">{log.action}</p>
                      <p className="text-muted text-[11px] truncate mt-0.5">
                        User #{log.userId ?? 'system'} &bull; IP: {log.ipAddress || 'internal'}
                      </p>
                    </div>
                    <span className="text-muted tabular-nums whitespace-nowrap text-[11px]" title={log.timestamp}>
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Users Table */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="Filter by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">All roles</option>
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <SkeletonRow cols={5} />
                    <SkeletonRow cols={5} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs tabular-nums text-muted">#{u.id}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">
                        {u.role === 'STUDENT' ? 'Student' : u.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'open' : 'full'}>
                        {u.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleUserStatus(u)}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Tab: Courses Table */}
      {currentTab === 'courses' && (
        <div className="space-y-4">
          <Input
            placeholder="Search courses by code, title, or instructor..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Code</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Instructor</TableHeader>
                <TableHeader>Level</TableHeader>
                <TableHeader align="right">Enrolled</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <SkeletonRow cols={6} />
                    <SkeletonRow cols={6} />
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-muted">
                    No courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs tabular-nums font-medium">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-muted">{c.instructorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.level}</Badge>
                    </TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {c.enrolledCount} of {c.capacity}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'PUBLISHED' ? 'open' : 'neutral'}>
                        {c.status === 'PUBLISHED' ? 'Published' : 'Archived'}
                      </Badge>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCourseStatusToggle(c)}
                      >
                        {c.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Tab: Audit Log */}
      {currentTab === 'audit' && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Action</TableHeader>
              <TableHeader>Details</TableHeader>
              <TableHeader>User</TableHeader>
              <TableHeader>IP</TableHeader>
              <TableHeader align="right">Time</TableHeader>
            </TableRow>
          </TableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted">
                  No audit logs available.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted">#{log.id}</TableCell>
                  <TableCell className="font-medium text-xs">{log.action}</TableCell>
                  <TableCell className="text-xs text-muted max-w-xs truncate" title={log.details}>
                    {log.details || '-'}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted">
                    {log.userId ? `#${log.userId}` : 'system'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">{log.ipAddress || '-'}</TableCell>
                  <TableCell align="right" className="text-xs text-muted tabular-nums" title={log.timestamp}>
                    {formatRelativeTime(log.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* Tab: Settings */}
      {currentTab === 'settings' && (
        <Card header={<h3 className="text-sm font-medium text-ink">System configurations</h3>}>
          <div className="divide-y divide-line -m-5">
            {settings.map((s, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-paper/30">
                <div>
                  <p className="font-mono font-medium text-ink">{s.settingKey}</p>
                  <p className="text-muted mt-0.5">{s.description || 'System policy parameter'}</p>
                </div>
                <Badge variant="neutral">{s.settingValue}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Create user account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Ada Lovelace"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <Input
            label="Email address"
            type="email"
            placeholder="ada@lms.edu"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-1.5 text-sm bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddUser(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={creatingUser}>
              Create user
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
