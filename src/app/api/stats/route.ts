import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { Product } from '@/models/Product';

function periodStart(period: string): Date {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'day') {
    return start;
  }
  if (period === 'month') {
    start.setDate(1);
    return start;
  }
  start.setMonth(0, 1);
  return start;
}

/** Lọc đơn theo kỳ: dùng createdAt hoặc created_at */
function matchPeriod(from: Date) {
  return {
    $or: [{ createdAt: { $gte: from } }, { created_at: { $gte: from } }],
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const period =
      request.nextUrl.searchParams.get('period') || 'month';
    const from = periodStart(period);
    const periodMatch = matchPeriod(from);

    const [
      orderAgg,
      statusBreakdown,
      totalCustomers,
      totalProducts,
      topProductsAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $ifNull: ['$TotalAmount', { $ifNull: ['$total', 0] }],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: {
              $ifNull: ['$Status', '$status'],
            },
            n: { $sum: 1 },
          },
        },
      ]),
      Customer.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: periodMatch },
        {
          $addFields: {
            normItems: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$Items', []] } }, 0] },
                then: '$Items',
                else: { $ifNull: ['$items', []] },
              },
            },
          },
        },
        { $unwind: '$normItems' },
        {
          $group: {
            _id: {
              $ifNull: [
                '$normItems.ProductID',
                '$normItems.product_id',
              ],
            },
            units: {
              $sum: {
                $ifNull: [
                  '$normItems.Quantity',
                  { $ifNull: ['$normItems.quantity', 0] },
                ],
              },
            },
            revenue: {
              $sum: {
                $ifNull: [
                  '$normItems.subtotal',
                  {
                    $multiply: [
                      {
                        $ifNull: [
                          '$normItems.Quantity',
                          { $ifNull: ['$normItems.quantity', 0] },
                        ],
                      },
                      {
                        $ifNull: [
                          '$normItems.Price',
                          { $ifNull: ['$normItems.unit_price', 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        { $sort: { units: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            name: '$product.ProductName',
            units: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    const revenue = orderAgg[0]?.revenue ?? 0;
    const orderCount = orderAgg[0]?.count ?? 0;

    return NextResponse.json(
      {
        data: {
          period,
          from: from.toISOString(),
          totalRevenue: revenue,
          totalOrders: orderCount,
          totalCustomers,
          totalProducts,
          ordersByStatus: Object.fromEntries(
            statusBreakdown.map((s: { _id: string; n: number }) => [
              s._id,
              s.n,
            ])
          ),
          topProducts: topProductsAgg.map(
            (p: {
              name: string;
              units: number;
              revenue: number;
            }) => ({
              name: p.name,
              units: p.units,
              revenue: p.revenue,
            })
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error building stats:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
