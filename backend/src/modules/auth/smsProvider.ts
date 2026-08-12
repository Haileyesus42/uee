import { env } from '../../env';

export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

// Logs the code instead of sending a real SMS — no gateway account needed for local dev.
// Swap SMS_PROVIDER to a real gateway (e.g. Africa's Talking) in production by adding
// an implementation here and selecting it below; nothing else in the auth module changes.
class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    console.log(`[SMS DEV] OTP for ${phone}: ${code}`);
  }
}

function createSmsProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case 'console':
      return new ConsoleSmsProvider();
    default:
      throw new Error(`Unknown SMS_PROVIDER: ${env.SMS_PROVIDER}`);
  }
}

export const smsProvider = createSmsProvider();
