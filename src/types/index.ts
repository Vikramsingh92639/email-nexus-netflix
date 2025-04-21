
export interface User {
  id: string;
  accessToken: string;
  isBlocked: boolean;
}

export interface Admin {
  username: string;
  password: string;
}

export interface GoogleAuthConfig {
  id: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
  authUri: string;
  tokenUri: string;
  authProviderCertUrl: string;
  isActive: boolean;
  access_token?: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isHidden: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  admin: Admin | null;
  login: (accessToken: string, isAdmin: boolean) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface DataContextType {
  accessTokens: User[];
  googleConfigs: GoogleAuthConfig[];
  emails: Email[];
  fetchEmails: (emailId: string) => Promise<Email[]>;
  addAccessToken: (token: string) => void;
  deleteAccessToken: (id: string) => void;
  blockAccessToken: (id: string, blocked: boolean) => void;
  addGoogleConfig: (config: Omit<GoogleAuthConfig, "id" | "isActive">) => void;
  updateGoogleConfig: (id: string, config: Partial<GoogleAuthConfig>) => void;
  deleteGoogleConfig: (id: string) => void;
  toggleEmailVisibility: (id: string) => void;
  updateAdminCredentials: (username: string, password: string) => void;
}
