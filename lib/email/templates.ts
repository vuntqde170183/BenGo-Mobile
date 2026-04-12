export interface RideConfirmationData {
  rideId: string;
  userEmail: string;
  userName: string;
  driverName: string;
  originAddress: string;
  destinationAddress: string;
  ridePrice: string;
  rideDate: string;
}

export const getVerificationEmailText = (name: string, otp: string): string => {
  return `
    XÁC THỰC TÀI KHOẢN BENGO
    Xin chào ${name},
    Cảm ơn bạn đã đăng ký BenGo. Vui lòng sử dụng mã OTP dưới đây để hoàn tất:
    Mã xác thực: ${otp}
    Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này.
  `.trim();
};

export const getVerificationEmailHTML = (name: string, otp: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; text-align: center; color: #4a5568; }
        .otp-box { background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; display: inline-block; }
        .otp-code { font-size: 36px; font-weight: 800; color: #065f46; letter-spacing: 8px; }
        .footer { background-color: #f8fafc; padding: 25px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">🔐 Xác thực tài khoản</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px; margin-bottom: 10px;">Xin chào <strong>${name}</strong>,</p>
          <p>Mã xác nhận (OTP) của bạn là:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p style="font-size: 14px; margin-top: 20px;">Mã này có hiệu lực trong vòng <strong>10 phút</strong>.<br>Vui lòng không chia sẻ mã này với bất kỳ ai để bảo mật tài khoản.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BenGo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};

export const getRideConfirmationText = (data: RideConfirmationData): string => {
  return `
    ĐẶT XE THÀNH CÔNG - CHUYẾN #${data.rideId}
    Xin chào ${data.userName},
    Hành trình của bạn đã được xác nhận.
    
    Chi tiết:
    - Từ: ${data.originAddress}
    - Đến: ${data.destinationAddress}
    - Tài xế: ${data.driverName}
    - Giá cước: ${data.ridePrice}
    - Ngày: ${data.rideDate}
    
    Chúc bạn có một hành trình an toàn!
  `.trim();
};

export const getRideConfirmationHTML = (data: RideConfirmationData): string => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, system-ui, sans-serif; background-color: #f3f4f6; padding: 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .header { background: #0284c7; padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .label { color: #64748b; font-size: 14px; }
        .value { font-weight: 600; text-align: right; }
        .price { font-size: 24px; font-weight: 800; color: #0284c7; text-align: center; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 25px; text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="font-size: 24px;">🚕 Đặt xe thành công!</h1>
          <p style="margin-top: 10px; opacity: 0.9;">Chuyến đi của bạn đã được xác nhận</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${data.userName}</strong>,</p>
          <p style="margin-top: 5px;">BenGo đã nhận được yêu cầu của bạn. Tài xế của bạn đang chuẩn bị đón bạn.</p>
          
          <div class="card">
            <div class="row">
              <span class="label">Mã chuyến đi</span>
              <span class="value">#${data.rideId}</span>
            </div>
            <div class="row">
              <span class="label">Điểm đón</span>
              <span class="value">${data.originAddress}</span>
            </div>
            <div class="row">
              <span class="label">Điểm đến</span>
              <span class="value">${data.destinationAddress}</span>
            </div>
            <div class="row">
              <span class="label">Tài xế</span>
              <span class="value">${data.driverName}</span>
            </div>
            <div class="row" style="border:none">
              <span class="label">Thời gian</span>
              <span class="value">${data.rideDate}</span>
            </div>
          </div>
          
          <div class="price">
            <span style="font-size: 16px; font-weight: 400; color: #64748b;">Tổng cộng:</span><br>
            ${data.ridePrice}
          </div>
          
          <p style="text-align: center; font-style: italic; color: #64748b; font-size: 14px;">Vui lòng có mặt đúng giờ tại điểm đón. Cảm ơn bạn!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BenGo Inc. Hotline: 1900 1234</p>
          <p style="margin-top: 5px;">Email này được tự động gửi từ hệ thống.</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};
