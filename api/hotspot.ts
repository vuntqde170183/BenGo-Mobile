import { fetchAPI } from "@/lib/fetch";

export interface HotspotLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  reason: string;
  crowdLevel: 'high' | 'medium' | 'low';
  estimatedCustomers: string;
  category: string;
  icon: string;
}

export interface HotspotRequest {
  latitude: number;
  longitude: number;
  radius?: number; // km
}

export interface HotspotResponse {
  locations: HotspotLocation[];
  summary: string;
  analyzedAt: string;
}

const OPENAI_SYSTEM_PROMPT = `Bạn là một trợ lý AI chuyên phân tích và dự đoán các địa điểm có đông người/khách hàng tiềm năng cho tài xế giao hàng và chở khách.

Dựa vào vị trí hiện tại, thời gian, và ngày trong tuần, hãy dự đoán các địa điểm xung quanh (trong bán kính được chỉ định) có khả năng đông người.

Hãy xem xét các yếu tố:
- Giờ cao điểm (sáng 7-9h, trưa 11-13h, chiều 17-19h)
- Ngày trong tuần vs cuối tuần
- Các loại địa điểm: trung tâm thương mại, bệnh viện, trường học, khu công nghiệp, chợ, nhà hàng, quán bar, sân bay, bến xe, khu du lịch
- Thời tiết và mùa
- Các sự kiện thường xuyên

Trả về JSON với format chính xác như sau (KHÔNG có markdown, KHÔNG có \`\`\`json):
{
  "locations": [
    {
      "id": "unique_id",
      "name": "Tên địa điểm",
      "address": "Địa chỉ cụ thể",
      "latitude": 16.xxx,
      "longitude": 108.xxx,
      "reason": "Lý do dự đoán đông",
      "crowdLevel": "high|medium|low",
      "estimatedCustomers": "Ước tính số khách (ví dụ: 50-100 người)",
      "category": "shopping|food|transport|hospital|school|entertainment|office|market|tourism",
      "icon": "cart|restaurant|bus|medkit|school|game-controller|briefcase|storefront|camera"
    }
  ],
  "summary": "Tóm tắt phân tích ngắn gọn"
}

LƯU Ý QUAN TRỌNG:
- Chỉ trả về các địa điểm THỰC TẾ có tọa độ CHÍNH XÁC tại thành phố tương ứng
- Tọa độ phải nằm trong bán kính được yêu cầu
- Trả về tối đa 8 địa điểm, sắp xếp theo mức độ đông giảm dần
- Mỗi lý do phải cụ thể theo thời gian và ngày hiện tại`;

const getDayName = (date: Date): string => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[date.getDay()];
};

const getTimeContext = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'buổi sáng sớm (giờ cao điểm đi làm)';
  if (hour >= 9 && hour < 11) return 'buổi sáng (sau giờ cao điểm)';
  if (hour >= 11 && hour < 14) return 'buổi trưa (giờ ăn trưa)';
  if (hour >= 14 && hour < 17) return 'buổi chiều';
  if (hour >= 17 && hour < 20) return 'buổi chiều tối (giờ cao điểm tan làm)';
  if (hour >= 20 && hour < 23) return 'buổi tối';
  return 'khuya';
};

export const predictHotspots = async (
  request: HotspotRequest,
  openaiApiKey: string
): Promise<HotspotResponse> => {
  const now = new Date();
  const dayName = getDayName(now);
  const timeContext = getTimeContext(now);
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const radius = request.radius || 5;

  const userPrompt = `Vị trí hiện tại: ${request.latitude}, ${request.longitude}
Thời gian: ${timeStr} - ${timeContext}
Ngày: ${dayName}
Bán kính tìm kiếm: ${radius}km

Hãy dự đoán các địa điểm đông người xung quanh vị trí này.`;

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
          { role: 'system', content: OPENAI_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // Parse JSON from response, handling potential markdown wrapping
    let parsed: any;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
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
      locations: parsed.locations || [],
      summary: parsed.summary || 'Phân tích hoàn tất',
      analyzedAt: now.toISOString(),
    };
  } catch (error: any) {
    console.error('Hotspot prediction error:', error);
    throw error;
  }
};
