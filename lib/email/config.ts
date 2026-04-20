import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EXPO_PUBLIC_EMAIL_USER,
    pass: process.env.EXPO_PUBLIC_EMAIL_PASS, // App Password từ Google
  },
});

export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};
