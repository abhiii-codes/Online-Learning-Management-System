import React, { useState, useEffect } from 'react';
import { Course, Assignment, Submission, Quiz, QuizQuestion, Module } from '../types';
import { api } from '../services/api';
import {
  BookOpen, Plus, Users, FileText, CheckCircle, Edit, Trash2,
  HelpCircle, Award, Eye, Send, Sparkles, FolderPlus
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  // Form states
  const [newCourse, setNewCourse] = useState({ title: '', code: '', description: '', category: 'Computer Science', level: 'BEGINNER', capacity: 60 });
  const [newModule, setNewModule] = useState({ title: '', description: '', orderIndex: 1 });
  const [newLesson, setNewLesson] = useState({ moduleId: 0, title: '', contentType: 'TEXT', contentBody: '', durationMinutes: 20, orderIndex: 1 });
  const [newAssignment, setNewAssignment] = useState({ title: '', instructions: '', maxPoints: 100, dueDate: '2026-12-31T23:59' });
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', timeLimitMinutes: 25, passingScore: 60 });
  const [newQuestion, setNewQuestion] = useState({ quizId: 0, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', points: 10 });

  // Submissions list for selected course assignment
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);
  const [activeAssignSubmissions, setActiveAssignSubmissions] = useState<number | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [coursesList, statsData] = await Promise.all([
        api.getInstructorCourses(),
        api.getInstructorStats()
      ]);
      setCourses(coursesList);
      setStats(statsData);
      if (coursesList.length > 0 && !selectedCourse) {
        loadCourseDetails(coursesList[0].id);
      }
    } catch (err) {
      console.error(err);
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
    } catch (err: any) {
      alert(err.message || 'Failed to load course details');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse(newCourse as any);
      setShowCreateCourse(false);
      setNewCourse({ title: '', code: '', description: '', category: 'Computer Science', level: 'BEGINNER', capacity: 60 });
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Course creation failed');
    }
  };

  const handlePublishToggle = async (courseId: number, currentStatus: string) => {
    try {
      if (currentStatus === 'PUBLISHED') {
        await api.archiveCourse(courseId);
      } else {
        await api.publishCourse(courseId);
      }
      await loadDashboard();
      if (selectedCourse?.id === courseId) {
        loadCourseDetails(courseId);
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createModule({ ...newModule, courseId: selectedCourse.id });
      setShowAddModule(false);
      setNewModule({ title: '', description: '', orderIndex: 1 });
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add module');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createLesson(newLesson as any);
      setShowAddLesson(false);
      setNewLesson({ moduleId: selectedCourse.modules?.[0]?.id || 0, title: '', contentType: 'TEXT', contentBody: '', durationMinutes: 20, orderIndex: 1 });
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add lesson');
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createAssignment({ ...newAssignment, courseId: selectedCourse.id, dueDate: newAssignment.dueDate.replace('T', ' ') + ':00' } as any);
      setShowAddAssignment(false);
      setNewAssignment({ title: '', instructions: '', maxPoints: 100, dueDate: '2026-12-31T23:59' });
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add assignment');
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createQuiz({ ...newQuiz, courseId: selectedCourse.id } as any);
      setShowAddQuiz(false);
      setNewQuiz({ title: '', description: '', timeLimitMinutes: 25, passingScore: 60 });
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add quiz');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newQuestion.quizId) return;
    try {
      await api.addQuizQuestion(newQuestion.quizId, newQuestion as any);
      setShowAddQuestion(false);
      setNewQuestion({ quizId: newQuestion.quizId, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', points: 10 });
      loadCourseDetails(selectedCourse.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add quiz question');
    }
  };

  const handleViewSubmissions = async (assignmentId: number) => {
    try {
      const subs = await api.getSubmissionsForAssignment(assignmentId);
      setSubmissionsList(subs);
      setActiveAssignSubmissions(assignmentId);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch submissions');
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      const gradeVal = parseFloat(gradeInput);
      await api.gradeSubmission(gradingSubmission.id, gradeVal, feedbackInput);
      alert('Grade and feedback saved successfully!');
      setGradingSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
      if (activeAssignSubmissions) {
        handleViewSubmissions(activeAssignSubmissions);
      }
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Grading failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Authored Courses</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.coursesAuthored ?? courses.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Enrolled Students</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalStudentsEnrolled ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Submissions to Grade</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.pendingGradingCount ?? 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Course Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course List & Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-900">Your Authored Courses</h3>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Course</span>
              </button>
            </div>

            <div className="space-y-2">
              {courses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadCourseDetails(c.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedCourse?.id === c.id
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{c.code}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-semibold mt-1">{c.title}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                    <span>Enrolled: {c.enrolledCount}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishToggle(c.id, c.status);
                      }}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      {c.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Course Curriculum & Grading (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <>
              {/* Course Header Banner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{selectedCourse.code}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedCourse.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">{selectedCourse.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowAddModule(true)}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                    <button
                      onClick={() => setShowAddLesson(true)}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lesson</span>
                    </button>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Add Lab</span>
                    </button>
                    <button
                      onClick={() => setShowAddQuiz(true)}
                      className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Add Quiz</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Curriculum Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Curriculum Structure (Modules & Lessons)</span>
                </h3>

                <div className="space-y-4">
                  {selectedCourse.modules && selectedCourse.modules.map((m, mIdx) => (
                    <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      <div className="p-3 bg-slate-100 font-bold text-xs text-slate-800 flex justify-between items-center">
                        <span>Module {mIdx + 1}: {m.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{m.lessons?.length || 0} Lessons</span>
                      </div>
                      <div className="divide-y divide-slate-100 p-2">
                        {m.lessons && m.lessons.map((l) => (
                          <div key={l.id} className="p-2 text-xs text-slate-700 flex justify-between items-center">
                            <span>{l.title}</span>
                            <span className="text-[10px] text-slate-400">{l.durationMinutes} mins</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Evaluation Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Assignments & Student Submissions</span>
                </h3>

                <div className="space-y-3">
                  {selectedCourse.assignments && selectedCourse.assignments.map((a) => (
                    <div key={a.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{a.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Due: {a.dueDate} | Max Points: {a.maxPoints}</p>
                      </div>
                      <button
                        onClick={() => handleViewSubmissions(a.id)}
                        className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg border border-indigo-200"
                      >
                        Grade Submissions ({a.submissionCount || 0})
                      </button>
                    </div>
                  ))}
                </div>

                {/* Submissions List & Grading Form */}
                {activeAssignSubmissions && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                      Enrolled Student Submissions ({submissionsList.length})
                    </h4>

                    {submissionsList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No student submissions submitted for this assignment yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {submissionsList.map((sub) => (
                          <div key={sub.id} className="p-3 border border-slate-200 rounded-xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{sub.studentName} ({sub.studentEmail})</p>
                              <p className="text-[11px] text-slate-600 font-mono mt-1 p-1 bg-slate-50 rounded border border-slate-100">
                                {sub.submissionText}
                              </p>
                              {sub.grade !== null && sub.grade !== undefined && (
                                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                                  Graded: {sub.grade} pts | Feedback: {sub.feedback}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeInput(sub.grade?.toString() || '');
                                setFeedbackInput(sub.feedback || '');
                              }}
                              className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                            >
                              {sub.grade !== null ? 'Re-Grade' : 'Grade Submission'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Select or create a course to manage its curriculum, assignments, and grading.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Course */}
      {showCreateCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateCourse} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Create New Course</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="CS-205"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="Data Structures & Algorithms"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowCreateCourse(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-bold rounded-lg">Save Course</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Module */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddModule} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Curriculum Module</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module Title</label>
              <input
                type="text"
                required
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="Module 1: Foundations"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddModule(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg">Add Module</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Lesson */}
      {showAddLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddLesson} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Lesson</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Module</label>
              <select
                value={newLesson.moduleId}
                onChange={(e) => setNewLesson({ ...newLesson, moduleId: parseInt(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg bg-white"
              >
                {selectedCourse?.modules?.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Title</label>
              <input
                type="text"
                required
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="1.1 Core Concepts"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Content Body</label>
              <textarea
                rows={5}
                required
                value={newLesson.contentBody}
                onChange={(e) => setNewLesson({ ...newLesson, contentBody: e.target.value })}
                className="w-full p-2 text-xs font-mono border rounded-lg"
                placeholder="Write lesson notes, architectural diagrams, or code samples..."
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddLesson(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg">Save Lesson</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Assignment */}
      {showAddAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddAssignment} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Course Assignment</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="Lab 4: Database Transactions"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
              <textarea
                rows={3}
                required
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Points</label>
                <input
                  type="number"
                  required
                  value={newAssignment.maxPoints}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxPoints: parseInt(e.target.value) })}
                  className="w-full p-2 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full p-2 text-xs border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddAssignment(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-indigo-600 text-white font-bold rounded-lg">Save Assignment</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Grade Submission (Atomic JDBC Transaction Demo) */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleGradeSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Evaluate Student Submission</h3>
            <p className="text-xs text-slate-500">Student: {gradingSubmission.studentName}</p>

            <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono border border-slate-200 max-h-32 overflow-y-auto">
              {gradingSubmission.submissionText}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade (0 - 100)</label>
              <input
                type="number"
                step="0.5"
                required
                min="0"
                max="100"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg font-bold"
                placeholder="e.g. 95.0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor Feedback</label>
              <textarea
                rows={3}
                required
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg"
                placeholder="Constructive feedback, code improvements, suggestions..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setGradingSubmission(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-bold rounded-lg shadow-sm">
                Commit Grade & Notify Student
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
