import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { normalizeOrderDoc } from '@/lib/orderNormalize';

async function getOrdersCollection() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  return db.collection('orders');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const col = await getOrdersCollection();
    const doc = (await col.findOne({
      _id: new mongoose.Types.ObjectId(id),
    })) as Record<string, unknown> | null;

    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let customerMap:
      | Map<string, { CustomerName?: string; Phone?: string }>
      | undefined;
    const cid = doc.CustomerId;
    if (
      cid &&
      !(doc.customer && typeof doc.customer === 'object') &&
      !(typeof cid === 'object' && cid && 'CustomerName' in (cid as object))
    ) {
      const cidStr =
        cid instanceof mongoose.Types.ObjectId
          ? cid.toString()
          : String(cid);
      const c = await Customer.findById(cidStr)
        .select('CustomerName Phone')
        .lean();
      if (c && !Array.isArray(c)) {
        const row = c as {
          _id: mongoose.Types.ObjectId;
          CustomerName?: string;
          Phone?: string;
        };
        customerMap = new Map([
          [String(row._id), { CustomerName: row.CustomerName, Phone: row.Phone }],
        ]);
      }
    }

    const data = normalizeOrderDoc(doc, customerMap);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const col = await getOrdersCollection();
    const _id = new mongoose.Types.ObjectId(id);

    const $set: Record<string, unknown> = {};
    if (body.Status !== undefined) {
      $set.Status = body.Status;
      $set.status = body.Status;
    }
    if (body.PaymentMethod !== undefined) {
      $set.PaymentMethod = body.PaymentMethod;
      $set.paymentMethod = body.PaymentMethod;
    }
    if (body.Address !== undefined) $set.Address = body.Address;
    if (body.Phone !== undefined) $set.Phone = body.Phone;
    if (body.Email !== undefined) $set.Email = body.Email;

    const upd = await col.updateOne({ _id }, { $set });
    if (upd.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const after = await col.findOne({ _id });
    const doc = after as Record<string, unknown>;
    let customerMap:
      | Map<string, { CustomerName?: string; Phone?: string }>
      | undefined;
    const cid = doc.CustomerId;
    if (
      cid &&
      !(doc.customer && typeof doc.customer === 'object') &&
      !(typeof cid === 'object' && cid && 'CustomerName' in (cid as object))
    ) {
      const cidStr =
        cid instanceof mongoose.Types.ObjectId
          ? cid.toString()
          : String(cid);
      const c = await Customer.findById(cidStr)
        .select('CustomerName Phone')
        .lean();
      if (c && !Array.isArray(c)) {
        const row = c as {
          _id: mongoose.Types.ObjectId;
          CustomerName?: string;
          Phone?: string;
        };
        customerMap = new Map([
          [String(row._id), { CustomerName: row.CustomerName, Phone: row.Phone }],
        ]);
      }
    }

    const data = normalizeOrderDoc(doc, customerMap);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const col = await getOrdersCollection();
    const _id = new mongoose.Types.ObjectId(id);

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

    const $set: Record<string, unknown> = {
      CustomerId: body.CustomerId,
      Items: items,
      items: items, 
      TotalAmount: body.TotalAmount,
      total: body.TotalAmount,
      Address: body.Address,
      Phone: body.Phone,
      Email: body.Email,
      PaymentMethod: body.PaymentMethod,
      paymentMethod: body.PaymentMethod,
      Status: body.Status,
      status: body.Status,
    };

    const upd = await col.updateOne({ _id }, { $set });
    if (upd.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const after = await col.findOne({ _id });
    const data = normalizeOrderDoc(after as Record<string, unknown>, undefined);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const col = await getOrdersCollection();
    const r = await col.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (r.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
