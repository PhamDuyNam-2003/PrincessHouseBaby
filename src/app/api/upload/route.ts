import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'princess-house-baby', // Tên thư mục trên Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve(NextResponse.json({ error: 'Lỗi tải ảnh lên Cloudinary' }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ url: result?.secure_url }, { status: 200 }));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
