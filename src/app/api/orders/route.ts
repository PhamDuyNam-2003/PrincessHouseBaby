import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { normalizeOrderDoc } from '@/lib/orderNormalize';

async function getOrdersCollection() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  return db.collection('orders');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const badge = request.nextUrl.searchParams.get('badge');
    if (badge === '1') {
      const col = await getOrdersCollection();
      const count = await col.countDocuments({
        $or: [
          { Status: { $in: ['pending', 'processing'] } },
          { status: { $in: ['pending', 'processing'] } },
        ],
      });
      return NextResponse.json({ data: { count } }, { status: 200 });
    }

    const col = await getOrdersCollection();
    const raw = (await col.find({}).sort({ _id: -1 }).toArray()) as Record<
      string,
      unknown
    >[];

    const idsNeedingLookup = new Set<string>();
    for (const doc of raw) {
      const hasEmbedded =
        doc.customer &&
        typeof doc.customer === 'object' &&
        (doc.customer as { name?: string }).name;
      const cid = doc.CustomerId;
      if (!hasEmbedded && cid) {
        if (cid instanceof mongoose.Types.ObjectId) {
          idsNeedingLookup.add(cid.toString());
        } else if (typeof cid === 'string' && mongoose.Types.ObjectId.isValid(cid)) {
          idsNeedingLookup.add(cid);
        }
      }
    }

    let customerMap = new Map<
      string,
      { CustomerName?: string; Phone?: string }
    >();
    if (idsNeedingLookup.size > 0) {
      const customers = await Customer.find({
        _id: {
          $in: [...idsNeedingLookup].map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      })
        .select('CustomerName Phone')
        .lean();
      customerMap = new Map(
        customers.map((c) => [
          String(c._id),
          { CustomerName: c.CustomerName, Phone: c.Phone },
        ])
      );
    }

    const data = raw.map((doc) => normalizeOrderDoc(doc, customerMap));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const orderNumber = `ORD-${Date.now()}`;

    const items = (body.Items || []).map(
      (row: {
        ProductID: string;
        VariantId?: string;
        variantName?: string;
        Quantity: number;
        Price: number;
      }) => ({
        ProductID: row.ProductID,
        VariantId: row.VariantId || undefined,
        variantName: row.variantName || '',
        Quantity: row.Quantity,
        Price: row.Price,
      })
    );

    const order = new Order({
      OrderNumber: orderNumber,
      CustomerId: body.CustomerId,
      Items: items,
      TotalAmount: body.TotalAmount,
      Address: body.Address,
      Phone: body.Phone,
      Email: body.Email,
      PaymentMethod: body.PaymentMethod || 'COD',
      Status: 'pending',
    });

    await order.save();

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
