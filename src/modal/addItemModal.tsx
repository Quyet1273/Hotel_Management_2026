import React, { useState } from "react";
import { Package, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventoryservice";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "other",
    unit: "Cái",
    min_quantity: 10,
    price: 0,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await inventoryService.addItem(form);
    if (res.success) {
      toast.success("Thêm vật tư thành công!");
      setForm({ name: "", category: "other", unit: "Cái", min_quantity: 10, price: 0 });
      onSuccess();
      onClose();
    } else {
      toast.error("Lỗi: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '2rem',
        maxWidth: '28rem',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        border: '1px solid #e5e7eb'
      }}>
        
        {/* HEADER: Màu Xanh Blue đặc trưng của Kho */}
        <div style={{ 
          backgroundColor: '#2563eb', 
          padding: '1.5rem', 
          color: '#ffffff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '2.5rem', 
              height: '2.5rem', 
              backgroundColor: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Package style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thêm Danh Mục
            </h3>
          </div>
          
          <button
            onClick={onClose}
            style={{ 
              padding: '0.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              border: 'none', 
              borderRadius: '0.75rem', 
              color: '#ffffff', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#ffffff' }}>
          
          {/* Tên vật tư */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tên vật tư <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              placeholder="VD: Nước suối Lavie..."
              style={{ 
                width: '100%', 
                padding: '0.85rem 1.25rem', 
                backgroundColor: '#ffffff', 
                border: '2px solid #e5e7eb', 
                borderRadius: '1rem', 
                fontWeight: '700', 
                color: '#111827', 
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '0.9rem'
              }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Danh mục */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1.25rem', 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '1rem', 
                  fontWeight: '700', 
                  color: '#111827', 
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="amenities">Tiện nghi</option>
                <option value="food">Thực phẩm</option>
                <option value="beverage">Đồ uống</option>
                <option value="cleaning">Vệ sinh</option>
                <option value="other">Khác</option>
              </select>
            </div>
            {/* Đơn vị */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Đơn vị *</label>
              <input
                required
                placeholder="Cái, Chai..."
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1.25rem', 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '1rem', 
                  fontWeight: '700', 
                  color: '#111827', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Cảnh báo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Cảnh báo hết</label>
              <input
                type="number"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1.25rem', 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '1rem', 
                  fontWeight: '700', 
                  color: '#111827', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
              />
            </div>
            {/* Giá nhập */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Giá nhập (VNĐ)</label>
              <input
                type="number"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1.25rem', 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '1rem', 
                  fontWeight: '700', 
                  color: '#111827', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* NÚT SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1.15rem', 
              backgroundColor: '#2563eb', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '1.25rem', 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '1.25rem', height: '1.25rem' }} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Lưu Thông Tin</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}