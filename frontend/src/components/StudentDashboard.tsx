import React, { useState, useEffect } from 'react';
import { Course, Enrollment, Lesson, Assignment, Quiz, QuizAttempt } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { SeatBar } from './ui/SeatBar';
import { SkeletonRow } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { useToast } from './ui/Toast';
import {
  BookOpen, CheckCircle, Clock, PlayCircle,
  FileText, HelpCircle, ArrowLeft, Send, CheckCircle2, RotateCw
} from 'lucide-react';

interface StudentDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab = 'my',
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

  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Course action loadings
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [droppingId, setDroppingId] = useState<number | null>(null);

  // Assignment submission state
  const [submittingAssignId, setSubmittingAssignId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submittingAssignLoading, setSubmittingAssignLoading] = useState(false);

  // Quiz player state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [submittingQuizLoading, setSubmittingQuizLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [enrollments, catalog] = await Promise.all([
        api.getMyEnrollments(),
        api.getCourses(search, category, 'PUBLISHED'),
      ]);
      setMyEnrollments(enrollments || []);
      setCatalogCourses(catalog.courses || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category]);

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      await api.enroll(courseId);
      toast('Enrolled in course', 'success');
      await loadData();
      handleTabClick('my');
    } catch (err: any) {
      toast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleDrop = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    setDroppingId(courseId);
    try {
      await api.dropCourse(courseId);
      toast('Dropped course', 'success');
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Drop course failed', 'error');
    } finally {
      setDroppingId(null);
    }
  };

  const handleOpenCourse = async (courseId: number) => {
    try {
      const course = await api.getCourseDetails(courseId);
      setSelectedCourse(course);
      if (
        course.modules &&
        course.modules.length > 0 &&
        course.modules[0].lessons &&
        course.modules[0].lessons.length > 0
      ) {
        setSelectedLesson(course.modules[0].lessons[0]);
      } else {
        setSelectedLesson(null);
      }
      setActiveQuiz(null);
      setQuizResult(null);
    } catch (err: any) {
      toast(err.message || 'Failed to load course content', 'error');
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    if (!selectedCourse) return;
    try {
      await api.markLessonComplete(lessonId);
      toast('Lesson marked complete', 'success');
      const refreshed = await api.getCourseDetails(selectedCourse.id);
      setSelectedCourse(refreshed);
      const enrollments = await api.getMyEnrollments();
      setMyEnrollments(enrollments);
    } catch (err: any) {
      toast(err.message || 'Could not update lesson progress', 'error');
    }
  };

  const handleStartQuiz = async (quizId: number) => {
    try {
      const quiz = await api.getQuiz(quizId);
      setActiveQuiz(quiz);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (err: any) {
      toast(err.message || 'Failed to load quiz assessment', 'error');
    }
  };

  const handleQuizAnswer = (questionId: number, option: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuizLoading(true);
    try {
      const result = await api.submitQuizAttempt(activeQuiz.id, quizAnswers);
      setQuizResult(result);
      toast('Quiz submitted', 'success');
      const enrollments = await api.getMyEnrollments();
      setMyEnrollments(enrollments);
    } catch (err: any) {
      toast(err.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmittingQuizLoading(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignId || !submissionText.trim()) return;
    setSubmittingAssignLoading(true);
    try {
      await api.submitAssignment(submittingAssignId, submissionText.trim());
      toast('Assignment submitted', 'success');
      setSubmittingAssignId(null);
      setSubmissionText('');
      if (selectedCourse) {
        const refreshed = await api.getCourseDetails(selectedCourse.id);
        setSelectedCourse(refreshed);
      }
    } catch (err: any) {
      toast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmittingAssignLoading(false);
    }
  };

  // Continue Learning: Most recent enrolled course
  const continueCourse = myEnrollments.length > 0 ? myEnrollments[0] : null;

  // Render Lesson / Quiz Viewer when course is active
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => setSelectedCourse(null)}
          >
            Back to courses
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-ink tabular-nums">{selectedCourse.code}</span>
            <span className="text-xs text-muted">&bull;</span>
            <span className="text-xs font-medium text-ink">{selectedCourse.title}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-status-full hover:text-status-full"
            loading={droppingId === selectedCourse.id}
            onClick={() => handleDrop(selectedCourse.id)}
          >
            Drop course
          </Button>
        </div>

        {/* Course Player Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation: Modules & Lessons */}
          <div className="lg:col-span-4 space-y-4">
            <Card header={<h3 className="text-sm font-medium text-ink">Curriculum</h3>}>
              <div className="divide-y divide-line -m-5">
                {selectedCourse.modules?.map((m) => (
                  <div key={m.id} className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-ink">{m.title}</p>
                    <div className="space-y-1 pl-2">
                      {m.lessons?.map((l) => {
                        const isCurrent = selectedLesson?.id === l.id && !activeQuiz;
                        return (
                          <button
                            key={l.id}
                            onClick={() => {
                              setSelectedLesson(l);
                              setActiveQuiz(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-control flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-paper text-ink font-medium border border-line'
                                : 'text-muted hover:text-ink hover:bg-paper/40'
                            }`}
                          >
                            <span className="truncate pr-2">{l.title}</span>
                            {l.completed && <CheckCircle className="w-3.5 h-3.5 text-status-open flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quizzes list in course */}
                {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-ink">Assessments</p>
                    <div className="space-y-1 pl-2">
                      {selectedCourse.quizzes.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleStartQuiz(q.id)}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-control flex items-center justify-between transition-colors ${
                            activeQuiz?.id === q.id
                              ? 'bg-paper text-ink font-medium border border-line'
                              : 'text-muted hover:text-ink hover:bg-paper/40'
                          }`}
                        >
                          <span className="truncate pr-2">{q.title}</span>
                          <HelpCircle className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Assignments in course */}
            {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
              <Card header={<h3 className="text-sm font-medium text-ink">Assignments</h3>}>
                <div className="divide-y divide-line -m-5">
                  {selectedCourse.assignments.map((a) => (
                    <div key={a.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-ink">{a.title}</p>
                        <Badge variant="outline">{a.maxPoints} pts</Badge>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{a.instructions}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSubmittingAssignId(a.id)}
                      >
                        Submit work
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Main Content: Lesson Reader or Quiz Taker */}
          <div className="lg:col-span-8">
            {activeQuiz ? (
              <Card
                header={
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-sm font-medium text-ink">{activeQuiz.title}</h2>
                    <span className="text-xs text-muted tabular-nums">
                      {activeQuiz.timeLimitMinutes} min limit &bull; Pass: {activeQuiz.passingScore}%
                    </span>
                  </div>
                }
              >
                {quizResult ? (
                  <div className="text-center py-8 space-y-3">
                    <CheckCircle2
                      className={`w-10 h-10 mx-auto ${
                        quizResult.passed ? 'text-status-open' : 'text-status-full'
                      }`}
                    />
                    <h3 className="font-serif text-xl font-normal text-ink">
                      {quizResult.passed ? 'Assessment passed' : 'Assessment not passed'}
                    </h3>
                    <p className="text-xs text-muted tabular-nums">
                      Score: {quizResult.score} / {quizResult.totalPossible} ({Math.round((quizResult.score / (quizResult.totalPossible || 1)) * 100)}%)
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => setActiveQuiz(null)}>
                      Close assessment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeQuiz.questions?.map((q, idx) => (
                      <div key={q.id} className="space-y-3 pb-4 border-b border-line last:border-b-0">
                        <p className="text-sm font-medium text-ink">
                          <span className="tabular-nums mr-1">{idx + 1}.</span> {q.questionText}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map((optKey) => {
                            const optText = (q as any)[`option${optKey}`];
                            if (!optText) return null;
                            const isSelected = quizAnswers[q.id] === optKey;
                            return (
                              <button
                                key={optKey}
                                onClick={() => handleQuizAnswer(q.id, optKey)}
                                className={`text-left px-3 py-2 text-xs rounded-control border transition-colors ${
                                  isSelected
                                    ? 'bg-paper text-ink font-medium border-accent'
                                    : 'bg-surface text-muted border-line hover:text-ink hover:bg-paper/40'
                                }`}
                              >
                                <span className="font-medium mr-1.5">{optKey}.</span> {optText}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        loading={submittingQuizLoading}
                        onClick={handleSubmitQuiz}
                      >
                        Submit quiz
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : selectedLesson ? (
              <Card
                header={
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-sm font-medium text-ink">{selectedLesson.title}</h2>
                    <span className="text-xs text-muted tabular-nums">
                      {selectedLesson.durationMinutes} min read
                    </span>
                  </div>
                }
                footer={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted">
                      {selectedLesson.completed ? 'Lesson completed' : 'Not completed'}
                    </span>
                    <Button
                      variant={selectedLesson.completed ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleCompleteLesson(selectedLesson.id)}
                    >
                      {selectedLesson.completed ? 'Mark uncompleted' : 'Mark complete'}
                    </Button>
                  </div>
                }
              >
                <div className="prose prose-sm max-w-none text-ink leading-relaxed space-y-4">
                  <p>{selectedLesson.contentBody || 'Lesson reading material will appear here.'}</p>
                </div>
              </Card>
            ) : (
              <EmptyState title="Select a lesson to begin" description="Choose a lesson or quiz from the curriculum list on the left." />
            )}
          </div>
        </div>

        {/* Assignment Submission Modal */}
        {submittingAssignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
            <div className="w-full max-w-md bg-surface border border-line rounded-container p-5 space-y-4">
              <h3 className="text-sm font-medium text-ink">Submit assignment</h3>
              <form onSubmit={handleSubmitAssignment} className="space-y-3">
                <textarea
                  className="w-full p-3 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  rows={4}
                  placeholder="Enter your submission notes or repository link..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  required
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setSubmittingAssignId(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" loading={submittingAssignLoading}>
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab Controls */}
      <div className="flex border-b border-line space-x-1 pb-3">
        <button
          onClick={() => handleTabClick('my')}
          className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors ${
            currentTab === 'my'
              ? 'bg-surface text-ink border border-line shadow-none'
              : 'text-muted hover:text-ink hover:bg-paper'
          }`}
        >
          My courses ({myEnrollments.length})
        </button>
        <button
          onClick={() => handleTabClick('catalog')}
          className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors ${
            currentTab === 'catalog'
              ? 'bg-surface text-ink border border-line shadow-none'
              : 'text-muted hover:text-ink hover:bg-paper'
          }`}
        >
          Course catalog
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-container text-xs text-status-full flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Tab: My Courses */}
      {currentTab === 'my' && (
        <div className="space-y-6">
          {/* Continue Learning: Most recent enrolled course first */}
          {continueCourse && (
            <Card
              header={
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-xs font-medium text-muted uppercase tracking-normal">
                    Continue learning
                  </h3>
                  <Badge variant="outline">{continueCourse.status || 'Active'}</Badge>
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-ink tabular-nums">{continueCourse.courseCode}</span>
                    <span className="text-xs text-muted">&bull;</span>
                    <span className="text-sm font-medium text-ink">{continueCourse.courseTitle}</span>
                  </div>
                  <p className="text-xs text-muted tabular-nums">Progress: {continueCourse.progressPercent}% completed</p>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenCourse(continueCourse.courseId)}
                  >
                    Resume
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-status-full hover:text-status-full"
                    loading={droppingId === continueCourse.courseId}
                    onClick={() => handleDrop(continueCourse.courseId)}
                  >
                    Drop course
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Enrolled Courses Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-ink">All enrolled courses</h2>

            {loading ? (
              <div className="border border-line rounded-container bg-surface divide-y divide-line">
                <SkeletonRow cols={4} />
                <SkeletonRow cols={4} />
              </div>
            ) : myEnrollments.length === 0 ? (
              <EmptyState
                title="No courses enrolled yet"
                description="Explore the catalog to register and begin learning."
                actionLabel="Browse catalog"
                onAction={() => handleTabClick('catalog')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEnrollments.map((e) => (
                  <Card key={e.id}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-semibold text-ink tabular-nums">{e.courseCode}</span>
                          <h4 className="text-sm font-medium text-ink truncate mt-0.5">{e.courseTitle}</h4>
                          <p className="text-xs text-muted tabular-nums mt-0.5">Progress: {e.progressPercent}% completed</p>
                        </div>
                        <Badge variant="outline">{e.status || 'Active'}</Badge>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenCourse(e.courseId)}>
                          Resume
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted hover:text-status-full"
                          loading={droppingId === e.courseId}
                          onClick={() => handleDrop(e.courseId)}
                        >
                          Drop course
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Course Catalog */}
      {currentTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="Search courses by code, title, or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">All categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>

          {loading ? (
            <div className="border border-line rounded-container bg-surface divide-y divide-line">
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
            </div>
          ) : catalogCourses.length === 0 ? (
            <EmptyState title="No courses found" description="Try adjusting your search criteria." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalogCourses.map((c) => {
                const isEnrolled = myEnrollments.some((e) => e.courseId === c.id);
                const isFull = c.enrolledCount >= c.capacity;

                return (
                  <Card key={c.id}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-ink tabular-nums">{c.code}</span>
                            <span className="text-xs text-muted">&bull;</span>
                            <span className="text-xs text-muted">{c.category}</span>
                          </div>
                          <h4 className="text-sm font-medium text-ink mt-0.5 truncate">{c.title}</h4>
                          <p className="text-xs text-muted mt-0.5">Instructor: {c.instructorName}</p>
                        </div>
                        <Badge variant="outline">{c.level}</Badge>
                      </div>

                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>

                      {/* Animated SeatBar */}
                      <SeatBar enrolled={c.enrolledCount} capacity={c.capacity} />

                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        {isEnrolled ? (
                          <>
                            <span className="text-xs text-status-open font-medium">Enrolled</span>
                            <Button variant="secondary" size="sm" onClick={() => handleOpenCourse(c.id)}>
                              Open
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isFull}
                            loading={enrollingId === c.id}
                            onClick={() => handleEnroll(c.id)}
                            className="w-full"
                          >
                            {isFull ? 'Course full' : 'Enroll'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
