export async function POST(
  request: Request,
  { id }: { id: string }
) {
  try {
    const body = await request.json();
    const { proofImage, notes, timestamp } = body;

    if (!proofImage) {
      return Response.json(
        { message: "Hình ảnh xác thực là bắt buộc" },
        { status: 400 }
      );
    }

    return Response.json({
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
    return Response.json(
      { message: "Lỗi máy chủ nội bộ", error: error.message },
      { status: 500 }
    );
  }
}
