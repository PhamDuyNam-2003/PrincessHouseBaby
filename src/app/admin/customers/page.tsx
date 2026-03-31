'use client';

import { useState, useEffect, useCallback } from 'react';

type ProvinceRow = { code: number; name: string };
type DistrictRow = { code: number; name: string };
type WardRow = { code: number; name: string };

const normalizeText = (str: string) =>
  str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

type CustomerRow = {
  _id: string;
  CustomerName: string;
  Email: string;
  Phone?: string;
  PhoneNumber?: string;
  Address: string;
  ProvinceName?: string;
  DistrictName?: string;
  WardName?: string;
};

const emptyForm = {
  CustomerName: '',
  Email: '',
  Phone: '',
  Address: '',
  ProvinceName: '',
  DistrictName: '',
  WardName: '',
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [wards, setWards] = useState<WardRow[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);

  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      setCustomers(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setProvinces(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
        );
        const data = await res.json();
        if (cancelled) return;
        setDistricts(data.districts || []);
        setWards([]);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
        );
        const data = await res.json();
        if (cancelled) return;
        setWards(data.wards || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProvinceCode(null);
    setDistrictCode(null);
    setModalOpen(true);
  };

  const openEdit = (c: CustomerRow) => {
    setEditing(c);
    setForm({
      CustomerName: c.CustomerName,
      Email: c.Email,
      Phone: c.Phone || c.PhoneNumber || '',
      Address: c.Address || '',
      ProvinceName: c.ProvinceName || '',
      DistrictName: c.DistrictName || '',
      WardName: c.WardName || '',
    });
    
    // Find codes if we have names
    if (c.ProvinceName) {
      const p = provinces.find((x) => x.name === c.ProvinceName);
      if (p) setProvinceCode(p.code);
      else setProvinceCode(null);
    } else {
      setProvinceCode(null);
    }
    // Note: districtCode and ward mapping might be delayed or tricky since districts fetch is async after provinceCode is set.
    // For simplicity, we just set the names in form. Finding the proper districtCode can be tricky as districts are not loaded yet.
    // However, if the user doesn't change it, the original names are saved back.
    if (!c.ProvinceName) setDistrictCode(null);
    setModalOpen(true);
  };

  useEffect(() => {
    // If editing and districts load, find districtCode so wards can load
    if (editing && form.DistrictName && districts.length > 0 && !districtCode) {
      const d = districts.find((x) => x.name === form.DistrictName);
      if (d) setDistrictCode(d.code);
    }
  }, [districts, editing, form.DistrictName, districtCode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/customers/${editing._id}` : '/api/customers';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Lưu thất bại');
        return;
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      alert('Lỗi mạng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa khách hàng này?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Xóa thất bại');
        return;
      }
      await load();
    } catch {
      alert('Lỗi mạng');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[#fff0f5] min-h-[80vh] flex items-center justify-center">
        <div className="bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-full animate-bounce shadow-sm border border-pink-200">
          🌸 Đang tìm các bé khách hàng... ✨
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#fff0f5] min-h-[80vh] text-gray-800 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
         <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 drop-shadow-sm flex items-center gap-2">
          👧 Thành viên gia đình ✨
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Bé mới
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(236,72,153,0.1)] overflow-hidden border-2 border-pink-50">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[640px]">
            <thead className="bg-pink-100 border-b-2 border-pink-200">
              <tr>
                <th className="px-6 py-4 text-left font-black text-pink-600">Tên Tên</th>
                <th className="px-6 py-4 text-left font-black text-pink-600">Thư gửi (Email)</th>
                <th className="px-6 py-4 text-left font-black text-pink-600">Alo Alo</th>
                <th className="px-6 py-4 text-left font-black text-pink-600">Nhà ở</th>
                <th className="px-6 py-4 text-left font-black text-pink-600 w-48">Làm gì nè?</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={`${String(customer._id ?? 'row')}-${index}-${customer.Email ?? ''}`}
                  className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-purple-700">{customer.CustomerName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{customer.Email}</td>
                  <td className="px-6 py-4 font-bold text-pink-500">{customer.Phone || customer.PhoneNumber || (customer as any).phone || '—'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-xs truncate" title={customer.Address}>
                    {[customer.Address, customer.WardName, customer.DistrictName, customer.ProvinceName].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEdit(customer)}
                        className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors shadow-sm"
                      >
                        Sửa ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(customer._id)}
                        className="bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors shadow-sm"
                      >
                        Xoá 🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center py-12 text-pink-300 font-bold">Chưa có khách hàng nào 😴</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(236,72,153,0.3)] max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border-4 border-pink-100 custom-scrollbar animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-pink-500 mb-6 flex items-center gap-2">
              {editing ? 'Sửa thông tin bé ✏️' : 'Thêm bé mới 🎀'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Tên 👧</label>
                 <input
                   required
                   placeholder="Nhập tên..."
                   className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-4 py-2.5 font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                   value={form.CustomerName}
                   onChange={(e) =>
                     setForm((f) => ({ ...f, CustomerName: e.target.value }))
                   }
                 />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Thư (Email) 📧</label>
                 <input
                   required
                   type="email"
                   placeholder="email@vidu.com"
                   className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-4 py-2.5 font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                   value={form.Email}
                   onChange={(e) =>
                     setForm((f) => ({ ...f, Email: e.target.value }))
                   }
                 />
              </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Gọi điện 📞</label>
                 <input
                   required
                   placeholder="Số điện thoại..."
                   className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-4 py-2.5 font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                   value={form.Phone}
                   onChange={(e) =>
                     setForm((f) => ({ ...f, Phone: e.target.value }))
                   }
                 />
              </div>

              <div className="pt-2 border-t-2 border-dashed border-pink-100 mt-2 space-y-3">
                 <label className="text-sm font-black text-pink-500 flex items-center gap-1">🏡 Chỗ ở của bé</label>
                 
                <div>
                  <input
                    type="text"
                    placeholder="Tìm Tỉnh/Thành..."
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg mb-2 focus:outline-none focus:border-pink-400 text-sm placeholder:text-pink-300 font-medium"
                  />
                  <select
                    value={form.ProvinceName}
                    onChange={(e) => {
                      const p = provinces.find((x) => x.name === e.target.value);
                      setProvinceCode(p?.code ?? null);
                      setDistrictCode(null);
                      setForm((prev) => ({
                        ...prev,
                        ProvinceName: e.target.value,
                        DistrictName: '',
                        WardName: '',
                      }));
                    }}
                    className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 focus:outline-none focus:border-pink-300"
                  >
                    <option value="">Chọn Tỉnh/Thành</option>
                    {provinces
                      .filter((loc) => normalizeText(loc.name).includes(normalizeText(provinceSearch)))
                      .map((loc) => (
                        <option key={loc.code} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Tìm Quận/Huyện..."
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg mb-2 focus:outline-none focus:border-pink-400 text-sm placeholder:text-pink-300 font-medium"
                  />
                  <select
                    value={form.DistrictName}
                    onChange={(e) => {
                      const d = districts.find((x) => x.name === e.target.value);
                      setDistrictCode(d?.code ?? null);
                      setForm((prev) => ({
                        ...prev,
                        DistrictName: e.target.value,
                        WardName: '',
                      }));
                    }}
                    className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 focus:outline-none focus:border-pink-300 disabled:opacity-50"
                    disabled={!form.ProvinceName}
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districts
                      .filter((dist) => normalizeText(dist.name).includes(normalizeText(districtSearch)))
                      .map((dist) => (
                        <option key={dist.code} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Tìm Phường/Xã..."
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg mb-2 focus:outline-none focus:border-pink-400 text-sm placeholder:text-pink-300 font-medium"
                  />
                  <select
                    value={form.WardName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, WardName: e.target.value }))
                    }
                    className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 focus:outline-none focus:border-pink-300 disabled:opacity-50"
                    disabled={!form.DistrictName}
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wards
                      .filter((w) => normalizeText(w.name).includes(normalizeText(wardSearch)))
                      .map((w) => (
                        <option key={w.code} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>

                <input
                  placeholder="Số nhà, tên đường chi tiết..."
                  className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-xl px-4 py-2.5 font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                  value={form.Address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, Address: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-6">
                 <button
                   type="button"
                   onClick={() => setModalOpen(false)}
                   className="px-6 py-3 border-2 border-pink-200 text-pink-500 font-bold rounded-full hover:bg-pink-50 hover:border-pink-300 transition-colors"
                 >
                   Hủy xíu
                 </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-black py-3 rounded-full hover:from-pink-500 hover:to-purple-500 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:transform-none"
                >
                  {saving ? 'Đang lưu...' : 'Lưu liền! ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
