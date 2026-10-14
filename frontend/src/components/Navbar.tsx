import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bell, LogOut, User as UserIcon, Shield, GraduationCap, Award } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenNotifications, unreadNotifsCount }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">ONLINE LMS</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-semibold border border-blue-400/40">
                  Servlet 6 + JDBC
                </span>
              </div>
            </div>
          </div>

          {/* User Status / Notification Controls */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs border border-slate-600">
                    {user.role === 'ADMIN' ? <Shield className="w-4 h-4 text-amber-500" /> :
                     user.role === 'INSTRUCTOR' ? <Award className="w-4 h-4 text-green-400" /> :
                     <GraduationCap className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight ${
                      user.role === 'ADMIN' ? 'bg-amber-500 text-slate-900' :
                      user.role === 'INSTRUCTOR' ? 'bg-green-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-slate-200 hover:text-red-400 hover:bg-slate-800 rounded-lg transition text-xs font-semibold border border-transparent hover:border-slate-700"
                  title="Sign out of LMS"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
