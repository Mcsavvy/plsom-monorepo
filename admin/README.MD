# PLSOM Admin Portal

Perfect Love School of Ministry (PLSOM) Administrator & Lecturer Portal built with Refine.

## Overview

This is the admin/lecturer portal for the PLSOM Learning Management System. It provides:

- **JWT-based Authentication** with role-based access control
- **Admin & Lecturer Access Only** - Students are redirected to the student portal
- **Secure API Integration** with automatic token refresh
- **Modern UI** built with Tailwind CSS and shadcn/ui components

## Features

- ✅ JWT Authentication with token refresh
- ✅ Role-based access control (Admin/Lecturer only)
- ✅ Secure API communication
- ✅ Modern responsive design
- ✅ Built with Refine framework

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd plsom-admin
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   VITE_API_URL=http://localhost:8000
   ```

   Replace with your actual API server URL.

4. **Run the development server**
   ```bash
   pnpm dev
   ```

## Authentication

The portal uses JWT-based authentication with the following endpoints:

- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `POST /api/auth/token/verify/` - Verify token
- `POST /api/auth/token/blacklist/` - Logout

### Access Control

- **Admin Role**: Full system access, can function as lecturer
- **Lecturer Role**: Course management, student tracking, assessments
- **Student Role**: Automatically redirected (not allowed in this portal)

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Framework**: Refine
- **Styling**: Tailwind CSS, shadcn/ui
- **Routing**: React Router
- **State Management**: Built-in Refine hooks
- **Authentication**: JWT with refresh tokens

## Available Scripts

### Running the development server.

```bash
    pnpm dev
```

### Building for production.

```bash
    pnpm build
```

### Running the production server.

```bash
    pnpm start
```

## Learn More

To learn more about **Refine**, please check out the [Documentation](https://refine.dev/docs)

- **REST Data Provider** [Docs](https://refine.dev/docs/core/providers/data-provider/#overview)
- **Tailwind CSS** [Docs](https://refine.dev/docs/guides-concepts/general-concepts/#headless-concept)
- **React Router** [Docs](https://refine.dev/docs/core/providers/router-provider/)
- **Custom Auth Provider** [Docs](https://refine.dev/docs/core/providers/auth-provider/)

## License

MIT
