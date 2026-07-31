import React, { useState, useEffect } from 'react';
import api from '../api.js';
import BillingSetup from './BillingSetup.jsx';
import ContractorBill from './ContractorBill.jsx';
import ClientRABill from './ClientRABill.jsx';
import BillingDashboard from './BillingDashboard.jsx';
import DashboardsSection from './DashboardsSection.jsx';

function OrderDetail({ user, orderId, navigate }) {
  const [order, setOrder] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('towers'); // 'towers' | 'billing-setup' | 'contractor-bill' | 'client-ra' | 'billing-dashboard'

  // Modal states for building creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [bCount, setBCount] = useState('');
  const [bName, setBName] = useState('');
  const [bCapacity, setBCapacity] = useState('');
  const [bSiteName, setBSiteName] = useState('Dio Graciaa Main Site');
  const [bReportDate, setBReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [bMatWeight, setBMatWeight] = useState(0.3);
  const [bExecWeight, setBExecWeight] = useState(0.7);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Copy building data modal states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceBuildingId, setSourceBuildingId] = useState('');
  const [targetBuildingId, setTargetBuildingId] = useState('');
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  const [copying, setCopying] = useState(false);

  // Edit building modal states
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(50);
  const [editSiteName, setEditSiteName] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleOpenEditBuilding = (b) => {
    setEditingBuilding(b);
    setEditName(b.name);
    setEditCapacity(b.capacity);
    setEditSiteName(b.siteName || order?.clientName || 'Dio Graciaa Site');
    setError('');
  };

  const handleOpenCopyModal = () => {
    setSourceBuildingId('');
    setTargetBuildingId('');
    setCopyConfirmed(false);
    setError('');
    setShowCopyModal(true);
  };

  const handleCopyBuildingData = async (e) => {
    e.preventDefault();
    if (!sourceBuildingId || !targetBuildingId) {
      setError('Please select both source and target towers.');
      return;
    }
    if (sourceBuildingId === targetBuildingId) {
      setError('Source and target towers must be different.');
      return;
    }
    if (!copyConfirmed) {
      setError('You must confirm that this action will overwrite target tower data.');
      return;
    }

    setCopying(true);
    setError('');

    try {
      const res = await api.post('/buildings/copy', {
        sourceBuildingId,
        targetBuildingId
      });
      setShowCopyModal(false);
      // Navigate directly to the target building execution table so the user
      // immediately sees the persisted copied data.
      navigate('building-grid', { orderId, buildingId: targetBuildingId });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to copy tower data.');
    } finally {
      setCopying(false);
    }
  };

  const handleSaveBuildingConfig = async (e) => {
    e.preventDefault();
    if (!editingBuilding) return;
    setSubmitting(true);
    setError('');

    try {
      await api.patch(`/buildings/${editingBuilding.id}/config`, {
        name: editName,
        capacity: editCapacity,
        siteName: editSiteName
      });
      setEditingBuilding(null);
      fetchOrderDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update building configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderRes = await api.get(`/orders/${orderId}`);
      setOrder(orderRes.data);

      const buildingsRes = await api.get(`/orders/${orderId}/buildings`);
      setBuildings(buildingsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setBCount('');
    setBName('');
    setBCapacity('');
    setBSiteName(order?.siteAddress || order?.clientName || 'Dio Graciaa Site');
    setError('');
    setShowAddModal(true);
  };

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(bMatWeight) + parseFloat(bExecWeight) !== 1.0) {
      setError('Material Weight + Installation Weight must sum to exactly 1.0.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/buildings`, {
        count: bCount,
        name: bName,
        capacity: bCapacity,
        siteName: bSiteName,
        reportDate: bReportDate,
        materialWeight: bMatWeight,
        executionWeight: bExecWeight
      });
      setShowAddModal(false);
      fetchOrderDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create building(s).');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete project "${order.orderNumber}"?\n\nThis will permanently remove ALL towers, apartments, billing data, and audit logs associated with this project. This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/orders/${orderId}`);
      navigate('orders');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete order.');
    }
  };

  const handleDeleteBuilding = async (buildingId, buildingName) => {
    if (!window.confirm(`Are you sure you want to delete tower "${buildingName}"?\n\nThis will permanently remove all apartments, audit logs, and billing data for this tower. This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/buildings/${buildingId}`);
      fetchOrderDetails(); // Refresh to remove the deleted building
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete building.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading project info...</div>;
  }

  if (!order) {
    return (
      <div className="card">
        <h3>Project Not Found</h3>
        <button className="btn btn-secondary" onClick={() => navigate('orders')}>
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header Card */}
      <div className="card grid-controls-row" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project
          </span>
          <h2 style={{ fontSize: '2rem', color: 'var(--accent-blue)', marginTop: '0.1rem' }}>
            {order.orderNumber}
          </h2>
          {(order.clientName || order.siteName) && (
            <div style={{ marginTop: '0.25rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              👤 Client: {order.clientName || order.siteName}
            </div>
          )}
          {order.supervisorName && (
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.2rem', fontWeight: 600 }}>
              👷 Supervisor: {order.supervisorName}
            </div>
          )}
          {(order.contractorId || order.contractorName) && (
            <div style={{ fontSize: '0.85rem', color: '#a78bfa', marginTop: '0.2rem', fontWeight: 600 }}>
              🚜 Contractor: {order.contractorId}{order.contractorName ? ` - ${order.contractorName}` : ''}
            </div>
          )}
          {order.siteAddress && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              📍 {order.siteAddress}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {order.totalApartmentsNeeded > 0 && (
            <div style={{
              background: 'var(--bg-primary)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Target Units
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {order.totalApartmentsNeeded} units
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('orders')}>
              ⬅️ All Projects
            </button>
            {user.role === 'ROLE_A' && activeTab === 'towers' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  ➕ Add Towers / Buildings
                </button>
                {buildings.length > 1 && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleOpenCopyModal}
                    style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'var(--accent-blue)' }}
                    title="Copy apartment progress/milestones from one tower to another"
                  >
                    📋 Copy Tower Data
                  </button>
                )}
              </div>
            )}
            {user.role === 'ROLE_A' && (
              <button className="btn btn-danger" onClick={handleDeleteOrder} title="Delete this entire project and all its data">
                🗑️ Delete Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'towers' ? 'active' : ''}`} onClick={() => setActiveTab('towers')}>
          🏢 Buildings / Towers ({buildings.length})
        </div>
        <div className={`tab ${activeTab === 'billing-setup' ? 'active' : ''}`} onClick={() => setActiveTab('billing-setup')}>
          ⚙️ Billing Setup
        </div>
        <div className={`tab ${activeTab === 'contractor-bill' ? 'active' : ''}`} onClick={() => setActiveTab('contractor-bill')}>
          👷 Contractor running Bill
        </div>
        <div className={`tab ${activeTab === 'client-ra' ? 'active' : ''}`} onClick={() => setActiveTab('client-ra')}>
          📊 Client RA Bill
        </div>
        <div className={`tab ${activeTab === 'billing-dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('billing-dashboard')}>
          💰 Billing Dashboard
        </div>
        <div className={`tab ${activeTab === 'dashboards' ? 'active' : ''}`} onClick={() => setActiveTab('dashboards')}>
          📊 Project Dashboards
        </div>
      </div>

      {/* View Switcher */}
      {activeTab === 'towers' && (
        <div className="buildings-view">
          {buildings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <h3>No Buildings Registered</h3>
              {user.role === 'ROLE_A' ? (
                <p>Click "Add Towers / Buildings" above to configure your building layouts.</p>
              ) : (
                <p>No buildings have been created under this project code yet.</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {buildings.map(b => (
                <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.4rem' }}>{b.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {b.siteName}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      <div><b>Total Capacity:</b> {b.capacity} units</div>
                      <div><b>Completed:</b> {b.completedCount}</div>
                      <div><b>In Progress:</b> {b.inProgressCount}</div>
                      <div><b>Delayed/Watch:</b> {b.delayedCount}</div>
                    </div>
                  </div>

                  <div>
                    {/* Completion progress bar */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span>Completion Rate</span>
                        <span>{((b.overallCompletion || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(b.overallCompletion || 0) * 100}%`,
                          background: 'linear-gradient(90deg, #10b981, #3b82f6)'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => navigate('building-grid', { orderId, buildingId: b.id })}
                      >
                        Open Execution Table ➡️
                      </button>
                      {user.role === 'ROLE_A' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.35rem' }}
                            onClick={() => handleOpenEditBuilding(b)}
                            title="Edit tower name, capacity and setup"
                          >
                            ✏️ Edit Tower
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.35rem' }}
                            onClick={() => handleDeleteBuilding(b.id, b.name)}
                            title="Delete this tower and all its data"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'billing-setup' && (
        <BillingSetup user={user} orderId={orderId} buildings={buildings} />
      )}

      {activeTab === 'contractor-bill' && (
        <ContractorBill user={user} orderId={orderId} />
      )}

      {activeTab === 'client-ra' && (
        <ClientRABill user={user} orderId={orderId} />
      )}

      {activeTab === 'billing-dashboard' && (
        <BillingDashboard user={user} orderId={orderId} />
      )}

      {activeTab === 'dashboards' && (
        <DashboardsSection user={user} orderId={orderId} />
      )}

      {/* Add Towers Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-small" style={{ maxWidth: '500px' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              🏢 Provision Towers / Buildings
            </h3>

            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAddBuilding}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Total Towers to Add *
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="50"
                  value={bCount}
                  onChange={(e) => setBCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="e.g. 1"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {bCount && bCount > 1 ? `Will create ${bCount} towers concurrently ("${bName || 'Tower'} 1", "${bName || 'Tower'} 2", ... "${bName || 'Tower'} ${bCount}")` : 'Will create 1 tower.'}
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Tower Label / Base Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tower or Block Alpha"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Apartment Total no. per Tower *
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={bCapacity}
                  onChange={(e) => setBCapacity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  min={1}
                  max={500}
                  placeholder="e.g. 50"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Each tower will automatically instantiate rows 1 to {bCapacity || 'N'} with default types.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Site / Location Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={bSiteName}
                  onChange={(e) => setBSiteName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Initial Report Date *
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={bReportDate}
                  onChange={(e) => setBReportDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Material Weight (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    className="form-control"
                    value={bMatWeight}
                    onChange={(e) => setBMatWeight(parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Execution Weight (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    className="form-control"
                    value={bExecWeight}
                    onChange={(e) => setBExecWeight(parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating layout rows...' : `➕ Provision ${bCount > 1 ? `${bCount} Towers` : 'Tower'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Building Modal */}
      {editingBuilding && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-small" style={{ maxWidth: '450px' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              ✏️ Edit Tower Configuration
            </h3>

            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSaveBuildingConfig}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Tower Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Apartment Qty Capacity *
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="500"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 1)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Changing capacity automatically adds new apartment rows or trims excess rows.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Site / Location Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editSiteName}
                  onChange={(e) => setEditSiteName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingBuilding(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Tower Modal */}
      {showCopyModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-small" style={{ maxWidth: '450px' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              📋 Copy Tower Data
            </h3>

            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCopyBuildingData}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Source Tower / Building *
                </label>
                <select
                  className="form-control"
                  value={sourceBuildingId}
                  onChange={(e) => setSourceBuildingId(e.target.value)}
                  required
                >
                  <option value="">-- Select Source Tower --</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.capacity} units)</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  All material/installation progress, planning dates, assignments, unit types, and QC gates will be copied.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Target Tower / Building *
                </label>
                <select
                  className="form-control"
                  value={targetBuildingId}
                  onChange={(e) => setTargetBuildingId(e.target.value)}
                  required
                >
                  <option value="">-- Select Target Tower --</option>
                  {buildings.filter(b => b.id !== sourceBuildingId).map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.capacity} units)</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Data will be mapped to target apartments by Sr No.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setCopyConfirmed(!copyConfirmed)}>
                <input
                  type="checkbox"
                  checked={copyConfirmed}
                  onChange={() => { }}
                  style={{ marginTop: '0.2rem' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 600 }}>
                  I understand that this action is permanent and will completely overwrite the progress data of the target tower.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCopyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#3b82f6', borderColor: '#2563eb' }} disabled={copying}>
                  {copying ? 'Copying data...' : '📋 Copy Tower Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
