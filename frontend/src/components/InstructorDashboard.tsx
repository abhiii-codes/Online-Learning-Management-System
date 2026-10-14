import React, { useState, useEffect } from 'react';
import { Course, Assignment, Submission, Quiz, Module } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Table, TableHead, TableHeader, TableRow, TableCell } from './ui/Table';
import { SeatBar } from './ui/SeatBar';
import { SkeletonRow } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import {
  BookOpen, Plus, Users, FileText, CheckCircle,
  HelpCircle, Eye, CheckSquare, RotateCw
} from 'lucide-react';

interface InstructorDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  activeTab = 'courses',
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

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Grading modal state
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);

  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    code: '',
    description: '',
    category: 'Computer Science',
    level: 'BEGINNER',
    capacity: 60,
  });
  const [newModule, setNewModule] = useState({ title: '', description: '', orderIndex: 1 });
  const [newLesson, setNewLesson] = useState({
    moduleId: 0,
    title: '',
    contentType: 'TEXT',
    contentBody: '',
    durationMinutes: 20,
    orderIndex: 1,
  });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    instructions: '',
    maxPoints: 100,
    dueDate: '2026-12-31T23:59',
  });
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 25,
    passingScore: 60,
  });
  const [newQuestion, setNewQuestion] = useState({
    quizId: 0,
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    points: 10,
  });

  // Submissions list for selected course assignment
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);
  const [activeAssignSubmissions, setActiveAssignSubmissions] = useState<number | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesList, statsData] = await Promise.all([
        api.getInstructorCourses(),
        api.getInstructorStats(),
      ]);
      setCourses(coursesList || []);
      setStats(statsData);
      if (coursesList && coursesList.length > 0 && !selectedCourse) {
        loadCourseDetails(coursesList[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load instructor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadCourseDetails = async (id: number) => {
    try {
      const details = await api.getCourseDetails(id);
      setSelectedCourse(details);
      if (details.modules && details.modules.length > 0) {
        setNewLesson((prev) => ({ ...prev, moduleId: details.modules![0].id }));
      }
      if (details.quizzes && details.quizzes.length > 0) {
        setNewQuestion((prev) => ({ ...prev, quizId: details.quizzes![0].id }));
      }
      if (details.assignments && details.assignments.length > 0) {
        handleViewSubmissions(details.assignments[0].id);
      } else {
        setSubmissionsList([]);
        setActiveAssignSubmissions(null);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load course details', 'error');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse(newCourse as any);
      setShowCreateCourse(false);
      setNewCourse({
        title: '',
        code: '',
        description: '',
        category: 'Computer Science',
        level: 'BEGINNER',
        capacity: 60,
      });
      toast('Course created successfully', 'success');
      await loadDashboard();
    } catch (err: any) {
      toast(err.message || 'Course creation failed', 'error');
    }
  };

  const handlePublishToggle = async (courseId: number, currentStatus: string) => {
    try {
      if (currentStatus === 'PUBLISHED') {
        await api.archiveCourse(courseId);
        toast('Course archived', 'success');
      } else {
        await api.publishCourse(courseId);
        toast('Course published', 'success');
      }
      await loadDashboard();
      if (selectedCourse?.id === courseId) {
        loadCourseDetails(courseId);
      }
    } catch (err: any) {
      toast(err.message || 'Status update failed', 'error');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createModule({ ...newModule, courseId: selectedCourse.id });
      setShowAddModule(false);
      setNewModule({ title: '', description: '', orderIndex: 1 });
      toast('Module added', 'success');
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      toast(err.message || 'Failed to add module', 'error');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createLesson(newLesson as any);
      setShowAddLesson(false);
      setNewLesson({
        moduleId: selectedCourse.modules?.[0]?.id || 0,
        title: '',
        contentType: 'TEXT',
        contentBody: '',
        durationMinutes: 20,
        orderIndex: 1,
      });
      toast('Lesson added', 'success');
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      toast(err.message || 'Failed to add lesson', 'error');
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createAssignment({
        ...newAssignment,
        courseId: selectedCourse.id,
        dueDate: newAssignment.dueDate.replace('T', ' ') + ':00',
      } as any);
      setShowAddAssignment(false);
      setNewAssignment({ title: '', instructions: '', maxPoints: 100, dueDate: '2026-12-31T23:59' });
      toast('Assignment published', 'success');
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      toast(err.message || 'Failed to add assignment', 'error');
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createQuiz({ ...newQuiz, courseId: selectedCourse.id } as any);
      setShowAddQuiz(false);
      setNewQuiz({ title: '', description: '', timeLimitMinutes: 25, passingScore: 60 });
      toast('Quiz created', 'success');
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      toast(err.message || 'Failed to add quiz', 'error');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newQuestion.quizId) return;
    try {
      await api.addQuizQuestion(newQuestion.quizId, newQuestion as any);
      setShowAddQuestion(false);
      setNewQuestion({
        quizId: newQuestion.quizId,
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        points: 10,
      });
      toast('Question added to quiz', 'success');
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      toast(err.message || 'Failed to add quiz question', 'error');
    }
  };

  const handleViewSubmissions = async (assignmentId: number) => {
    setLoadingSubmissions(true);
    try {
      const subs = await api.getSubmissionsForAssignment(assignmentId);
      setSubmissionsList(subs || []);
      setActiveAssignSubmissions(assignmentId);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch submissions', 'error');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGradingLoading(true);
    try {
      await api.gradeSubmission(gradingSubmission.id, Number(gradeInput), feedbackInput);
      toast('Grade and feedback saved', 'success');
      setGradingSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
      if (activeAssignSubmissions) {
        handleViewSubmissions(activeAssignSubmissions);
      }
      loadDashboard();
    } catch (err: any) {
      toast(err.message || 'Grading failed', 'error');
    } finally {
      setGradingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex space-x-1">
          <button
            onClick={() => handleTabClick('courses')}
            className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors ${
              currentTab === 'courses'
                ? 'bg-surface text-ink border border-line shadow-none'
                : 'text-muted hover:text-ink hover:bg-paper'
            }`}
          >
            Authored courses ({courses.length})
          </button>
          <button
            onClick={() => handleTabClick('curriculum')}
            className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors ${
              currentTab === 'curriculum'
                ? 'bg-surface text-ink border border-line shadow-none'
                : 'text-muted hover:text-ink hover:bg-paper'
            }`}
          >
            Curriculum & grading
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowCreateCourse(true)}
        >
          New course
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-container text-xs text-status-full flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadDashboard}>Retry</Button>
        </div>
      )}

      {/* Overview Metric Strip */}
      <div className="border border-line rounded-container bg-surface grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line">
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Authored courses</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {stats?.coursesAuthored ?? courses.length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Enrolled students</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {stats?.totalStudentsEnrolled ?? 0}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-muted font-normal">Submissions to grade</p>
          <p className="text-2xl font-normal text-ink mt-1 tabular-nums">
            {stats?.pendingGradingCount ?? 0}
          </p>
        </div>
      </div>

      {/* Tab: Courses with Seats-Filled Bars */}
      {currentTab === 'courses' && (
        <div className="space-y-4">
          {loading ? (
            <div className="border border-line rounded-container bg-surface divide-y divide-line">
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              title="No courses authored yet"
              description="Create your first academic syllabus and begin enrolling students."
              actionLabel="Create course"
              onAction={() => setShowCreateCourse(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <Card key={c.id}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-ink tabular-nums">{c.code}</span>
                        <h4 className="text-sm font-medium text-ink mt-0.5 truncate">{c.title}</h4>
                        <p className="text-xs text-muted mt-0.5">{c.category} &bull; {c.level}</p>
                      </div>
                      <Badge variant={c.status === 'PUBLISHED' ? 'open' : 'neutral'}>
                        {c.status === 'PUBLISHED' ? 'Published' : 'Archived'}
                      </Badge>
                    </div>

                    {/* Seats-filled bar */}
                    <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />

                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          loadCourseDetails(c.id);
                          handleTabClick('curriculum');
                        }}
                      >
                        Manage curriculum
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublishToggle(c.id, c.status)}
                      >
                        {c.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Curriculum & Submissions to Grade */}
      {currentTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Selected Course Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface border border-line rounded-container">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted font-medium">Selected course:</span>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => loadCourseDetails(Number(e.target.value))}
                className="px-3 py-1 text-xs bg-paper border border-line rounded-control text-ink font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddModule(true)}>
                Add module
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddLesson(true)}>
                Add lesson
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddAssignment(true)}>
                Add assignment
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddQuiz(true)}>
                Add quiz
              </Button>
            </div>
          </div>

          {selectedCourse && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Modules & Lessons outline */}
              <div className="lg:col-span-5 space-y-4">
                <Card header={<h3 className="text-sm font-medium text-ink">Curriculum structure</h3>}>
                  {selectedCourse.modules?.length === 0 ? (
                    <EmptyState
                      title="No modules created"
                      description="Add your first module to organize lessons and assignments."
                      actionLabel="Add module"
                      onAction={() => setShowAddModule(true)}
                    />
                  ) : (
                    <div className="divide-y divide-line -m-5">
                      {selectedCourse.modules?.map((m) => (
                        <div key={m.id} className="p-3.5 space-y-1.5">
                          <p className="text-xs font-medium text-ink">{m.title}</p>
                          <div className="pl-2 space-y-1">
                            {m.lessons?.map((l) => (
                              <div
                                key={l.id}
                                className="px-2.5 py-1 text-xs bg-paper/60 rounded-control flex items-center justify-between"
                              >
                                <span className="truncate pr-2">{l.title}</span>
                                <span className="text-[10px] text-muted tabular-nums">
                                  {l.durationMinutes}m
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Quizzes overview */}
                <Card
                  header={
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-sm font-medium text-ink">Quizzes</h3>
                      {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => setShowAddQuestion(true)}
                        >
                          Add question
                        </Button>
                      )}
                    </div>
                  }
                >
                  {selectedCourse.quizzes?.length === 0 ? (
                    <p className="text-xs text-muted">No quizzes created for this course.</p>
                  ) : (
                    <div className="divide-y divide-line -m-5">
                      {selectedCourse.quizzes?.map((q) => (
                        <div key={q.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-ink">{q.title}</p>
                            <p className="text-muted text-[11px] tabular-nums mt-0.5">
                              {q.timeLimitMinutes}m limit &bull; Pass: {q.passingScore}%
                            </p>
                          </div>
                          <Badge variant="outline">{q.questions?.length ?? 0} questions</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Submissions-to-Grade Table */}
              <div className="lg:col-span-7 space-y-4">
                <Card
                  header={
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-sm font-medium text-ink">Student submissions to grade</h3>
                      {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
                        <select
                          value={activeAssignSubmissions || ''}
                          onChange={(e) => handleViewSubmissions(Number(e.target.value))}
                          className="px-2.5 py-1 text-xs bg-paper border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {selectedCourse.assignments.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  }
                >
                  {loadingSubmissions ? (
                    <div className="divide-y divide-line">
                      <SkeletonRow cols={4} />
                      <SkeletonRow cols={4} />
                    </div>
                  ) : submissionsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted">
                      No student submissions recorded for this assignment yet.
                    </div>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Student</TableHeader>
                          <TableHeader>Submitted</TableHeader>
                          <TableHeader align="right">Grade</TableHeader>
                          <TableHeader align="right">Action</TableHeader>
                        </TableRow>
                      </TableHead>
                      <tbody>
                        {submissionsList.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              {sub.studentName || `Student #${sub.studentId}`}
                            </TableCell>
                            <TableCell className="text-muted tabular-nums text-xs">
                              {sub.submittedAt ? sub.submittedAt.substring(0, 10) : 'Recent'}
                            </TableCell>
                            <TableCell align="right" className="tabular-nums">
                              {sub.grade !== null ? (
                                <Badge variant="open">{sub.grade} pts</Badge>
                              ) : (
                                <Badge variant="filling">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeInput(sub.grade !== null ? String(sub.grade) : '');
                                  setFeedbackInput(sub.feedback || '');
                                }}
                              >
                                {sub.grade !== null ? 'Re-grade' : 'Grade'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal isOpen={showCreateCourse} onClose={() => setShowCreateCourse(false)} title="Create course">
        <form onSubmit={handleCreateCourse} className="space-y-3.5">
          <Input
            label="Course title"
            placeholder="Introduction to Operating Systems"
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
            required
          />
          <Input
            label="Course code"
            placeholder="CS301"
            value={newCourse.code}
            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Syllabus overview and learning objectives..."
            value={newCourse.description}
            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Category</label>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
            <Input
              label="Student capacity"
              type="number"
              value={newCourse.capacity}
              onChange={(e) => setNewCourse({ ...newCourse, capacity: Number(e.target.value) })}
              required
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowCreateCourse(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Module Modal */}
      <Modal isOpen={showAddModule} onClose={() => setShowAddModule(false)} title="Add curriculum module">
        <form onSubmit={handleAddModule} className="space-y-3.5">
          <Input
            label="Module title"
            placeholder="Module 1: Concurrency and Thread Safety"
            value={newModule.title}
            onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
            required
          />
          <Input
            label="Module description"
            placeholder="Key concepts covered in this module..."
            value={newModule.description}
            onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddModule(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save module
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} title="Add lesson">
        <form onSubmit={handleAddLesson} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Module</label>
            <select
              value={newLesson.moduleId}
              onChange={(e) => setNewLesson({ ...newLesson, moduleId: Number(e.target.value) })}
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {selectedCourse?.modules?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Lesson title"
            placeholder="Lesson 1: Mutexes and Row Locks"
            value={newLesson.title}
            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
            required
          />
          <Input
            label="Reading content body"
            placeholder="Enter lesson lecture notes or reading material..."
            value={newLesson.contentBody}
            onChange={(e) => setNewLesson({ ...newLesson, contentBody: e.target.value })}
            required
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddLesson(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save lesson
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Assignment Modal */}
      <Modal isOpen={showAddAssignment} onClose={() => setShowAddAssignment(false)} title="Add assignment">
        <form onSubmit={handleAddAssignment} className="space-y-3.5">
          <Input
            label="Assignment title"
            placeholder="Lab 2: Deadlock Detection & HikariCP Tuning"
            value={newAssignment.title}
            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            required
          />
          <Input
            label="Instructions"
            placeholder="Detailed submission guidelines..."
            value={newAssignment.instructions}
            onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
            required
          />
          <Input
            label="Maximum points"
            type="number"
            value={newAssignment.maxPoints}
            onChange={(e) => setNewAssignment({ ...newAssignment, maxPoints: Number(e.target.value) })}
            required
          />
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddAssignment(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Publish assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Quiz Modal */}
      <Modal isOpen={showAddQuiz} onClose={() => setShowAddQuiz(false)} title="Create quiz assessment">
        <form onSubmit={handleAddQuiz} className="space-y-3.5">
          <Input
            label="Quiz title"
            placeholder="Midterm MCQ Assessment"
            value={newQuiz.title}
            onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
            required
          />
          <Input
            label="Quiz description"
            placeholder="Covers modules 1 through 3..."
            value={newQuiz.description}
            onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Time limit (minutes)"
              type="number"
              value={newQuiz.timeLimitMinutes}
              onChange={(e) => setNewQuiz({ ...newQuiz, timeLimitMinutes: Number(e.target.value) })}
              required
            />
            <Input
              label="Passing score (%)"
              type="number"
              value={newQuiz.passingScore}
              onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: Number(e.target.value) })}
              required
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddQuiz(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save quiz
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Question Modal */}
      <Modal isOpen={showAddQuestion} onClose={() => setShowAddQuestion(false)} title="Add quiz question">
        <form onSubmit={handleAddQuestion} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Target quiz</label>
            <select
              value={newQuestion.quizId}
              onChange={(e) => setNewQuestion({ ...newQuestion, quizId: Number(e.target.value) })}
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {selectedCourse?.quizzes?.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Question text"
            placeholder="Which transaction isolation level prevents dirty reads?"
            value={newQuestion.questionText}
            onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Option A"
              value={newQuestion.optionA}
              onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
              required
            />
            <Input
              label="Option B"
              value={newQuestion.optionB}
              onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
              required
            />
            <Input
              label="Option C"
              value={newQuestion.optionC}
              onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
              required
            />
            <Input
              label="Option D"
              value={newQuestion.optionD}
              onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Correct option</label>
              <select
                value={newQuestion.correctOption}
                onChange={(e) => setNewQuestion({ ...newQuestion, correctOption: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <Input
              label="Points"
              type="number"
              value={newQuestion.points}
              onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
              required
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddQuestion(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save question
            </Button>
          </div>
        </form>
      </Modal>

      {/* Grade Submission Modal */}
      {gradingSubmission && (
        <Modal
          isOpen={true}
          onClose={() => setGradingSubmission(null)}
          title={`Grade submission: ${gradingSubmission.studentName || `Student #${gradingSubmission.studentId}`}`}
        >
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="p-3 bg-paper rounded-control border border-line text-xs space-y-1">
              <p className="font-medium text-ink">Student notes:</p>
              <p className="text-muted whitespace-pre-wrap">{gradingSubmission.submissionText || 'No text submitted.'}</p>
            </div>
            <Input
              label="Awarded score (points)"
              type="number"
              placeholder="e.g. 95"
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              required
            />
            <Input
              label="Instructor feedback"
              placeholder="Detailed comments on code structure, test execution..."
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" size="md" type="button" onClick={() => setGradingSubmission(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" loading={gradingLoading}>
                Save grade
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
