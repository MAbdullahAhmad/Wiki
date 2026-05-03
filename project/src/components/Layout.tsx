import { Link, useLocation } from 'react-router-dom';
import { Search, BookOpen, Home, Menu, X, Moon, Sun } from 'lucide-react';
import { useState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface LayoutProps {
  children: React.ReactNode;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('wiki-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function ThemeSwitch({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const id = useId();
  const isDark = theme === 'dark';

  return (
    <div
      className="group inline-flex items-center gap-2"
      data-state={isDark ? 'checked' : 'unchecked'}
    >
      <span
        id={`${id}-light`}
        className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-sm font-medium"
        aria-controls={id}
        onClick={() => isDark && onToggle()}
      >
        <Sun className="size-4" aria-hidden="true" />
      </span>
      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={onToggle}
        aria-labelledby={`${id}-dark ${id}-light`}
        aria-label="Toggle between dark and light mode"
      />
      <span
        id={`${id}-dark`}
        className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-sm font-medium"
        aria-controls={id}
        onClick={() => !isDark && onToggle()}
      >
        <Moon className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('wiki-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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
          <Link to="/" className="flex items-center gap-2 font-bold text-lg" title="Wiki by Abdullah">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>W/A</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <nav className="flex items-center gap-1">
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
            <div className="w-px h-6 bg-border mx-2" />
            <ThemeSwitch theme={theme} onToggle={toggleTheme} />
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <ThemeSwitch theme={theme} onToggle={toggleTheme} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
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
          Wiki by Abdullah
        </div>
      </footer>
    </div>
  );
}
