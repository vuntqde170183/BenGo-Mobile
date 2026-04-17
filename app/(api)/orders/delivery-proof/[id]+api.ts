import { ExpoRequest, ExpoResponse } from "expo-router";

export async function POST(
  request: ExpoRequest,
  { id }: { id: string }
) {
  try {
    const body = await request.json();
    const { proofImage, notes, timestamp } = body;

    if (!proofImage) {
      return ExpoResponse.json(
        { message: "Hình ảnh xác thực là bắt buộc" },
        { status: 400 }
      );
    }

    console.log(`[API MOCK] Nhận xác thực giao hàng cho đơn: ${id}`);
    console.log(`[API MOCK] Ảnh: ${proofImage}`);
    console.log(`[API MOCK] Ghi chú: ${notes}`);
    console.log(`[API MOCK] Thời gian: ${timestamp}`);

    // TRONG THỰC TẾ: Bạn sẽ lưu proofImage và notes vào Database
    // Ví dụ: update orders set status='DELIVERED', delivery_proof_url=..., delivery_notes=... where id=...

    return ExpoResponse.json({
      success: true,
      message: "Xác thực giao hàng thành công (Mock API)",
      data: {
        orderId: id,
        status: "DELIVERED",
        proofImage,
        notes,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Lỗi API Delivery Proof:", error);
    return ExpoResponse.json(
      { message: "Lỗi máy chủ nội bộ", error: error.message },
      { status: 500 }
    );
  }
}
