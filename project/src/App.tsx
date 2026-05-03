import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/components/HomePage';
import { SearchPage } from '@/components/SearchPage';
import { WikiPageView } from '@/components/WikiPageView';
import { TagView } from '@/components/TagView';
import { BrowsePage } from '@/components/BrowsePage';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/page/:slug" element={<WikiPageView />} />
          <Route path="/tag/:tagName" element={<TagView />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
