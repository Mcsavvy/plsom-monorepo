import { Refine, Authenticated } from '@refinedev/core';

import routerBindings from '@refinedev/react-router';
import { BrowserRouter, Route, Routes as ReactRoutes, Outlet, Navigate, useRoutes } from 'react-router';
import './App.css';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { notificationProvider } from './providers/notificationProvider';
import { Login } from './pages/login';
import { ForgotPassword } from './pages/forgotPassword';
import { ResetPassword } from './pages/resetPassword';
import { Profile } from './pages/profile';
import { Dashboard } from './pages/dashboard';
import { SidebarLayout } from './components/sidebar-layout';
import {
  InvitationsList,
  InvitationsCreate,
  InvitationsEdit,
  InvitationsShow,
} from './pages/invitations';
import {
  CohortsList,
  CohortsCreate,
  CohortsEdit,
  CohortsShow,
} from './pages/cohorts';
import { StudentsList, StudentsShow, StudentsEdit } from './pages/students';
import { StaffList, StaffShow, StaffEdit } from './pages/staff';
import { EnrollmentsList, EnrollmentsShow } from './pages/enrollments';
import {
  CoursesList,
  CoursesShow,
  CoursesCreate,
  CoursesEdit,
} from './pages/courses';
import {
  ClassesList,
  ClassesShow,
  ClassesCreate,
  ClassesEdit,
} from './pages/classes';
import { TestsList, TestsShow, TestsCreate, TestsEdit } from './pages/tests';
import {
  SubmissionsList,
  SubmissionShow,
  SubmissionGrade,
} from './pages/submissions';
import { Onboard } from './pages/onboard';
import PageNotFound from './pages/404';
import { AuditLogsList, AuditLogsShow } from './pages/audit-logs';
import { Toaster } from './components/ui/toaster';
import { API_URL, RESOURCES } from './constants';
import { auditLogProvider } from './providers/auditLogProvider';
import { ErrorBoundary, withErrorBoundary } from './components/ErrorBoundary';
import { Suspense } from 'react';
import { FullPageLoader, InlineLoader } from './components/LoadingSpinner';
import { DocumentTitleHandler } from './components/DocumentTitleHandler';
import { ClassAttendance } from './pages/classes/attendance';
import { withSentryReactRouterV7Routing } from '@sentry/react';

// Authenticated layout wrapper with error boundary
const AuthenticatedLayout = () => (
  <Authenticated
    key='authenticated-inner'
    fallback={<Navigate to='/login' replace />}
    loading={<FullPageLoader />}
  >
    <SidebarLayout>
      <Suspense fallback={<InlineLoader text='Loading page...' />}>
        <Outlet />
      </Suspense>
    </SidebarLayout>
  </Authenticated>
);

// Unauthenticated layout wrapper
const UnauthenticatedLayout = () => (
  <Authenticated
    key='authenticated-outer'
    fallback={<Outlet />}
    loading={<FullPageLoader />}
  >
    <Navigate to='/' replace />
  </Authenticated>
);

const Routes = withSentryReactRouterV7Routing(ReactRoutes);

// Enhanced Dashboard with error boundary
const EnhancedDashboard = withErrorBoundary(Dashboard);
const EnhancedCohortsList = withErrorBoundary(CohortsList);
const EnhancedCohortsCreate = withErrorBoundary(CohortsCreate);
const EnhancedCohortsShow = withErrorBoundary(CohortsShow);
const EnhancedCohortsEdit = withErrorBoundary(CohortsEdit);
const EnhancedStudentsList = withErrorBoundary(StudentsList);
const EnhancedStudentsShow = withErrorBoundary(StudentsShow);
const EnhancedStudentsEdit = withErrorBoundary(StudentsEdit);
const EnhancedStaffList = withErrorBoundary(StaffList);
const EnhancedStaffShow = withErrorBoundary(StaffShow);
const EnhancedStaffEdit = withErrorBoundary(StaffEdit);
const EnhancedEnrollmentsList = withErrorBoundary(EnrollmentsList);
const EnhancedEnrollmentsShow = withErrorBoundary(EnrollmentsShow);
const EnhancedInvitationsList = withErrorBoundary(InvitationsList);
const EnhancedInvitationsCreate = withErrorBoundary(InvitationsCreate);
const EnhancedInvitationsShow = withErrorBoundary(InvitationsShow);
const EnhancedInvitationsEdit = withErrorBoundary(InvitationsEdit);
const EnhancedAuditLogsList = withErrorBoundary(AuditLogsList);
const EnhancedAuditLogsShow = withErrorBoundary(AuditLogsShow);
const EnhancedCoursesList = withErrorBoundary(CoursesList);
const EnhancedCoursesShow = withErrorBoundary(CoursesShow);
const EnhancedCoursesCreate = withErrorBoundary(CoursesCreate);
const EnhancedCoursesEdit = withErrorBoundary(CoursesEdit);
const EnhancedClassesList = withErrorBoundary(ClassesList);
const EnhancedClassesShow = withErrorBoundary(ClassesShow);
const EnhancedClassesCreate = withErrorBoundary(ClassesCreate);
const EnhancedClassesEdit = withErrorBoundary(ClassesEdit);
const EnhancedClassAttendance = withErrorBoundary(ClassAttendance);
const EnhancedTestsList = withErrorBoundary(TestsList);
const EnhancedTestsShow = withErrorBoundary(TestsShow);
const EnhancedTestsCreate = withErrorBoundary(TestsCreate);
const EnhancedTestsEdit = withErrorBoundary(TestsEdit);
const EnhancedSubmissionsList = withErrorBoundary(SubmissionsList);
const EnhancedSubmissionsShow = withErrorBoundary(SubmissionShow);
const EnhancedSubmissionGrade = withErrorBoundary(SubmissionGrade);
const EnhancedLogin = withErrorBoundary(Login);
const EnhancedForgotPassword = withErrorBoundary(ForgotPassword);
const EnhancedResetPassword = withErrorBoundary(ResetPassword);
const EnhancedProfile = withErrorBoundary(Profile);

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <BrowserRouter>
        <ErrorBoundary
          fallback={
            <div className='min-h-screen flex items-center justify-center p-4'>
              <div className='text-center'>
                <h1 className='text-2xl font-bold mb-2'>Configuration Error</h1>
                <p className='text-muted-foreground'>
                  There was an error initializing the application. Please
                  contact support.
                </p>
              </div>
            </div>
          }
        >
          <Refine
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerBindings}
            authProvider={authProvider}
            notificationProvider={notificationProvider}
            auditLogProvider={auditLogProvider}
            resources={RESOURCES}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              useNewQueryKeys: true,
              projectId: 'kGMTVU-QpOWh6-o4w4v9',
              liveMode: 'auto',
              redirect: {
                afterCreate: 'show',
                afterClone: 'list',
                afterEdit: 'list',
              },
            }}
          >
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                <Route element={<AuthenticatedLayout />}>
                  <Route index element={<EnhancedDashboard />} />
                  <Route path='profile' element={<EnhancedProfile />} />
                  <Route path='cohorts' element={<EnhancedCohortsList />} />
                  <Route
                    path='cohorts/create'
                    element={<EnhancedCohortsCreate />}
                  />
                  <Route path='cohorts/:id' element={<EnhancedCohortsShow />} />
                  <Route
                    path='cohorts/:id/edit'
                    element={<EnhancedCohortsEdit />}
                  />
                  <Route path='students' element={<EnhancedStudentsList />} />
                  <Route
                    path='students/:id'
                    element={<EnhancedStudentsShow />}
                  />
                  <Route
                    path='students/:id/edit'
                    element={<EnhancedStudentsEdit />}
                  />
                  <Route path='staff' element={<EnhancedStaffList />} />
                  <Route path='staff/:id' element={<EnhancedStaffShow />} />
                  <Route
                    path='staff/:id/edit'
                    element={<EnhancedStaffEdit />}
                  />
                  <Route
                    path='enrollments'
                    element={<EnhancedEnrollmentsList />}
                  />
                  <Route
                    path='enrollments/:id'
                    element={<EnhancedEnrollmentsShow />}
                  />
                  <Route path='courses' element={<EnhancedCoursesList />} />
                  <Route
                    path='courses/create'
                    element={<EnhancedCoursesCreate />}
                  />
                  <Route
                    path='courses/:id/edit'
                    element={<EnhancedCoursesEdit />}
                  />
                  <Route path='courses/:id' element={<EnhancedCoursesShow />} />
                  <Route path='classes' element={<EnhancedClassesList />} />
                  <Route
                    path='classes/create'
                    element={<EnhancedClassesCreate />}
                  />
                  <Route
                    path='classes/:id/edit'
                    element={<EnhancedClassesEdit />}
                  />
                  <Route path='classes/:id' element={<EnhancedClassesShow />} />
                  <Route path='classes/:id/attendance' element={<EnhancedClassAttendance />} />
                  <Route path='tests' element={<EnhancedTestsList />} />
                  <Route
                    path='tests/create'
                    element={<EnhancedTestsCreate />}
                  />
                  <Route
                    path='tests/:id/edit'
                    element={<EnhancedTestsEdit />}
                  />
                  <Route path='tests/:id' element={<EnhancedTestsShow />} />
                  <Route
                    path='submissions'
                    element={<EnhancedSubmissionsList />}
                  />
                  <Route
                    path='submissions/:id'
                    element={<EnhancedSubmissionsShow />}
                  />
                  <Route
                    path='submissions/:id/grade'
                    element={<EnhancedSubmissionGrade />}
                  />
                  <Route
                    path='invitations'
                    element={<EnhancedInvitationsList />}
                  />
                  <Route
                    path='invitations/create'
                    element={<EnhancedInvitationsCreate />}
                  />
                  <Route
                    path='invitations/:id'
                    element={<EnhancedInvitationsShow />}
                  />
                  <Route
                    path='invitations/:id/edit'
                    element={<EnhancedInvitationsEdit />}
                  />
                  <Route
                    path='audit-logs'
                    element={<EnhancedAuditLogsList />}
                  />
                  <Route
                    path='audit-logs/:id'
                    element={<EnhancedAuditLogsShow />}
                  />
                </Route>

                <Route element={<UnauthenticatedLayout />}>
                  <Route path='/login' element={<EnhancedLogin />} />
                  <Route
                    path='/forgot-password'
                    element={<EnhancedForgotPassword />}
                  />
                  <Route
                    path='/reset-password'
                    element={<EnhancedResetPassword />}
                  />
                  <Route path='/onboard/:token' element={<Onboard />} />
                </Route>

                {/* Catch-all route for 404s */}
                <Route path='*' element={<PageNotFound />} />
              </Routes>
            </Suspense>

            <DocumentTitleHandler />
          </Refine>
        </ErrorBoundary>

        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
