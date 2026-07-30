import { apiFetch } from "./api-client";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// DEMO STUB — see backend UsersController for the full explanation.
// This call stands in for reading the logged-in user from a JWT/session.
// In a real app this would be derived from an auth token, not fetched.
// ---------------------------------------------------------------------------
export const usersService = {
  getMe: () => apiFetch<CurrentUser>("/users/me"),
};
