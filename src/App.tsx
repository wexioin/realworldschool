import React, { Suspense } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import { ToastProvider } from './components/Toast';
import { SessionProvider, useSessionMaybe, ROLE_HOME } from './session';

// 단일 HTML(파일 공유용) 빌드에서는 file:// 에서도 동작하도록 MemoryRouter를 쓰고,
// 열자마자 콘텐츠 자산 페이지로 진입합니다. 일반 빌드는 기존 BrowserRouter 유지.
const SINGLEFILE = import.meta.env.VITE_SINGLEFILE === '1';
const Router = SINGLEFILE ? MemoryRouter : BrowserRouter;
const routerProps = SINGLEFILE ? { initialEntries: ['/content-assets'] } : {};

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ContentsPage = React.lazy(() => import('./pages/ContentsPage'));
const ContentAssetsPage = React.lazy(() => import('./pages/ContentAssetsPage'));
const BrandAssetsPage = React.lazy(() => import('./pages/BrandAssetsPage'));
const KnowledgeAssetsPage = React.lazy(() => import('./pages/KnowledgeAssetsPage'));
const CreatorsPage = React.lazy(() => import('./pages/CreatorsPage'));
const PartnersPage = React.lazy(() => import('./pages/PartnersPage'));
const MembersPage = React.lazy(() => import('./pages/MembersPage'));
const SalesPage = React.lazy(() => import('./pages/SalesPage'));
const SettlementsPage = React.lazy(() => import('./pages/SettlementsPage'));
const ExperiencePage = React.lazy(() => import('./pages/ExperiencePage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReviewerPage = React.lazy(() => import('./pages/ReviewerPage'));
const MyContentsPage = React.lazy(() => import('./pages/MyContentsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

/**
 * 로그인 게이트. 비로그인 상태에서는 Layout(사이드바) 없이 로그인 화면만 띄웁니다.
 * 로그인 후에는 역할별 라우트만 등록되므로, 검수자·크리에이터는 어드민 경로를
 * 주소창에 직접 입력해도 각자의 홈으로 되돌아갑니다.
 */
function AppRoutes() {
  const { user } = useSessionMaybe();

  if (!user) {
    return (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    );
  }

  const home = ROLE_HOME[user.role];

  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {user.role === 'admin' && (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contents" element={<ContentsPage />} />
              <Route path="/content-assets" element={<ContentAssetsPage />} />
              <Route path="/brand-assets" element={<BrandAssetsPage />} />
              <Route path="/knowledge-assets" element={<KnowledgeAssetsPage />} />
              <Route path="/creators" element={<CreatorsPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/settlements" element={<SettlementsPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          {user.role === 'reviewer' && <Route path="/review/assignments" element={<ReviewerPage />} />}
          {user.role === 'creator' && <Route path="/my/contents" element={<MyContentsPage />} />}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <Router {...routerProps}>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
