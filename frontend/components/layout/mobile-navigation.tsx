"use client";

import { useState, useEffect } from "react";
import { Home, BookOpen, Calendar, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { NetworkStatus, PWAInstallButton } from "@/components/pwa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { PLSOMBranding } from "../ui/plsom-branding";

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
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    protected: true,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    protected: true,
  },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { logout, user } = useAuth();

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-40 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'
        } lg:hidden`}>
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 ${isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Top Header for Mobile */}
      <header className={`fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md z-40 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        } lg:hidden`}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-2">
            <PLSOMBranding size="sm" showName={false} />
          </div>
          <div className="flex items-center space-x-2">
            <NetworkStatus variant="minimal" showOnlineStatus />
            <Popover>
              <PopoverTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar className="h-8 w-8">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground font-semibold text-sm">
                        {user?.initials}
                      </div>
                    )}
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground font-semibold">
                          {user?.initials}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user?.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                    <PWAInstallButton variant="card" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
