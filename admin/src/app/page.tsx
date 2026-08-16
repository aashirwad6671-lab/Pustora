'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminService, adminSupabase } from '../services/adminService';
import { Product, Order, Profile, Coupon, DeliveryPartner } from '../types';

export default function AdminControlPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [activeModule, setActiveModule] = useState<
    'dashboard' | 'orders' | 'fleet' | 'products' | 'inventory' | 'users' | 'support' | 'analytics' | 'marketing'
  >('dashboard');

  // Loading and State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Collections
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    pendingOrdersCount: 0,
    totalUsers: 0,
    lowStockCount: 0,
    hourlySales: [1200, 3400, 8900, 15400, 11200, 18900, 22400, 19500, 14200],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);

  // Orders State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedPartnerMap, setSelectedPartnerMap] = useState<Record<string, string>>({});

  // Product Form & Edit
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodCat, setProdCat] = useState('books');
  const [prodSub, setProdSub] = useState('textbooks');
  const [prodGrade, setProdGrade] = useState('Class 6');
  const [prodSubject, setProdSubject] = useState('Mathematics');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Edit Product State
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCat, setEditCat] = useState('books');
  const [editSub, setEditSub] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Fleet Add Form
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicleType, setNewRiderVehicleType] = useState('Motorcycle');
  const [newRiderVehicleNumber, setNewRiderVehicleNumber] = useState('');

  // Coupon Form
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMinCart, setCouponMinCart] = useState('');

  // Support Chat
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportFilterStatus, setSupportFilterStatus] = useState<string>('all');
  const [supportFilterPriority, setSupportFilterPriority] = useState<string>('all');
  const [supportSearchQuery, setSupportSearchQuery] = useState<string>('');
  const [activeTicketMessages, setActiveTicketMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load all Data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [metRes, prodRes, ordRes, invRes, userRes, ticketRes, couponRes, dpRes] = await Promise.all([
        AdminService.getOverviewMetrics(),
        AdminService.getProducts(),
        AdminService.getOrders(),
        AdminService.getInventoryLevels(),
        AdminService.getUsers(),
        AdminService.getSupportTickets(),
        AdminService.getCoupons(),
        AdminService.getDeliveryPartners(),
      ]);

      if (metRes.data) setMetrics(metRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (ordRes.data) setOrders(ordRes.data);
      if (invRes.data) setInventory(invRes.data);
      if (userRes.data) setUsers(userRes.data);
      if (ticketRes.data) setTickets(ticketRes.data);
      if (couponRes.data) setCoupons(couponRes.data);
      if (dpRes.data) setDeliveryPartners(dpRes.data);
    } catch (err: any) {
      setErrorMsg('Failed to sync administrative database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Support Ticket Realtime Sync
  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicketMessages([]);
      return;
    }
    let isMounted = true;
    async function fetchMessages() {
      const response = await AdminService.getTicketMessages(activeTicketId);
      if (response.data && isMounted) setActiveTicketMessages(response.data);
    }
    fetchMessages();

    const channel = adminSupabase
      .channel(`support_messages:${activeTicketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicketId}` },
        (payload: any) => {
          if (isMounted) {
            setActiveTicketMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      adminSupabase.removeChannel(channel);
    };
  }, [activeTicketId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicketMessages]);

  // Orders Realtime Sync
  useEffect(() => {
    const channel = adminSupabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
        const newOrder = payload.new;
        setOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));
        setMetrics((prev) => ({ ...prev, pendingOrdersCount: prev.pendingOrdersCount + 1 }));
        AdminService.getOrders().then((res) => {
          if (res.data) {
            const fresh = res.data.find((o: any) => o.id === newOrder.id);
            const customerName = (fresh as any)?.profiles?.full_name || 'a customer';
            setNewOrderAlert(`🔔 New incoming order from ${customerName}!`);
            setTimeout(() => setNewOrderAlert(null), 6000);
            setOrders(res.data);
          }
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        const updated = payload.new;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
        if (updated.status === 'delivered' || updated.status === 'cancelled') {
          setMetrics((prev) => ({ ...prev, pendingOrdersCount: Math.max(0, prev.pendingOrdersCount - 1) }));
        }
      })
      .subscribe();

    return () => {
      adminSupabase.removeChannel(channel);
    };
  }, []);

  // ── Action Handlers ──
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(true);
    const response = await AdminService.updateOrderStatus(orderId, newStatus);
    setActionLoading(false);
    if (response.error) alert(response.error);
    else setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setActionLoading(true);
    const response = await AdminService.cancelOrder(orderId);
    setActionLoading(false);
    if (response.error) alert(response.error);
    else setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
  };

  const handleAssignAndDispatch = async (orderId: string) => {
    const partnerId = selectedPartnerMap[orderId];
    if (!partnerId) {
      alert('Please select a delivery partner first.');
      return;
    }
    const partner = deliveryPartners.find((dp) => dp.id === partnerId);
    const partnerName = partner?.profiles?.full_name || 'the selected partner';
    if (!confirm(`Assign this order to ${partnerName} and send out for delivery?`)) return;

    setAssigningOrderId(orderId);
    const response = await AdminService.assignAndDispatch(orderId, partnerId);
    setAssigningOrderId(null);

    if (response.error) {
      alert(response.error);
    } else {
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status: 'out_for_delivery', delivery_partner_id: partnerId } : o
      ));
      setDeliveryPartners(deliveryPartners.map((dp) =>
        dp.id === partnerId ? { ...dp, status: 'busy' } : dp
      ));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      
      setUrl(data.url);
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodMrp) return;
    setActionLoading(true);
    const response = await AdminService.addProduct(
      {
        name: prodName,
        brand: prodBrand || 'Generic',
        price: parseFloat(prodPrice),
        mrp: parseFloat(prodMrp),
        category_id: prodCat,
        sub_category: prodSub,
        grade_suitability: prodGrade,
        subject_tag: prodSubject,
        image_url: prodImageUrl || (prodCat === 'books' ? '📚' : prodCat === 'toys' ? '🧸' : '✏️'),
      },
      parseInt(prodStock)
    );
    setActionLoading(false);
    if (response.error) {
      alert(`Product creation failed: ${response.error}`);
    } else if (response.data) {
      setProducts([response.data, ...products]);
      setProdName('');
      setProdBrand('');
      setProdPrice('');
      setProdMrp('');
      setProdImageUrl('');
      alert('Product registered successfully!');
      AdminService.getInventoryLevels().then(r => r.data && setInventory(r.data));
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setActionLoading(true);
    const response = await AdminService.updateProduct(
      editingProductId,
      {
        name: editName,
        brand: editBrand || 'Generic',
        description: editDescription,
        price: parseFloat(editPrice),
        mrp: parseFloat(editMrp),
        category_id: editCat,
        sub_category: editSub,
        grade_suitability: editGrade,
        subject_tag: editSubject,
        image_url: editImageUrl,
      },
      editStock ? parseInt(editStock) : undefined
    );
    setActionLoading(false);
    if (response.error) {
      alert(`Update failed: ${response.error}`);
    } else if (response.data) {
      setProducts(products.map((p) => (p.id === editingProductId ? response.data! : p)));
      setEditingProductId(null);
      alert('Product updated successfully!');
    }
  };

  const openEditPanel = (p: Product) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditBrand((p as any).brand || '');
    setEditDescription((p as any).description || '');
    setEditPrice(String(p.price));
    setEditMrp(String((p as any).mrp || p.price));
    setEditStock(String((p as any).stock_quantity || ''));
    setEditCat(p.category_id || 'books');
    setEditSub((p as any).sub_category || '');
    setEditGrade((p as any).grade_suitability || '');
    setEditSubject((p as any).subject_tag || '');
    setEditImageUrl((p as any).image_url || '');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setActionLoading(true);
    const response = await AdminService.deleteProduct(id);
    setActionLoading(false);
    if (response.error) alert(response.error);
    else setProducts(products.filter((p) => p.id !== id));
  };

  const handleRestock = async (inventoryId: string) => {
    const qty = prompt('Enter restock quantity to add:');
    if (!qty || isNaN(parseInt(qty))) return;
    setActionLoading(true);
    const response = await AdminService.restockProduct(inventoryId, parseInt(qty));
    setActionLoading(false);
    if (response.error) alert(response.error);
    else {
      setInventory(
        inventory.map((inv) =>
          inv.id === inventoryId ? { ...inv, stock_quantity: inv.stock_quantity + parseInt(qty) } : inv
        )
      );
    }
  };

  const handleRoleChange = async (userId: string, currentRole: Profile['role']) => {
    const nextRole = currentRole === 'admin' ? 'general' : 'admin';
    if (!confirm(`Toggle user role to ${nextRole}?`)) return;
    setActionLoading(true);
    const response = await AdminService.updateRole(userId, nextRole);
    setActionLoading(false);
    if (response.error) alert(response.error);
    else setUsers(users.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)));
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponDiscount || !couponMinCart) return;
    setActionLoading(true);
    const response = await AdminService.addCoupon({
      code: couponCode,
      discount_amount: parseFloat(couponDiscount),
      min_cart_value: parseFloat(couponMinCart),
    });
    setActionLoading(false);
    if (response.error) alert(response.error);
    else if (response.data) {
      setCoupons([response.data, ...coupons]);
      setCouponCode('');
      setCouponDiscount('');
      setCouponMinCart('');
      alert('Coupon created successfully!');
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !supportReply.trim()) return;
    const adminUser = users.find((u) => u.role === 'admin') || users[0];
    if (!adminUser) {
      alert('No admin user profile found to send reply.');
      return;
    }
    setActionLoading(true);
    const response = await AdminService.replyToTicket(activeTicketId, adminUser.id, supportReply.trim());
    setActionLoading(false);
    if (response.error) alert(response.error);
    else {
      setTickets(tickets.map((t) => (t.id === activeTicketId ? { ...t, status: 'active' } : t)));
      setSupportReply('');
      const messagesRes = await AdminService.getTicketMessages(activeTicketId);
      if (messagesRes.data) setActiveTicketMessages(messagesRes.data);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicketId) return;
    setActionLoading(true);
    const response = await AdminService.resolveTicket(activeTicketId);
    setActionLoading(false);
    if (response.error) alert(response.error);
    else {
      setTickets(tickets.map((t) => (t.id === activeTicketId ? { ...t, status: 'resolved' } : t)));
      alert('Ticket marked as Resolved.');
    }
  };

  // ── Authentication Barrier ──
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F051D 0%, #1A0B2E 50%, #2D1B69 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"DM Sans", sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(108, 63, 214, 0.4)',
          }}>
            ⚡
          </div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', fontFamily: 'Sora, sans-serif' }}>
            Pustora Command Panel
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 28px 0' }}>
            Enterprise Quick-Commerce Operations
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === 'admin@12345') {
              setIsAuthenticated(true);
            } else {
              alert('Incorrect administrator password.');
            }
          }}>
            <input
              type="password"
              placeholder=""
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '15px',
                marginBottom: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 6px 20px rgba(108, 63, 214, 0.3)',
              }}
            >
              Authenticate & Open Dashboard →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main Shell ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D041A', color: '#E2D9F3', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* ── MOBILE OVERLAY ── */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className={`admin-layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
            ⚡
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: 'Sora, sans-serif' }}>PUSTORA</h2>
            <p style={{ color: '#A78BFA', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '2px 0 0 0' }}>Admin Central</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard Hub', icon: '📊', badge: null },
            { id: 'orders', label: 'Orders & Dispatch', icon: '🛍️', badge: metrics.pendingOrdersCount > 0 ? metrics.pendingOrdersCount : null, badgeColor: '#EF4444' },
            { id: 'fleet', label: 'Delivery Fleet', icon: '🚴', badge: deliveryPartners.length, badgeColor: '#10B981' },
            { id: 'products', label: 'Products Catalog', icon: '📚', badge: products.length, badgeColor: '#6366F1' },
            { id: 'inventory', label: 'Inventory Stock', icon: '🏭', badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : null, badgeColor: '#F59E0B' },
            { id: 'users', label: 'User Directory', icon: '👥', badge: null },
            { id: 'support', label: 'Helpdesk Tickets', icon: '💬', badge: tickets.filter(t => t.status === 'open').length > 0 ? tickets.filter(t => t.status === 'open').length : null, badgeColor: '#EC4899' },
            { id: 'marketing', label: 'Coupons Studio', icon: '🎟️', badge: null },
            { id: 'analytics', label: 'Sales Analytics', icon: '📈', badge: null },
          ].map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: item.badgeColor || '#7C3AED',
                    color: '#fff',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Supabase Live</span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            style={{ color: '#F87171', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ── */}
      <main className="admin-layout-main">
        
        {/* Top Header */}
        <header style={{
          height: '64px',
          background: 'rgba(19, 6, 36, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 80,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
            <h1 style={{ color: '#fff', fontSize: '17px', fontWeight: 800, margin: 0, fontFamily: 'Sora, sans-serif', textTransform: 'capitalize' }}>
              {activeModule.replace('-', ' ')}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📍</span>
              <span style={{ color: '#C4B5FD', fontSize: '12px', fontWeight: 600 }}>Lucknow Central Warehouse</span>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
              AD
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ padding: '28px 32px 60px', flex: 1 }}>

          {/* New Order Alert Banner */}
          {newOrderAlert && (
            <div style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
              color: '#fff',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
            }}>
              <span>{newOrderAlert}</span>
              <button onClick={() => setNewOrderAlert(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 1: DASHBOARD HUB
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stat Widgets */}
              <div className="grid-4-to-1" style={{ gap: '16px' }}>
                {[
                  { label: "Today's Delivered Sales", val: `₹${metrics.todayRevenue}`, trend: '+18.4% vs yesterday', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
                  { label: 'Pending Dispatches', val: `${metrics.pendingOrdersCount} Orders`, trend: `${deliveryPartners.filter(d=>d.status==='active').length} Riders Active`, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                  { label: 'Registered Customers', val: `${metrics.totalUsers}`, trend: 'Synced with Supabase Auth', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
                  { label: 'Low Stock Alarms', val: `${metrics.lowStockCount} Items`, trend: 'Threshold under 15 units', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#160829', border: `1px solid ${stat.border}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    <div style={{ color: '#fff', fontSize: '26px', fontWeight: 800, margin: '8px 0 4px', fontFamily: 'Sora, sans-serif' }}>{stat.val}</div>
                    <div style={{ color: stat.color, fontSize: '11px', fontWeight: 600 }}>{stat.trend}</div>
                  </div>
                ))}
              </div>

              {/* Warehouse & Live Fleet Summary */}
              <div className="grid-2-to-1" style={{ gap: '20px' }}>
                <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                    📍 Active Lucknow Hub Coordinates
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { name: 'Hazratganj Main Hub', coords: '26.8504, 80.9419', status: 'Active Dispatching' },
                      { name: 'Gomti Nagar Express Depot', coords: '26.8624, 80.9987', status: 'Active Dispatching' },
                      { name: 'Aliganj Smart Hub', coords: '26.8929, 80.9388', status: 'Active Dispatching' },
                    ].map((hub, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{hub.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>GPS: {hub.coords}</div>
                        </div>
                        <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                          ● {hub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                    🚴 Delivery Fleet Status
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Total Fleet</span>
                      <strong style={{ color: '#fff' }}>{deliveryPartners.length} Riders</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Available for Dispatch</span>
                      <strong style={{ color: '#10B981' }}>{deliveryPartners.filter(d => d.status === 'active').length} Online</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Out on Route</span>
                      <strong style={{ color: '#F59E0B' }}>{deliveryPartners.filter(d => d.status === 'busy').length} Busy</strong>
                    </div>
                    <button
                      onClick={() => setActiveModule('fleet')}
                      style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #7C3AED', background: 'rgba(124,58,237,0.2)', color: '#C4B5FD', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Manage Fleet →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 2: ORDERS & DISPATCH HUB
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'orders' && (() => {
            const filteredOrders = orders.filter((o) => {
              const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
              const customerName = ((o as any).profiles?.full_name || '').toLowerCase();
              const orderId = o.id.toLowerCase();
              const matchSearch = orderSearch.trim() === ''
                ? true
                : customerName.includes(orderSearch.toLowerCase()) || orderId.includes(orderSearch.toLowerCase());
              return matchStatus && matchSearch;
            });

            const STATUS_STEPS = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
            const STATUS_LABELS: Record<string, string> = {
              placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed',
              out_for_delivery: 'Dispatched', delivered: 'Delivered',
            };
            const STATUS_ICONS: Record<string, string> = {
              placed: '🛒', confirmed: '✅', packed: '📦', out_for_delivery: '🚴', delivered: '🎉',
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Search & Filter Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search orders by customer name (e.g. Aman Pandey, Arpita) or Order ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{
                      padding: '11px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: '#160829',
                      color: '#fff',
                      fontSize: '13px',
                      minWidth: '320px',
                      flex: 1,
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(['all', 'placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setOrderStatusFilter(s)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: orderStatusFilter === s ? '#7C3AED' : 'rgba(255,255,255,0.12)',
                          background: orderStatusFilter === s ? '#7C3AED' : '#160829',
                          color: orderStatusFilter === s ? '#fff' : 'rgba(255,255,255,0.6)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '42px', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>No orders found matching the filter criteria.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredOrders.map((o) => {
                      const customer = (o as any).profiles;
                      const items = (o as any).order_items || [];
                      const isCancelled = o.status === 'cancelled';
                      const isDelivered = o.status === 'delivered';
                      const currentStepIdx = STATUS_STEPS.indexOf(o.status);
                      const assignedPartner = deliveryPartners.find(dp => dp.id === (o as any).delivery_partner_id);
                      const isNewOrder = o.status === 'placed';
                      const orderTime = new Date((o as any).created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
                      const statusLabel: Record<string, string> = { placed: '🛒 New Order', confirmed: '✅ Confirmed', packed: '📦 Packed', out_for_delivery: '🚴 Out for Delivery', delivered: '✅ Delivered', cancelled: '❌ Cancelled' };
                      const statusBg: Record<string, string> = { placed: 'rgba(124,58,237,0.3)', confirmed: 'rgba(59,130,246,0.2)', packed: 'rgba(245,158,11,0.2)', out_for_delivery: 'rgba(16,185,129,0.2)', delivered: 'rgba(16,185,129,0.15)', cancelled: 'rgba(239,68,68,0.15)' };
                      const statusColor: Record<string, string> = { placed: '#C4B5FD', confirmed: '#93C5FD', packed: '#FCD34D', out_for_delivery: '#6EE7B7', delivered: '#34D399', cancelled: '#FCA5A5' };

                      return (
                        <div key={o.id} style={{
                          background: '#160829',
                          border: isNewOrder ? '2px solid rgba(124,58,237,0.65)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          opacity: isCancelled ? 0.6 : 1,
                          boxShadow: isNewOrder ? '0 0 24px rgba(124,58,237,0.3)' : 'none',
                        }}>
                          {/* Order Header */}
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(88,28,190,0.5) 0%, rgba(124,58,237,0.3) 100%)',
                            padding: '14px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>
                                {(customer?.full_name || 'G').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'Sora, sans-serif' }}>
                                  {customer?.full_name || 'Guest Customer'}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <span>📞 {customer?.phone_number || '—'}</span>
                                  <span>· #{o.id.substring(0, 8).toUpperCase()}</span>
                                  <span>· 🕐 {orderTime}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: statusBg[o.status] || statusBg.placed, color: statusColor[o.status] || statusColor.placed }}>
                                {statusLabel[o.status] || o.status}
                              </span>
                              <span style={{
                                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                background: o.payment_method === 'COD' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                                color: o.payment_method === 'COD' ? '#FCD34D' : '#6EE7B7',
                                border: `1px solid ${o.payment_method === 'COD' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                              }}>
                                {o.payment_method === 'COD' ? '💵 Cash on Delivery' : `✅ Paid Online`}
                              </span>
                              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900, fontFamily: 'Sora, sans-serif' }}>₹{o.grand_total}</span>
                            </div>
                          </div>

                          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Pipeline Bar */}
                            {!isCancelled && (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {STATUS_STEPS.map((step, idx) => {
                                  const isDone = currentStepIdx >= idx;
                                  const isCurrent = currentStepIdx === idx;
                                  return (
                                    <React.Fragment key={step}>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <div style={{
                                          width: '28px', height: '28px', borderRadius: '50%',
                                          background: isDone ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                                          border: `2px solid ${isDone ? '#9333EA' : 'rgba(255,255,255,0.15)'}`,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '12px',
                                          boxShadow: isCurrent ? '0 0 0 3px rgba(124,58,237,0.4)' : 'none',
                                        }}>
                                          {STATUS_ICONS[step]}
                                        </div>
                                        <span style={{ fontSize: '10px', color: isDone ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: isDone ? 700 : 400 }}>
                                          {STATUS_LABELS[step]}
                                        </span>
                                      </div>
                                      {idx < STATUS_STEPS.length - 1 && (
                                        <div style={{ height: '2px', flex: 1, background: currentStepIdx > idx ? '#7C3AED' : 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            )}

                            {/* Address */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>📍 Delivery Address</div>
                              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>{o.delivery_address || 'Address not registered'}</div>
                            </div>

                            {/* Itemized Products */}
                            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>📦 Items Ordered ({items.length})</span>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Qty × Price</span>
                              </div>
                              {items.length === 0 ? (
                                <div style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No items found</div>
                              ) : (
                                items.map((item: any, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ color: '#E2D9F3', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.products?.name || 'Item'}</div>
                                      {item.products?.brand && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{item.products.brand}</div>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '10px' }}>
                                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '6px' }}>×{item.quantity}</span>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#C4B5FD', fontSize: '13px', fontWeight: 700 }}>₹{item.price_at_purchase * item.quantity}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>₹{item.price_at_purchase} each</div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(124,58,237,0.08)' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>ORDER TOTAL</span>
                                <span style={{ fontSize: '15px', color: '#fff', fontWeight: 900, fontFamily: 'Sora, sans-serif' }}>₹{o.grand_total}</span>
                              </div>
                            </div>

                            {/* Assigned Partner info */}
                            {assignedPartner && (
                              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '18px' }}>🚴</span>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#6EE7B7' }}>{assignedPartner.profiles?.full_name || 'Rider'}</div>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{assignedPartner.vehicle_type} ({assignedPartner.vehicle_number || 'No Plate'}) · {assignedPartner.profiles?.phone_number}</div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {!isCancelled && !isDelivered && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {o.status === 'placed' && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(o.id, 'confirmed')}
                                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      ✅ Confirm Order
                                    </button>
                                    <button
                                      onClick={() => handleCancelOrder(o.id)}
                                      style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {o.status === 'confirmed' && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(o.id, 'packed')}
                                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      📦 Mark as Packed
                                    </button>
                                    <button
                                      onClick={() => handleCancelOrder(o.id)}
                                      style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {o.status === 'packed' && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                      value={selectedPartnerMap[o.id] || ''}
                                      onChange={(e) => setSelectedPartnerMap(prev => ({ ...prev, [o.id]: e.target.value }))}
                                      style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: '#240C3E',
                                        color: '#fff',
                                        fontSize: '13px',
                                      }}
                                    >
                                      <option value="">-- Choose Delivery Rider --</option>
                                      {deliveryPartners.map((dp) => (
                                        <option key={dp.id} value={dp.id}>
                                          {dp.profiles?.full_name || 'Rider'} ({dp.vehicle_type}{dp.vehicle_number ? ` - ${dp.vehicle_number}` : ''}) {dp.status === 'busy' ? '[Busy]' : '✓ Ready'}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleAssignAndDispatch(o.id)}
                                      disabled={!selectedPartnerMap[o.id] || assigningOrderId === o.id}
                                      style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      {assigningOrderId === o.id ? '⏳...' : '🚴 Dispatch →'}
                                    </button>
                                  </div>
                                )}

                                {o.status === 'out_for_delivery' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                                    style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✅ Force Mark Delivered
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════
              MODULE 3: DELIVERY FLEET MANAGER (NEW DEDICATED)
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'fleet' && (
            <div className="grid-fleet-split" style={{ gap: '24px', alignItems: 'start' }}>
              {/* Riders Grid */}
              <div>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                  Registered Delivery Riders ({deliveryPartners.length})
                </h3>
                <div className="form-row-2" style={{ gap: '14px' }}>
                  {deliveryPartners.map((dp) => (
                    <div key={dp.id} style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            🚴
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{dp.profiles?.full_name || 'Delivery Partner'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{dp.profiles?.phone_number}</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: dp.status === 'active' ? 'rgba(16,185,129,0.15)' : dp.status === 'busy' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.1)',
                          color: dp.status === 'active' ? '#10B981' : dp.status === 'busy' ? '#F59E0B' : '#9CA3AF',
                        }}>
                          {dp.status === 'active' ? '🟢 Active' : dp.status === 'busy' ? '🟡 On Delivery' : '⚫ Offline'}
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Vehicle:</span>
                        <strong style={{ color: '#C4B5FD' }}>{dp.vehicle_type} ({dp.vehicle_number || 'No Plate'})</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Partner Card */}
              <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                  + Onboard Delivery Partner
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newRiderName || !newRiderPhone || !newRiderVehicleNumber) return;
                  setActionLoading(true);
                  const res = await AdminService.getDeliveryPartners();
                  // Trigger reload
                  loadAllData();
                  setActionLoading(false);
                  alert('Rider can also self-register at /delivery using password admin@12345');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Rider Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={newRiderName}
                      onChange={(e) => setNewRiderName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={newRiderPhone}
                      onChange={(e) => setNewRiderPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Vehicle Plate Number</label>
                    <input
                      type="text"
                      placeholder="UP32 AB 1234"
                      value={newRiderVehicleNumber}
                      onChange={(e) => setNewRiderVehicleNumber(e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#A78BFA', margin: 0 }}>
                    💡 Tip: Riders can also open <strong>/delivery</strong> on mobile, click <em>"+ Create Account"</em>, enter vehicle details and join instantly.
                  </p>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 4: PRODUCT CATALOG
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="grid-products-split" style={{ gap: '24px', alignItems: 'start' }}>

                {/* ── Product Table ── */}
                <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: 'Sora, sans-serif' }}>
                      Catalog Inventory ({products.length})
                    </h3>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Image</th>
                          <th style={{ padding: '10px' }}>Product</th>
                          <th style={{ padding: '10px' }}>Category</th>
                          <th style={{ padding: '10px' }}>Price</th>
                          <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: editingProductId === p.id ? 'rgba(124,58,237,0.1)' : 'transparent' }}>
                            <td style={{ padding: '10px' }}>
                              {(p as any).image_url && (p as any).image_url.startsWith('http') ? (
                                <img
                                  src={(p as any).image_url}
                                  alt={p.name}
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                  {(p as any).image_url || (p.category_id === 'books' ? '📚' : p.category_id === 'toys' ? '🧸' : '✏️')}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 10px', color: '#fff', fontWeight: 600 }}>
                              <div>{p.name}</div>
                              {(p as any).brand && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{(p as any).brand}</div>}
                            </td>
                            <td style={{ padding: '10px', color: '#C4B5FD' }}>{p.category_id}</td>
                            <td style={{ padding: '10px', color: '#10B981', fontWeight: 700 }}>₹{p.price}</td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => openEditPanel(p)}
                                  style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: editingProductId === p.id ? '#7C3AED' : 'rgba(124,58,237,0.2)', color: editingProductId === p.id ? '#fff' : '#C4B5FD', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  {editingProductId === p.id ? '✎ Editing' : '✎ Edit'}
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  style={{ padding: '5px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Right Panel: Add or Edit Product ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Edit Product Panel */}
                  {editingProductId && (() => {
                    const editingProduct = products.find(p => p.id === editingProductId);
                    return (
                      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.1) 100%)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: 'Sora, sans-serif' }}>
                            ✎ Edit Product
                          </h3>
                          <button
                            onClick={() => setEditingProductId(null)}
                            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            ✕ Cancel
                          </button>
                        </div>

                        {/* Image Preview */}
                        {editImageUrl && editImageUrl.startsWith('http') && (
                          <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                            <img
                              src={editImageUrl}
                              alt="Preview"
                              style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '4px' }}>Image Preview</div>
                          </div>
                        )}

                        <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Product Name *</label>
                            <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Brand</label>
                            <input type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} placeholder="e.g. Navneet, Camlin" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🖼️ Image URL</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="url"
                                value={editImageUrl}
                                onChange={e => setEditImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                              />
                              <label style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.4)', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                                📷 Upload
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditImageUrl)} style={{ display: 'none' }} />
                              </label>
                            </div>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0 0' }}>Paste a link or upload from your device/camera.</p>
                          </div>
                          <div className="form-row-2" style={{ gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Price (₹) *</label>
                              <input type="number" required value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>MRP (₹) *</label>
                              <input type="number" required value={editMrp} onChange={e => setEditMrp(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                          </div>
                          <div className="form-row-2" style={{ gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Category</label>
                              <select value={editCat} onChange={e => setEditCat(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#240C3E', color: '#fff', boxSizing: 'border-box' }}>
                                <option value="books">📚 Books</option>
                                <option value="stationery">✏️ Stationery</option>
                                <option value="toys">🧸 Toys</option>
                                <option value="games">🎲 Games</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Stock Qty</label>
                              <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} placeholder="Leave blank to keep" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Description</label>
                            <textarea rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Short product description..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                          </div>
                          <button type="submit" disabled={actionLoading} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                            {actionLoading ? '⏳ Saving...' : '💾 Save Changes'}
                          </button>
                        </form>
                      </div>
                    );
                  })()}

                  {/* Add Product Form */}
                  <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                      + Add New Product
                    </h3>
                    <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Product Name *</label>
                        <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. NCERT Maths Class 8" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Brand</label>
                        <input type="text" value={prodBrand} onChange={e => setProdBrand(e.target.value)} placeholder="e.g. Navneet, Camlin, Generic" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🖼️ Image</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="url"
                            value={prodImageUrl}
                            onChange={e => setProdImageUrl(e.target.value)}
                            placeholder="https://example.com/product-image.jpg"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                          />
                          <label style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.4)', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                            📷 Upload
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProdImageUrl)} style={{ display: 'none' }} />
                          </label>
                        </div>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0 0' }}>Paste a link or upload from your device/camera.</p>
                        {prodImageUrl && prodImageUrl.startsWith('http') && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={prodImageUrl}
                              alt="Preview"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Image preview</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Price (₹) *</label>
                          <input type="number" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>MRP (₹) *</label>
                          <input type="number" required value={prodMrp} onChange={e => setProdMrp(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Category</label>
                          <select value={prodCat} onChange={e => setProdCat(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#240C3E', color: '#fff', boxSizing: 'border-box' }}>
                            <option value="books">📚 Books</option>
                            <option value="stationery">✏️ Stationery</option>
                            <option value="toys">🧸 Toys</option>
                            <option value="games">🎲 Games</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Initial Stock</label>
                          <input type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                      </div>
                      <button type="submit" disabled={actionLoading} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}>
                        {actionLoading ? '⏳ Publishing...' : '🚀 Publish to Catalog'}
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 5: INVENTORY & STOCK ALARMS
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'inventory' && (
            <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                Stock Replenishment Monitor
              </h3>
              <div className="table-responsive-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px' }}>Current Units</th>
                    <th style={{ padding: '12px' }}>Low Stock Alert Threshold</th>
                    <th style={{ padding: '12px' }}>Health Status</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{inv.products?.name || 'Item'}</td>
                      <td style={{ padding: '12px', color: '#C4B5FD', fontWeight: 700 }}>{inv.stock_quantity} units</td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>{inv.low_stock_threshold} units</td>
                      <td style={{ padding: '12px' }}>
                        {inv.stock_quantity < inv.low_stock_threshold ? (
                          <span style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>⚠️ LOW STOCK</span>
                        ) : (
                          <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>✅ HEALTHY</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleRestock(inv.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          + Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 6: USERS DIRECTORY
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'users' && (
            <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                Customer & Staff Directory ({users.length})
              </h3>
              <div className="table-responsive-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Customer Name</th>
                    <th style={{ padding: '12px' }}>Phone</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Joined Date</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{u.full_name || 'Guest User'}</td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>{u.phone_number}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: u.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)', color: u.role === 'admin' ? '#FCA5A5' : '#C4B5FD' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.4)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleRoleChange(u.id, u.role)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
                          Toggle Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 7: HELPDESK & SUPPORT
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'support' && (
            <div className="grid-fleet-split" style={{ gap: '20px', height: 'calc(100vh - 160px)' }}>
              <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', overflowY: 'auto' }}>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>Tickets ({tickets.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tickets.map(t => (
                    <div key={t.id} onClick={() => setActiveTicketId(t.id)} style={{ padding: '12px', borderRadius: '10px', background: activeTicketId === t.id ? '#7C3AED' : 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{t.subject}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '2px' }}>{t.profiles?.full_name || 'Customer'} · {t.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {activeTicketId ? (
                  <>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{tickets.find(t => t.id === activeTicketId)?.subject}</strong>
                      </div>
                      <button onClick={handleResolveTicket} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10B981', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        Mark Resolved
                      </button>
                    </div>
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeTicketMessages.map(m => (
                        <div key={m.id} style={{ background: 'rgba(124,58,237,0.2)', padding: '10px 14px', borderRadius: '10px', maxWidth: '75%', color: '#fff', fontSize: '13px' }}>
                          {m.message}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleReplyTicket} style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
                      <input type="text" placeholder="Type reply message..." value={supportReply} onChange={e => setSupportReply(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                      <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Send</button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                    Select a ticket to open conversation
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 8: MARKETING COUPONS
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'marketing' && (
            <div className="grid-fleet-split" style={{ gap: '24px' }}>
              <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                  Active Promotional Coupons ({coupons.length})
                </h3>
                <div className="form-row-2" style={{ gap: '12px' }}>
                  {coupons.map(c => (
                    <div key={c.id} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#C4B5FD', letterSpacing: '1px' }}>{c.code}</div>
                      <div style={{ color: '#fff', fontSize: '13px', marginTop: '6px' }}>Discount: <strong>₹{c.discount_amount} OFF</strong></div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Min Order: ₹{c.min_cart_value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: 'Sora, sans-serif' }}>
                  + Create New Coupon
                </h3>
                <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Coupon Code</label>
                    <input type="text" required placeholder="e.g. MONSOON25" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Discount (₹)</label>
                    <input type="number" required placeholder="50" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Minimum Cart Value (₹)</label>
                    <input type="number" required placeholder="300" value={couponMinCart} onChange={e => setCouponMinCart(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" disabled={actionLoading} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}>
                    Generate Coupon Code
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODULE 9: SALES ANALYTICS
             ══════════════════════════════════════════════════════════ */}
          {activeModule === 'analytics' && (
            <div style={{ background: '#160829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', fontFamily: 'Sora, sans-serif' }}>
                Hourly Delivery Volume Density (Lucknow Hub)
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                {metrics.hourlySales.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg, #7C3AED 0%, #A855F7 100%)', borderRadius: '6px 6px 0 0', height: `${Math.max(15, (h / 25000) * 100)}%` }} />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{i * 2 + 8}:00</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
