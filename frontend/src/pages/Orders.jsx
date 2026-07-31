import React, { useState, useEffect } from 'react';
import api from '../api.js';

function Orders({ user, navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [orderNoInput, setOrderNoInput] = useState('');
  const [clientNameInput, setClientNameInput] = useState('');
  const [siteAddressInput, setSiteAddressInput] = useState('');
  const [supervisorNameInput, setSupervisorNameInput] = useState('');
  const [totalAptsInput, setTotalAptsInput] = useState('');
  const [contractorIdInput, setContractorIdInput] = useState('');
  const [contractorNameInput, setContractorNameInput] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOrderNoInput('');
    setClientNameInput('');
    setSiteAddressInput('');
    setSupervisorNameInput('');
    setTotalAptsInput('');
    setContractorIdInput('');
    setContractorNameInput('');
    setError('');
    setShowModal(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/orders', {
        orderNumber: orderNoInput,
        clientName: clientNameInput,
        siteAddress: siteAddressInput,
        supervisorName: supervisorNameInput,
        totalApartmentsNeeded: totalAptsInput ? parseInt(totalAptsInput, 10) : 0,
        contractorId: contractorIdInput,
        contractorName: contractorNameInput
      });

      setShowModal(false);
      setOrderNoInput('');
      setClientNameInput('');
      setSiteAddressInput('');
      setSupervisorNameInput('');
      setTotalAptsInput('');
      setContractorIdInput('');
      setContractorNameInput('');
      fetchOrders(); // Reload to get fully computed metrics
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (e, orderId, orderNumber) => {
    e.stopPropagation(); // Prevent row click from navigating
    if (!window.confirm(`Are you sure you want to delete project "${orderNumber}"?\n\nThis will permanently remove ALL towers, apartments, billing data, and audit logs associated with this project. This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete order.');
    }
  };

  return (
    <div className="orders-container">
      <div className="grid-controls-row" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Projects Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select an active project to view towers, tracking grids, and billing details.</p>
        </div>
        {user.role === 'ROLE_A' && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            ➕ Create New Project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading active projects...</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <h3>No Projects Found</h3>
          {user.role === 'ROLE_A' ? (
            <p style={{ marginTop: '0.5rem' }}>Get started by creating your first tracking project code.</p>
          ) : (
            <p style={{ marginTop: '0.5rem' }}>No projects have been seeded by the Setup administrator yet.</p>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="billing-table">
            <thead>
              <tr>
                <th>Project Number</th>
                <th>Client & Site Address</th>
                <th>Supervisor In Charge</th>
                <th>Towers / Buildings</th>
                <th>Total Apartments Needed</th>
                <th>Overall Progress</th>
                <th>Creation Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('order-detail', { orderId: order.id })}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '1rem' }}>
                    {order.orderNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      👤 {order.clientName || order.siteName || 'N/A'}
                    </div>
                    {order.siteAddress && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        📍 {order.siteAddress}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                      👷 {order.supervisorName || 'Unassigned'}
                    </span>
                    {(order.contractorId || order.contractorName) && (
                      <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.15rem', fontWeight: 600 }}>
                        🚜 {order.contractorId}{order.contractorName ? ` - ${order.contractorName}` : ''}
                      </div>
                    )}
                  </td>
                  <td>{order.buildingsCount} Towers</td>
                  <td>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {order.totalApartmentsNeeded || 0} units
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                        ({order.totalApartments} configured)
                      </span>
                    </div>
                  </td>
                  <td className="highlight-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(order.overallCompletion || 0) * 100}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {((order.overallCompletion || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        View Project ➡️
                      </button>
                      {user.role === 'ROLE_A' && (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={(e) => handleDeleteOrder(e, order.id, order.orderNumber)}
                          title="Delete this order and all its data"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-small">
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              ➕ Create New Project
            </h3>

            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateOrder}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Project Number *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ORD-2026-001 or DG-WEST-09"
                  value={orderNoInput}
                  onChange={(e) => setOrderNoInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dio Graciaa Developers or Prestige Group"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Supervisor Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Miller (Lead Supervisor)"
                  value={supervisorNameInput}
                  onChange={(e) => setSupervisorNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Site Address *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Plot 42, Sector 18, City Center"
                  value={siteAddressInput}
                  onChange={(e) => setSiteAddressInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Contractor ID *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CON-09"
                  value={contractorIdInput}
                  onChange={(e) => setContractorIdInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Contractor Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ABC Constructions"
                  value={contractorNameInput}
                  onChange={(e) => setContractorNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Total Apartments Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 120"
                  value={totalAptsInput}
                  onChange={(e) => setTotalAptsInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
