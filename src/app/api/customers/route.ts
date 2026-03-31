import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const customers = await Customer.find().sort({ createdAt: -1 });
    
    return NextResponse.json({ data: customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const email = String(body.Email || '')
      .trim()
      .toLowerCase();

    const payload = {
      CustomerName: body.CustomerName,
      Email: email,
      Phone: body.Phone,
      Address: body.Address ?? '',
      ProvinceName: body.ProvinceName ?? '',
      DistrictName: body.DistrictName ?? '',
      WardName: body.WardName ?? '',
    };

    const existing = await Customer.findOne({ Email: email });
    if (existing) {
      const updated = await Customer.findByIdAndUpdate(
        existing._id,
        {
          ...payload,
        },
        { new: true, runValidators: true }
      );
      return NextResponse.json({ data: updated }, { status: 200 });
    }

    const customer = new Customer(payload);
    await customer.save();
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
