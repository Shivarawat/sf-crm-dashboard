import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const AppContent = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Dashboard /> : <Login />;
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
