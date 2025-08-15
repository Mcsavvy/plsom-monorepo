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
} from "@/types/auth";
import { useSession } from "./session";
import { useCallback, useMemo } from "react";
import { createAxiosInstance } from "./axios";

async function _login(
  client: AxiosInstance,
  data: LoginCredentials
): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>("/auth/login", data);
  if (response.status === 200) {
    const loginResponse = loginResponseSchema.parse(response.data);
    return loginResponse;
  }
  throw new Error("Failed to login");
}

async function _refreshToken(
  client: AxiosInstance,
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const response = await client.post<RefreshTokenResponse>(
    "/auth/refresh",
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
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
    "/auth/logout",
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
  const response = await client.get<AuthUser>("/users/me", {
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

export function useAuth() {
  const { session, setSession, clearSession } = useSession();
  const client = useMemo(() => {
    const axiosInstance = createAxiosInstance({});
    return axiosInstance;
  }, []);

  const login = useCallback(
    async (data: LoginCredentials) => {
      const tokenResponse = await _login(client, data);
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
    const tokenResponse = await _refreshToken(client, session.tokens.refresh);
    setSession({ ...session, tokens: tokenResponse });
  }, [client, setSession, session]);

  const logout = useCallback(async () => {
    if (!session) throw "No session is active";
    await _logout(client, session.tokens.access, session.tokens.refresh);
    clearSession();
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
  };
}
