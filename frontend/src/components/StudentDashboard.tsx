import React, { useState, useEffect } from 'react';
import { Course, Enrollment, Lesson, Module, Assignment, Quiz, QuizAttempt } from '../types';
import { api } from '../services/api';
import {
  BookOpen, CheckCircle, Clock, PlayCircle, Award, CheckCircle2,
  FileText, HelpCircle, ArrowLeft, Send, Sparkles, AlertCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'catalog'>('my');
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Assignment submission state
  const [submittingAssignId, setSubmittingAssignId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState('');

  // Quiz player state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrollments, catalog] = await Promise.all([
        api.getMyEnrollments(),
        api.getCourses(search, category, 'PUBLISHED')
      ]);
      setMyEnrollments(enrollments);
      setCatalogCourses(catalog.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category]);

  const handleEnroll = async (courseId: number) => {
    try {
      await api.enroll(courseId);
      await loadData();
      setActiveTab('my');
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    }
  };

  const handleOpenCourse = async (courseId: number) => {
    try {
      const course = await api.getCourseDetails(courseId);
      setSelectedCourse(course);
      // Auto-select first lesson if available
      if (course.modules && course.modules.length > 0 && course.modules[0].lessons && course.modules[0].lessons.length > 0) {
        setSelectedLesson(course.modules[0].lessons[0]);
      } else {
        setSelectedLesson(null);
      }
      setActiveQuiz(null);
      setQuizResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to load course content');
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    if (!selectedCourse) return;
    try {
      await api.markLessonComplete(lessonId);
      // Refresh course details and enrollments to reflect new progress
      const refreshed = await api.getCourseDetails(selectedCourse.id);
      setSelectedCourse(refreshed);
      if (selectedLesson && selectedLesson.id === lessonId) {
        setSelectedLesson({ ...selectedLesson, completed: true });
      }
      const enrollments = await api.getMyEnrollments();
      setMyEnrollments(enrollments);
    } catch (err: any) {
      alert(err.message || 'Failed to mark lesson complete');
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent, assignmentId: number) => {
    e.preventDefault();
    if (!submissionText.trim()) return;
    try {
      await api.submitAssignment(assignmentId, submissionText);
      alert('Assignment submitted successfully!');
      setSubmittingAssignId(null);
      setSubmissionText('');
      if (selectedCourse) {
        handleOpenCourse(selectedCourse.id);
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const handleStartQuiz = async (quizId: number) => {
    try {
      const q = await api.getQuiz(quizId);
      setActiveQuiz(q);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to open quiz');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const result = await api.submitQuizAttempt(activeQuiz.id, quizAnswers);
      setQuizResult(result);
      if (selectedCourse) {
        const refreshed = await api.getCourseDetails(selectedCourse.id);
        setSelectedCourse(refreshed);
      }
    } catch (err: any) {
      alert(err.message || 'Quiz submission failed');
    }
  };

  // If a course workspace is active, render the Interactive Course Viewer
  if (selectedCourse) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => {
            setSelectedCourse(null);
            setSelectedLesson(null);
            setActiveQuiz(null);
          }}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Courses</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedCourse.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">{selectedCourse.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{selectedCourse.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Instructor: {selectedCourse.instructorName}</p>
            </div>
          </div>
        </div>

        {/* Learning Workspace Grid: Syllabus Sidebar & Lesson/Quiz Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Syllabus Navigation (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Course Modules & Lessons</span>
              </h3>

              <div className="space-y-3">
                {selectedCourse.modules && selectedCourse.modules.map((m, mIdx) => (
                  <div key={m.id} className="border border-slate-100 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-100">
                      Module {mIdx + 1}: {m.title}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {m.lessons && m.lessons.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => {
                            setSelectedLesson(l);
                            setActiveQuiz(null);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition ${
                            selectedLesson?.id === l.id && !activeQuiz
                              ? 'bg-blue-50 text-blue-800 font-bold border-l-4 border-blue-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <PlayCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{l.title}</span>
                          </div>
                          {l.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quizzes Sidebar Section */}
            {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>Interactive Quizzes</span>
                </h3>
                <div className="space-y-2">
                  {selectedCourse.quizzes.map((q) => (
                    <div key={q.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50/50">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{q.title}</p>
                        <p className="text-[10px] text-slate-500">{q.timeLimitMinutes} mins | Pass: {q.passingScore}%</p>
                        {q.studentPreviousScore !== null && q.studentPreviousScore !== undefined && (
                          <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${q.studentPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            Score: {q.studentPreviousScore} pts ({q.studentPassed ? 'PASSED' : 'TRY AGAIN'})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartQuiz(q.id)}
                        className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition"
                      >
                        {q.studentPreviousScore !== null ? 'Retake' : 'Start'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Workspace (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Quiz Player */}
            {activeQuiz ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="border-b border-slate-200 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Quiz Attempt</span>
                    <h2 className="text-xl font-bold text-slate-900">{activeQuiz.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{activeQuiz.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Close Quiz
                  </button>
                </div>

                {quizResult ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                      <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Quiz Submitted & Evaluated!</h3>
                    <p className="text-sm text-slate-600">
                      Your Score: <span className="font-bold text-slate-900">{quizResult.score}</span> / {quizResult.totalPossible}
                    </p>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                      quizResult.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Status: {quizResult.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                    </span>
                    <div>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition"
                      >
                        Return to Course
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeQuiz.questions && activeQuiz.questions.map((q, idx) => (
                      <div key={q.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Question {idx + 1} ({q.points} pts)
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mb-3">{q.questionText}</p>

                        <div className="space-y-2">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const optText = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center space-x-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                                  quizAnswers[q.id] === opt
                                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={opt}
                                  checked={quizAnswers[q.id] === opt}
                                  onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-bold">{opt}.</span>
                                <span>{optText}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSubmitQuiz}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                      >
                        Submit & Calculate Grade
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedLesson ? (
              /* Lesson Reader */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lesson Content</span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedLesson.title}</h2>
                    <span className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedLesson.durationMinutes} minutes reading</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleCompleteLesson(selectedLesson.id)}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition ${
                      selectedLesson.completed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{selectedLesson.completed ? 'Completed ✓' : 'Mark as Complete'}</span>
                  </button>
                </div>

                <div className="prose max-w-none text-slate-700 text-sm leading-relaxed p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 font-mono">
                  {selectedLesson.contentBody}
                </div>
              </div>
            ) : null}

            {/* Assignments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Course Assignments</span>
              </h3>

              <div className="space-y-4">
                {selectedCourse.assignments && selectedCourse.assignments.map((a) => (
                  <div key={a.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{a.instructions}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Due: {a.dueDate} | Max Points: {a.maxPoints}</p>
                      </div>

                      <div className="text-right">
                        {a.submittedByCurrentStudent ? (
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                              Submitted
                            </span>
                            {a.currentStudentGrade !== null && a.currentStudentGrade !== undefined && (
                              <p className="text-xs font-bold text-slate-800">
                                Grade: {a.currentStudentGrade} / {a.maxPoints}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSubmittingAssignId(a.id)}
                            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition"
                          >
                            Submit Solution
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submission Drawer */}
                    {submittingAssignId === a.id && (
                      <form onSubmit={(e) => handleSubmitAssignment(e, a.id)} className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                        <label className="block text-xs font-semibold text-slate-700">Your Solution / Code / Answers</label>
                        <textarea
                          rows={4}
                          required
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Paste your code, solution logic, or answers here..."
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSubmittingAssignId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                          >
                            Confirm Submission
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Primary Student Dashboard Overview
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Learning Portal</h1>
          <p className="text-xs text-slate-600 mt-0.5">Explore enrolled courses, assignments, quizzes, and curriculum progress</p>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Enrolled Courses ({myEnrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Course Catalog
          </button>
        </div>
      </div>

      {/* Tab: My Courses */}
      {activeTab === 'my' ? (
        <div className="mt-6">
          {myEnrollments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800">No courses enrolled yet</h3>
              <p className="text-xs text-slate-600 mt-1">Browse the course catalog to discover and enroll in available academic courses.</p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEnrollments.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                        {e.courseCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        e.progressPercent >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {e.progressPercent >= 100 ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-3">{e.courseTitle}</h3>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1">
                        <span>Course Completion</span>
                        <span>{e.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${e.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenCourse(e.courseId)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Open Course Workspace
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab: Course Catalog */
        <div className="mt-6 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course title or code..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Database Systems">Database Systems</option>
              <option value="Web Engineering">Web Engineering</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogCourses.map((c) => {
              const isEnrolled = myEnrollments.some((e) => e.courseId === c.id);
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">{c.category}</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-2">{c.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                    <p className="text-[11px] text-slate-500 mt-3">Instructor: <span className="font-medium text-slate-700">{c.instructorName}</span></p>

                    <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                      <span>Level: {c.level}</span>
                      <span>Enrolled: {c.enrolledCount} / {c.capacity}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    {isEnrolled ? (
                      <button
                        onClick={() => handleOpenCourse(c.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Enrolled (Go to Course)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
