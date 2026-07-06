import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import { ToastProvider } from './components/Toast';
 
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
 
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
 
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Loading />}>
            <Routes>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}