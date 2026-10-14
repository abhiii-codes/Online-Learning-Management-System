import {
  User, Course, Module, Lesson, Assignment, Submission,
  Quiz, QuizQuestion, QuizAttempt, Enrollment, Notification, AuditLog
} from '../types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // include session cookie (JSESSIONID)
  });

  const json: ApiResponse<T> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () =>
    request<User>('/auth/me'),

  // Users (Admin)
  getUsers: (page = 1, size = 50, role?: string) =>
    request<{ users: User[]; total: number; page: number; size: number }>(`/users?page=${page}&size=${size}${role ? `&role=${role}` : ''}`),
  createUser: (userData: any) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id: number, userData: any) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id: number) =>
    request<boolean>(`/users/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: (search = '', category = '', status = '') =>
    request<{ courses: Course[]; total: number }>(`/courses?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`),
  getCourseDetails: (id: number) =>
    request<Course>(`/courses/${id}`),
  getInstructorCourses: () =>
    request<Course[]>('/courses/instructor'),
  createCourse: (course: Partial<Course>) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (id: number, course: Partial<Course>) =>
    request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(course) }),
  publishCourse: (id: number) =>
    request<boolean>(`/courses/${id}/publish`, { method: 'POST' }),
  archiveCourse: (id: number) =>
    request<boolean>(`/courses/${id}/archive`, { method: 'POST' }),
  deleteCourse: (id: number) =>
    request<boolean>(`/courses/${id}`, { method: 'DELETE' }),

  // Modules & Lessons
  getModules: (courseId: number) =>
    request<Module[]>(`/modules?courseId=${courseId}`),
  createModule: (mod: Partial<Module>) =>
    request<Module>('/modules', { method: 'POST', body: JSON.stringify(mod) }),
  createLesson: (lesson: Partial<Lesson>) =>
    request<Lesson>('/lessons', { method: 'POST', body: JSON.stringify(lesson) }),
  markLessonComplete: (lessonId: number) =>
    request<boolean>(`/lessons/${lessonId}/complete`, { method: 'POST' }),

  // Enrollments
  getMyEnrollments: () =>
    request<Enrollment[]>('/enrollments/my'),
  enroll: (courseId: number) =>
    request<Enrollment>('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) }),
  dropCourse: (courseId: number) =>
    request<boolean>('/enrollments/drop', { method: 'POST', body: JSON.stringify({ courseId }) }),
  getCourseRoster: (courseId: number) =>
    request<Enrollment[]>(`/enrollments?courseId=${courseId}`),

  // Assignments & Submissions
  getAssignments: (courseId: number) =>
    request<Assignment[]>(`/assignments?courseId=${courseId}`),
  createAssignment: (assignment: Partial<Assignment>) =>
    request<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(assignment) }),
  submitAssignment: (assignmentId: number, submissionText: string, fileUrl = '') =>
    request<Submission>('/submissions', { method: 'POST', body: JSON.stringify({ assignmentId, submissionText, fileUrl }) }),
  getSubmissionsForAssignment: (assignmentId: number) =>
    request<Submission[]>(`/submissions?assignmentId=${assignmentId}`),
  getMySubmission: (assignmentId: number) =>
    request<Submission>(`/submissions?assignmentId=${assignmentId}`),
  gradeSubmission: (submissionId: number, grade: number, feedback: string) =>
    request<Submission>(`/submissions/${submissionId}/grade`, { method: 'POST', body: JSON.stringify({ grade, feedback }) }),

  // Quizzes
  getQuizzes: (courseId: number) =>
    request<Quiz[]>(`/quizzes?courseId=${courseId}`),
  getQuiz: (quizId: number) =>
    request<Quiz>(`/quizzes/${quizId}`),
  createQuiz: (quiz: Partial<Quiz>) =>
    request<Quiz>('/quizzes', { method: 'POST', body: JSON.stringify(quiz) }),
  addQuizQuestion: (quizId: number, question: Partial<QuizQuestion>) =>
    request<QuizQuestion>(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(question) }),
  submitQuizAttempt: (quizId: number, answers: Record<number, string>) =>
    request<QuizAttempt>(`/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify(answers) }),
  getQuizAttempts: (quizId: number) =>
    request<QuizAttempt[]>(`/quizzes/${quizId}/attempts`),

  // Analytics & Stats
  getAdminStats: () =>
    request<any>('/analytics/admin'),
  getInstructorStats: () =>
    request<any>('/analytics/instructor'),
  getStudentStats: () =>
    request<any>('/analytics/student'),

  // Notifications
  getNotifications: () =>
    request<Notification[]>('/notifications'),
  markNotificationRead: (id: number) =>
    request<boolean>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<boolean>('/notifications/read-all', { method: 'POST' }),

  // Audit Logs
  getAuditLogs: (limit = 50) =>
    request<AuditLog[]>(`/audit-logs?limit=${limit}`),

  // Settings
  getSettings: () =>
    request<any[]>('/settings'),
  updateSetting: (key: string, value: string, description: string) =>
    request<boolean>('/settings', { method: 'POST', body: JSON.stringify({ key, value, description }) }),
};
