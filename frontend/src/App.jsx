import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GradeSelection from './pages/GradeSelection';
import Topics from './pages/Topics';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Practice from './pages/Practice';
import QuizList from './pages/QuizList';
import QuizTaking from './pages/QuizTaking';
import QuizResults from './pages/QuizResults';
import Exam from './pages/Exam';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTopics from './pages/admin/AdminTopics';
import AdminLessons from './pages/admin/AdminLessons';
import AdminExercises from './pages/admin/AdminExercises';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestionBank from './pages/admin/AdminQuestionBank';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          
          {/* Grade Selection - Protected */}
          <Route
            path="/select-grade"
            element={
              <ProtectedRoute>
                <GradeSelection />
              </ProtectedRoute>
            }
          />
          
          {/* Home route - redirect based on auth */}
          <Route
            path="/"
            element={
              <Layout>
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/topics"
            element={
              <Layout>
                <ProtectedRoute>
                  <Topics />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/lessons"
            element={
              <Layout>
                <ProtectedRoute>
                  <Lessons />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/lessons/:id"
            element={
              <Layout>
                <ProtectedRoute>
                  <LessonDetail />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/practice"
            element={
              <Layout>
                <ProtectedRoute>
                  <Practice />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/quiz"
            element={
              <Layout>
                <ProtectedRoute>
                  <QuizList />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute>
                <QuizTaking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:id/results"
            element={
              <Layout>
                <ProtectedRoute>
                  <QuizResults />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/exam"
            element={
              <Layout>
                <ProtectedRoute>
                  <Exam />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/progress"
            element={
              <Layout>
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/topics"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminTopics />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/lessons"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminLessons />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/lessons/:lessonId/exercises"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminExercises />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/exercises"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminQuestionBank />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/quizzes"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminQuizzes />
                </ProtectedRoute>
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminLayout>
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              </AdminLayout>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

