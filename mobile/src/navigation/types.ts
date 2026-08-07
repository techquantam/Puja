export type AuthStackParamList = {
  Welcome: undefined;
  Login: { contact?: string } | undefined;
  Signup: undefined;
  Otp: { contact: string; purpose: 'verify' | 'recovery' };
  ForgotPassword: undefined;
  ResetPassword: { contact: string; code: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
