import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  BookOpen, Bell, LogOut, Menu, X, Users,
  FileText, Shield, Award, CheckSquare, Layers, Settings, ChevronRight
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
  activeNavTab?: string;
  onNavTabChange?: (tab: string) => void;
  pageTitle?: string;
  pageAction?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onOpenNotifications,
  unreadNotifsCount,
  activeNavTab,
  onNavTabChange,
  pageTitle,
  pageAction,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  // Role-specific navigation items
  const navItems = {
    STUDENT: [
      { id: 'my', label: 'My courses', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'catalog', label: 'Course catalog', icon: <Layers className="w-4 h-4" /> },
    ],
    INSTRUCTOR: [
      { id: 'courses', label: 'Authored courses', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'curriculum', label: 'Curriculum & quizzes', icon: <FileText className="w-4 h-4" /> },
    ],
    ADMIN: [
      { id: 'overview', label: 'System overview', icon: <Shield className="w-4 h-4" /> },
      { id: 'users', label: 'User directory', icon: <Users className="w-4 h-4" /> },
      { id: 'courses', label: 'Course governance', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'audit', label: 'Audit trail', icon: <FileText className="w-4 h-4" /> },
      { id: 'settings', label: 'Platform settings', icon: <Settings className="w-4 h-4" /> },
    ],
  }[user.role] || [];

  const handleNavClick = (id: string) => {
    if (onNavTabChange) onNavTabChange(id);
    setMobileMenuOpen(false);
  };

  const roleLabel = {
    STUDENT: 'Student',
    INSTRUCTOR: 'Instructor',
    ADMIN: 'Admin',
  }[user.role] || user.role;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-surface">
      <div className="space-y-6">
        {/* Wordmark in Sidebar for desktop */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="font-medium text-sm text-ink tracking-tight">Online LMS</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-control bg-paper text-muted border border-line tabular-nums">
              v1.0
            </span>
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-muted hover:text-ink rounded-control lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="px-3 space-y-1" aria-label="Portal Navigation">
          {navItems.map((item) => {
            const isActive = activeNavTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-control transition-colors duration-100 ${
                  isActive
                    ? 'bg-paper text-ink font-medium border border-line/60'
                    : 'text-muted hover:text-ink hover:bg-paper/50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isActive ? 'text-accent' : 'text-muted'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-muted" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout at bottom of sidebar */}
      <div className="p-3 border-t border-line space-y-2">
        <div className="px-3 py-2 bg-paper/60 border border-line rounded-control flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-medium text-ink truncate">{user.name}</p>
            <p className="text-[11px] text-muted truncate">{user.email}</p>
          </div>
          <Badge variant="neutral">{roleLabel}</Badge>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-muted hover:text-status-full hover:bg-paper rounded-control transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Light Top Navigation Bar */}
      <header className="bg-surface border-b border-line sticky top-0 z-30 h-14">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-muted hover:text-ink rounded-control lg:hidden border border-line bg-surface"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm text-ink tracking-tight lg:hidden">Online LMS</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-muted hover:text-ink rounded-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 px-1 min-w-[14px] h-3.5 bg-accent text-white text-[9px] font-medium rounded-full flex items-center justify-center tabular-nums">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-line">
              <span className="text-xs text-ink font-medium">{user.name}</span>
              <Badge variant="neutral">{roleLabel}</Badge>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-muted hover:text-status-full hover:bg-paper rounded-control border border-line transition-colors ml-1"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>

            {/* Mobile Sign Out button */}
            <button
              type="button"
              onClick={logout}
              className="sm:hidden p-1.5 text-muted hover:text-status-full rounded-control border border-line bg-surface transition-colors"
              title="Sign out of account"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with 240px Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (240px) */}
        <aside className="hidden lg:block w-60 border-r border-line bg-surface flex-shrink-0">
          {sidebarContent}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-ink/30 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-surface shadow-xl z-10">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl">
          {pageTitle && (
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between pb-5 mb-6 border-b border-line gap-3">
              <h1 className="text-2xl font-serif text-ink tracking-tight">{pageTitle}</h1>
              {pageAction && <div>{pageAction}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
