"use client";

import { useState, useEffect } from "react";
import { Home, BookOpen, Users, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NetworkStatus, PWAInstallButton } from "@/components/pwa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  protected?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/courses",
    label: "Courses",
    icon: BookOpen,
    protected: true,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: Users,
    protected: true,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    protected: true,
  },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { session } = useSession();

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        setIsVisible(false);
      } else {
        // Scrolling up - show nav
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Filter navigation items based on authentication
  const filteredNavItems = navigationItems.filter(item => 
    !item.protected || isAuthenticated
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } lg:hidden`}>
        <div className="flex items-center justify-around h-16 px-2">
          {filteredNavItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          ))}
          
          {/* More Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg min-w-0 flex-1"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Navigation Menu</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* All Navigation Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Navigation
                  </h3>
                  <div className="grid gap-1">
                    {filteredNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* User Info */}
                {isAuthenticated && session && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Account
                    </h3>
                    <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {session.user.first_name.charAt(0)}{session.user.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {session.user.first_name} {session.user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Network Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Network Status</span>
                  <NetworkStatus variant="minimal" showOnlineStatus />
                </div>

                {/* Install App */}
                <div className="space-y-2">
                  <PWAInstallButton variant="button" className="w-full" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Top Header for Mobile */}
      <header className={`fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } lg:hidden`}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg">PLSOM LMS</h1>
          </div>
          <div className="flex items-center space-x-2">
            <NetworkStatus variant="minimal" />
            <PWAInstallButton variant="button" />
          </div>
        </div>
      </header>

      {/* Spacer for fixed headers */}
      <div className="h-14 lg:hidden" />
      <div className="h-16 lg:hidden" />
    </>
  );
}

export default MobileNavigation;
