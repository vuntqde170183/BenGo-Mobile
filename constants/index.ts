import arrowDown from "@/assets/icons/arrow-down.png";
import arrowUp from "@/assets/icons/arrow-up.png";
import backArrow from "@/assets/icons/back-arrow.png";
import chat from "@/assets/icons/chat.png";
import checkmark from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import dollar from "@/assets/icons/dollar.png";
import email from "@/assets/icons/email.png";
import eyecross from "@/assets/icons/eyecross.png";
import google from "@/assets/icons/google.png";
import home from "@/assets/icons/home.png";
import list from "@/assets/icons/list.png";
import lock from "@/assets/icons/lock.png";
import map from "@/assets/icons/map.png";
import marker from "@/assets/icons/marker.png";
import marker2 from "@/assets/icons/marker2.png";
import out from "@/assets/icons/out.png";
import person from "@/assets/icons/person.png";
import pin from "@/assets/icons/pin.png";
import point from "@/assets/icons/point.png";
import profile from "@/assets/icons/profile.png";
import search from "@/assets/icons/search.png";
import selectedMarker from "@/assets/icons/selected-marker.png";
import selectedMarker2 from "@/assets/icons/selected-marker2.png";
import star from "@/assets/icons/star.png";
import target from "@/assets/icons/target.png";
import to from "@/assets/icons/to.png";
import check from "@/assets/images/check.png";
import getStarted from "@/assets/images/get-started.png";
import message from "@/assets/images/message.png";
import noResult from "@/assets/images/no-result.png";
import onboarding1 from "@/assets/images/onboarding1.png";
import onboarding2 from "@/assets/images/onboarding2.png";
import onboarding3 from "@/assets/images/onboarding3.png";
import signUpCar from "@/assets/images/signup-car.png";

export const images = {
    onboarding1,
    onboarding2,
    onboarding3,
    getStarted,
    signUpCar,
    check,
    noResult,
    message,
};

export const icons = {
    arrowDown,
    arrowUp,
    backArrow,
    chat,
    checkmark,
    close,
    dollar,
    email,
    eyecross,
    google,
    home,
    list,
    lock,
    map,
    marker,
    marker2,
    out,
    person,
    pin,
    point,
    profile,
    search,
    selectedMarker,
    selectedMarker2,
    star,
    target,
    to,
};

export const onboarding = [
    {
        id: 1,
        title: "Chuyến hoàn hảo chỉ cách một chạm!",
        description:
            "Hành trình của bạn bắt đầu cùng chúng tôi. Tìm chuyến lý tưởng một cách dễ dàng.",
        image: images.onboarding1,
    },
    {
        id: 2,
        title: "Chiếc xe tốt nhất trong tầm tay bạn khi bạn cần",
        description:
            "Khám phá sự tiện lợi khi tìm chuyến hoàn hảo cùng chúng tôi.",
        image: images.onboarding2,
    },
    {
        id: 3,
        title: "Chuyến của bạn, theo cách của bạn. Đi thôi!",
        description:
            "Nhập điểm đến của bạn, ngồi thư giãn và để chúng tôi lo phần còn lại.",
        image: images.onboarding3,
    },
];


export const data = {
    onboarding,
};

export const basePrices = {
    BIKE: 15000,
    VAN: 50000,
    TRUCK: 80000,
};

export const perKmPrices = {
    BIKE: 5000,
    VAN: 12000,
    TRUCK: 18000,
};

export const vehicleTypes = {
    BIKE: {
        label: "Xe máy",
        icon: "bicycle-outline",
        color: "#10B981",
        description: "Dành cho các đơn hàng nhỏ, gọn, cần giao nhanh.",
    },
    VAN: {
        label: "Xe tải van",
        icon: "car-sport-outline",
        color: "#3B82F6",
        description: "Phù hợp cho hàng hóa vừa phải, đồ điện tử hoặc chuyển nhà nhỏ.",
    },
    TRUCK: {
        label: "Xe tải",
        icon: "bus-outline",
        color: "#EF4444",
        description: "Dành cho hàng hóa lớn, cồng kềnh, khối lượng nặng.",
    },
};