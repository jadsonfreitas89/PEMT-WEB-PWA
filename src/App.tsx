import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../web/src/layouts/AppLayout';
import LoginPage from '../web/src/pages/LoginPage';
import RegisterPage from '../web/src/pages/RegisterPage';
import CompleteProfilePage from '../web/src/pages/CompleteProfilePage';
import SetupPage from '../web/src/pages/SetupPage';
import InitialSetupPage from '../web/src/pages/InitialSetupPage';
import HomePage from '../web/src/pages/HomePage';
import ChecklistPage from '../web/src/pages/ChecklistPage';
import HistoryPage from '../web/src/pages/HistoryPage';
import SettingsPage from '../web/src/pages/SettingsPage';
import AdminPage from '../web/src/pages/AdminPage';
import { AuthProvider } from '../web/src/services/auth/AuthContext';
import ProtectedRoute from '../web/src/services/auth/ProtectedRoute';
import PublicRoute from '../web/src/services/auth/PublicRoute';
import CompleteProfileRoute from '../web/src/services/auth/CompleteProfileRoute';
import AdminRoute from '../web/src/services/auth/AdminRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/complete-profile" element={<CompleteProfileRoute><CompleteProfilePage /></CompleteProfileRoute>} />
        <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
        <Route path="/initial-setup" element={<ProtectedRoute><InitialSetupPage /></ProtectedRoute>} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="checklist" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
          <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

