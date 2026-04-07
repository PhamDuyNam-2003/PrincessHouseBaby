import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';


// Cache sản phẩm 5 phút để không query DB mỗi lần chat
let cachedProducts: string | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

async function getProductCatalog(): Promise<string> {
  const now = Date.now();
  if (cachedProducts && now - cacheTime < CACHE_DURATION) {
    return cachedProducts;
  }

  try {
    await connectDB();
    void Category; // Đảm bảo model Category được đăng ký
    const products = await Product.find({}).populate('CategoryID').lean();

    const catalog = products
      .map((p: any) => {
        const variants = (p.variants || [])
          .map(
            (v: any) =>
              `  - ${v.variantName}: ${v.Price?.toLocaleString('vi-VN')}đ (còn ${v.StockQuantity} sp)`
          )
          .join('\n');
        const category = p.CategoryID?.CategoryName || 'Chưa phân loại';
        return `📌 ${p.ProductName}\n  Danh mục: ${category}\n  Mô tả: ${p.Description || 'Không có'}\n${variants}`;
      })
      .join('\n\n');

    cachedProducts = catalog;
    cacheTime = now;
    return catalog;
  } catch (error) {
    console.error('Error fetching products for chat:', error);
    return 'Không thể tải danh sách sản phẩm.';
  }
}

function buildSystemPrompt(productCatalog: string): string {
  return `Bạn là "Princess Bot" 🎀 — trợ lý tư vấn thông minh của shop **Princess House Baby**, chuyên bán kẹp tóc, băng đô, nơ, bờm tóc và phụ kiện tóc siêu dễ thương cho bé gái.

## Nguyên tắc trả lời:
- Luôn trả lời bằng **tiếng Việt**, giọng thân thiện, dễ thương, có emoji
- Trả lời **ngắn gọn** (tối đa 3-4 câu), đúng trọng tâm
- Nếu khách hỏi sản phẩm, hãy gợi ý từ danh sách bên dưới với giá chính xác
- Nếu khách hỏi ngoài phạm vi shop, nhẹ nhàng hướng về sản phẩm của shop
- Khi gợi ý sản phẩm, luôn kèm giá tiền
- Khuyến khích khách đặt hàng bằng cách nhấn nút "Đặt Mua Ngay" trên trang sản phẩm

## Danh sách sản phẩm hiện có:
${productCatalog}

## Thông tin shop:
- Tên: Princess House Baby
- Thanh toán: COD (thanh toán khi nhận hàng) hoặc Chuyển khoản
- Giao hàng: Toàn quốc`;
}

type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { message, history } = (await req.json()) as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Tin nhắn không hợp lệ' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    // Khởi tạo ở đây để đảm bảo lấy đúng key mới nhất từ env
    const genAI = new GoogleGenerativeAI(apiKey);

    const productCatalog = await getProductCatalog();
    console.log('Product Catalog length:', productCatalog.length, 'characters');
    
    const systemPrompt = buildSystemPrompt(productCatalog);

    const model = genAI.getGenerativeModel({
      model: 'gemini-pro-latest', 
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reply: text }, { status: 200 });
  } catch (error: any) {
    console.error('Chat API error detailed:', error);
    
    // Xử lý các lỗi phổ biến từ Gemini API
    if (error.status === 429) {
      return NextResponse.json(
        { reply: 'Bot đang hơi bận vì quá nhiều người hỏi (Hết quota), bạn thử lại sau chút nhé! 🌸' },
        { status: 200 }
      );
    }
    
    if (error.status === 404) {
      return NextResponse.json(
        { reply: 'Bot đang bảo trì model (Lỗi 404), mình sẽ quay lại sớm! 🎀' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { reply: 'Hệ thống đang bận một chút, bạn thử lại sau nhen! 🥲' },
      { status: 200 } // Trả về 200 để chatbot không báo lỗi đỏ
    );
  }
}
