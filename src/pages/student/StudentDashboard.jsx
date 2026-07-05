import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Target, ChevronRight, Lock, Play,
  CheckCircle, Plus, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const timeStatusConfig = {
  upcoming: { label: 'Not started yet',  icon: Clock,  color: 'text-surface-400' },
  active:   { label: 'Available now',    icon: Play,   color: 'text-green-600' },
  expired:  { label: 'Exam closed',      icon: Lock,   color: 'text-red-500' },
};

const ExamCard = ({ exam }) => {
  const { label, icon: Icon, color } = timeStatusConfig[exam.timeStatus] ?? timeStatusConfig.upcoming;
  const sub = exam.submission;

  const canStart = exam.timeStatus === 'active' && !sub;
  const hasResult = sub?.status === 'Graded';

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-xl p-4 hover:border-surface-300 hover:bg-white transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 truncate">{exam.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={11} /> {exam.duration} min</span>
            <span className="flex items-center gap-1"><Target size={11} /> Pass: {exam.passingPercentage}%</span>
            <span className="flex items-center gap-1"><AlertTriangle size={11} /> {exam.maxStrikes} strikes</span>
          </div>
          <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${color}`}>
            <Icon size={11} />
            {label}
          </div>
        </div>
        <div className="flex-shrink-0">
          {sub ? (
            <div className="text-right">
              <StatusBadge status={sub.status} />
              {hasResult && (
                <Link
                  to={`/student/result/${sub._id}`}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1.5 justify-end font-medium"
                >
                  View result <ArrowUpRight size={11} />
                </Link>
              )}
              {!hasResult && sub.status !== 'Pending' && (
                <p className="text-xs text-surface-400 mt-1">Awaiting grading</p>
              )}
              {sub.status === 'Pending' && (
                <Link to={`/student/exam/${exam._id}`} className="btn-primary btn-sm mt-1.5">Resume</Link>
              )}
            </div>
          ) : canStart ? (
            <Link to={`/student/exam/${exam._id}`} className="btn-primary btn-sm">
              <Play size={13} /> Start
            </Link>
          ) : (
            <span className="text-xs text-surface-400 px-2 py-1">
              {exam.timeStatus === 'upcoming' ? 'Not yet open' : 'Closed'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseCard = ({ course, onEnroll }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [exams, setExams] = useState(null);

  useEffect(() => {
    if (course.isEnrolled) {
      api.get(`/student/courses/${course._id}/exams`).then(({ data }) => setExams(data.exams));
    }
  }, [course._id, course.isEnrolled]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await onEnroll(course._id);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">{course.title}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{course.description}</p>
          </div>
        </div>
        {!course.isEnrolled ? (
          <button className="btn-primary btn-sm flex-shrink-0" onClick={handleEnroll} disabled={enrolling}>
            <Plus size={13} />
            {enrolling ? 'Enrolling…' : 'Enroll'}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium flex-shrink-0">
            <CheckCircle size={12} /> Enrolled
          </span>
        )}
      </div>

      {course.isEnrolled && (
        <div className="mt-4 space-y-2 border-t border-surface-100 pt-3">
          {exams === null ? (
            <div className="text-xs text-surface-400 text-center py-3">Loading exams…</div>
          ) : exams.length === 0 ? (
            <div className="text-xs text-surface-400 text-center py-3">No exams published yet.</div>
          ) : exams.map((exam) => (
            <ExamCard key={exam._id} exam={exam} courseId={course._id} />
          ))}
        </div>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = () =>
    api.get('/student/courses').then(({ data }) => setCourses(data.courses)).finally(() => setLoading(false));

  useEffect(() => { fetchCourses(); }, []);

  const handleEnroll = async (courseId) => {
    await api.post(`/student/courses/${courseId}/enroll`);
    toast.success('Enrolled successfully!');
    fetchCourses();
  };

  const enrolled = courses.filter((c) => c.isEnrolled);
  const available = courses.filter((c) => !c.isEnrolled);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900">
            My <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-surface-500 mt-1">Your courses and exam schedule</p>
        </div>

        {loading ? <LoadingSpinner text="Loading courses…" /> : (
          <div className="space-y-8">
            {/* Enrolled courses */}
            {enrolled.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-semibold text-surface-900">My Courses ({enrolled.length})</h2>
                </div>
                <div className="space-y-4">
                  {enrolled.map((c) => <CourseCard key={c._id} course={c} onEnroll={handleEnroll} />)}
                </div>
              </section>
            )}

            {/* Available courses */}
            {available.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-brand-500" />
                  <h2 className="text-lg font-semibold text-surface-900">Available Courses ({available.length})</h2>
                </div>
                <div className="space-y-4">
                  {available.map((c) => <CourseCard key={c._id} course={c} onEnroll={handleEnroll} />)}
                </div>
              </section>
            )}

            {courses.length === 0 && (
              <div className="card text-center py-16">
                <BookOpen size={40} className="text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No courses available yet. Check back soon!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
