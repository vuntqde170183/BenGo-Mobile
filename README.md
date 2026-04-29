# BenGo - Ứng dụng đặt xe thông minh

BenGo là một ứng dụng di động hiện đại được xây dựng trên nền tảng React Native và Expo, cung cấp giải pháp đặt xe, giao hàng và các dịch vụ vận chuyển thông minh. Với giao diện người dùng tinh tế, tích hợp bản đồ và hệ thống AI hỗ trợ, BenGo mang lại trải nghiệm mượt mà và an toàn cho người dùng.

## 🚀 Công nghệ sử dụng

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS cho React Native)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) & [React Query](https://tanstack.com/query/latest)
- **Maps:** [React Native Maps](https://github.com/react-native-maps/react-native-maps) & [Google Places Autocomplete](https://github.com/FaridSafi/react-native-google-places-autocomplete)
- **Payment:** [Stripe](https://stripe.com/) & [VNPay](https://vnpay.vn/)
- **AI Integration:** OpenAI API
- **Internationalization:** i18next
- **Package Manager:** [pnpm](https://pnpm.io/)

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các công cụ sau:

- [Node.js](https://nodejs.org/) (Phiên bản LTS)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- [Expo Go](https://expo.dev/expo-go) trên điện thoại (để test thực tế) hoặc Android Studio / Xcode (để chạy giả lập)

## 🛠️ Hướng dẫn cài đặt

### 1. Clone repository
```bash
git clone https://github.com/vuntqde170183/BenGo-Mobile.git
cd BenGo-Native
```

### 2. Cài đặt các dependencies
Sử dụng `npm` để cài đặt các thư viện cần thiết:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc và cấu hình các biến sau (tham khảo file `.env` hiện có):
```env
EXPO_PUBLIC_SERVER_URL=https://bengo-backend.onrender.com/api/v1
EXPO_PUBLIC_GOOGLE_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
EXPO_PUBLIC_OPENAI_API_KEY=YOUR_OPENAI_API_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_KEY
# Và các cấu hình khác...
```

### 4. Chạy ứng dụng

Khởi động server Expo:
```bash
npx expo start
```

Sau khi chạy lệnh trên, bạn có thể:
- Quét mã QR bằng ứng dụng **Expo Go** (Android) hoặc **Camera** (iOS).
- Nhấn `a` để chạy trên trình giả lập Android.
- Nhấn `i` để chạy trên trình giả lập iOS.
- Nhấn `w` để chạy phiên bản web.

## 📂 Cấu trúc thư mục

- `/app`: Chứa các route và màn hình chính của ứng dụng (Expo Router).
- `/components`: Các thành phần giao diện dùng chung (UI/UX).
- `/api`: Cấu hình gọi API và các services.
- `/store`: Quản lý trạng thái ứng dụng (Zustand).
- `/hooks`: Các custom hooks.
- `/constants`: Các biến hằng số, màu sắc, cấu hình giao diện.
- `/assets`: Chứa hình ảnh, icons và fonts.
- `/context`: Các React Context providers.

## ✨ Tính năng chính

- [x] Đăng nhập/Đăng ký với xác thực bảo mật.
- [x] Đặt xe trực tuyến với tính toán khoảng cách và giá tiền thực tế.
- [x] Tích hợp bản đồ Google Maps thời gian thực.
- [x] Thanh toán đa dạng: Tiền mặt, Stripe, VNPay.
- [x] Chat hỗ trợ tích hợp AI.
- [x] Quản lý lịch sử chuyến đi và thông tin cá nhân.
- [x] Hỗ trợ đa ngôn ngữ.

---
© 2024 BenGo Team. All rights reserved.
