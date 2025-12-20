import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PageLoader } from './components/UI';
import { Toaster } from 'react-hot-toast';

// Only load what is strictly necessary for the initial boot
const Login = lazy(() => import('./pages/auth/Login'));
const FirstRunSetup = lazy(() => import('./pages/auth/FirstRunSetup'));
const ProtectedApp = lazy(() => import('./components/Auth/ProtectedApp'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<FirstRunSetup />} />

            {/* All other routes are handled in ProtectedApp to isolate dependencies */}
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
