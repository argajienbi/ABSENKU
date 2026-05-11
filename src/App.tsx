import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WaveBackground } from "./components/WaveBackground";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { fetchHolidays } from "./lib/holidayService";
import { Loader2 } from 'lucide-react';

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserApp = lazy(() => import("./pages/UserApp"));

const PageLoading = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-950">
    <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-3xl shadow-xl flex items-center justify-center mb-4 animate-bounce">
       <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
    <p className="text-sm font-black text-teal-900 dark:text-teal-400 uppercase tracking-widest">Absenku System</p>
  </div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/app" />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    fetchHolidays();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/login" element={<WaveBackground><Login /></WaveBackground>} />
              
              <Route path="/app" element={
                <ProtectedRoute>
                  <WaveBackground>
                    <UserApp />
                  </WaveBackground>
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['superadmin', 'admin', 'demo']}>
                  <WaveBackground>
                    <Dashboard />
                  </WaveBackground>
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/app" />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
