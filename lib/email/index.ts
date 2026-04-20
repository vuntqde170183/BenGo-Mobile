import { transporter } from './config';
import {
  getRideConfirmationHTML,
  getRideConfirmationText,
  RideConfirmationData,
  getVerificationEmailHTML,
  getVerificationEmailText
} from './templates';

export const sendRideConfirmationEmail = async (
  data: RideConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!process.env.EXPO_PUBLIC_EMAIL_USER || !process.env.EXPO_PUBLIC_EMAIL_PASS) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const info = await transporter.sendMail({
      from: `"BenGo" <${process.env.EXPO_PUBLIC_EMAIL_USER}>`,
      to: data.userEmail,
      subject: `✅ Xác nhận đặt xe thành công - Chuyến #${data.rideId}`,
      text: getRideConfirmationText(data),
      html: getRideConfirmationHTML(data),
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!process.env.EXPO_PUBLIC_EMAIL_USER || !process.env.EXPO_PUBLIC_EMAIL_PASS) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const info = await transporter.sendMail({
      from: `"BenGo" <${process.env.EXPO_PUBLIC_EMAIL_USER}>`,
      to: email,
      subject: `🔐 Mã xác thực (OTP) - BenGo App`,
      text: getVerificationEmailText(name, otp),
      html: getVerificationEmailHTML(name, otp),
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export { RideConfirmationData } from './templates';
