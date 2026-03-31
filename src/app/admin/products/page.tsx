'use client';

import { useCallback, useEffect, useState } from 'react';
import { Product } from '@/types';

type CategoryOpt = { _id: string; CategoryName: string };

const defaultVariant = {
  variantName: 'Mặc định',
  Price: 0,
  Price50: 0,
  Price100: 0,
  StockQuantity: 0,
  ImageURL: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ProductName: '',
    CategoryID: '',
    Description: '',
    variants: [{ ...defaultVariant }],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, cat] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);
      setProducts(pr.data || []);
      setCategories(cat.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ProductName: '',
      CategoryID: categories[0]?._id || '',
      Description: '',
      variants: [{ ...defaultVariant }],
    });
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      const p = json.data;
      if (!p) return;
      setEditingId(id);
      setForm({
        ProductName: p.ProductName,
        CategoryID:
          typeof p.CategoryID === 'object'
            ? p.CategoryID._id
            : p.CategoryID,
        Description: p.Description || '',
        variants:
          p.variants?.length > 0
            ? p.variants.map((v: Record<string, unknown>) => ({
                variantName: String(v.variantName ?? ''),
                Price: Number(v.Price ?? 0),
                Price50: Number(v.Price50 ?? 0),
                Price100: Number(v.Price100 ?? 0),
                StockQuantity: Number(v.StockQuantity ?? 0),
                ImageURL: String(v.ImageURL ?? ''),
              }))
            : [{ ...defaultVariant }],
      });
      setModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ProductName: form.ProductName,
        CategoryID: form.CategoryID,
        Description: form.Description,
        variants: form.variants.map((v) => ({
          variantName: v.variantName,
          Price: Number(v.Price),
          Price50: Number(v.Price50),
          Price100: Number(v.Price100),
          StockQuantity: Number(v.StockQuantity),
          ImageURL: v.ImageURL,
        })),
      };
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
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
    } catch {
      alert('Lỗi mạng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Xóa thất bại');
        return;
      }
      await load();
    } catch {
      alert('Lỗi mạng');
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-full animate-bounce shadow-md border border-pink-200">
        🌸 Đang tải kẹp tóc... ✨
      </div>
    </div>;
  }

  return (
    <div className="p-4 md:p-6 bg-[#fff0f5] min-h-screen text-gray-800 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 drop-shadow-sm flex items-center gap-2">
          🎀 Quản lý Kẹp Tóc 🌸
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-5 py-2.5 rounded-full hover:from-pink-500 hover:to-purple-500 shadow-md hover:shadow-lg transform transition-all hover:-translate-y-1 font-bold text-sm md:text-base flex items-center gap-1"
        >
          ✨ Thêm kẹp tóc mới
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgba(236,72,153,0.08)] overflow-hidden border border-pink-50">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 text-pink-800 text-sm">
              <tr>
                <th className="px-5 py-4 text-left font-bold rounded-tl-3xl w-24">Ảnh</th>
                <th className="px-5 py-4 text-left font-bold">Tên kẹp tóc</th>
                <th className="px-5 py-4 text-left font-bold">Danh mục</th>
                <th className="px-5 py-4 text-left font-bold">Biến thể</th>
                <th className="px-5 py-4 text-left font-bold">Giá (Mặc định)</th>
                <th className="px-5 py-4 text-left font-bold">Tồn kho</th>
                <th className="px-5 py-4 text-left font-bold rounded-tr-3xl">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-pink-50 hover:bg-pink-50/60 transition-colors group">
                  <td className="px-5 py-4">
                    {product.variants?.[0]?.ImageURL ? (
                      <img
                        src={product.variants[0].ImageURL}
                        alt={product.ProductName}
                        className="w-16 h-16 object-cover rounded-2xl shadow-sm border-2 border-pink-100 group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-[10px] text-pink-400 font-bold border-2 border-dashed border-pink-200">
                        Chưa có ảnh
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold text-purple-700">
                    <span className="group-hover:text-pink-600 transition-colors cursor-pointer">{product.ProductName}</span>
                    {product.Description && (
                      <p className="text-xs text-pink-400 font-medium mt-1 line-clamp-1 italic" title={product.Description}>
                        {product.Description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                    <span className="bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                      📂 {product.CategoryID?.CategoryName ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-700 shadow-sm">
                      {product.variants?.length || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black text-pink-600 whitespace-nowrap text-base">
                    {product.variants?.[0]
                      ? <span>{product.variants[0].Price.toLocaleString()} đ 💰</span>
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-600 bg-emerald-50/50 rounded-lg text-center mx-2 inline-block my-2 border border-emerald-100 px-3">
                    {product.variants?.reduce((sum, v) => sum + (v.StockQuantity || 0), 0) || 0}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openEdit(product._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors mr-2 shadow-sm font-bold"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm font-bold"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pink-200/50 backdrop-blur-sm transition-opacity overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(236,72,153,0.3)] max-w-2xl w-full p-6 md:p-8 my-8 transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-pink-600 mb-6 flex items-center gap-2 border-b border-pink-100 pb-4">
              {editingId ? '✂️ Sửa kẹp tóc iu' : '✨ Thêm kẹp tóc mới nè'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Tên kẹp tóc 🎀</label>
                <input
                  required
                  placeholder="Ví dụ: Kẹp nơ công chúa..."
                  className="w-full border-2 border-pink-100 rounded-xl px-4 py-2 text-purple-800 font-bold focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all bg-pink-50/50"
                  value={form.ProductName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ProductName: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Danh mục 📂</label>
                 <select
                  required
                  className="w-full border-2 border-pink-100 rounded-xl px-4 py-2 text-purple-800 font-bold focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all bg-pink-50/50"
                  value={form.CategoryID}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, CategoryID: e.target.value }))
                  }
                 >
                  <option value="">Chọn bộ sưu tập</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.CategoryName}
                    </option>
                  ))}
                 </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">Mô tả chi tiết 💬</label>
                <textarea
                  placeholder="Viết vài dòng thật đáng yêu về sản phẩm này nhé..."
                  className="w-full border-2 border-pink-100 rounded-xl px-4 py-2 text-gray-700 focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all bg-pink-50/50"
                  rows={3}
                  value={form.Description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, Description: e.target.value }))
                  }
                />
              </div>

              <div className="border-t border-pink-100 pt-4">
                <p className="text-sm font-extrabold text-pink-600 mb-3 uppercase tracking-wider">
                  Mẫu loại & Giá tiền 💖
                </p>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {form.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-pink-100 rounded-2xl p-4 bg-[#fff0f5] shadow-sm relative group"
                    >
                      {form.variants.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setForm(f => ({...f, variants: f.variants.filter((_, i) => i !== idx)}))}
                          className="absolute -top-3 -right-3 w-7 h-7 bg-red-100 text-red-500 rounded-full font-bold flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100"
                        >
                          ×
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-pink-400">Kiểu dáng (VD: Đỏ / Chấm bi)</label>
                          <input
                            placeholder="Mặc định"
                            className="w-full border-2 border-pink-100 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-700 focus:border-pink-300 focus:outline-none"
                            value={v.variantName}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = { ...next[idx], variantName: e.target.value };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-pink-400">Tồn kho 📦</label>
                           <input
                            type="number"
                            placeholder="Số lượng"
                            className="w-full border-2 border-pink-100 rounded-xl px-3 py-1.5 text-sm font-bold text-emerald-600 focus:border-pink-300 focus:outline-none"
                            value={v.StockQuantity || ''}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = {
                                ...next[idx],
                                StockQuantity: Number(e.target.value),
                              };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-pink-400">Giá 1 cái</label>
                           <input
                            type="number"
                            placeholder="Giá"
                            className="w-full border-2 border-pink-100 rounded-xl px-2 py-1.5 text-sm font-black text-pink-600 focus:border-pink-300 focus:outline-none"
                            value={v.Price || ''}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = {
                                ...next[idx],
                                Price: Number(e.target.value),
                              };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-pink-400">Giá sỉ {'>='} 50</label>
                           <input
                            type="number"
                            placeholder="Giá"
                            className="w-full border-2 border-pink-100 rounded-xl px-2 py-1.5 text-sm font-bold text-purple-600 focus:border-pink-300 focus:outline-none"
                            value={v.Price50 || ''}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = {
                                ...next[idx],
                                Price50: Number(e.target.value),
                              };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-pink-400">Giá sỉ {'>='} 100</label>
                           <input
                            type="number"
                            placeholder="Giá"
                            className="w-full border-2 border-pink-100 rounded-xl px-2 py-1.5 text-sm font-bold text-purple-600 focus:border-pink-300 focus:outline-none"
                            value={v.Price100 || ''}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = {
                                ...next[idx],
                                Price100: Number(e.target.value),
                              };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                         <label className="text-xs font-bold text-pink-400">Ảnh kẹp tóc 🖼️ (Tải ảnh lên)</label>
                         <div className="flex gap-2 items-center">
                           <label className="cursor-pointer bg-white border-2 border-pink-200 hover:border-pink-400 text-pink-600 text-sm font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors text-center inline-block">
                             Tải ảnh 📷
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 
                                 const reader = new FileReader();
                                 reader.onloadend = () => {
                                   const img = new Image();
                                   img.src = reader.result as string;
                                   img.onload = () => {
                                     const canvas = document.createElement('canvas');
                                     let width = img.width;
                                     let height = img.height;
                                     const MAX_SIZE = 800; // Resize to max 800px

                                     if (width > height && width > MAX_SIZE) {
                                       height *= MAX_SIZE / width;
                                       width = MAX_SIZE;
                                     } else if (height > MAX_SIZE) {
                                       width *= MAX_SIZE / height;
                                       height = MAX_SIZE;
                                     }

                                     canvas.width = width;
                                     canvas.height = height;
                                     const ctx = canvas.getContext('2d');
                                     if (ctx) {
                                       ctx.drawImage(img, 0, 0, width, height);
                                       // Export as WebP to save much more space!
                                       const base64String = canvas.toDataURL('image/webp', 0.8);
                                       
                                       const next = [...form.variants];
                                       next[idx] = { ...next[idx], ImageURL: base64String };
                                       setForm((f) => ({ ...f, variants: next }));
                                     }
                                   };
                                 };
                                 reader.readAsDataURL(file);
                               }}
                             />
                           </label>
                           <span className="text-xs text-gray-400 italic">...hoặc dán Link URL</span>
                           <input
                            placeholder="🔗 https://..."
                            className="flex-1 border-2 border-pink-100 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:border-pink-300 focus:outline-none"
                            value={v.ImageURL}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[idx] = { ...next[idx], ImageURL: e.target.value };
                              setForm((f) => ({ ...f, variants: next }));
                            }}
                           />
                         </div>
                         {v.ImageURL && (
                           <div className="mt-3 bg-white p-2 rounded-xl inline-block shadow-sm">
                             <img src={v.ImageURL} alt="Preview" className="h-20 w-auto rounded-lg border border-pink-100 object-contain" />
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  className="mt-3 text-sm font-black text-pink-500 bg-pink-50 px-4 py-2 rounded-full border border-pink-200 hover:bg-pink-100 shadow-sm transition-colors inline-block"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      variants: [...f.variants, { ...defaultVariant }],
                    }))
                  }
                >
                  ➕ Thêm phân loại
                </button>
              </div>
              
              <div className="flex gap-3 pt-5 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-5 py-3 border-2 border-pink-100 rounded-full font-bold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                >
                  Hủy thui 🙈
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-black text-lg py-3 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 shadow-md transition-transform hover:-translate-y-1"
                >
                  {saving ? 'Đang lưu...' : 'Lưu sản phẩm ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
