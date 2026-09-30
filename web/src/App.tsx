import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SetupPage from './pages/SetupPage';
import HomePage from './pages/HomePage';
import ChecklistPage from './pages/ChecklistPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './services/auth/AuthContext';
import ProtectedRoute from './services/auth/ProtectedRoute';
import PublicRoute from './services/auth/PublicRoute';
import CompleteProfileRoute from './services/auth/CompleteProfileRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/complete-profile" element={<CompleteProfileRoute><CompleteProfilePage /></CompleteProfileRoute>} />
        <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="checklist" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
          <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
