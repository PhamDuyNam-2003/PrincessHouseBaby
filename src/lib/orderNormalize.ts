import mongoose from 'mongoose';

export type AdminOrderItemRow = {
  ProductID: string;
  VariantId?: string;
  variantName?: string;
  Quantity: number;
  Price: number;
  ImageURL?: string;
};

export type AdminOrderRow = {
  _id: string;
  OrderNumber: string;
  CustomerDisplayName: string;
  CustomerPhone: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  TotalAmount: number;
  Status: string;
  createdAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  Items?: AdminOrderItemRow[];
};

function toStringId(id: unknown): string {
  if (id == null) return '';
  if (typeof id === 'string') return id;
  if (id instanceof mongoose.Types.ObjectId) return id.toString();
  if (typeof id === 'object' && id !== null && '$oid' in (id as object)) {
    return String((id as { $oid: string }).$oid);
  }
  return String(id);
}

export function pickOrderDate(
  doc: Record<string, unknown>
): Date | undefined {
  const d = doc.createdAt ?? doc.created_at ?? doc.updatedAt;
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
  if (typeof d === 'string') {
    const x = new Date(d);
    if (!Number.isNaN(x.getTime())) return x;
  }
  if (d && typeof d === 'object' && '$date' in (d as object)) {
    const raw = (d as { $date: string }).$date;
    const x = new Date(raw);
    if (!Number.isNaN(x.getTime())) return x;
  }
  return undefined;
}

export function normalizeOrderDoc(
  doc: Record<string, unknown>,
  customerById?: Map<string, { CustomerName?: string; Phone?: string }>
): AdminOrderRow {
  const id = toStringId(doc._id);

  const embedded = doc.customer as
    | { name?: string; phone?: string; address?: string }
    | undefined;

  let CustomerDisplayName = '—';
  let CustomerPhone = '';

  if (embedded?.name) {
    CustomerDisplayName = String(embedded.name);
    CustomerPhone = String(embedded.phone ?? '');
  } else {
    const cid = doc.CustomerId as unknown;
    if (cid && typeof cid === 'object' && 'CustomerName' in (cid as object)) {
      const p = cid as { CustomerName?: string; Phone?: string };
      CustomerDisplayName = String(p.CustomerName ?? '—');
      CustomerPhone = String(p.Phone ?? '');
    } else if (cid != null && customerById) {
      const cidStr =
        cid instanceof mongoose.Types.ObjectId
          ? cid.toString()
          : toStringId(cid);
      if (cidStr) {
        const c = customerById.get(cidStr);
        if (c) {
          CustomerDisplayName = String(c.CustomerName ?? '—');
          CustomerPhone = String(c.Phone ?? '');
        }
      }
    }
  }

  const total = doc.TotalAmount ?? doc.total;
  const status = doc.Status ?? doc.status ?? 'pending';
  const shortId = id.replace(/[^a-f0-9]/gi, '').slice(-8);
  const orderNumber =
    (doc.OrderNumber as string | undefined) ??
    (doc.orderNumber as string | undefined) ??
    (shortId ? `ORD-${shortId}` : id);

  const dateObj = pickOrderDate(doc);
  const createdAt = dateObj?.toISOString();

  const rawItems = Array.isArray(doc.Items) ? doc.Items : (Array.isArray(doc.items) ? doc.items : []);
  const Items: AdminOrderItemRow[] = rawItems.map((item: any) => ({
    ProductID: String(item.ProductID || item.product_id || ''),
    VariantId: item.VariantId ? String(item.VariantId) : undefined,
    variantName: String(item.variantName || ''),
    Quantity: Number(item.Quantity || item.quantity || 1),
    Price: Number(item.Price || item.unit_price || 0),
    ImageURL: item.ImageURL || item.image || '',
  }));

  return {
    _id: id,
    OrderNumber: orderNumber,
    CustomerDisplayName,
    CustomerPhone,
    Email: String(doc.Email ?? doc.email ?? ''),
    Phone: String(doc.Phone ?? doc.phone ?? ''),
    Address: String(doc.Address ?? doc.address ?? ''),
    TotalAmount: Number(total) || 0,
    Status: String(status),
    createdAt,
    paymentMethod: String(doc.PaymentMethod ?? doc.paymentMethod ?? ''),
    paymentStatus: String(doc.paymentStatus ?? ''),
    Items,
  };
}
