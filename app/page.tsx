'use client';

import React, { useState, useEffect } from 'react';

// --- Types ---
type PCStatus = 'Active' | 'Available' | 'Locked';

interface OrderItem {
    name: string;
    icon: string;
    price: number;
    qty: number;
    timestamp: number;
}

interface PC {
    id: string;
    status: PCStatus;
    user: string;
    timeLeft: string;
    totalMins: number;
    color: string;
    orders: OrderItem[];
    // --- Added for Reports ---
    uptimeMinutes: number;
}

const MENU_ITEMS = [
    { name: 'Cola', icon: '🥤', price: 2.00 },
    { name: 'Water', icon: '💧', price: 1.00 },
    { name: 'Coffee', icon: '☕', price: 2.50 },
    { name: 'Chips', icon: '🍟', price: 1.50 },
    { name: 'Burger', icon: '🍔', price: 5.00 },
];

export default function AdminDashboard() {
    // 1. Data State (Added dummy uptimeMinutes for the report)
    const [pcs, setPcs] = useState<PC[]>([
        { id: 'PC-01', status: 'Active', user: 'Tarnnky', timeLeft: '1h 25m', totalMins: 120, color: '#00e5ff', orders: [], uptimeMinutes: 450 },
        { id: 'PC-02', status: 'Available', user: 'None', timeLeft: '--', totalMins: 0, color: '#00ff99', orders: [], uptimeMinutes: 120 },
        { id: 'PC-03', status: 'Locked', user: 'None', timeLeft: '--', totalMins: 0, color: '#ff4444', orders: [], uptimeMinutes: 85 },
        { id: 'PC-04', status: 'Active', user: 'Stebtorn', timeLeft: '2h 10m', totalMins: 180, color: '#00e5ff', orders: [], uptimeMinutes: 310 },
    ]);

    // 2. UI State
    const [currentTab, setCurrentTab] = useState('Dashboard');
    const [selectedPC, setSelectedPC] = useState<PC | null>(null);
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [timeInput, setTimeInput] = useState<number>(30);
    const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
    const [manualNumber, setManualNumber] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Timer: Updates "time ago" AND increments uptime for active PCs every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setPcs(prevPcs => prevPcs.map(pc => {
                if (pc.status === 'Active') {
                    return { ...pc, uptimeMinutes: pc.uptimeMinutes + 1 };
                }
                return pc;
            }));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const pcTicketsWithOrders = pcs.filter(pc => pc.orders.length > 0).length;

    const getElapsedTime = (timestamp: number) => {
        const diffInMs = Date.now() - timestamp;
        const diffInMins = Math.floor(diffInMs / 60000);
        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        const diffInHours = Math.floor(diffInMins / 60);
        return `${diffInHours}h ${diffInMins % 60}m ago`;
    };

    const parseTimeToMinutes = (timeStr: string): number => {
        if (timeStr === '--') return 0;
        const parts = timeStr.split(' ');
        let total = 0;
        parts.forEach(p => {
            if (p.includes('h')) total += parseInt(p) * 60;
            if (p.includes('m')) total += parseInt(p);
        });
        return total;
    };

    const formatMinutesToTime = (totalMinutes: number): string => {
        if (totalMinutes <= 0) return '--';
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // --- Actions ---
    const adjustTime = (id: string, minutes: number) => {
        setPcs(pcs.map(pc => {
            if (pc.id === id) {
                const currentMins = parseTimeToMinutes(pc.timeLeft);
                const newMins = Math.max(0, currentMins + minutes);
                const isNowActive = newMins > 0;
                const newTotalMins = minutes > 0 ? (pc.totalMins + minutes) : pc.totalMins;

                return {
                    ...pc,
                    timeLeft: formatMinutesToTime(newMins),
                    totalMins: isNowActive ? newTotalMins : 0,
                    status: isNowActive ? 'Active' : 'Available',
                    user: isNowActive ? (pc.user === 'None' ? 'Guest' : pc.user) : 'None',
                    color: isNowActive ? '#00e5ff' : '#00ff99'
                };
            }
            return pc;
        }));
        setSelectedPC(null);
    };

    const toggleLock = (id: string, lock: boolean) => {
        const targetPC = pcs.find(p => p.id === id);
        if (lock && targetPC?.status === 'Active') {
            const confirmed = window.confirm(`Station ${id} is still ACTIVE. Lock and end session?`);
            if (!confirmed) return;
        }
        setPcs(pcs.map(pc => pc.id === id ? { ...pc, status: lock ? 'Locked' : 'Available', color: lock ? '#ff4444' : '#00ff99', user: 'None', timeLeft: '--', totalMins: 0 } : pc));
        setSelectedPC(null);
    };

    const addToCart = (item: any) => {
        setCurrentCart(prev => {
            const existing = prev.find(i => i.name === item.name);
            if (existing) return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...item, qty: 1, timestamp: Date.now() }];
        });
    };

    const confirmOrder = () => {
        if (!selectedPC) return;
        const now = Date.now();
        setPcs(pcs.map(pc => {
            if (pc.id === selectedPC.id) {
                const updatedOrders = [...pc.orders];
                currentCart.forEach(cartItem => {
                    const existing = updatedOrders.find(o => o.name === cartItem.name);
                    if (existing) { existing.qty += cartItem.qty; }
                    else { updatedOrders.push({ ...cartItem, timestamp: now }); }
                });
                return { ...pc, orders: updatedOrders };
            }
            return pc;
        }));
        setIsOrderOpen(false);
        setCurrentCart([]);
        setSelectedPC(null);
    };

    const serveItem = (pcId: string, itemName: string) => {
        setPcs(pcs.map(pc => {
            if (pc.id === pcId) {
                const updatedOrders = pc.orders.map(order =>
                    order.name === itemName ? { ...order, qty: order.qty - 1 } : order
                ).filter(order => order.qty > 0);
                return { ...pc, orders: updatedOrders };
            }
            return pc;
        }));
        if (selectedPC && selectedPC.id === pcId) {
            setSelectedPC(prev => {
                if (!prev) return null;
                const updated = prev.orders.map(o => o.name === itemName ? { ...o, qty: o.qty - 1 } : o).filter(o => o.qty > 0);
                return { ...prev, orders: updated };
            });
        }
    };

    const getNextIdString = () => {
        const numbers = pcs.map(p => parseInt(p.id.replace('PC-', '')) || 0);
        const nextNum = Math.max(0, ...numbers) + 1;
        return `PC-${nextNum.toString().padStart(2, '0')}`;
    };

    const handleQuickAdd = () => {
        setPcs([...pcs, { id: getNextIdString(), status: 'Available', user: 'None', timeLeft: '--', totalMins: 0, color: '#00ff99', orders: [], uptimeMinutes: 0 }]);
    };

    const handleManualAdd = () => {
        if (!manualNumber) return;
        const id = `PC-${manualNumber.padStart(2, '0')}`;
        if (pcs.find(p => p.id === id)) return alert("Station ID exists!");
        setPcs([...pcs, { id, status: 'Available', user: 'None', timeLeft: '--', totalMins: 0, color: '#00ff99', orders: [], uptimeMinutes: 0 }]);
        setManualNumber('');
    };

    const handleTabChange = (tabName: string) => {
        setCurrentTab(tabName);
        setSelectedPC(null);
        setIsOrderOpen(false);
        setCurrentCart([]);
        setIsMobileMenuOpen(false);
    };

    const sortedPendingPcs = [...pcs].filter(pc => pc.orders.length > 0).sort((a, b) => Math.min(...a.orders.map(o => o.timestamp)) - Math.min(...b.orders.map(o => o.timestamp)));

    // Report logic: Find max uptime to calculate bar percentages
    const maxUptime = Math.max(...pcs.map(p => p.uptimeMinutes), 1);

    return (
        <div className="admin-container">
            <style>{`
                .admin-container { display: flex; background-color: #0d1117; color: #c9d1d9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }
                .sidebar { width: 260px; background-color: #161b22; padding: 30px 20px; border-right: 1px solid #30363d; display: flex; flex-direction: column; flex-shrink: 0; }
                .main-content { flex: 1; padding: 40px; overflow-y: auto; }
                .mobile-header { display: none; background: #161b22; padding: 15px 20px; border-bottom: 1px solid #30363d; align-items: center; justify-content: space-between; }
                .hamburger { font-size: 24px; background: none; border: none; color: #58a6ff; cursor: pointer; }
                @media (max-width: 900px) {
                    .admin-container { flex-direction: column; }
                    .sidebar { position: fixed; top: 0; left: 0; height: 100vh; z-index: 200; transform: ${isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'}; transition: transform 0.3s ease; box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
                    .mobile-header { display: flex; }
                    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 150; display: ${isMobileMenuOpen ? 'block' : 'none'}; }
                    .main-content { padding: 20px; }
                }
            `}</style>

            <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            <header className="mobile-header">
                <div style={styles.logo}>🖥️ CyberAdmin</div>
                <button className="hamburger" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            </header>

            <aside className="sidebar">
                <div style={styles.logo}>🖥️ CyberAdmin v1.2</div>
                <nav style={{ ...styles.nav, marginTop: '30px' }}>
                    <div onClick={() => handleTabChange('Dashboard')} style={{ ...styles.navItem, color: currentTab === 'Dashboard' ? '#fff' : '#8b949e', backgroundColor: currentTab === 'Dashboard' ? '#30363d' : 'transparent', borderRadius: '8px' }}>🏠 Dashboard</div>
                    <div onClick={() => handleTabChange('Food Orders')} style={{ ...styles.navItem, color: currentTab === 'Food Orders' ? '#fff' : '#8b949e', backgroundColor: currentTab === 'Food Orders' ? '#30363d' : 'transparent', borderRadius: '8px' }}>🛒 Food Orders {pcTicketsWithOrders > 0 && <span style={styles.badge}>{pcTicketsWithOrders}</span>}</div>
                    <div onClick={() => handleTabChange('System Setup')} style={{ ...styles.navItem, color: currentTab === 'System Setup' ? '#fff' : '#8b949e', backgroundColor: currentTab === 'System Setup' ? '#30363d' : 'transparent', borderRadius: '8px' }}>⚙️ System Setup</div>
                    <div onClick={() => handleTabChange('Reports')} style={{ ...styles.navItem, color: currentTab === 'Reports' ? '#fff' : '#8b949e', backgroundColor: currentTab === 'Reports' ? '#30363d' : 'transparent', borderRadius: '8px' }}>📊 Reports</div>
                </nav>
            </aside>

            <main className="main-content">
                <header style={styles.header}>
                    <h2>
                        {currentTab === 'Dashboard' && 'Monitor Overview'}
                        {currentTab === 'Food Orders' && 'Kitchen Queue'}
                        {currentTab === 'System Setup' && 'Station Management'}
                        {currentTab === 'Reports' && 'Uptime Analysis'}
                    </h2>
                </header>

                {currentTab === 'Dashboard' && (
                    <div style={styles.grid}>
                        {pcs.map((pc) => {
                            const isActive = pc.status === 'Active';
                            const minsLeft = parseTimeToMinutes(pc.timeLeft);
                            const total = pc.totalMins || 1;
                            const percentage = isActive ? (minsLeft / total) * 100 : 0;

                            return (
                                <div key={pc.id} onClick={() => { setSelectedPC(pc); setIsOrderOpen(false); setTimeInput(30); setCurrentCart([]); }}
                                    style={{
                                        ...styles.card,
                                        borderColor: pc.color,
                                        boxShadow: selectedPC?.id === pc.id ? `0 0 15px ${pc.color}` : 'none'
                                    }}>
                                    <div style={styles.cardHeader}>
                                        <span style={styles.pcName}>{pc.id}</span>
                                        <div style={styles.iconContainer}>
                                            {pc.orders.map((order, idx) => (
                                                <span key={idx}>{Array(order.qty).fill(order.icon).map((icon, i) => <span key={i} style={styles.miniIcon}>{icon}</span>)}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.statusCircle,
                                        background: isActive
                                            ? `conic-gradient(${pc.color} ${percentage}%, #252a33 0)`
                                            : `conic-gradient(#30363d 100%, #30363d 0)`,
                                        boxShadow: isActive ? `0 0 15px ${pc.color}44` : 'none'
                                    }}>
                                        <div style={styles.circleInner}>
                                            <div style={{ ...styles.timeText, color: isActive ? '#fff' : '#8b949e' }}>{pc.timeLeft}</div>
                                            <div style={styles.statusLabel}>{pc.status}</div>
                                        </div>
                                    </div>
                                    <div style={{ ...styles.userLabel, color: isActive ? pc.color : '#8b949e' }}>{pc.user}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {currentTab === 'Reports' && (
                    <div style={styles.reportContainer}>
                        <div style={styles.reportHeaderCard}>
                            <h3>Station Usage Ranking</h3>
                            <p style={{ fontSize: '13px', color: '#8b949e' }}>Visual breakdown of which PCs are being used the most based on total active minutes.</p>
                        </div>
                        <div style={styles.reportList}>
                            {[...pcs].sort((a, b) => b.uptimeMinutes - a.uptimeMinutes).map((pc, index) => {
                                const barWidth = (pc.uptimeMinutes / maxUptime) * 100;
                                return (
                                    <div key={pc.id} style={styles.reportItem}>
                                        <div style={styles.reportInfo}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ color: index === 0 ? '#ffcc00' : '#8b949e', fontWeight: 'bold' }}>#{index + 1}</span>
                                                <span style={{ fontWeight: 'bold' }}>{pc.id}</span>
                                            </div>
                                            <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>{pc.uptimeMinutes} mins</span>
                                        </div>
                                        <div style={styles.reportBarBg}>
                                            <div style={{
                                                ...styles.reportBarFill,
                                                width: `${barWidth}%`,
                                                backgroundColor: index === 0 ? '#58a6ff' : index === 1 ? '#238636' : '#30363d'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Keep existing System Setup and Food Orders sections here... */}
                {currentTab === 'System Setup' && (
                    <div style={styles.setupContainer}>
                        <div style={styles.actionRow}>
                            <button onClick={handleQuickAdd} style={styles.btnQuickAdd}>⚡ Quick Add {getNextIdString()}</button>
                            <div style={styles.manualEntry}>
                                <span>PC-</span>
                                <input type="number" value={manualNumber} onChange={e => setManualNumber(e.target.value)} style={styles.numInput} placeholder="00" />
                                <button onClick={handleManualAdd} style={styles.btnManualAdd}>Add Station</button>
                            </div>
                        </div>
                        <div style={styles.manageList}>
                            {pcs.map(pc => (
                                <div key={pc.id} style={styles.manageItem}>
                                    <div style={styles.itemMainInfo}>
                                        <span style={styles.manageId}>{pc.id}</span>
                                        <span style={{ ...styles.statusTag, color: pc.color }}>{pc.status}</span>
                                    </div>
                                    <button onClick={() => setPcs(pcs.filter(p => p.id !== pc.id))} style={styles.btnRemove}>Remove Station</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentTab === 'Food Orders' && (
                    <div style={styles.ticketGrid}>
                        {sortedPendingPcs.map((pc, index) => (
                            <div key={pc.id} style={{ ...styles.orderTicket, borderLeft: index === 0 ? '5px solid #ffcc00' : '1px solid #30363d' }}>
                                <div style={styles.ticketHeader}>
                                    <div>{index === 0 && <span style={{ color: '#ffcc00', marginRight: '5px' }}>⭐ NEXT:</span>}<strong>{pc.id}</strong></div>
                                    <span style={{ fontSize: '11px', color: '#ff7b72' }}>⏱️ {getElapsedTime(Math.min(...pc.orders.map(o => o.timestamp)))}</span>
                                </div>
                                <div style={styles.ticketBody}>
                                    {pc.orders.map((order) => (
                                        <div key={order.name} style={styles.ticketItem}>
                                            <span>{order.icon} {order.name} (x{order.qty})</span>
                                            <button onClick={() => serveItem(pc.id, order.name)} style={styles.btnServeMini}>Serve ✅</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.ticketFooter}>Customer: {pc.user}</div>
                            </div>
                        ))}
                        {sortedPendingPcs.length === 0 && <div style={styles.emptyMsg}>☕ No orders currently.</div>}
                    </div>
                )}

                {/* Keep Modal and Order Popup logic as it was */}
                {selectedPC && !isOrderOpen && (
                    <div style={styles.modal}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Control {selectedPC.id}</h3>
                        {selectedPC.orders.length > 0 && (
                            <div style={styles.pendingContainer}>
                                <label style={styles.smallLabel}>PENDING ITEMS (SERVE)</label>
                                {selectedPC.orders.map((order) => (
                                    <button key={order.name} onClick={() => serveItem(selectedPC.id, order.name)} style={styles.btnServeItem}>
                                        <div>{order.icon} {order.name} (x{order.qty})</div>
                                        <div style={{ fontSize: '9px', opacity: 0.6 }}>{getElapsedTime(order.timestamp)}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedPC.status !== 'Locked' ? (
                            <div style={styles.inputContainer}>
                                <label style={styles.smallLabel}>DURATION (MINUTES)</label>
                                <input type="number" value={timeInput === 0 ? '' : timeInput} onChange={(e) => setTimeInput(e.target.value === '' ? 0 : parseInt(e.target.value))} style={styles.manualInput} />
                                <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                    <button onClick={() => adjustTime(selectedPC.id, timeInput)} style={styles.btnTimeAdd}>➕ ADD</button>
                                    <button onClick={() => adjustTime(selectedPC.id, -timeInput)} style={styles.btnTimeReduce}>➖ REDUCE</button>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.lockedWarning}>
                                <span style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold' }}>⚠️ STATION LOCKED</span>
                                <p style={{ fontSize: '11px', margin: '5px 0 0' }}>Unlock the station to manage time.</p>
                            </div>
                        )}
                        <div style={styles.modalButtons}>
                            {selectedPC.status === 'Active' && <button onClick={() => setIsOrderOpen(true)} style={styles.btnOrder}>🛒 Add New Order</button>}
                            <button onClick={() => toggleLock(selectedPC.id, selectedPC.status !== 'Locked')} style={selectedPC.status === 'Locked' ? styles.btnUnlock : styles.btnLock}>
                                {selectedPC.status === 'Locked' ? '🔓 Unlock' : '🔒 Lock'}
                            </button>
                            <button onClick={() => setSelectedPC(null)} style={styles.btnClose}>Cancel</button>
                        </div>
                    </div>
                )}

                {isOrderOpen && selectedPC && (
                    <div style={styles.orderPopup}>
                        <div style={styles.popupHeader}>
                            <span>🛒 NEW ORDER: {selectedPC.id}</span>
                            <button onClick={() => setIsOrderOpen(false)} style={styles.closeX}>✕</button>
                        </div>
                        <div style={styles.popupContent}>
                            <div style={styles.itemGrid}>
                                {MENU_ITEMS.map((item) => (
                                    <div key={item.name} onClick={() => addToCart(item)} style={styles.product}>
                                        <span style={{ fontSize: '24px' }}>{item.icon}</span><br />
                                        {item.name} <br /> <small>${item.price.toFixed(2)}</small>
                                    </div>
                                ))}
                            </div>
                            <div style={styles.orderSidebar}>
                                <label style={styles.smallLabel}>Cart Items</label>
                                <div style={styles.cartList}>
                                    {currentCart.map(item => <div key={item.name} style={styles.cartItem}>{item.icon} x{item.qty}</div>)}
                                    {currentCart.length === 0 && <small style={{ color: '#8b949e' }}>Empty</small>}
                                </div>
                                <button style={{ ...styles.btnConfirm, opacity: currentCart.length > 0 ? 1 : 0.5 }} disabled={currentCart.length === 0} onClick={confirmOrder}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    logo: { fontSize: '20px', fontWeight: 'bold', color: '#58a6ff', marginBottom: '10px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
    navItem: { padding: '12px 15px', cursor: 'pointer', transition: '0.2s', fontSize: '15px' },
    badge: { backgroundColor: '#f85149', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', float: 'right' },
    header: { marginBottom: '30px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#1c2128', padding: '15px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: '0.3s' },
    cardHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', marginBottom: '10px' },
    pcName: { fontWeight: 'bold', fontSize: '14px' },
    iconContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px', minHeight: '20px' },
    miniIcon: { fontSize: '14px' },
    statusCircle: { width: '92px', height: '92px', borderRadius: '50%', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
    circleInner: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1c2128', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    timeText: { fontSize: '15px', fontWeight: '800' },
    statusLabel: { fontSize: '9px', opacity: 0.7 },
    userLabel: { fontSize: '13px', fontWeight: '600' },
    setupContainer: { maxWidth: '800px' },
    actionRow: { display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' },
    btnQuickAdd: { padding: '12px 24px', backgroundColor: '#238636', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    manualEntry: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c2128', padding: '5px 15px', borderRadius: '8px', border: '1px solid #30363d' },
    numInput: { background: 'transparent', border: 'none', color: '#fff', width: '40px', outline: 'none' },
    btnManualAdd: { background: '#30363d', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    manageList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    manageItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#1c2128', borderRadius: '12px', border: '1px solid #30363d' },
    itemMainInfo: { display: 'flex', alignItems: 'center', gap: '30px' },
    manageId: { fontWeight: 'bold', fontSize: '18px', width: '70px' },
    statusTag: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' },
    btnRemove: { background: 'transparent', color: '#f85149', border: '1px solid #f85149', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer' },
    ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    orderTicket: { backgroundColor: '#1c2128', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    ticketHeader: { padding: '10px 15px', backgroundColor: '#30363d', color: '#fff', display: 'flex', justifyContent: 'space-between' },
    ticketBody: { padding: '15px' },
    ticketFooter: { padding: '8px 15px', borderTop: '1px solid #30363d', fontSize: '11px', color: '#8b949e' },
    ticketItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '14px' },
    btnServeMini: { background: '#238636', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    emptyMsg: { gridColumn: '1/-1', textAlign: 'center', padding: '100px', fontSize: '18px', color: '#8b949e' },
    modal: { position: 'fixed', right: '40px', bottom: '40px', width: '320px', backgroundColor: '#161b22', padding: '20px', borderRadius: '15px', border: '1px solid #58a6ff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100 },
    pendingContainer: { backgroundColor: '#0d1117', padding: '10px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '10px' },
    btnServeItem: { width: '100%', padding: '8px', backgroundColor: '#1c2128', border: '1px solid #444', color: '#fff', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
    orderPopup: { position: 'fixed', right: '40px', bottom: '40px', width: '500px', backgroundColor: '#161b22', borderRadius: '10px', border: '1px solid #58a6ff', zIndex: 110, overflow: 'hidden' },
    inputContainer: { padding: '10px', backgroundColor: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' },
    manualInput: { boxSizing: 'border-box', width: '100%', backgroundColor: '#161b22', border: '1px solid #58a6ff', color: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', outline: 'none' },
    smallLabel: { fontSize: '10px', color: '#8b949e', display: 'block', marginBottom: '5px' },
    modalButtons: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
    btnTimeAdd: { flex: 1, padding: '8px', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' },
    btnTimeReduce: { flex: 1, padding: '8px', background: '#da3633', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' },
    btnLock: { padding: '10px', background: '#da3633', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' },
    btnUnlock: { padding: '10px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' },
    btnOrder: { padding: '10px', background: '#ffcc00', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px' },
    btnClose: { background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' },
    popupHeader: { backgroundColor: '#58a6ff', color: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
    closeX: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' },
    popupContent: { display: 'flex', padding: '20px', gap: '20px' },
    itemGrid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    product: { backgroundColor: '#0d1117', border: '1px solid #30363d', padding: '10px', borderRadius: '5px', textAlign: 'center', fontSize: '11px', cursor: 'pointer' },
    orderSidebar: { width: '150px', display: 'flex', flexDirection: 'column', gap: '10px' },
    cartList: { flex: 1, backgroundColor: '#0d1117', padding: '10px', borderRadius: '5px', overflowY: 'auto', maxHeight: '150px' },
    cartItem: { fontSize: '12px', marginBottom: '5px' },
    btnConfirm: { padding: '10px', background: '#238636', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    lockedWarning: { padding: '15px', textAlign: 'center', backgroundColor: '#211212', borderRadius: '8px', border: '1px solid #ff4444', marginBottom: '10px' },

    // NEW REPORT STYLES
    reportContainer: { maxWidth: '800px', backgroundColor: '#161b22', padding: '30px', borderRadius: '15px', border: '1px solid #30363d' },
    reportHeaderCard: { marginBottom: '30px' },
    reportList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    reportItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
    reportInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
    reportBarBg: { height: '8px', backgroundColor: '#0d1117', borderRadius: '4px', overflow: 'hidden' },
    reportBarFill: { height: '100%', transition: 'width 1s ease-in-out', borderRadius: '4px' },
};