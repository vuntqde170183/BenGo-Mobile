import { useAuth } from "@/context/AuthContext";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Animated } from "react-native";
import { useTranslation } from "react-i18next";

import CustomButton from "@/components/Common/CustomButton";
import CashPaymentModal from "@/components/Payment/CashPaymentModal";
import PaymentMethodSelection from "@/components/Payment/PaymentMethodSelection";
import QRPaymentModal from "@/components/Payment/QRPaymentModal";
import SuccessModal from "@/components/Payment/SuccessModal";
import { fetchAPI } from "@/lib/fetch";
import { PaymentProps } from "@/types/type";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
  originAddress,
  destinationAddress,
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
}: PaymentProps) => {
  const { t } = useTranslation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const userId = user?.id;

  const [success, setSuccess] = useState<boolean>(false);
  const [currentPaymentIntent, setCurrentPaymentIntent] = useState<any>(null);
  const [currentCustomer, setCurrentCustomer] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [cashStep, setCashStep] = useState<number>(1);
  const [qrStep, setQrStep] = useState<number>(1);
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>(amount);
  const [changeAmount, setChangeAmount] = useState<string>("0");
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);
  const qrScanAnim = new Animated.Value(0);
  const handlePaymentMethodSelect = useCallback((methodId: string) => {
    setSelectedPaymentMethod(methodId);
  }, []);

  useEffect(() => {
    if (showCashModal || showQRModal || success) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [showCashModal, showQRModal, success]);

  useEffect(() => {
    if (qrCodeVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(qrScanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(qrScanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [qrCodeVisible]);

  const openPaymentSheet = async () => {
    if (isProcessing) {
      return;
    }

    if (selectedPaymentMethod === "cash") {
      setShowCashModal(true);
      setCashStep(1);
      setPaymentAmount(amount);
      setChangeAmount("0");
      return;
    }

    if (selectedPaymentMethod === "qr") {
      setShowQRModal(true);
      setQrStep(1);
      setQrCodeVisible(false);
      return;
    }

    setIsProcessing(true);
    try {
      const initSuccess = await initializePaymentSheet();
      if (!initSuccess) {
        setIsProcessing(false);
        return;
      }

      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code === "Canceled") {
          setIsProcessing(false);
          return;
        }
        setIsProcessing(false);
      } else {
        await handlePostPaymentActions();
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handlePostPaymentActions = async () => {
    try {
      const bookingData = {
        origin_address: originAddress,
        destination_address: destinationAddress,
        origin_latitude: originLatitude,
        origin_longitude: originLongitude,
        destination_latitude: destinationLatitude,
        destination_longitude: destinationLongitude,
        ride_time: Math.round(rideTime), // Convert to integer
        fare_price: amount,
        driver_id: driverId,
        user_id: userId,
        payment_intent_id: currentPaymentIntent?.id || "cash_payment",
        user_name: user?.name || fullName || "User",
        user_email: user?.email || email || "user@example.com",
      };

      const response = await fetchAPI("/(api)/ride/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setSuccess(true);
    }
  };

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      if (!amount || amount === "0" || parseFloat(amount) <= 0) {
        throw new Error(t("payment.amountRequired"));
      }

      if (!email && !user?.email) {
        throw new Error(t("payment.emailRequired"));
      }

      const requestBody = {
        name: user?.name || fullName || (email || "").split("@")[0],
        email: user?.email || email,
        amount: amount,
      };

      const response = await fetchAPI("/(api)/(stripe)/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const { paymentIntent, customer, ephemeralKey } = response;

      if (!paymentIntent?.client_secret) {
        throw new Error(t("payment.cannotCreatePaymentIntent"));
      }

      if (!customer) {
        throw new Error(t("payment.cannotCreateCustomer"));
      }

      if (!ephemeralKey?.secret) {
        throw new Error(t("payment.cannotCreateEphemeralKey"));
      }

      const { error } = await initPaymentSheet({
        merchantDisplayName: "BenGo Clone",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey.secret,
        paymentIntentClientSecret: paymentIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        returnURL: "BenGo://book-ride",
      });

      if (error) {
        throw new Error(`${t("payment.paymentSetupFailed")}: ${error.message}`);
      }

      setCurrentPaymentIntent(paymentIntent);
      setCurrentCustomer(customer);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCashPayment = async () => {
    if (cashStep === 1) {
      setCashStep(2);
    } else if (cashStep === 2) {
      setCashStep(3);

      setTimeout(async () => {
        setShowCashModal(false);
        setSuccess(true);
        await handlePostPaymentActions();
      }, 2000);
    }
  };

  const handleQRPayment = async () => {
    if (qrStep === 1) {
      setQrStep(2);
      setQrCodeVisible(true);
    } else if (qrStep === 2) {
      setQrStep(3);

      setTimeout(async () => {
        setShowQRModal(false);
        setSuccess(true);
        await handlePostPaymentActions();
      }, 3000);
    }
  };

  const handleCashAmountChange = (value: string) => {
    setPaymentAmount(value);
    const change = parseFloat(value) - parseFloat(amount);
    setChangeAmount(change > 0 ? change.toFixed(0) : "0");
  };

  const handleGoHome = () => {
    setSuccess(false);
    router.push("/(root)/tabs/rides");
  };

  const handleBackToCashStep1 = () => {
    setCashStep(1);
  };

  const handleBackToQRStep1 = () => {
    setQrStep(1);
    setQrCodeVisible(false);
  };

  return (
    <>
      {/* Payment Method Selection */}
      <PaymentMethodSelection
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentMethodSelect={handlePaymentMethodSelect}
      />
      <CustomButton
        title={
          isProcessing
            ? t("payment.processing")
            : selectedPaymentMethod === "cash"
              ? t("payment.payCash")
              : selectedPaymentMethod === "qr"
                ? t("payment.payQR")
                : t("payment.confirmRide")
        }
        className="mb-10"
        onPress={openPaymentSheet}
        disabled={isProcessing}
      />
      {/* Cash Payment Modal */}
      <CashPaymentModal
        visible={showCashModal}
        onClose={() => setShowCashModal(false)}
        amount={amount}
        cashStep={cashStep}
        paymentAmount={paymentAmount}
        changeAmount={changeAmount}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
        qrScanAnim={qrScanAnim}
        onCashPayment={handleCashPayment}
        onCashAmountChange={handleCashAmountChange}
        onBackToStep1={handleBackToCashStep1}
      />

      {/* QR Payment Modal */}
      <QRPaymentModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        amount={amount}
        qrStep={qrStep}
        qrCodeVisible={qrCodeVisible}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
        qrScanAnim={qrScanAnim}
        onQRPayment={handleQRPayment}
        onBackToStep1={handleBackToQRStep1}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={success}
        onClose={() => setSuccess(false)}
        onGoHome={handleGoHome}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
      />
    </>
  );
};

export default Payment;
