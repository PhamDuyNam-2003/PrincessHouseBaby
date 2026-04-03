import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Đảm bảo model Category được đăng ký trước khi populate
    void Category;
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    
    let query: any = {};
    
    if (search) {
      query.$or = [
        { ProductName: { $regex: search, $options: 'i' } },
        { Description: { $regex: search, $options: 'i' } },
      ];
    }
    
    const products = await Product.find(query)
      .populate('CategoryID')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ data: products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const product = new Product({
      ProductName: body.ProductName,
      CategoryID: body.CategoryID,
      Description: body.Description ?? '',
      variants: Array.isArray(body.variants) ? body.variants : [],
    });

    await product.save();

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
