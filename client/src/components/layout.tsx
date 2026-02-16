import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, User as UserIcon, LogOut, Building2, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { AchievementNotifications } from "@/components/engagement-profile";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="font-serif text-xl font-bold text-primary tracking-tight">
              CareNaija
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
              Home
            </Link>
            <Link href="/search" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}>
              Find Hospitals
            </Link>
            <Link href="/health" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/health') || location.startsWith('/health/') ? 'text-primary' : 'text-muted-foreground'}`}>
              Health Hub
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName || user.email}`} alt={user.firstName || 'User'} />
                      <AvatarFallback>{(user.firstName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                     <Link href="/admin">
                       <DropdownMenuItem>
                         <Building2 className="mr-2 h-4 w-4" />
                         <span>Admin Dashboard</span>
                       </DropdownMenuItem>
                     </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 touch-target flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white safe-area-bottom">
            <nav className="flex flex-col py-2">
              <Link 
                href="/" 
                className="mobile-nav-link" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-home"
              >
                <Building2 className="h-5 w-5" />
                Home
              </Link>
              <Link 
                href="/search" 
                className="mobile-nav-link" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-search"
              >
                <Search className="h-5 w-5" />
                Find Hospitals
              </Link>
              <Link 
                href="/health" 
                className="mobile-nav-link" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-health"
              >
                <Building2 className="h-5 w-5" />
                Health Hub
              </Link>
              <div className="h-px bg-border mx-4 my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName || user.email}`} />
                      <AvatarFallback>{(user.firstName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-base font-medium">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <button 
                    className="mobile-nav-link text-destructive" 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    data-testid="mobile-nav-logout"
                  >
                    <LogOut className="h-5 w-5" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4 py-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-12 text-base" data-testid="mobile-nav-login">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-12 text-base" data-testid="mobile-nav-signup">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>
      
      {user && <AchievementNotifications />}

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-bold text-white tracking-tight">
                  CareNaija
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Empowering Nigerians to make informed healthcare decisions through transparent reviews and data.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search" className="hover:text-white transition-colors">Find & Compare Hospitals in Nigeria</Link></li>
                <li><Link href="/hospitals/lagos" className="hover:text-white transition-colors">Best Hospitals in Lagos</Link></li>
                <li><Link href="/hospitals/abuja" className="hover:text-white transition-colors">Best Hospitals in Abuja</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Write a Hospital Review</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/guides" className="hover:text-white transition-colors">Health Guides</Link></li>
                <li><Link href="/health" className="hover:text-white transition-colors">Health Hub</Link></li>
                <li><Link href="/specialties" className="hover:text-white transition-colors">Medical Specialties</Link></li>
                <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                <li><Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
                <li><Link href="/trust-safety" className="hover:text-white transition-colors">Trust & Safety</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} CareNaija. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
