import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Category } from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find().sort({ createdAt: -1 });
    
    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const category = new Category({
      CategoryName: body.CategoryName,
      Description: body.Description,
    });
    
    await category.save();
    
    return NextResponse.json(
      { data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
