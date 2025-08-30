import { ResourceProps } from '@refinedev/core';
import {
  GraduationCap,
  BookOpen,
  ListCheck,
  History,
  MailPlus,
  UserCheck,
  Layers,
  Presentation,
  FileText,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import React from 'react';
import {
  transformAuditLog,
  transformUser,
  transformStudent,
  transformStaff,
  transformEnrollment,
  transformCourse,
  transformClass,
  transformTestListItem,
  transformSubmissionListItem,
  transformSubmission,
} from '@/utils/dataTransformers';

export const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL is not set');
}
export const TOKEN_KEY = 'plsom-access-token';
export const REFRESH_TOKEN_KEY = 'plsom-refresh-token';

export const RESOURCES: ResourceProps[] = [
  {
    name: 'cohorts',
    list: '/cohorts',
    create: '/cohorts/create',
    edit: '/cohorts/:id/edit',
    show: '/cohorts/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(Layers),
    },
  },
  {
    name: 'invitations',
    list: '/invitations',
    create: '/invitations/create',
    edit: '/invitations/:id/edit',
    show: '/invitations/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(MailPlus),
    },
  },
  {
    name: 'enrollments',
    list: '/enrollments',
    show: '/enrollments/:id',
    meta: {
      canDelete: false,
      icon: React.createElement(ListCheck),
    },
  },
  {
    name: 'students',
    list: '/students',
    show: '/students/:id',
    edit: '/students/:id/edit',
    meta: {
      canDelete: true,
      icon: React.createElement(GraduationCap),
    },
  },
  {
    name: 'staff',
    list: '/staff',
    show: '/staff/:id',
    edit: '/staff/:id/edit',
    meta: {
      canDelete: false,
      icon: React.createElement(UserCheck),
    },
  },
  {
    name: 'courses',
    list: '/courses',
    create: '/courses/create',
    edit: '/courses/:id/edit',
    show: '/courses/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(BookOpen),
    },
  },
  {
    name: 'classes',
    list: '/classes',
    create: '/classes/create',
    edit: '/classes/:id/edit',
    show: '/classes/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(Presentation),
    },
  },
  {
    name: "attendance",
    list: "/classes/:id/attendance",
    meta: {
      icon: React.createElement(Users)
    }
  },
  {
    name: 'tests',
    list: '/tests',
    create: '/tests/create',
    edit: '/tests/:id/edit',
    show: '/tests/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(FileText),
    },
  },
  {
    name: 'submissions',
    list: '/submissions',
    show: '/submissions/:id',
    edit: '/submissions/:id/grade',
    meta: {
      canDelete: false,
      icon: React.createElement(ClipboardCheck),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    show: '/audit-logs/:id',
    meta: {
      canDelete: true,
      icon: React.createElement(History),
    },
  },
];

export const transformers: Record<string, (data: any) => any> = {
  'audit-logs': transformAuditLog,
  users: transformUser,
  students: transformStudent,
  staff: transformStaff,
  enrollments: transformEnrollment,
  courses: transformCourse,
  classes: transformClass,
  tests: transformTestListItem,
  submissions: transformSubmissionListItem,
  'submissions-show': transformSubmission,
};
