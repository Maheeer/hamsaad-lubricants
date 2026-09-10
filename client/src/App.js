import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// PWA components
import PWAInstallBanner from './components/PWAInstallBanner';
import OfflineBar       from './components/OfflineBar';

// Pages
import Login               from './pages/Login';
import AdminDashboard      from './pages/admin/Dashboard';
import ManagerDashboard    from './pages/manager/Dashboard';
import StorekeeperDashboard from './pages/storekeeper/Dashboard';
import CashierDashboard    from './pages/cashier/Dashboard';
import ClientApp           from './pages/client/ClientApp';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <p>Loading HAMSAAD LUBRICANTS...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Login />
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/manager/*" element={
        <ProtectedRoute allowedRoles={['manager']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/storekeeper/*" element={
        <ProtectedRoute allowedRoles={['storekeeper']}>
          <StorekeeperDashboard />
        </ProtectedRoute>
      } />

      <Route path="/cashier/*" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierDashboard />
        </ProtectedRoute>
      } />

      {/* Client portal */}
      <Route path="/client/*" element={<ClientApp />} />

      <Route path="/" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* PWA offline indicator */}
        <OfflineBar />

        <AppRoutes />

        {/* PWA install prompt */}
        <PWAInstallBanner />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
