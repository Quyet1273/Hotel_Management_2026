import { useState, useEffect } from "react";
import { X, Save, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventoryservice";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
}

export function EditItemModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: EditItemModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "other",
    unit: "Cái",
    min_quantity: 10,
    price: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "other",
        unit: item.unit || "Cái",
        min_quantity: item.min_quantity || 0,
        price: item.price || 0,
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await inventoryService.updateItem(item.id, form);
    if (res.success) {
      toast.success("Cập nhật vật tư thành công!");
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1.5rem',
        maxWidth: '28rem',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e5e7eb'
      }}>
        
        {/* HEADER: Màu Cam Amber */}
        <div style={{ 
          backgroundColor: '#f59e0b', 
          padding: '1.25rem', 
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
              Chỉnh sửa vật tư
            </h3>
          </div>
          
          <button
            onClick={onClose}
            style={{ 
              padding: '0.5rem', 
              backgroundColor: 'rgba(0, 0, 0, 0.1)', 
              border: 'none', 
              borderRadius: '50%', 
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

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tên vật tư */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
              Tên vật tư
            </label>
            <input
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                backgroundColor: '#f9fafb', 
                border: '2px solid #e5e7eb', 
                borderRadius: '0.75rem', 
                fontWeight: '700', 
                color: '#111827', 
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Đơn vị */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
                Đơn vị
              </label>
              <input
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem', 
                  backgroundColor: '#f9fafb', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '0.75rem', 
                  fontWeight: '700', 
                  color: '#111827', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            {/* Giá nhập */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
                Giá nhập
              </label>
              <input
                type="number"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem', 
                  backgroundColor: '#f9fafb', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '0.75rem', 
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

          {/* Ngưỡng tối thiểu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', marginLeft: '0.25rem' }}>
              Số lượng tối thiểu (Cảnh báo)
            </label>
            <input
              type="number"
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                backgroundColor: '#f9fafb', 
                border: '2px solid #e5e7eb', 
                borderRadius: '0.75rem', 
                fontWeight: '700', 
                color: '#111827', 
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
            />
          </div>

          {/* NÚT LƯU */}
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: '#f59e0b', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '0.75rem', 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '1.25rem', height: '1.25rem' }} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save style={{ width: '1.25rem', height: '1.25rem' }} />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}