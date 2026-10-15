import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GradeSelection = lazy(() => import('./pages/GradeSelection'));
const Topics = lazy(() => import('./pages/Topics'));
const Lessons = lazy(() => import('./pages/Lessons'));
const LessonDetail = lazy(() => import('./pages/LessonDetail'));
const Practice = lazy(() => import('./pages/Practice'));
const QuizList = lazy(() => import('./pages/QuizList'));
const QuizTaking = lazy(() => import('./pages/QuizTaking'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const Exam = lazy(() => import('./pages/Exam'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTopics = lazy(() => import('./pages/admin/AdminTopics'));
const AdminLessons = lazy(() => import('./pages/admin/AdminLessons'));
const AdminExercises = lazy(() => import('./pages/admin/AdminExercises'));
const AdminQuizzes = lazy(() => import('./pages/admin/AdminQuizzes'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminQuestionBank = lazy(() => import('./pages/admin/AdminQuestionBank'));

function StudentLayout() {
  return <Layout><Outlet /></Layout>;
}

function AdminRouteLayout() {
  return <AdminLayout><Outlet /></AdminLayout>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div role="status" className="p-8 text-center">Đang tải...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/select-grade" element={<GradeSelection />} />
              <Route path="/quiz/:id" element={<QuizTaking />} />
              <Route element={<StudentLayout />}>
                <Route index element={<Home />} />
                <Route path="topics" element={<Topics />} />
                <Route path="lessons" element={<Lessons />} />
                <Route path="lessons/:id" element={<LessonDetail />} />
                <Route path="practice" element={<Practice />} />
                <Route path="quiz" element={<QuizList />} />
                <Route path="quiz/:id/results" element={<QuizResults />} />
                <Route path="exam" element={<Exam />} />
                <Route path="progress" element={<Progress />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminRouteLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="topics" element={<AdminTopics />} />
                <Route path="lessons" element={<AdminLessons />} />
                <Route path="lessons/:lessonId/exercises" element={<AdminExercises />} />
                <Route path="exercises" element={<AdminQuestionBank />} />
                <Route path="quizzes" element={<AdminQuizzes />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
