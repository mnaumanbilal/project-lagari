import { apiFetch } from "./client";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function adminLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
