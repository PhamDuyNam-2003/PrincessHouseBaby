'use client';

import { useCallback, useEffect, useState } from 'react';

type ProvinceRow = { code: number; name: string };
type DistrictRow = { code: number; name: string };
type WardRow = { code: number; name: string };

const normalizeText = (str: string) =>
  str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

type OrderItemRow = {
  ProductID: string;
  VariantId?: string;
  variantName?: string;
  Quantity: number;
  Price: number;
  ImageURL?: string;
};

type OrderRow = {
  _id: string;
  OrderNumber?: string;
  CustomerId?: string;
  CustomerDisplayName?: string;
  CustomerPhone?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  TotalAmount?: number;
  Status?: string;
  PaymentMethod?: string;
  createdAt?: string;
  Items?: OrderItemRow[];
};

type CustomerShort = { _id: string; CustomerName: string; Phone?: string; PhoneNumber?: string; Email: string; Address?: string; ProvinceName?: string; DistrictName?: string; WardName?: string; };
type ProductShort = { _id: string; ProductName: string; variants?: { _id: string; variantName: string; Price: number }[] };

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function formatMoney(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('vi-VN');
}

const emptyForm = {
  CustomerId: '',
  Phone: '',
  Email: '',
  Address: '',
  ProvinceName: '',
  DistrictName: '',
  WardName: '',
  PaymentMethod: 'COD',
  Status: 'pending',
  Items: [] as OrderItemRow[],
};

// Helper: parse Address string back into components roughly if needed
// A real system would save ProvinceName explicitly in Order doc, but we will store them as a combined Address string 
// as expected by existing Order schema: "Address, Ward, District, Province"
function parseAddress(fullAddress: string) {
  const parts = fullAddress.split(',').map(s => s.trim());
  if (parts.length >= 4) {
    return {
      Address: parts.slice(0, parts.length - 3).join(', '),
      WardName: parts[parts.length - 3],
      DistrictName: parts[parts.length - 2],
      ProvinceName: parts[parts.length - 1]
    };
  }
  return { Address: fullAddress, ProvinceName: '', DistrictName: '', WardName: '' };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [viewing, setViewing] = useState<OrderRow | null>(null);
  const [viewingCustomerOrder, setViewingCustomerOrder] = useState<OrderRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // References state
  const [customers, setCustomers] = useState<CustomerShort[]>([]);
  const [products, setProducts] = useState<ProductShort[]>([]);

  // Address API state
  const [provinces, setProvinces] = useState<ProvinceRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [wards, setWards] = useState<WardRow[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  // Filtering and Sorting
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      setOrders(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReferences = useCallback(async () => {
    try {
      const [cusRes, prdRes] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json())
      ]);
      setCustomers(cusRes.data || []);
      setProducts(prdRes.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    loadReferences();
  }, [load, loadReferences]);

  // Province fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setProvinces(data);
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, []);

  // District fetch
  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]); setWards([]); return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        if (!cancelled) { setDistricts(data.districts || []); setWards([]); }
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [provinceCode]);

  // Ward fetch
  useEffect(() => {
    if (!districtCode) {
      setWards([]); return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await res.json();
        if (!cancelled) setWards(data.wards || []);
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [districtCode]);

  // Handle Editing district code auto-mapping
  useEffect(() => {
    if (editing && form.DistrictName && districts.length > 0 && !districtCode) {
      const d = districts.find((x) => x.name === form.DistrictName);
      if (d) setDistrictCode(d.code);
    }
  }, [districts, editing, form.DistrictName, districtCode]);


  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProvinceCode(null);
    setDistrictCode(null);
    setModalOpen(true);
  };

  const openEdit = (o: OrderRow) => {
    setEditing(o);
    const parsedAddr = parseAddress(o.Address || '');
    
    setForm({
      CustomerId: o.CustomerId || '',
      Phone: o.Phone || o.CustomerPhone || '',
      Email: o.Email || '',
      Address: parsedAddr.Address,
      ProvinceName: parsedAddr.ProvinceName,
      DistrictName: parsedAddr.DistrictName,
      WardName: parsedAddr.WardName,
      PaymentMethod: o.PaymentMethod || 'COD',
      Status: o.Status || 'pending',
      Items: o.Items ? [...o.Items] : [],
    });

    if (parsedAddr.ProvinceName) {
      const p = provinces.find((x) => x.name === parsedAddr.ProvinceName);
      setProvinceCode(p ? p.code : null);
    } else {
      setProvinceCode(null);
    }
    if (!parsedAddr.ProvinceName) setDistrictCode(null);

    setModalOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: status }),
      });
      if (!res.ok) { alert('Cập nhật thất bại'); return; }
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('admin-orders-badge-refresh'));
    } catch { alert('Lỗi mạng'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa đơn hàng này?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Xóa thất bại'); return; }
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('admin-orders-badge-refresh'));
    } catch { alert('Lỗi mạng'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.CustomerId) {
      alert("Vui lòng chọn khách hàng.");
      return;
    }
    setSaving(true);
    try {
      const fullAddress = [form.Address, form.WardName, form.DistrictName, form.ProvinceName]
        .filter(Boolean).join(', ');

      const totalAmount = form.Items.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

      const payload = {
        ...form,
        Address: fullAddress,
        TotalAmount: totalAmount
      };

      const url = editing ? `/api/orders/${editing._id}` : '/api/orders';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Lưu thất bại');
        return;
      }
      setModalOpen(false);
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('admin-orders-badge-refresh'));
    } catch (err) {
      alert('Lỗi mạng');
    } finally {
      setSaving(false);
    }
  };

  const addItemToOrder = () => {
    setForm(prev => ({
      ...prev,
      Items: [...prev.Items, { ProductID: '', VariantId: '', variantName: '', Quantity: 1, Price: 0 }]
    }));
  };

  const updateOrderItem = (index: number, update: Partial<OrderItemRow>) => {
    setForm(prev => {
      const newItems = [...prev.Items];
      newItems[index] = { ...newItems[index], ...update };
      
      // Auto-update price if product or variant changes
      if (update.ProductID || "VariantId" in update) {
        const prdId = update.ProductID || newItems[index].ProductID;
        const varId = update.VariantId !== undefined ? update.VariantId : newItems[index].VariantId;
        const prd = products.find(p => p._id === prdId);
        if (prd && prd.variants && prd.variants.length > 0) {
          const v = prd.variants.find(v => v._id === varId) || prd.variants[0];
          newItems[index].VariantId = v._id;
          newItems[index].variantName = v.variantName;
          newItems[index].Price = v.Price;
          newItems[index].ImageURL = (v as any).ImageURL || (v as any).image;
        } else {
          newItems[index].VariantId = '';
          newItems[index].variantName = '';
        }
      }
      
      return { ...prev, Items: newItems };
    });
  };

  const removeOrderItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      Items: prev.Items.filter((_, i) => i !== index)
    }));
  };


  const toggleSort = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const filteredAndSortedOrders = orders
    .filter((o) => {
      if (!startDate && !endDate) return true;
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'desc' ? dB - dA : dA - dB;
    });

  if (loading && orders.length === 0) {
    return <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-full animate-bounce shadow-md border border-pink-200">
        🌸 Đang tải đơn hàng... ✨
      </div>
    </div>;
  }

  return (
    <div className="p-4 md:p-6 bg-[#fff0f5] min-h-screen text-gray-800 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 drop-shadow-sm flex items-center gap-2">
          🎀 Quản lý đơn hàng 🌸
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-5 py-2.5 rounded-full hover:from-pink-500 hover:to-purple-500 shadow-md hover:shadow-lg transform transition-all hover:-translate-y-1 font-bold text-sm md:text-base flex items-center gap-1"
        >
          ✨ Thêm đơn hàng
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-[0_4px_20px_rgba(236,72,153,0.1)] mb-6 flex flex-wrap items-end gap-5 border border-pink-100">
        <div>
          <label className="block text-sm font-bold text-pink-400 mb-1">Từ ngày 📅</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-2 border-pink-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all bg-pink-50/50 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-pink-400 mb-1">Đến ngày 📅</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-2 border-pink-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all bg-pink-50/50 text-gray-700"
          />
        </div>
        <div>
          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="px-5 py-2 bg-pink-50 border-2 border-pink-100 rounded-2xl hover:bg-pink-100 text-sm font-bold text-pink-500 transition-colors shadow-sm"
          >
            Xóa bộ lọc 🧹
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgba(236,72,153,0.08)] overflow-hidden border border-pink-50">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 text-pink-800 text-sm">
              <tr>
                <th className="px-5 py-4 text-left font-bold rounded-tl-3xl">Mã đơn</th>
                <th className="px-5 py-4 text-left font-bold">Khách hàng</th>
                <th className="px-5 py-4 text-left font-bold">Sản phẩm</th>
                <th className="px-5 py-4 text-left font-bold cursor-pointer hover:bg-pink-200/50 select-none group transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-1">
                    Ngày ⏱️
                    <span className="text-pink-400 font-black group-hover:text-pink-600">
                      {sortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  </div>
                </th>
                <th className="px-5 py-4 text-left font-bold">Tổng tiền</th>
                <th className="px-5 py-4 text-left font-bold">Trạng thái</th>
                <th className="px-5 py-4 text-left font-bold rounded-tr-3xl">Thao tác</th>
              </tr>
            </thead>
            <tbody>
            {filteredAndSortedOrders.map((order, index) => {
              const date = order.createdAt
                ? new Date(order.createdAt).toLocaleString('vi-VN')
                : '—';
              const name = order.CustomerDisplayName || 'Khách vãng lai';
              const phone = order.Phone || order.CustomerPhone || (order as any).PhoneNumber || ((order as any).customer && (order as any).customer.phone) || 'Không có SĐT';
              return (
                <tr
                  key={`${String(order._id)}-${index}-${order.OrderNumber ?? ''}`}
                  className="border-b border-pink-50 hover:bg-pink-50/60 transition-colors group"
                >
                  <td className="px-5 py-4 font-mono text-sm max-w-[120px] truncate cursor-pointer font-bold text-purple-600 hover:text-pink-500" title={order.OrderNumber} onClick={() => setViewing(order)}>
                    🏷️ {order.OrderNumber ?? '—'}
                  </td>
                  <td className="px-5 py-4 min-w-[150px]">
                    <div 
                      className="font-bold text-pink-600 hover:text-purple-600 cursor-pointer hover:underline transition-colors flex items-center gap-1"
                      onClick={() => setViewingCustomerOrder(order)}
                    >
                      👧 {name}
                    </div>
                    {phone ? (
                      <span className="inline-block bg-white px-2 py-0.5 rounded-full border border-pink-100 text-xs font-bold text-gray-500 mt-1 shadow-sm">
                        📞 {phone}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm min-w-[150px]">
                    {order.Items && order.Items.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setViewing(order)}
                        className="inline-flex items-center justify-center bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full font-bold hover:bg-pink-200 transition-colors shadow-sm"
                      >
                        <span className="mr-1 shadow-sm px-2 py-0.5 bg-white text-pink-600 rounded-full text-xs font-black">
                          {order.Items.reduce((acc, it) => acc + it.Quantity, 0)}
                        </span> 
                        sản phẩm 🎀
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Trống</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap font-medium">{date}</td>
                  <td className="px-5 py-4 font-black text-pink-600 whitespace-nowrap text-base">
                    {formatMoney(order.TotalAmount)} đ 💰
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={order.Status ?? 'pending'}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="border-2 border-pink-100 rounded-xl px-3 py-1.5 text-sm max-w-[160px] font-bold text-gray-700 bg-white focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openEdit(order)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors mr-2 shadow-sm font-bold"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(order._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm font-bold"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pink-200/50 backdrop-blur-sm transition-opacity"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(236,72,153,0.3)] max-w-4xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-pink-600 mb-6 flex items-center gap-2">
              {editing ? '✂️ Sửa đơn hàng' : '✨ Thêm đơn hàng mới'}
            </h2>
            
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái: Thông tin khách hàng & Địa chỉ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Thông tin khách hàng</h3>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Khách hàng</label>
                  <select
                    required
                    value={form.CustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const c = customers.find(x => x._id === cid);
                      setForm(prev => ({ 
                        ...prev, 
                        CustomerId: cid,
                        Phone: c?.Phone || prev.Phone,
                        Email: c?.Email || prev.Email
                      }));
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Chọn Khách Hàng --</option>
                    {customers.map((c, idx) => (
                      <option key={c._id || `cust-${idx}`} value={c._id}>{c.CustomerName} - {c.Phone}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Điện thoại</label>
                    <input
                      required
                      value={form.Phone}
                      onChange={e => setForm(f => ({ ...f, Phone: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={form.Email}
                      onChange={e => setForm(f => ({ ...f, Email: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 mt-4">Thông tin giao hàng</h3>

                <div>
                  <label className="block text-sm font-semibold mb-1">Tỉnh/Thành</label>
                  <div className="flex gap-1 mb-1">
                    <input
                      type="text"
                      placeholder="Tìm..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className="flex-1 px-3 py-1 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <select
                    value={form.ProvinceName}
                    onChange={(e) => {
                      const p = provinces.find((x) => x.name === e.target.value);
                      setProvinceCode(p?.code ?? null);
                      setDistrictCode(null);
                      setForm((prev) => ({
                        ...prev, ProvinceName: e.target.value, DistrictName: '', WardName: '',
                      }));
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Chọn Tỉnh/Thành</option>
                    {provinces.filter((loc) => normalizeText(loc.name).includes(normalizeText(provinceSearch)))
                      .map((loc) => <option key={loc.code} value={loc.name}>{loc.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Quận/Huyện</label>
                  <div className="flex gap-1 mb-1">
                    <input
                      type="text"
                      placeholder="Tìm..."
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      className="flex-1 px-3 py-1 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <select
                    value={form.DistrictName}
                    onChange={(e) => {
                      const d = districts.find((x) => x.name === e.target.value);
                      setDistrictCode(d?.code ?? null);
                      setForm((prev) => ({ ...prev, DistrictName: e.target.value, WardName: '' }));
                    }}
                    className="w-full border rounded px-3 py-2"
                    disabled={!form.ProvinceName}
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districts.filter((dist) => normalizeText(dist.name).includes(normalizeText(districtSearch)))
                      .map((dist) => <option key={dist.code} value={dist.name}>{dist.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Phường/Xã</label>
                  <div className="flex gap-1 mb-1">
                    <input
                      type="text"
                      placeholder="Tìm..."
                      value={wardSearch}
                      onChange={(e) => setWardSearch(e.target.value)}
                      className="flex-1 px-3 py-1 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <select
                    value={form.WardName}
                    onChange={(e) => setForm((prev) => ({ ...prev, WardName: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    disabled={!form.DistrictName}
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wards.filter((w) => normalizeText(w.name).includes(normalizeText(wardSearch)))
                      .map((w) => <option key={w.code} value={w.name}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Số nhà, đường</label>
                  <input
                    value={form.Address}
                    onChange={(e) => setForm((f) => ({ ...f, Address: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Thanh toán</label>
                    <select
                      value={form.PaymentMethod}
                      onChange={(e) => setForm(f => ({ ...f, PaymentMethod: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="COD">COD</option>
                      <option value="transfer">Chuyển khoản</option>                     
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                    <select
                      value={form.Status}
                      onChange={(e) => setForm(f => ({ ...f, Status: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cột phải: Sản phẩm Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">Sản phẩm ({form.Items.length})</h3>
                  <button type="button" onClick={addItemToOrder} className="text-blue-600 text-sm font-bold tracking-wide hover:underline">
                    + THÊM SẢN PHẨM
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 border border-gray-100 p-2 rounded bg-gray-50">
                  {form.Items.length === 0 && <p className="text-sm text-gray-500 italic">Chưa có sản phẩm nào. Nhấn Thêm.</p>}
                  
                  {form.Items.map((item, index) => {
                    const selectedPrd = products.find(p => p._id === item.ProductID);
                    const variantsList = selectedPrd?.variants || [];
                    
                    return (
                      <div key={index} className="bg-white p-3 rounded shadow-sm relative text-sm border">
                        <button type="button" onClick={() => removeOrderItem(index)} className="absolute top-2 right-2 text-red-500 font-bold hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center">×</button>
                        
                        <div className="mb-2 pr-6">
                          <label className="block font-semibold mb-1">Sản phẩm</label>
                          <select 
                            required
                            value={item.ProductID}
                            onChange={e => updateOrderItem(index, { ProductID: e.target.value })}
                            className="w-full border rounded p-1.5"
                          >
                            <option value="">-- Chọn --</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.ProductName}</option>)}
                          </select>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block font-semibold mb-1 text-xs text-gray-600">Phân loại</label>
                            <select 
                              value={item.VariantId || ''}
                              onChange={e => updateOrderItem(index, { VariantId: e.target.value })}
                              className="w-full border rounded p-1 text-xs"
                              disabled={variantsList.length === 0}
                            >
                              {variantsList.map(v => <option key={v._id} value={v._id}>{v.variantName}</option>)}
                            </select>
                          </div>
                          <div className="w-16">
                            <label className="block font-semibold mb-1 text-xs text-gray-600">SL</label>
                            <input 
                              type="number" min={1} required
                              value={item.Quantity}
                              onChange={e => updateOrderItem(index, { Quantity: parseInt(e.target.value) || 1 })}
                              className="w-full border rounded p-1 text-xs text-center"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block font-semibold mb-1 text-xs text-gray-600">Đơn giá</label>
                            <input 
                              type="number" min={0} required
                              value={item.Price}
                              onChange={e => updateOrderItem(index, { Price: parseInt(e.target.value) || 0 })}
                              className="w-full border rounded p-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-4">
                  <span>Tổng tiền:</span>
                  <span className="text-pink-600">
                    {formatMoney(form.Items.reduce((sum, item) => sum + (item.Price * item.Quantity), 0))} đ
                  </span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="md:col-span-2 flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Đơn Hàng'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 border rounded-lg font-bold hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-md"
          onClick={() => setViewing(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(236,72,153,0.3)] max-w-2xl w-full p-0 overflow-hidden transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-5 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black tracking-wide flex items-center gap-2">🎀 Đơn hàng {viewing.OrderNumber}</h2>
                <p className="text-pink-100 text-sm mt-1 font-medium">👧 {viewing.CustomerDisplayName || 'Khách vãng lai'} - 📞 {viewing.Phone || viewing.CustomerPhone || 'Không rõ'}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-white hover:text-pink-200 font-bold text-3xl transition-colors hover:scale-110">&times;</button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-[#fff0f5]">
              <h3 className="font-bold text-pink-600 mb-4 text-lg border-b border-pink-200 pb-2 flex items-center gap-2">🛍️ Sản phẩm mua</h3>
              {viewing.Items && viewing.Items.length > 0 ? (
                <div className="space-y-4">
                  {viewing.Items.map((item, i) => {
                    const prd = products.find(p => p._id === item.ProductID);
                    const prdName = prd?.ProductName || 'Sản phẩm đã bị xóa hoặc ẩn';
                    const imgUrl = (item as any).ImageURL || (item as any).image;
                    
                    return (
                      <div key={i} className="flex gap-4 items-center bg-white rounded-2xl p-4 border border-pink-100 shadow-sm hover:shadow-md transition-shadow group">
                        {imgUrl ? (
                          <img src={imgUrl} alt="Hình ảnh" className="w-20 h-20 object-cover rounded-xl border border-pink-100 shadow-sm group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100 text-pink-300 text-xs text-center font-semibold">
                            Chưa có ảnh
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-800 break-words leading-tight">{prdName}</p>
                          <div className="mt-2 flex gap-2 flex-col sm:flex-row sm:items-center text-sm">
                            <span className="text-gray-600 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100"><span className="font-bold text-pink-500">Phân loại:</span> {item.variantName || 'Mặc định'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-pink-600">{formatMoney(item.Price)} đ</p>
                          <p className="text-sm font-bold text-gray-700 bg-gray-100 inline-block px-3 py-1 rounded-full mt-1 border border-gray-200 shadow-sm">x {item.Quantity}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 font-medium text-center py-8">Không có sản phẩm nào trong đơn hàng này 🥲</p>
              )}
            </div>
            <div className="px-6 py-5 bg-white border-t border-pink-100 flex justify-between items-center rounded-b-3xl">
               <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">Tổng cộng:</span>
               <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{formatMoney(viewing.TotalAmount)} đ</span>
            </div>
          </div>
        </div>
      )}

      {viewingCustomerOrder && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-pink-100/60 backdrop-blur-md"
          onClick={() => setViewingCustomerOrder(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(236,72,153,0.2)] max-w-sm w-full p-0 overflow-hidden transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-5 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-7xl opacity-20 rotate-12">🌸</div>
              <h2 className="text-xl font-extrabold flex items-center gap-2 relative z-10">🎀 Khách hàng iu</h2>
              <button 
                onClick={() => setViewingCustomerOrder(null)} 
                className="text-white hover:text-pink-200 font-bold text-3xl transition-colors hover:scale-110 relative z-10"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-5 relative bg-white">
              {(() => {
                const order = viewingCustomerOrder;
                const custRef = customers.find(c => c._id === order.CustomerId);
                
                // Giải thích: Ưu tiên lấy thông tin từ Đơn hàng (Order) trước, 
                // vì đây là thông tin khách nhập lúc mua. Nếu trống mới lấy từ Profile khách hàng.
                const name = order.CustomerDisplayName || (custRef && custRef.CustomerName) || 'Khách vãng lai';
                const phone = order.Phone || order.CustomerPhone || (custRef && (custRef.Phone || custRef.PhoneNumber)) || 'Không có';
                const email = order.Email || (custRef && custRef.Email) || 'Không xác định';
                const address = order.Address || (custRef ? [custRef.Address, custRef.WardName, custRef.DistrictName, custRef.ProvinceName].filter(Boolean).join(', ') : '') || 'Chưa cung cấp địa chỉ';

                return (
                  <div className="space-y-4">
                    <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                      <label className="text-xs text-pink-400 font-bold uppercase tracking-wider mb-1 block">Tên công chúa ✨</label>
                      <p className="font-extrabold text-xl text-purple-700">{name}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                      <label className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1 block">Điện thoại 📞</label>
                      <p className="font-bold text-gray-800 bg-white px-3 py-1.5 rounded-xl shadow-sm inline-block border border-purple-100">{phone}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <label className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1 block">Email 💌</label>
                      <p className="font-semibold text-gray-700">{email}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <label className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1 block">Địa chỉ 🏠</label>
                      <p className="font-medium text-gray-700 break-words">{address}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="px-6 py-4 bg-pink-50 border-t border-pink-100 flex justify-end rounded-b-3xl">
               <button
                  type="button"
                  onClick={() => setViewingCustomerOrder(null)}
                  className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl font-bold text-gray-700 hover:from-gray-300 hover:to-gray-400 transition-transform shadow-sm hover:scale-105"
                >
                  Đóng thui 🙈
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
