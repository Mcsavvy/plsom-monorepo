"use client";

import { useState, useEffect } from "react";
import { Home, BookOpen, Calendar, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
      <nav
        className={`bg-background/95 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur-md transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        } lg:hidden`}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {navigationItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center space-y-1 rounded-lg p-2 transition-colors ${
                isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Top Header for Mobile */}
      <header
        className={`bg-background/95 fixed top-0 right-0 left-0 z-40 backdrop-blur-md transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } lg:hidden`}
      >
        <div className="flex h-14 items-center justify-between px-4">
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
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center text-sm font-semibold">
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
                        <img
                          src={user.profilePicture}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center font-semibold">
                          {user?.initials}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user?.displayName}</p>
                      <p className="text-muted-foreground text-sm">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
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
