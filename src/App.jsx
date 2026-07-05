import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import CoursesPage from './pages/admin/CoursesPage';
import ExamManagePage from './pages/admin/ExamManagePage';
import LiveMonitor from './pages/admin/LiveMonitor';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import SubmissionDetail from './pages/admin/SubmissionDetail';
import StudentsPage from './pages/admin/StudentsPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import ExamSession from './pages/student/ExamSession';
import ResultPage from './pages/student/ResultPage';
import SubmissionsHistoryPage from './pages/student/SubmissionsHistoryPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
          toastStyle={{
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute role="admin"><CoursesPage /></ProtectedRoute>} />
          <Route path="/admin/exams/:examId" element={<ProtectedRoute role="admin"><ExamManagePage /></ProtectedRoute>} />
          <Route path="/admin/monitor" element={<ProtectedRoute role="admin"><LiveMonitor /></ProtectedRoute>} />
          <Route path="/admin/submissions" element={<ProtectedRoute role="admin"><SubmissionsPage /></ProtectedRoute>} />
          <Route path="/admin/submissions/:id" element={<ProtectedRoute role="admin"><SubmissionDetail /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentsPage /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/exam/:examId" element={<ProtectedRoute role="student"><ExamSession /></ProtectedRoute>} />
          <Route path="/student/result/:submissionId" element={<ProtectedRoute role="student"><ResultPage /></ProtectedRoute>} />
          <Route path="/student/submissions" element={<ProtectedRoute role="student"><SubmissionsHistoryPage /></ProtectedRoute>} />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
