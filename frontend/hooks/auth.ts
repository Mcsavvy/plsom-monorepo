import { AxiosInstance } from "axios";
import {
  AuthUser,
  authUserSchema,
  LoginCredentials,
  LoginResponse,
  loginResponseSchema,
  RefreshTokenResponse,
  refreshTokenResponseSchema,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  User,
} from "@/types/auth";
import { useSession } from "./session";
import { useCallback, useMemo } from "react";
import { createAxiosInstance } from "./axios";

async function _login(
  client: AxiosInstance,
  data: LoginCredentials
): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>("/auth/login/", data);
  if (response.status === 200) {
    const loginResponse = loginResponseSchema.parse(response.data);
    return loginResponse;
  }
  throw new Error("Failed to login");
}

async function _refreshToken(
  client: AxiosInstance,
  access: string,
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const response = await client.post<RefreshTokenResponse>(
    "/auth/refresh/",
    { refresh: refreshToken },
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    }
  );
  if (response.status === 200) {
    const refreshTokenResponse = refreshTokenResponseSchema.parse(
      response.data
    );
    return refreshTokenResponse;
  }
  throw new Error("Failed to refresh token");
}

async function _logout(
  client: AxiosInstance,
  token: string,
  refreshToken: string
): Promise<void> {
  await client.post(
    "/auth/logout/",
    {
      refresh: refreshToken,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

async function _getCurrentUser(
  client: AxiosInstance,
  token: string
): Promise<AuthUser> {
  const response = await client.get<AuthUser>("/users/me/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    const user = authUserSchema.parse(response.data);
    return user;
  }
  throw new Error("Failed to get current user");
}

async function _resetPassword(
  client: AxiosInstance,
  data: ChangePasswordRequest
): Promise<void> {
  const response = await client.post("/auth/reset-password/", data);
  if (response.status !== 200) {
    throw new Error("Failed to reset password");
  }
}



function _transformUser(user: AuthUser): User {
  const displayName = (
    user.title
      ? `${user.title} ${user.first_name} ${user.last_name}`
      : `${user.first_name} ${user.last_name}`
  ).trim();
  const initials = user.first_name.charAt(0) + user.last_name.charAt(0);
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    title: user.title ?? undefined,
    whatsappNumber: user.whatsapp_number ?? undefined,
    profilePicture: user.profile_picture
      ? user.profile_picture.replace("b2l/", "b2/")
      : undefined,
    isActive: user.is_active,
    initials: initials,
    displayName: displayName,
  };
}

export function useAuth() {
  const { session, setSession, clearSession } = useSession();
  const client = useMemo(() => {
    const axiosInstance = createAxiosInstance({});
    return axiosInstance;
  }, []);
  const user = useMemo(() => {
    if (!session) return null;
    return _transformUser(session.user);
  }, [session]);

  const login = useCallback(
    async (data: LoginCredentials) => {
      const tokenResponse = await _login(client, data);
      if (tokenResponse.role != "student") {
        throw Error("Only students can use this application");
      }
      const userResponse = await _getCurrentUser(client, tokenResponse.access);
      const sessionData = {
        tokens: tokenResponse,
        user: userResponse,
      };
      setSession(sessionData);
    },
    [client, setSession, session]
  );

  const refreshLogin = useCallback(async () => {
    if (!session) throw "No session is active";
    const tokenResponse = await _refreshToken(
      client,
      session.tokens.access,
      session.tokens.refresh
    );
    setSession({ ...session, tokens: tokenResponse });
  }, [client, setSession, session]);

  const logout = useCallback(async () => {
    if (!session) throw "No session is active";
    try {
      await _logout(client, session.tokens.access, session.tokens.refresh);
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      clearSession();
    }
  }, [client, clearSession, session]);

  const isAuthenticated = useMemo(() => {
    return session !== null;
  }, [session]);

  const refreshCurrentUser = useCallback(async () => {
    if (!session) throw "No session is active";
    const userResponse = await _getCurrentUser(client, session.tokens.access);
    setSession({ ...session, user: userResponse });
  }, [client, setSession, session]);

  const requestPasswordReset = useCallback(
    async (data: ForgotPasswordRequest) => {
      const response = await client.post("/auth/forgot-password/", data);
      if (response.status !== 200) {
        throw new Error("Failed to request password reset");
      }
    },
    [client]
  );

  const resetPassword = useCallback(
    async (data: ChangePasswordRequest) => {
      await _resetPassword(client, data);
    },
    [client]
  );



  return {
    login,
    refreshLogin,
    logout,
    isAuthenticated,
    refreshCurrentUser,
    requestPasswordReset,
    resetPassword,
    user,
  };
}
