"use client";

import { useState, useEffect } from "react";
import {
  Home,
  BookOpen,
  Calendar,
  Settings,
  User,
  LogOut,
  ArrowLeft,
  FileText,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { NetworkStatus, PWAInstallButton } from "@/components/pwa";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { PLSOMBranding } from "../ui/plsom-branding";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  protected?: boolean;
}

interface HeaderMapEntry {
  pattern: RegExp;
  component: React.ComponentType<{
    user: any;
    handleLogout: () => Promise<void>;
  }>;
}

interface DefaultHeaderProps {
  user: any;
  handleLogout: () => Promise<void>;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    protected: true,
  },
  {
    href: "/courses",
    label: "Courses",
    icon: BookOpen,
    protected: true,
  },
  {
    href: "/classes",
    label: "Classes",
    icon: Presentation,
    protected: true,
  },
  {
    href: "/tests",
    label: "Tests",
    icon: FileText,
    protected: true,
  },
];

function getGenericHeader(title: string) {
  function GenericHeader({ user }: DefaultHeaderProps) {
    const router = useRouter();
    return (
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
            <h1 className="truncate text-lg font-bold md:text-2xl">{title}</h1>
            <Avatar className="h-8 w-8">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="object-fit h-full w-full"
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center text-xs font-semibold">
                  {user?.initials}
                </div>
              )}
            </Avatar>
          </div>
        </div>
      </div>
    );
  }
  return GenericHeader;
}

// function TestDetailsHeader({ user }: DefaultHeaderProps) {

// Header map - add your regex patterns and corresponding components here
const headerMap: HeaderMapEntry[] = [
  {
    pattern: /^\/profile(\/.*)?$/,
    component: getGenericHeader("My Profile"),
  },
  {
    pattern: /^\/courses\/(\d+)$/,
    component: getGenericHeader("Course Details"),
  },
  {
    pattern: /^\/classes\/(\d+)$/,
    component: getGenericHeader("Class Details"),
  },
  {
    pattern: /^\/tests\/(\d+)$/,
    component: getGenericHeader("Test Details"),
  },
  {
    pattern: /^\/tests\/(\d+)\/take$/,
    component: getGenericHeader("Take Test"),
  },
  {
    pattern: /^\/submissions\/(\d+)$/,
    component: getGenericHeader("Submission Details"),
  },
];

// Default header component
function DefaultHeader({ user, handleLogout }: DefaultHeaderProps) {
  return (
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
                    className="object-fit h-full w-full"
                  />
                ) : (
                  <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center text-xs font-semibold">
                    {user?.initials}
                  </div>
                )}
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent className="z-50 w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="object-fit h-full w-full"
                    />
                  ) : (
                    <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center text-xs font-semibold">
                      {user?.initials}
                    </div>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.displayName}</p>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full touch-manipulation justify-start"
                  asChild
                >
                  <Link
                    href="/profile"
                    prefetch
                    className="flex w-full items-center"
                    style={{ pointerEvents: "auto" }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
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
  );
}

export function MobileNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Find matching header component based on current pathname
  const getHeaderComponent = () => {
    for (const entry of headerMap) {
      if (entry.pattern.test(pathname)) {
        return entry.component;
      }
    }
    return DefaultHeader;
  };

  const HeaderComponent = getHeaderComponent();

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
              prefetch
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
        <HeaderComponent user={user} handleLogout={handleLogout} />
      </header>

      {/* Spacer for fixed headers */}
      <div className="h-14 lg:hidden" />
      <div className="h-16 lg:hidden" />
    </>
  );
}

export default MobileNavigation;
