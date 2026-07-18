'use client';

import React, { useState, useEffect } from 'react';
import { AdminService, adminSupabase } from '../services/adminService';
import { Product, Order, Profile, Coupon } from '../../../mobile/src/types';

export default function AdminControlPanel() {
  const [activeModule, setActiveModule] = useState<
    'dashboard' | 'products' | 'orders' | 'inventory' | 'users' | 'support' | 'analytics' | 'marketing'
  >('dashboard');

  // Unified Loading and Errors
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  // --- Module Data Collections ---
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

  // --- Form States ---
  // Product CRUD
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodCat, setProdCat] = useState('books');
  const [prodSub, setProdSub] = useState('textbooks');
  const [prodGrade, setProdGrade] = useState('Class 6');
  const [prodSubject, setProdSubject] = useState('Mathematics');

  // Coupon Creation
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
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Dynamic initialization load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const [accessRes, metRes, prodRes, ordRes, invRes, userRes, ticketRes, couponRes] = await Promise.all([
          AdminService.checkAccessStatus(),
          AdminService.getOverviewMetrics(),
          AdminService.getProducts(),
          AdminService.getOrders(),
          AdminService.getInventoryLevels(),
          AdminService.getUsers(),
          AdminService.getSupportTickets(),
          AdminService.getCoupons(),
        ]);

        if (accessRes.data) setHasFullAccess(accessRes.data);
        if (metRes.data) setMetrics(metRes.data);
        if (prodRes.data) setProducts(prodRes.data);
        if (ordRes.data) setOrders(ordRes.data);
        if (invRes.data) setInventory(invRes.data);
        if (userRes.data) setUsers(userRes.data);
        if (ticketRes.data) setTickets(ticketRes.data);
        if (couponRes.data) setCoupons(couponRes.data);
      } catch (err: any) {
        setErrorMsg('Failed to sync administrative schemas.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch messages and subscribe to active ticket's chat timeline
  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicketMessages([]);
      return;
    }

    let isMounted = true;
    async function fetchMessages() {
      const response = await AdminService.getTicketMessages(activeTicketId);
      if (response.error) {
        console.error('Error fetching support messages:', response.error);
      } else if (response.data && isMounted) {
        setActiveTicketMessages(response.data);
      }
    }

    fetchMessages();

    const channel = adminSupabase
      .channel(`support_messages:${activeTicketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${activeTicketId}`,
        },
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

  // Smooth scroll to chat end on updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicketMessages]);

  const handleResolveTicket = async () => {
    if (!activeTicketId) return;
    setActionLoading(true);
    const response = await AdminService.resolveTicket(activeTicketId);
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setTickets(
        tickets.map((t) => (t.id === activeTicketId ? { ...t, status: 'resolved' } : t))
      );
      alert('Ticket marked as Resolved.');
    }
  };

  const handleAssignTicket = async (adminId: string) => {
    if (!activeTicketId) return;
    setActionLoading(true);
    
    const dbValue = adminId === '' ? null : adminId;
    const response = await AdminService.assignTicket(activeTicketId, dbValue);
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setTickets(
        tickets.map((t) => (t.id === activeTicketId ? { ...t, assigned_to: dbValue } : t))
      );
      alert('Ticket assignment updated.');
    }
  };

  // --- Action Handlers ---
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
        image_url: prodCat === 'books' ? '📚' : prodCat === 'toys' ? '🧸' : '✏️',
      },
      parseInt(prodStock)
    );
    setActionLoading(false);

    if (response.error) {
      alert(`CRUD failed: ${response.error}`);
    } else if (response.data) {
      setProducts([response.data, ...products]);
      setProdName('');
      setProdBrand('');
      setProdPrice('');
      setProdMrp('');
      alert('Product registered successfully!');
      
      // Refresh inventory levels in parallel
      const invRes = await AdminService.getInventoryLevels();
      if (invRes.data) setInventory(invRes.data);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setActionLoading(true);
    const response = await AdminService.deleteProduct(id);
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(true);
    const response = await AdminService.updateOrderStatus(orderId, newStatus);
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  const handleRestock = async (inventoryId: string) => {
    const qty = prompt('Enter restock quantity:');
    if (!qty || isNaN(parseInt(qty))) return;

    setActionLoading(true);
    const response = await AdminService.restockProduct(inventoryId, parseInt(qty));
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
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

    if (response.error) {
      alert(response.error);
    } else {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)));
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !supportReply.trim()) return;

    // Resolve active admin user profile from the synced list
    const adminUser = users.find((u) => u.role === 'admin') || users[0];
    if (!adminUser) {
      alert('Error: No profile found in database to send reply as. Please register a profile on the mobile app first.');
      return;
    }

    setActionLoading(true);
    const response = await AdminService.replyToTicket(activeTicketId, adminUser.id, supportReply.trim());
    setActionLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setTickets(
        tickets.map((t) => (t.id === activeTicketId ? { ...t, status: 'active' } : t))
      );
      setSupportReply('');
      
      // Instantly refresh message timeline
      const messagesRes = await AdminService.getTicketMessages(activeTicketId);
      if (messagesRes.data) {
        setActiveTicketMessages(messagesRes.data);
      }
    }
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

    if (response.error) {
      alert(response.error);
    } else if (response.data) {
      setCoupons([response.data, ...coupons]);
      setCouponCode('');
      setCouponDiscount('');
      setCouponMinCart('');
      alert('Coupon created successfully!');
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderBox}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px' }}>Synchronizing Pustora Database...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* RLS WARNING BANNER — shown when service role key is missing */}
      {!hasFullAccess && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'linear-gradient(90deg, #7C3AED, #B45309)',
          color: '#fff',
          padding: '10px 20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <span>
            ⚠️ <strong>Limited Mode:</strong> Running with anon key — writes (Add Product, Delete, etc.) will fail if Supabase RLS is ON.
          </span>
          <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>
            Fix: Add your <code style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '4px' }}>SUPABASE_SERVICE_ROLE_KEY</code> to <code style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '4px' }}>admin/.env.local</code>, then restart the server.
          </span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={styles.brandLogo}>⚡</div>
          <div style={styles.brandInfo}>
            <h2 style={styles.brandName}>Pustora Panel</h2>
            <p style={styles.brandSub}>Har Zaroorat, Ek App</p>
          </div>
        </div>
        <nav style={styles.sidebarNav}>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'dashboard' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('dashboard')}
          >
            📊 Dashboard Hub
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'products' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('products')}
          >
            📚 Products Catalog
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'orders' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('orders')}
          >
            🛍️ Orders Dispatcher
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'inventory' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('inventory')}
          >
            🏭 Inventory Alerts
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'users' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('users')}
          >
            👥 User Management
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'support' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('support')}
          >
            💬 Support Tickets
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'analytics' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('analytics')}
          >
            📈 Sales Analytics
          </button>
          <button
            style={{ ...styles.navBtn, ...(activeModule === 'marketing' ? styles.navBtnActive : {}) }}
            onClick={() => setActiveModule('marketing')}
          >
            🎟️ Marketing Coupons
          </button>
        </nav>
      </aside>

      {/* CORE WORKSPACE */}
      <main style={styles.mainContent}>
        <header style={styles.contentHeader}>
          <h1 style={styles.headerTitle}>
            {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} Control
          </h1>
          <div style={styles.headerControls}>
            <span style={styles.adminBadge}>Admin Node</span>
          </div>
        </header>

        {errorMsg && <div style={styles.alertBox}>{errorMsg}</div>}

        {/* -------------------- 1. DASHBOARD HUB -------------------- */}
        {activeModule === 'dashboard' && (
          <div style={styles.tabContent}>
            {/* Quick Metrics */}
            <div style={styles.widgetsGrid}>
              <div style={styles.widget}>
                <div style={styles.widgetTitle}>Delivered Sales</div>
                <div style={styles.widgetVal}>₹{metrics.todayRevenue}</div>
                <div style={styles.widgetTrend}>+18.2% vs yesterday</div>
              </div>
              <div style={styles.widget}>
                <div style={styles.widgetTitle}>Pending Dispatch</div>
                <div style={styles.widgetVal}>{metrics.pendingOrdersCount} orders</div>
                <div style={styles.widgetTrendDown}>Riders active in Lucknow</div>
              </div>
              <div style={styles.widget}>
                <div style={styles.widgetTitle}>Registered Users</div>
                <div style={styles.widgetVal}>{metrics.totalUsers} profiles</div>
                <div style={styles.widgetTrend}>Synced live with Auth</div>
              </div>
              <div style={styles.widget}>
                <div style={styles.widgetTitle}>Low Stock Alarms</div>
                <div style={styles.widgetVal}>{metrics.lowStockCount} items</div>
                <div style={styles.widgetTrendDown}>Threshold under 15</div>
              </div>
            </div>

            {/* Simulated Live Lucknow Delivery coordinates map preview */}
            <div style={styles.chartCard}>
              <h3>Lucknow Delivery Store Branches (Active GPS Nodes)</h3>
              <div style={styles.alertBox}>
                <p>📍 Store 1: Hazratganj Hub (26.8504, 80.9419) — <strong>Active</strong></p>
                <p>📍 Store 2: Gomti Nagar Hub (26.8624, 80.9987) — <strong>Active</strong></p>
                <p>📍 Store 3: Aliganj Hub (26.8929, 80.9388) — <strong>Active</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 2. PRODUCTS CATALOG CRUD -------------------- */}
        {activeModule === 'products' && (
          <div style={styles.tabContentSplit}>
            <div style={styles.tableCard}>
              <h3>Active Products catalog ({products.length})</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Brand</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td style={styles.td}>{p.id.substring(0, 8)}...</td>
                        <td style={styles.td}>{p.name}</td>
                        <td style={styles.td}>{p.category_id}</td>
                        <td style={styles.td}>{p.brand}</td>
                        <td style={styles.td}>₹{p.price}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.actionBtnDanger}
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={actionLoading}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.formCard}>
              <h3>Add Product</h3>
              <form onSubmit={handleAddProduct} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Product Name</label>
                  <input
                    type="text"
                    required
                    style={styles.input}
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Brand</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Price (₹)</label>
                    <input
                      type="number"
                      required
                      style={styles.input}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>MRP (₹)</label>
                    <input
                      type="number"
                      required
                      style={styles.input}
                      value={prodMrp}
                      onChange={(e) => setProdMrp(e.target.value)}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Initial Stock</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Category</label>
                    <select
                      style={styles.select}
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                    >
                      <option value="books">📚 Books</option>
                      <option value="stationery">✏️ Stationery</option>
                      <option value="toys">🧸 Toys</option>
                      <option value="games">🎲 Games</option>
                    </select>
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn} disabled={actionLoading}>
                  Add to Supabase Database
                </button>
              </form>
            </div>
          </div>
        )}

        {/* -------------------- 3. ORDERS DISPATCHER -------------------- */}
        {activeModule === 'orders' && (
          <div style={styles.tabContent}>
            <div style={styles.tableCard}>
              <h3>Pending Quick-Commerce Dispatches</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Destination</th>
                    <th style={styles.th}>Bill Total</th>
                    <th style={styles.th}>Payment Method</th>
                    <th style={styles.th}>Order Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={styles.td}>{o.id.substring(0, 8)}...</td>
                      <td style={styles.td}>{o.delivery_address}</td>
                      <td style={styles.td}>₹{o.grand_total}</td>
                      <td style={styles.td}>{o.payment_method}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(o.status === 'placed' ? styles.badgePlaced : {}),
                            ...(o.status === 'confirmed' ? styles.badgeConfirmed : {}),
                            ...(o.status === 'packed' ? styles.badgePacked : {}),
                            ...(o.status === 'out_for_delivery' ? styles.badgeOut : {}),
                            ...(o.status === 'delivered' ? styles.badgeDelivered : {}),
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button
                            style={styles.actionBtn}
                            onClick={() => handleUpdateOrderStatus(o.id, 'packed')}
                            disabled={actionLoading}
                          >
                            📦 Pack
                          </button>
                          <button
                            style={styles.actionBtn}
                            onClick={() => handleUpdateOrderStatus(o.id, 'out_for_delivery')}
                            disabled={actionLoading}
                          >
                            🚴 Out for Delivery
                          </button>
                          <button
                            style={styles.actionBtnSuccess}
                            onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                            disabled={actionLoading}
                          >
                            ✅ Deliver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- 4. INVENTORY ALERTS -------------------- */}
        {activeModule === 'inventory' && (
          <div style={styles.tabContent}>
            <div style={styles.tableCard}>
              <h3>Stock Replenishment Monitor</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product Title</th>
                    <th style={styles.th}>Brand</th>
                    <th style={styles.th}>Current Stock</th>
                    <th style={styles.th}>Low Limit Alert</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => (
                    <tr key={inv.id}>
                      <td style={styles.td}>{inv.products?.name || 'Loading Name...'}</td>
                      <td style={styles.td}>{inv.products?.brand || 'Loading Brand...'}</td>
                      <td style={styles.td}>{inv.stock_quantity} pcs</td>
                      <td style={styles.td}>{inv.low_stock_threshold} pcs</td>
                      <td style={styles.td}>
                        {inv.stock_quantity < inv.low_stock_threshold ? (
                          <span style={styles.statusDanger}>⚠️ LOW STOCK</span>
                        ) : (
                          <span style={styles.statusSuccess}>✅ STABLE</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionBtnSuccess}
                          onClick={() => handleRestock(inv.id)}
                          disabled={actionLoading}
                        >
                          ➕ Restock Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- 5. USER ROLE MANAGEMENT -------------------- */}
        {activeModule === 'users' && (
          <div style={styles.tabContent}>
            <div style={styles.tableCard}>
              <h3>Registered Customer Accounts</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>UUID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Mobile Number</th>
                    <th style={styles.th}>Permission Role</th>
                    <th style={styles.th}>Created Timestamp</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.id.substring(0, 8)}...</td>
                      <td style={styles.td}>{u.full_name || 'Name not configured'}</td>
                      <td style={styles.td}>{u.phone_number}</td>
                      <td style={styles.td}>
                        <span style={u.role === 'admin' ? styles.statusDanger : styles.statusInfo}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleRoleChange(u.id, u.role)}
                          disabled={actionLoading}
                        >
                          Toggle Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- 6. CUSTOMER SUPPORT TICKETS -------------------- */}
        {activeModule === 'support' && (() => {
          // Calculate reactive, live aggregates from State
          const totalCount = tickets.length;
          const openCount = tickets.filter(t => t.status === 'open').length;
          const activeCount = tickets.filter(t => t.status === 'active').length;
          const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
          const unassignedCount = tickets.filter(t => !t.assigned_to).length;

          // Resolve active admins from the user database
          const adminUsers = users.filter(u => u.role === 'admin');

          // Filter tickets according to search queries and status/priority parameters
          const filteredTickets = tickets.filter((t) => {
            const matchesStatus = supportFilterStatus === 'all' ? true : t.status === supportFilterStatus;
            const matchesPriority = supportFilterPriority === 'all' ? true : t.priority === supportFilterPriority;
            
            const buyerName = t.profiles?.full_name || '';
            const subjectText = t.subject || '';
            const matchesSearch = supportSearchQuery.trim() === '' ? true :
              buyerName.toLowerCase().includes(supportSearchQuery.toLowerCase()) ||
              subjectText.toLowerCase().includes(supportSearchQuery.toLowerCase());

            return matchesStatus && matchesPriority && matchesSearch;
          });

          // Resolve selected ticket object
          const activeTicket = tickets.find((t) => t.id === activeTicketId);

          return (
            <div style={styles.tabContent}>
              {/* SUPPORT ANALYTICS METRICS */}
              <div style={styles.supportAnalyticsGrid}>
                <div style={styles.supportWidget}>
                  <span style={styles.supportWidgetTitle}>Total Queries</span>
                  <span style={styles.supportWidgetVal}>{totalCount}</span>
                </div>
                <div style={styles.supportWidget}>
                  <span style={styles.supportWidgetTitle}>Open (Waiting)</span>
                  <span style={{ ...styles.supportWidgetVal, color: '#EF4444' }}>{openCount}</span>
                </div>
                <div style={styles.supportWidget}>
                  <span style={styles.supportWidgetTitle}>Active (replied)</span>
                  <span style={{ ...styles.supportWidgetVal, color: '#F59E0B' }}>{activeCount}</span>
                </div>
                <div style={styles.supportWidget}>
                  <span style={styles.supportWidgetTitle}>Resolved (closed)</span>
                  <span style={{ ...styles.supportWidgetVal, color: '#10B981' }}>{resolvedCount}</span>
                </div>
                <div style={styles.supportWidget}>
                  <span style={styles.supportWidgetTitle}>Unassigned</span>
                  <span style={{ ...styles.supportWidgetVal, color: '#60A5FA' }}>{unassignedCount}</span>
                </div>
              </div>

              {/* ADVANCED FILTER HANGER */}
              <div style={styles.supportFilterBar}>
                <input
                  type="text"
                  placeholder="🔍 Search queries by subject or customer name..."
                  style={styles.supportSearchInput}
                  value={supportSearchQuery}
                  onChange={(e) => setSupportSearchQuery(e.target.value)}
                />
                
                <select
                  style={styles.supportFilterSelect}
                  value={supportFilterStatus}
                  onChange={(e) => setSupportFilterStatus(e.target.value)}
                >
                  <option value="all">📁 All Statuses</option>
                  <option value="open">🔴 Open</option>
                  <option value="active">🟡 Active</option>
                  <option value="resolved">🟢 Resolved</option>
                </select>

                <select
                  style={styles.supportFilterSelect}
                  value={supportFilterPriority}
                  onChange={(e) => setSupportFilterPriority(e.target.value)}
                >
                  <option value="all">⚠️ All Priorities</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🔵 Low</option>
                </select>
              </div>

              {/* PRIMARY WORKSPACE */}
              <div style={styles.tabContentSplit}>
                {/* LEFT TICKET LIST */}
                <div style={styles.tableCard}>
                  <h3 style={{ marginBottom: '16px' }}>Help tickets ({filteredTickets.length})</h3>
                  <div style={styles.ticketCardList}>
                    {filteredTickets.map((t) => {
                      const isSelected = activeTicketId === t.id;
                      const assignedAdmin = users.find((u) => u.id === t.assigned_to);

                      return (
                        <div
                          key={t.id}
                          style={{
                            ...styles.ticketCard,
                            ...(isSelected ? styles.ticketCardActive : {}),
                          }}
                          onClick={() => setActiveTicketId(t.id)}
                        >
                          <div style={styles.ticketCardHeader}>
                            <span style={styles.ticketCardSubject}>{t.subject}</span>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(t.status === 'open' ? styles.badgePlaced : {}),
                                ...(t.status === 'active' ? styles.badgeConfirmed : {}),
                                ...(t.status === 'resolved' ? styles.badgeDelivered : {}),
                              }}
                            >
                              {t.status}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                            Customer: {t.profiles?.full_name || 'Buyer'} ({t.profiles?.phone_number || 'No Number'})
                          </p>

                          <div style={styles.badgeRow}>
                            <span
                              style={{
                                ...styles.priorityBadge,
                                ...(t.priority === 'high' ? styles.badgeHigh : {}),
                                ...(t.priority === 'medium' ? styles.badgeMedium : {}),
                                ...(t.priority === 'low' ? styles.badgeLow : {}),
                              }}
                            >
                              {t.priority} priority
                            </span>
                            
                            {assignedAdmin ? (
                              <span style={{ ...styles.priorityBadge, backgroundColor: 'rgba(92, 45, 145, 0.12)', color: '#FFD700', border: '1px solid rgba(92, 45, 145, 0.3)' }}>
                                Assigned: {assignedAdmin.full_name || 'Admin'}
                              </span>
                            ) : (
                              <span style={{ ...styles.priorityBadge, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                Awaiting Agent
                              </span>
                            )}
                          </div>

                          <div style={styles.ticketCardFooter}>
                            <span>Created: {new Date(t.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredTickets.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#8E8A94', fontStyle: 'italic', padding: '20px' }}>
                        No tickets matching the current search parameters.
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT CHATTIMELINE resolves */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeTicket ? (
                    <div style={styles.chatArea}>
                      {/* HEADER PANEL */}
                      <div style={styles.chatHeader}>
                        <div>
                          <span style={styles.chatHeaderTitle}>{activeTicket.subject}</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            Buyer: {activeTicket.profiles?.full_name || 'User'} ({activeTicket.profiles?.phone_number || 'No Number'})
                          </p>
                        </div>
                        {activeTicket.status !== 'resolved' ? (
                          <button
                            style={styles.resolveBtnText}
                            onClick={handleResolveTicket}
                            disabled={actionLoading}
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span style={{ ...styles.statusSuccess, border: '1px solid #10B981', padding: '4px 8px', borderRadius: '4px' }}>
                            Resolved ✅
                          </span>
                        )}
                      </div>

                      {/* ASSIGNMENT CONTROL STRIP */}
                      <div style={styles.chatControls}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={styles.label}>Support Agent:</span>
                          <select
                            style={styles.supportFilterSelect}
                            value={activeTicket.assigned_to || ''}
                            onChange={(e) => handleAssignTicket(e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="">-- Unassigned (Awaiting Action) --</option>
                            {adminUsers.map((admin) => (
                              <option key={admin.id} value={admin.id}>
                                {admin.full_name || 'Admin'} ({admin.phone_number})
                              </option>
                            ))}
                          </select>
                        </div>
                        {adminUsers.length === 0 && (
                          <span style={{ fontSize: '0.7rem', color: '#EF4444', fontStyle: 'italic' }}>
                            Tip: Set profile role to admin in the Users tab to assign tickets.
                          </span>
                        )}
                      </div>

                      {/* MESSAGES VIEW timeline */}
                      <div style={styles.chatTimeline}>
                        {/* Render Ticket Description as Initial Message */}
                        <div style={{ ...styles.chatBubble, ...styles.userBubble }}>
                          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', color: '#FFD700' }}>
                            Initial Query Details
                          </strong>
                          {activeTicket.description}
                          <div style={styles.bubbleTime}>
                            {new Date(activeTicket.created_at).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Streamed Messages */}
                        {activeTicketMessages.map((msg) => {
                          const isUser = msg.sender_id === activeTicket.user_id;

                          return (
                            <div
                              key={msg.id}
                              style={{
                                ...styles.chatBubble,
                                ...(isUser ? styles.userBubble : styles.adminBubble),
                              }}
                            >
                              {msg.message}
                              <div style={styles.bubbleTime}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          );
                        })}
                        
                        <div ref={chatEndRef} />
                      </div>

                      {/* BOTTOM DISPATCHER FOOTER */}
                      <div style={styles.chatFooter}>
                        <form onSubmit={handleReplyTicket} style={styles.chatInputRow}>
                          <input
                            type="text"
                            required
                            placeholder={activeTicket.status === 'resolved' ? "Ticket resolved. Send message to reopen..." : "Type active support message..."}
                            style={styles.chatInput}
                            value={supportReply}
                            onChange={(e) => setSupportReply(e.target.value)}
                            disabled={actionLoading}
                          />
                          <button
                            type="submit"
                            style={styles.chatSendBtn}
                            disabled={actionLoading || !supportReply.trim()}
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...styles.chatArea, justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
                      <span style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</span>
                      <h4 style={{ color: '#2D1B69', margin: '0 0 8px 0', fontFamily: 'Sora, sans-serif' }}>Support Center Timeline</h4>
                      <p style={{ color: '#6C5E94', fontSize: '0.82rem', margin: 0, maxWidth: '280px' }}>
                        Select a support query ticket card from the sidebar list to engage in active conversation thread.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* -------------------- 7. SALES ANALYTICS REPORTS -------------------- */}
        {activeModule === 'analytics' && (
          <div style={styles.tabContent}>
            <div style={styles.chartCard}>
              <h3>Hourly Sales Volume Analysis (Lucknow Deliveries)</h3>
              <div style={styles.chartContainer}>
                {metrics.hourlySales.map((height, idx) => (
                  <div key={idx} style={styles.chartCol}>
                    <div style={{ ...styles.chartBar, height: `${(height / 25000) * 100}%` }}></div>
                    <span style={styles.chartLabel}>{0 + idx * 2}:00</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 8. MARKETING CAMPAIGNS -------------------- */}
        {activeModule === 'marketing' && (
          <div style={styles.tabContentSplit}>
            <div style={styles.tableCard}>
              <h3>Active Promo Coupons ({coupons.length})</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Discount</th>
                    <th style={styles.th}>Min Order Value</th>
                    <th style={styles.th}>Expires At</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: '#FFD700' }}>{c.code}</td>
                      <td style={styles.td}>₹{c.discount_amount}</td>
                      <td style={styles.td}>₹{c.min_cart_value}</td>
                      <td style={styles.td}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.formCard}>
              <h3>Add New Coupon</h3>
              <form onSubmit={handleAddCoupon} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONSOON20"
                    style={styles.input}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Discount Amount (₹)</label>
                  <input
                    type="number"
                    required
                    style={styles.input}
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(e.target.value)}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Min Cart Subtotal (₹)</label>
                  <input
                    type="number"
                    required
                    style={styles.input}
                    value={couponMinCart}
                    onChange={(e) => setCouponMinCart(e.target.value)}
                  />
                </div>
                <button type="submit" style={styles.submitBtn} disabled={actionLoading}>
                  Deploy Active Promo Coupon
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Custom CSS Grid Styles for Next.js Desktop layout
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#F8F4FF',
    color: '#2D1B69',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#EDE8FF',
    borderRight: '1px solid #EDE8FF',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  brandLogo: {
    fontSize: '2rem',
    color: '#6C3FD6',
  },
  brandInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    color: '#2D1B69',
    fontSize: '1.25rem',
    fontWeight: 800,
    fontFamily: "'Sora', sans-serif",
  },
  brandSub: {
    color: '#6C3FD6',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6C5E94',
    padding: '12px 16px',
    borderRadius: '10px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: 700,
    transition: 'all 0.2s ease',
  },
  navBtnActive: {
    background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    color: '#FFF',
    boxShadow: '0 4px 12px rgba(108, 63, 214, 0.15)',
  },
  mainContent: {
    flex: 1,
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    gap: '24px',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #EDE8FF',
    paddingBottom: '16px',
  },
  headerTitle: {
    color: '#2D1B69',
    fontSize: '1.5rem',
    fontWeight: 800,
    fontFamily: "'Sora', sans-serif",
  },
  adminBadge: {
    border: '1px solid #6C3FD6',
    color: '#6C3FD6',
    backgroundColor: '#EDE8FF',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  tabContentSplit: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
  },
  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  widget: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '16px',
    boxShadow: '0 6px 20px rgba(45, 27, 105, 0.03)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  widgetTitle: {
    fontSize: '0.75rem',
    color: '#6C5E94',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  widgetVal: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#2D1B69',
  },
  widgetTrend: {
    fontSize: '0.75rem',
    color: '#10B981',
  },
  widgetTrendDown: {
    fontSize: '0.75rem',
    color: '#EF4444',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(45, 27, 105, 0.03)',
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '200px',
    marginTop: '24px',
    borderBottom: '1px solid #EDE8FF',
    paddingBottom: '10px',
  },
  chartCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '8%',
    height: '100%',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  chartBar: {
    width: '60%',
    background: 'linear-gradient(180deg, #6C3FD6 0%, #9B5DE5 100%)',
    borderRadius: '4px 4px 0 0',
  },
  chartLabel: {
    fontSize: '0.7rem',
    color: '#6C5E94',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(45, 27, 105, 0.03)',
  },
  tableWrap: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    marginTop: '16px',
  },
  th: {
    color: '#6C5E94',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    paddingBottom: '12px',
    borderBottom: '1px solid #EDE8FF',
  },
  td: {
    padding: '14px 0',
    fontSize: '0.85rem',
    color: '#2D1B69',
    borderBottom: '1px solid #EDE8FF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(45, 27, 105, 0.03)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#6C5E94',
  },
  input: {
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  textarea: {
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    color: '#FFF',
    fontWeight: 800,
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(108, 63, 214, 0.15)',
    transition: 'all 0.2s ease',
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    color: '#6C3FD6',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 700,
  },
  actionBtnSuccess: {
    backgroundColor: '#10B981',
    border: 'none',
    color: '#FFF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 700,
  },
  actionBtnDanger: {
    backgroundColor: '#EF4444',
    border: 'none',
    color: '#FFF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 700,
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  badgePlaced: { backgroundColor: '#EDE8FF', color: '#6C3FD6', border: '1px solid #EDE8FF' },
  badgeConfirmed: { backgroundColor: 'rgba(155, 93, 229, 0.1)', color: '#9B5DE5', border: '1px solid rgba(155, 93, 229, 0.2)' },
  badgePacked: { backgroundColor: 'rgba(245, 166, 35, 0.1)', color: '#F5A623', border: '1px solid rgba(245, 166, 35, 0.2)' },
  badgeOut: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' },
  badgeDelivered: { backgroundColor: '#E8FDF5', color: '#10B981', border: '1px solid #10B981' },
  statusSuccess: { color: '#10B981', fontWeight: 800, fontSize: '0.75rem' },
  statusDanger: { color: '#EF4444', fontWeight: 800, fontSize: '0.75rem' },
  statusInfo: { color: '#6C3FD6', fontWeight: 800, fontSize: '0.75rem' },
  loaderBox: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#F8F4FF',
    color: '#2D1B69',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #EDE8FF',
    borderTopColor: '#6C3FD6',
    borderRadius: '50%',
  },
  alertBox: {
    borderLeft: '4px solid #6C3FD6',
    backgroundColor: '#EDE8FF',
    padding: '16px',
    borderRadius: '0 8px 8px 0',
    fontSize: '0.8rem',
    lineHeight: '1.6',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  supportAnalyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  supportWidget: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 4px 12px rgba(45, 27, 105, 0.02)',
  },
  supportWidgetTitle: {
    fontSize: '0.7rem',
    color: '#6C5E94',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  supportWidgetVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#2D1B69',
  },
  supportFilterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'center',
  },
  supportSearchInput: {
    flex: 1,
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
  },
  supportFilterSelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  ticketCardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '650px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDE8FF',
    borderRadius: '10px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(45, 27, 105, 0.02)',
  },
  ticketCardActive: {
    backgroundColor: '#EDE8FF',
    borderColor: '#6C3FD6',
  },
  ticketCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  ticketCardSubject: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#2D1B69',
  },
  badgeRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  badgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    color: '#F5A623',
    border: '1px solid rgba(245, 166, 35, 0.2)',
  },
  badgeLow: {
    backgroundColor: 'rgba(108, 63, 214, 0.1)',
    color: '#6C3FD6',
    border: '1px solid rgba(108, 63, 214, 0.2)',
  },
  ticketCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#6C5E94',
    marginTop: '4px',
  },
  chatArea: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #EDE8FF',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '16px',
    backgroundColor: '#EDE8FF',
    borderBottom: '1px solid #EDE8FF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#2D1B69',
  },
  chatHeaderSub: {
    fontSize: '0.75rem',
    color: '#6C5E94',
  },
  chatControls: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #EDE8FF',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chatTimeline: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#F8F4FF',
  },
  chatBubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  userBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    color: '#2D1B69',
    borderBottomLeftRadius: '2px',
    border: '1px solid #EDE8FF',
  },
  adminBubble: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    color: '#FFF',
    borderBottomRightRadius: '2px',
  },
  bubbleTime: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '4px',
    textAlign: 'right',
  },
  chatFooter: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #EDE8FF',
  },
  chatInputRow: {
    display: 'flex',
    gap: '10px',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#EDE8FF',
    border: '1px solid transparent',
    borderRadius: '8px',
    padding: '12px',
    color: '#2D1B69',
    fontSize: '0.85rem',
    outline: 'none',
  },
  chatSendBtn: {
    background: 'linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%)',
    color: '#FFF',
    fontWeight: 800,
    border: 'none',
    padding: '0 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  resolveBtnText: {
    backgroundColor: '#EF4444',
    color: '#FFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
};;
