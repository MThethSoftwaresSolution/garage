export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface VerifyActivationOtpRequest {
  email: string;
  otp: string;
}

export interface ResendActivationOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  isSuccess: boolean;
  message?: string;
  token?: string;

  id?: string;
  username?: string;
  isAdmin?: boolean;
  isActiveMember?: boolean;
  name?: string;
  surname?: string;
  phone?: string;
}
