import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsRegister(false);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Create student account' : 'Sign in to your account'}
    >
      <div className="space-y-4">
        {/* Preset demo shortcuts */}
        <div className="p-3 bg-paper rounded-control border border-line space-y-1.5">
          <p className="text-[11px] font-medium text-muted">Demo accounts:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemo('abhinav@student.lms.edu')}
            >
              Student
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemo('aditya@lms.edu')}
            >
              Instructor
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemo('admin@lms.edu')}
            >
              Admin
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-control flex items-start space-x-2 text-status-full text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <Input
              label="Full name"
              type="text"
              placeholder="e.g. Abhinav Singh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="name@lms.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            className="w-full mt-2"
          >
            {isRegister ? 'Register' : 'Sign in'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-line">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-muted hover:text-ink font-medium"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register as a student"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
