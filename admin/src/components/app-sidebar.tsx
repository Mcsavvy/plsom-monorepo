import { ChevronUp, Settings, User2, LogOut, AlertCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useGetIdentity, useLogout, useMenu } from '@refinedev/core';
import { Link, useLocation } from 'react-router';
import { SidebarErrorBoundary } from './ErrorBoundary';
import { Button } from './ui/button';
import { RefreshCcw } from 'lucide-react';
import React from 'react';
import { UserIdentity } from '@/types/user';

export function AppSidebar() {
  const { data: user } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const location = useLocation();

  const getRoleIndicatorColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-500';
      case 'lecturer':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isActiveRoute = (route: string) => {
    return (
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
  };

  return (
    <SidebarErrorBoundary>
      <Sidebar variant='inset' className='border-r-0 bg-background'>
        <SidebarHeader className='p-4'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size='lg' asChild>
                <Link to='/' className='flex items-center gap-3'>
                  <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm border'>
                    <img
                      src='/logo.png'
                      alt='PLSOM Logo'
                      className='size-6 object-contain'
                      onError={e => {
                        // Fallback to text if logo fails to load
                        e.currentTarget.style.display = 'none';
                        (
                          e.currentTarget.nextElementSibling as HTMLElement
                        ).style.display = 'flex';
                      }}
                    />
                    <div
                      className='size-6 items-center justify-center text-xs font-bold text-primary hidden'
                      style={{ display: 'none' }}
                    >
                      P
                    </div>
                  </div>
                  <div className='grid flex-1 text-left leading-tight'>
                    <span className='truncate font-semibold text-sm'>
                      PLSOM
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      Admin Portal
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className='px-3'>
          <SidebarGroup>
            <SidebarGroupLabel className='px-0 text-xs font-normal text-muted-foreground mb-2'>
              Applications
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className='space-y-2'>
                {menuItems.length === 0 ? (
                  // Loading skeleton
                  (<div className='space-y-0'>
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className='h-8 bg-muted rounded-md animate-pulse'
                      />
                    ))}
                  </div>)
                ) : menuItems.length > 0 ? (
                  menuItems.filter(item => item.name != "attendance").map(item => {
                    const isActive =
                      selectedKey === item.key ||
                      isActiveRoute(item.route || '');

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          asChild
                          className={`h-8 px-2 hover:bg-accent rounded-md transition-colors ${isActive ? 'bg-accent font-medium' : ''}`}
                        >
                          <Link
                            to={item.route || '#'}
                            className='flex items-center gap-3'
                          >
                            {item.icon ? (
                              React.isValidElement(item.icon) ? (
                                React.cloneElement(
                                  item.icon as React.ReactElement,
                                  { className: 'size-4' }
                                )
                              ) : (
                                <span className='size-4 flex items-center justify-center'>
                                  {typeof item.icon === 'function'
                                    ? React.createElement(item.icon, {
                                        className: 'size-4',
                                      })
                                    : item.icon}
                                </span>
                              )
                            ) : (
                              <div className='size-4 rounded bg-muted flex items-center justify-center'>
                                <span className='text-xs'>•</span>
                              </div>
                            )}
                            <span className='text-sm'>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  // Empty state
                  (<div className='text-center py-8'>
                    <AlertCircle className='h-6 w-6 mx-auto text-muted-foreground mb-2' />
                    <p className='text-sm text-muted-foreground mb-2'>
                      No menu items available
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCcw className='h-4 w-4 mr-2' />
                      Reload
                    </Button>
                  </div>)
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className='p-3'>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size='lg'
                    className='h-auto p-2 hover:bg-accent rounded-lg transition-colors data-[state=open]:bg-accent'
                  >
                    <div className='relative'>
                      <Avatar className='size-8 rounded-lg'>
                        <AvatarImage
                          src={user?.avatar}
                          alt={user?.name || 'User'}
                          className='object-cover'
                        />
                        <AvatarFallback className='rounded-lg bg-foreground text-white font-semibold text-xs'>
                          {user?.initials ? user.initials : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {user?.role && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-1 border-white shadow-sm ${getRoleIndicatorColor(user.role)}`}
                        />
                      )}
                    </div>
                    <div className='grid flex-1 text-left leading-tight'>
                      <span className='truncate font-medium text-sm'>
                        {user?.name || 'Loading...'}
                      </span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {user?.email || ''}
                      </span>
                    </div>
                    <ChevronUp className='ml-auto size-4 text-muted-foreground' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-56 rounded-lg'
                  side='top'
                  align='end'
                  sideOffset={4}
                >
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='flex items-center gap-2 px-2 py-1.5 text-left'>
                      <div className='relative'>
                        <Avatar className='size-8 rounded-lg'>
                          <AvatarImage
                            src={user?.avatar}
                            alt={user?.name || 'User'}
                            className='object-cover'
                          />
                          <AvatarFallback className='rounded-lg bg-primary text-white font-semibold text-xs'>
                            {user?.initials ? user.initials : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {user?.role && (
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-1 border-white shadow-sm ${getRoleIndicatorColor(user.role)}`}
                          />
                        )}
                      </div>
                      <div className='grid flex-1 text-left leading-tight'>
                        <span className='truncate font-medium text-sm'>
                          {user?.name || 'Loading...'}
                        </span>
                        <span className='truncate text-xs text-muted-foreground'>
                          {user?.email || ''}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className='text-sm'>
                      <Link to='/profile'>
                        <User2 className='mr-2 h-4 w-4' />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='text-sm'>
                      <Link to='/profile'>
                        <Settings className='mr-2 h-4 w-4' />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className='text-sm text-red-600 focus:text-red-600'
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarErrorBoundary>
  );
}
