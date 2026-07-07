import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail, { StoryDetailSlug } from './pages/StoryDetail';
import WriterProfile from './pages/WriterProfile';
import Writers from './pages/Writers';
import CategoryArchive from './pages/CategoryArchive';
import {
  PrivacyPolicyPage,
  CookiePolicyPage,
  ContactPage,
  ReportContentPage,
  AboutPage,
} from './pages/LegalPage';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';

const Submit = lazy(() => import('./pages/Submit'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const OnboardingUsername = lazy(() => import('./pages/OnboardingUsername'));
const EditStory = lazy(() => import('./pages/EditStory'));
const Admin = lazy(() => import('./pages/Admin'));

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

function PageLoader() {
  return (
    <div className="page-loading" aria-busy="true">
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/story/:id" element={<StoryDetail />} />
              <Route path="/category/:categorySlug" element={<CategoryArchive />} />
              <Route path="/writer/:username" element={<WriterProfile />} />
              <Route path="/writers" element={<Writers />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/report-content" element={<ReportContentPage />} />
              <Route path="/:categorySlug/:storySlug" element={<StoryDetailSlug />} />
              <Route
                path="/onboarding/username"
                element={
                  <ProtectedRoute requireWriter requireOnboarding={false}>
                    <Suspense fallback={<PageLoader />}>
                      <OnboardingUsername />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requireWriter>
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute requireWriter>
                    <Suspense fallback={<PageLoader />}>
                      <EditProfile />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit"
                element={
                  <ProtectedRoute requireWriter>
                    <Suspense fallback={<PageLoader />}>
                      <Submit />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute requireWriter>
                    <Suspense fallback={<PageLoader />}>
                      <EditStory />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<PageLoader />}>
                      <Admin />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}