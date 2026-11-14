export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  loggedIn: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
