export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'LATE' | 'RESUBMITTED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'GRADE' | 'ENROLLMENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  bio?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt?: string;
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  contentType: string;
  contentBody: string;
  durationMinutes: number;
  orderIndex: number;
  completed?: boolean;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: Lesson[];
}

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  instructions: string;
  maxPoints: number;
  dueDate: string;
  submissionCount?: number;
  submittedByCurrentStudent?: boolean;
  currentStudentGrade?: number | null;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  submissionText: string;
  fileUrl?: string;
  submittedAt?: string;
  grade?: number | null;
  feedback?: string | null;
  graderName?: string | null;
  gradedAt?: string | null;
  status: SubmissionStatus;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: string | null;
  points: number;
  orderIndex: number;
}

export interface Quiz {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScore: number;
  questionCount?: number;
  studentPreviousScore?: number | null;
  studentPassed?: boolean | null;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  quizTitle?: string;
  studentId: number;
  studentName?: string;
  score: number;
  totalPossible: number;
  passed: boolean;
  answersJson?: string;
  attemptedAt?: string;
}

export interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  category: string;
  instructorId: number;
  instructorName?: string;
  status: CourseStatus;
  level: CourseLevel;
  thumbnailUrl?: string;
  capacity: number;
  enrolledCount?: number;
  modules?: Module[];
  assignments?: Assignment[];
  quizzes?: Quiz[];
}

export interface Enrollment {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  courseId: number;
  courseTitle?: string;
  courseCode?: string;
  enrolledAt?: string;
  progressPercent: number;
  status: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt?: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  entityName: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  timestamp?: string;
}
