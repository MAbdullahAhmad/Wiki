import { Link, useLocation } from 'react-router-dom';
import { Search, BookOpen, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/browse', label: 'Browse', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Wiki</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive(link.to) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-background p-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.to) ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2 mb-1"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Personal Wiki — Built with React & Markdown
        </div>
      </footer>
    </div>
  );
}
