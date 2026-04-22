export interface BookingAISuggestion {
  // Thông tin tham khảo (hiển thị để người dùng biết, KHÔNG auto-fill vào form)
  estimatedWeight: string;
  estimatedLength: string;
  productInfo: string;
  analysis?: {
    technical: string;
    experience: string;
    compliance: string;
  };
  // Gợi ý xe (áp dụng khi người dùng nhấn "Áp dụng")
  recommendedVehicle: 'BIKE' | 'VAN' | 'TRUCK';
  vehicleReason: string;
  // Ghi chú gợi ý (áp dụng khi người dùng nhấn "Áp dụng")
  suggestedNote: string;
  tips: string[];
  // Cảnh báo mâu thuẫn (chỉ hiển thị, không thay đổi dữ liệu)
  conflictWarning?: string;
}

export interface BookingAIRequest {
  goodsName: string;
  goodsWeight: string;
  goodsLength?: string;
  hasImages: boolean;
  imageCount: number;
  currentNote: string;
  distance?: number;
}

const SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên gia logistics cho ứng dụng giao hàng BenGo. Nhiệm vụ của bạn là phân tích đơn hàng và đưa ra gợi ý tối ưu.

**QUY TRÌNH PHÂN TÍCH:**
1. **Phân tích hàng hóa (Tham khảo):** Ước tính cân nặng, kích thước thực tế và đưa ra cảnh báo (conflictWarning) nếu thông tin người dùng nhập sai lệch quá lớn so với thực tế.
2. **Đánh giá chuyên sâu (Phân tích):**
   - **Đặc thù kỹ thuật:** Xác định tính chất hàng (dễ vỡ, đồ điện tử, cần giữ thẳng đứng, chống rung lắc...).
   - **Trải nghiệm khách hàng:** Đánh giá phương tiện nào giúp đảm bảo an toàn hàng hóa cao nhất.
   - **Quy định giao thông:** Đối chiếu luật GTĐB Việt Nam (ví dụ: giới hạn kích thước hàng hóa trên xe máy, quy định chiều cao...).
3. **Gợi ý phương tiện (Quyết định):**
   - Dựa trên kích thước/cân nặng người dùng nhập để lọc xe hợp lệ (BIKE: <=20kg & <50cm; VAN: 20-200kg & 50cm-1.8m; TRUCK: >200kg hoặc >1.8m).
   - **Quan trọng:** Bạn PHẢI cân nhắc các yếu tố ở mục (2). Nếu hàng hóa là đồ điện tử hoặc dễ vỡ, hãy ưu tiên gợi ý VAN hoặc TRUCK dù kích thước có thể vừa với xe máy, đồng thời đưa ra lý do thuyết phục trong 'vehicleReason'.

**JSON PHẢN HỒI (CHỈ TRẢ VỀ JSON, KHÔNG MARKDOWN, KHÔNG GIẢI THÍCH NGOÀI):**
{
  "estimatedWeight": "Ước tính thực tế (ví dụ: ~15 kg)",
  "estimatedLength": "Ước tính thực tế (ví dụ: 47x47x45 cm)",
  "productInfo": "Mô tả ngắn về sản phẩm",
  "analysis": {
    "technical": "Đánh giá kỹ thuật (vd: cần giữ thẳng đứng, chống rung lắc)",
    "experience": "Đánh giá trải nghiệm (vd: rủi ro hư hỏng, sự chuyên nghiệp)",
    "compliance": "Đánh giá tuân thủ (vd: phù hợp luật GTĐB Việt Nam)"
  },
  "recommendedVehicle": "BIKE|VAN|TRUCK",
  "vehicleReason": "Giải thích logic: Kết hợp giữa số liệu người dùng nhập và các yếu tố kỹ thuật/an toàn đã phân tích.",
  "suggestedNote": "Ghi chú hướng dẫn cho tài xế",
  "tips": ["Mẹo 1", "Mẹo 2"],
  "conflictWarning": "Cảnh báo nếu số liệu người dùng khai chênh lệch lớn"
}

QUY TẮC BẮT BUỘC:
- Nếu thông số người dùng nhập (ví dụ: 10kg) nằm trong giới hạn xe máy (BIKE), nhưng hàng hóa là đồ dễ vỡ, hãy KHUYẾN NGHỊ VAN và giải thích trong vehicleReason.
- Dùng tiếng Việt chuyên nghiệp, ngắn gọn.`;

export const getBookingAISuggestion = async (
  request: BookingAIRequest,
  openaiApiKey: string
): Promise<BookingAISuggestion> => {
  const weightNote = !request.goodsWeight || request.goodsWeight === '0'
    ? '(chưa nhập - AI hãy ước tính)'
    : `${request.goodsWeight} kg`;

  const lengthNote = !request.goodsLength || request.goodsLength.trim() === ''
    ? '(chưa nhập - AI hãy ước tính)'
    : request.goodsLength;

  const imageNote = request.imageCount > 0
    ? `Có ${request.imageCount} ảnh hàng hóa đính kèm.`
    : 'Không có ảnh hàng hóa';

  const userPrompt = `YÊU CẦU: Bạn PHẢI ưu tiên tuyệt đối thông tin người dùng đã nhập dưới đây để gợi ý loại xe và giải thích lý do lựa chọn một cách logic.

Thông tin người dùng nhập:
- Tên hàng: "${request.goodsName}"
- Khối lượng người dùng khai: ${weightNote}
- Kích thước người dùng khai: ${lengthNote}
- ${imageNote}

Hãy thực hiện:
1. Gợi ý loại xe dựa TRÊN THÔNG TIN NGƯỜI DÙNG ĐÃ NHẬP.
2. Tại mục "vehicleReason": Hãy giải thích rõ tại sao loại xe đó được chọn dựa trên các thông số người dùng đã cung cấp (so sánh với giới hạn tải trọng/kích thước của xe).
3. Đưa ra thông tin ước tính thực tế để tham khảo và ghi cảnh báo nếu cần.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Không nhận được phản hồi từ AI');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        const startIdx = content.indexOf('{');
        const endIdx = content.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          parsed = JSON.parse(content.substring(startIdx, endIdx + 1));
        } else {
          throw new Error('Không thể phân tích phản hồi AI');
        }
      }
    }

    return {
      estimatedWeight: parsed.estimatedWeight || '',
      estimatedLength: parsed.estimatedLength || '',
      productInfo: parsed.productInfo || '',
      analysis: parsed.analysis,
      recommendedVehicle: parsed.recommendedVehicle || 'VAN',
      vehicleReason: parsed.vehicleReason || '',
      suggestedNote: parsed.suggestedNote || '',
      tips: parsed.tips || [],
      conflictWarning: parsed.conflictWarning || undefined,
    };
  } catch (error: any) {
    throw error;
  }
};
