export interface OTPData {
  code: string;
  expiresAt: Date;
}

export const generateOTP = (expiryMinutes: number = 10): OTPData => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return { code, expiresAt };
};

export const sendOTP = async (target: string, code: string): Promise<boolean> => {
  // In a real application, you would connect to Twilio (SMS) or Nodemailer (Email)
  // For local testing & development, we print to terminal console
  console.log(`\n======================================================`);
  console.log(`[PujaMart OTP Service] Send OTP to: ${target}`);
  console.log(`OTP Code: ${code}`);
  console.log(`Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  // We can simulate an async delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
};
