import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, BookOpen, Users, FileText, ChevronRight,
  Trash2, Edit2, Check, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

// ── Helpers ────────────────────────────────────────────────────────
/**
 * Converts a Date/ISO string to the value expected by datetime-local inputs.
 * datetime-local requires "YYYY-MM-DDTHH:MM" (no timezone, no seconds).
 */
const toDatetimeLocal = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
  } catch {
    return '';
  }
};

// ── Create / Edit Course Modal ─────────────────────────────────────
const CourseForm = ({ initial = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}
      <div>
        <label className="label">Course title</label>
        <input className="input" placeholder="e.g. Introduction to Python"
          value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="What will students learn?"
          value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>
          {loading ? 'Saving…' : initial._id ? 'Update' : 'Create Course'}
        </button>
      </div>
    </form>
  );
};

// ── Create / Edit Exam Modal ───────────────────────────────────────
const ExamForm = ({ courseId, initial = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    title:             initial.title             || '',
    description:       initial.description       || '',
    duration:          initial.duration          || 30,
    startTime:         toDatetimeLocal(initial.startTime),
    endTime:           toDatetimeLocal(initial.endTime),
    passingPercentage: initial.passingPercentage ?? 50,
    maxStrikes:        initial.maxStrikes        ?? 3,
    isPublished:       initial.isPublished       || false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) =>
    setForm(f => ({
      ...f,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const validate = () => {
    if (!form.title.trim())    return 'Exam title is required';
    if (!form.startTime)       return 'Start time is required';
    if (!form.endTime)         return 'End time is required';
    const start = new Date(form.startTime);
    const end   = new Date(form.endTime);
    if (isNaN(start.getTime())) return 'Start time is invalid';
    if (isNaN(end.getTime()))   return 'End time is invalid';
    if (end <= start)           return 'End time must be after start time';
    const dur = Number(form.duration);
    if (isNaN(dur) || dur < 1) return 'Duration must be at least 1 minute';
    const pct = Number(form.passingPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return 'Passing % must be between 0 and 100';
    const strikes = Number(form.maxStrikes);
    if (isNaN(strikes) || strikes < 1) return 'Max strikes must be at least 1';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const formattedForm = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      await onSave({ ...formattedForm, courseId });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Exam title</label>
          <input className="input" placeholder="e.g. Mid-Term Exam" value={form.title} onChange={update('title')} required />
        </div>
        <div className="col-span-2">
          <label className="label">Description <span className="text-surface-400">(optional)</span></label>
          <input className="input" placeholder="Brief description" value={form.description} onChange={update('description')} />
        </div>

        <div>
          <label className="label">Duration (minutes)</label>
          <input type="number" className="input" min="1" value={form.duration} onChange={update('duration')} required />
        </div>
        <div>
          <label className="label">Passing % threshold</label>
          <input type="number" className="input" min="0" max="100" value={form.passingPercentage} onChange={update('passingPercentage')} required />
        </div>

        <div>
          <label className="label">Start time (local)</label>
          <input type="datetime-local" className="input" value={form.startTime} onChange={update('startTime')} required />
        </div>
        <div>
          <label className="label">End time (local)</label>
          <input type="datetime-local" className="input" value={form.endTime} onChange={update('endTime')} required />
        </div>

        <div>
          <label className="label">Max anti-cheat strikes</label>
          <input type="number" className="input" min="1" value={form.maxStrikes} onChange={update('maxStrikes')} required />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox" id="publish"
            className="w-4 h-4 accent-brand-500"
            checked={form.isPublished}
            onChange={update('isPublished')}
          />
          <label htmlFor="publish" className="text-sm text-surface-700 cursor-pointer">
            Publish immediately
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>
          {loading ? 'Saving…' : initial._id ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </form>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, data? }

  const fetchCourses = () =>
    api.get('/admin/courses')
      .then(({ data }) => setCourses(data.courses))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchCourses(); }, []);

  // ── Course handlers ──────────────────────────────────────────────
  const handleCreateCourse = async (form) => {
    await api.post('/admin/courses', form);
    toast.success('Course created!');
    fetchCourses();
  };

  const handleUpdateCourse = async (form) => {
    await api.put(`/admin/courses/${modal.data._id}`, form);
    toast.success('Course updated!');
    fetchCourses();
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course and ALL its exams/questions? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    }
  };

  // ── Exam handlers ────────────────────────────────────────────────
  const handleCreateExam = async (form) => {
    await api.post('/admin/exams', form);
    toast.success('Exam created!');
    fetchCourses();
  };

  const handleTogglePublish = async (exam) => {
    try {
      await api.put(`/admin/exams/${exam._id}`, { isPublished: !exam.isPublished });
      toast.success(exam.isPublished ? 'Exam unpublished' : 'Exam published!');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('Delete this exam and all its questions? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/exams/${examId}`);
      toast.success('Exam deleted');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                Courses <span className="text-gradient">&amp; Exams</span>
              </h1>
              <p className="text-surface-500 mt-1">Manage your course catalog and exam schedule</p>
            </div>
            <button className="btn-primary" onClick={() => setModal({ type: 'createCourse' })}>
              <Plus size={18} /> New Course
            </button>
          </div>

          {loading ? <LoadingSpinner text="Loading courses…" /> : (
            <div className="space-y-6">
              {courses.length === 0 && (
                <div className="card text-center py-16">
                  <BookOpen size={40} className="text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">No courses yet. Create your first course!</p>
                </div>
              )}

              {courses.map((course) => (
                <div key={course._id} className="card">
                  {/* Course header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-surface-900">{course.title}</h2>
                        <p className="text-sm text-surface-500">{course.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <Users size={12} /> {course.enrolledStudents?.length ?? 0}
                      </span>
                      <button
                        className="btn-secondary btn-sm px-2.5 py-1.5"
                        onClick={() => setModal({ type: 'editCourse', data: course })}
                        title="Edit course"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-danger btn-sm px-2.5 py-1.5"
                        onClick={() => handleDeleteCourse(course._id)}
                        title="Delete course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Exams list */}
                  <div className="space-y-2 mb-3">
                    {course.exams?.map((exam) => (
                      <div key={exam._id} className="flex items-center gap-3 p-3 bg-surface-100 rounded-xl">
                        <FileText size={15} className="text-surface-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-surface-900 truncate">{exam.title}</p>
                          <p className="text-xs text-surface-400">
                            {new Date(exam.startTime).toLocaleString()} → {new Date(exam.endTime).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge status={exam.isPublished ? 'published' : 'draft'} />
                        <div className="flex gap-1.5">
                          <button
                            title={exam.isPublished ? 'Unpublish' : 'Publish'}
                            className={`p-1.5 rounded-lg transition-colors ${exam.isPublished ? 'text-green-400 hover:bg-green-500/10' : 'text-surface-500 hover:bg-surface-300'}`}
                            onClick={() => handleTogglePublish(exam)}
                          >
                            <Check size={14} />
                          </button>
                          <Link
                            to={`/admin/exams/${exam._id}`}
                            className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 transition-colors"
                            title="Manage questions"
                          >
                            <ChevronRight size={14} />
                          </Link>
                          <button
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            onClick={() => handleDeleteExam(exam._id)}
                            title="Delete exam"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!course.exams || course.exams.length === 0) && (
                      <p className="text-sm text-surface-400 px-3">No exams yet.</p>
                    )}
                  </div>

                  <button
                    className="btn-secondary btn-sm w-full"
                    onClick={() => setModal({ type: 'createExam', data: { courseId: course._id } })}
                  >
                    <Plus size={14} /> Add Exam to this Course
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={modal?.type === 'createCourse'} onClose={() => setModal(null)} title="Create New Course">
        <CourseForm onSave={handleCreateCourse} onClose={() => setModal(null)} />
      </Modal>

      <Modal isOpen={modal?.type === 'editCourse'} onClose={() => setModal(null)} title="Edit Course">
        <CourseForm initial={modal?.data} onSave={handleUpdateCourse} onClose={() => setModal(null)} />
      </Modal>

      <Modal isOpen={modal?.type === 'createExam'} onClose={() => setModal(null)} title="Create New Exam" size="lg">
        <ExamForm courseId={modal?.data?.courseId} onSave={handleCreateExam} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
};

export default CoursesPage;
