import { api } from '../services/api';
import {
  User, Course, Module, Lesson, Assignment, Submission,
  Quiz, QuizQuestion, QuizAttempt, Enrollment, Notification, AuditLog
} from '../types';

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description?: string;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
}

export interface CoursesListResponse {
  courses: Course[];
  total: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalCourses: number;
  activeEnrollments: number;
  databaseEngine: string;
}

export interface InstructorStatsResponse {
  coursesAuthored: number;
  totalStudentsEnrolled: number;
  pendingGradingCount: number;
}

export const apiClient = api;
export { api };
export type {
  User, Course, Module, Lesson, Assignment, Submission,
  Quiz, QuizQuestion, QuizAttempt, Enrollment, Notification, AuditLog
};
