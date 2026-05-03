import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/components/HomePage';
import { Loader2 } from 'lucide-react';

const SearchPage = lazy(() => import('@/components/SearchPage').then((m) => ({ default: m.SearchPage })));
const WikiPageView = lazy(() => import('@/components/WikiPageView').then((m) => ({ default: m.WikiPageView })));
const TagView = lazy(() => import('@/components/TagView').then((m) => ({ default: m.TagView })));
const BrowsePage = lazy(() => import('@/components/BrowsePage').then((m) => ({ default: m.BrowsePage })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/page/:slug" element={<WikiPageView />} />
            <Route path="/tag/:tagName" element={<TagView />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}
