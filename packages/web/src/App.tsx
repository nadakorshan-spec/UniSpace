import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Tasks from './pages/Tasks';
import Exams from './pages/Exams';
import CalendarPage from './pages/CalendarPage';
import StudyPlanner from './pages/StudyPlanner';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lavender-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/courses" element={<Protected><Courses /></Protected>} />
          <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
          <Route path="/exams" element={<Protected><Exams /></Protected>} />
          <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
          <Route path="/planner" element={<Protected><StudyPlanner /></Protected>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
