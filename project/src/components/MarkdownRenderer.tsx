import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { LinkPreview } from './LinkPreview';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { index } = useWikiIndex();
  const slugs = new Set(index?.pages.map((p) => p.slug) || []);

  const components: Components = {
    a: ({ href, children, ...props }) => {
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        const slug = href.replace(/\.md$/, '').replace(/^\//, '');
        if (slugs.has(slug)) {
          return <LinkPreview slug={slug}>{children as ReactNode}</LinkPreview>;
        }
      }
      if (href?.startsWith('http')) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2" {...props}>
            {children}
          </a>
        );
      }
      return <a href={href} className="text-primary underline underline-offset-2" {...props}>{children}</a>;
    },
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold tracking-tight mt-8 mb-4 pb-2 border-b border-border" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }) => (
      <p className="leading-7 mb-4" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props}>{children}</blockquote>
    ),
    code: ({ className, children, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>{children}</code>
        );
      }
      return (
        <code className={`${className} block`} {...props}>{children}</code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto mb-4 text-sm" {...props}>{children}</pre>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-border" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold text-sm" {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-4 py-2 text-sm" {...props}>{children}</td>
    ),
    hr: (props) => (
      <hr className="my-6 border-border" {...props} />
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>{children}</strong>
    ),
  };

  return (
    <div className="wiki-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
