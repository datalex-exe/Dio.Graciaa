import React, { useState, useEffect } from 'react';
import api from '../api.js';

function DashboardsSection({ user, orderId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('executive'); // 'executive' | 'towers' | 'stage' | 'director' | 'operations' | 'handover'

  useEffect(() => {
    fetchAnalytics();
  }, [orderId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}/analytics`);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch project analytics:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading project dashboards and aggregations...</div>;
  }

  if (!data) {
    return <div className="card">No dashboard metrics available. Make sure towers and apartments are configured.</div>;
  }

  const { headerMetadata, towerSummary, typeSummary, stageAnalysis } = data;
  const siteTotal = towerSummary.find(t => t.id === 'site-total') || {};
  const towersList = towerSummary.filter(t => t.id !== 'site-total');

  // Reusable Color helper for Health and Risk columns
  const getHealthBadgeClass = (health) => {
    if (!health) return 'health-watch';
    const h = health.toLowerCase();
    if (h.includes('excellent') || h.includes('good') || h.includes('normal')) return 'health-excellent';
    if (h.includes('watch')) return 'health-watch';
    if (h.includes('delay')) return 'health-delayed';
    if (h.includes('critical') || h.includes('high') || h.includes('rectification')) return 'health-critical';
    return 'health-watch';
  };

  const formatPct = (val) => `${((val || 0) * 100).toFixed(1)}%`;
  const formatCurrency = (val) => `₹${(val || 0).toLocaleString()}`;

  return (
    <div className="dashboards-container">
      {/* Sub-tab Picker for the 6 Dashboards */}
      <div className="tabs" style={{ background: 'rgba(30, 41, 59, 0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div className={`tab ${activeSubTab === 'executive' ? 'active' : ''}`} onClick={() => setActiveSubTab('executive')}>
          📊 Executive Summary
        </div>
        <div className={`tab ${activeSubTab === 'towers' ? 'active' : ''}`} onClick={() => setActiveSubTab('towers')}>
          🏢 Master Tower Rollup
        </div>
        <div className={`tab ${activeSubTab === 'stage' ? 'active' : ''}`} onClick={() => setActiveSubTab('stage')}>
          📈 Stage Analysis
        </div>
        <div className={`tab ${activeSubTab === 'director' ? 'active' : ''}`} onClick={() => setActiveSubTab('director')}>
          👨‍💼 Project Director
        </div>
        <div className={`tab ${activeSubTab === 'operations' ? 'active' : ''}`} onClick={() => setActiveSubTab('operations')}>
          ⚙️ Operations Details
        </div>
        <div className={`tab ${activeSubTab === 'handover' ? 'active' : ''}`} onClick={() => setActiveSubTab('handover')}>
          🔑 Handover Tracker
        </div>
      </div>

      {/* Header Metadata Strip */}
      <div className="card" style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div><b>Site:</b> <span style={{ color: 'white' }}>{headerMetadata.siteName}</span></div>
          <div><b>Report Date:</b> <span style={{ color: 'white' }}>{headerMetadata.reportDate}</span></div>
          <div><b>Project Manager:</b> <span style={{ color: 'white' }}>{headerMetadata.projectManager}</span></div>
          <div><b>Client:</b> <span style={{ color: 'white' }}>{headerMetadata.client}</span></div>
          <div><b>Target Completion:</b> <span style={{ color: 'white' }}>{headerMetadata.targetCompletion}</span></div>
          <div><b>Prepared By:</b> <span style={{ color: 'white' }}>{headerMetadata.preparedBy}</span></div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE DASHBOARD                                        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'executive' && (
        <div className="dashboard-view-executive">
          {/* Main KPI Row */}
          <div className="kpi-row">
            <div className="kpi-card" style={{ borderTop: '4px solid var(--accent-blue)' }}>
              <div className="kpi-card-label">Total Apartments</div>
              <div className="kpi-card-value">{siteTotal.apartments}</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid var(--status-mat-ready-bg)' }}>
              <div className="kpi-card-label">Material Inward/Ready</div>
              <div className="kpi-card-value">{siteTotal.materialInwardReady}</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid var(--status-executing-bg)' }}>
              <div className="kpi-card-label">Execution In Progress</div>
              <div className="kpi-card-value">{siteTotal.executionInProgress}</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid var(--health-critical-border)' }}>
              <div className="kpi-card-label">QC Issues (Pending+Rejected)</div>
              <div className="kpi-card-value" style={{ color: 'var(--health-critical-text)' }}>
                {siteTotal.qcPending + siteTotal.qcRejected}
              </div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid var(--status-ready-bg)' }}>
              <div className="kpi-card-label">Ready for Handover</div>
              <div className="kpi-card-value">{siteTotal.readyForHandover}</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '4px solid var(--health-excellent-text)' }}>
              <div className="kpi-card-label">Completed</div>
              <div className="kpi-card-value" style={{ color: 'var(--health-excellent-text)' }}>
                {siteTotal.completed}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Overall Site Completion Gauge */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <h3 className="card-title">Overall Site Completion</h3>
              <div style={{ position: 'relative', width: '160px', height: '160px', margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* SVG circular progress indicator */}
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#cyanBlueGrad)" strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (siteTotal.overallCompletionPct || 0))}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="cyanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-cyan)" />
                      <stop offset="100%" stopColor="var(--accent-blue)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  {formatPct(siteTotal.overallCompletionPct)}
                </div>
              </div>
              <span className={`badge ${getHealthBadgeClass(siteTotal.health)}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Site Health: {siteTotal.health}
              </span>
            </div>

            {/* Tower Performance Summary */}
            <div className="card" style={{ flex: 2, overflowX: 'auto' }}>
              <h3 className="card-title">🏢 Tower Performance</h3>
              <table className="billing-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Tower</th>
                    <th>Apartments</th>
                    <th>K/W/V/D Units</th>
                    <th>Material Inw %</th>
                    <th>Overall %</th>
                    <th>In Progress</th>
                    <th>QC Issues</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {towersList.map(t => (
                    <tr key={t.id}>
                      <td><b>{t.tower}</b></td>
                      <td>{t.apartments}</td>
                      <td>{t.kitchenUnits}/{t.wardrobeUnits}/{t.vanityUnits}/{t.doorUnits}</td>
                      <td>{formatPct(t.materialInwardPct)}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{formatPct(t.overallCompletionPct)}</td>
                      <td>{t.executionInProgress}</td>
                      <td style={{ color: (t.qcPending + t.qcRejected) > 0 ? '#f87171' : 'inherit' }}>
                        {t.qcPending + t.qcRejected}
                      </td>
                      <td>{t.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unit Type mini summary */}
          <div className="card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <h3 className="card-title">📦 Unit Type Checklist Completion</h3>
            <table className="billing-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Type Code</th>
                  <th>Product</th>
                  <th>Type Name</th>
                  <th>Units</th>
                  <th>Execution Completion %</th>
                  <th>QC/Handover Complete %</th>
                </tr>
              </thead>
              <tbody>
                {typeSummary.map((ts, idx) => (
                  <tr key={idx}>
                    <td><b>{ts.typeCode}</b></td>
                    <td>{ts.product}</td>
                    <td>{ts.typeName}</td>
                    <td>{ts.units}</td>
                    <td>{formatPct(ts.executionPct)}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{formatPct(ts.qcHandoverPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MASTER TOWER SUMMARY                                        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'towers' && (
        <div className="dashboard-view-towers card" style={{ overflowX: 'auto' }}>
          <h3 className="card-title">🏢 Master Towers Ledger Rollup</h3>
          <table className="billing-table" style={{ fontSize: '0.75rem', minWidth: '1500px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th>Tower</th>
                <th>Apartments</th>
                <th>Kit Qty</th>
                <th>Ward Qty</th>
                <th>Van Qty</th>
                <th>Door Qty</th>
                <th>Material Inward %</th>
                <th>Kitchen Comp %</th>
                <th>Wardrobe Comp %</th>
                <th>Vanity Comp %</th>
                <th>Door Comp %</th>
                <th>Overall Comp %</th>
                <th>Not Started</th>
                <th>Material Inw/Ready</th>
                <th>Exec In Progress</th>
                <th>Ready Handover</th>
                <th>Completed</th>
                <th>Delayed</th>
                <th>Critical</th>
                <th>Health</th>
                <th>QC Pending</th>
                <th>QC Rejected</th>
              </tr>
            </thead>
            <tbody>
              {towerSummary.map(t => {
                const isTotalRow = t.id === 'site-total';
                return (
                  <tr key={t.id} className={isTotalRow ? 'sum-row' : ''} style={{ borderBottom: isTotalRow ? 'none' : '1px solid var(--border-color)' }}>
                    <td><b>{t.tower}</b></td>
                    <td>{t.apartments}</td>
                    <td>{t.kitchenUnits}</td>
                    <td>{t.wardrobeUnits}</td>
                    <td>{t.vanityUnits}</td>
                    <td>{t.doorUnits}</td>
                    <td>{formatPct(t.materialInwardPct)}</td>
                    <td>{formatPct(t.kitchenCompletionPct)}</td>
                    <td>{formatPct(t.wardrobeCompletionPct)}</td>
                    <td>{formatPct(t.vanityCompletionPct)}</td>
                    <td>{formatPct(t.doorCompletionPct)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{formatPct(t.overallCompletionPct)}</td>
                    <td>{t.notStarted}</td>
                    <td>{t.materialInwardReady}</td>
                    <td>{t.executionInProgress}</td>
                    <td>{t.readyForHandover}</td>
                    <td>{t.completed}</td>
                    <td style={{ color: t.delayedApartments > 0 ? '#fb923c' : 'inherit' }}>{t.delayedApartments}</td>
                    <td style={{ color: t.criticalApartments > 0 ? '#f87171' : 'inherit' }}>{t.criticalApartments}</td>
                    <td>
                      <span className={`badge ${getHealthBadgeClass(t.health)}`}>
                        {t.health}
                      </span>
                    </td>
                    <td>{t.qcPending}</td>
                    <td style={{ color: t.qcRejected > 0 ? '#f87171' : 'inherit' }}>{t.qcRejected}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STAGE ANALYSIS                                             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'stage' && (
        <div className="dashboard-view-stage card" style={{ overflowX: 'auto' }}>
          <h3 className="card-title">📈 Checklist Stage Progress Matrix</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Displays the weighted-average completion percentage for each specific checklist item per building, and the overall Site Average.
          </p>
          <table className="billing-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th>Checklist Item</th>
                {stageAnalysis.headers.map((h, idx) => (
                  <th key={idx} style={{ textAlign: 'center', fontWeight: h.includes('Average') ? 'bold' : 'normal' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Group 1: Material */}
              <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
                <td colSpan={stageAnalysis.headers.length + 1} style={{ color: 'var(--accent-blue)', padding: '0.5rem 1rem' }}>
                  📦 Stage 1: Material Inward Checklist
                </td>
              </tr>
              {stageAnalysis.rows.filter(r => r.category.startsWith('Material')).map((row, idx) => (
                <tr key={idx}>
                  <td style={{ paddingLeft: '1.5rem' }}>{row.label}</td>
                  {row.values.map((val, vIdx) => {
                    const isLast = vIdx === row.values.length - 1;
                    return (
                      <td key={vIdx} style={{ textAlign: 'center', fontWeight: isLast ? 'bold' : 'normal', color: isLast ? 'var(--accent-cyan)' : 'inherit' }}>
                        {formatPct(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Group 2: Execution */}
              <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
                <td colSpan={stageAnalysis.headers.length + 1} style={{ color: 'var(--accent-purple)', padding: '0.5rem 1rem' }}>
                  🔨 Stage 2: Execution & Installation Checklist
                </td>
              </tr>
              {stageAnalysis.rows.filter(r => r.category.startsWith('Execution')).map((row, idx) => (
                <tr key={idx}>
                  <td style={{ paddingLeft: '1.5rem' }}>{row.label}</td>
                  {row.values.map((val, vIdx) => {
                    const isLast = vIdx === row.values.length - 1;
                    return (
                      <td key={vIdx} style={{ textAlign: 'center', fontWeight: isLast ? 'bold' : 'normal', color: isLast ? 'var(--accent-cyan)' : 'inherit' }}>
                        {formatPct(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PROJECT DIRECTOR DASHBOARD                                 */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'director' && (
        <div className="dashboard-view-director">
          {/* Tower Risk & Action Table */}
          <div className="card" style={{ overflowX: 'auto' }}>
            <h3 className="card-title">⚠️ Towers Risk Analysis & Action Plan</h3>
            <table className="billing-table" style={{ fontSize: '0.75rem', minWidth: '1120px' }}>
              <thead>
                <tr>
                  <th>Tower</th>
                  <th>Apartments</th>
                  <th>Material Inw %</th>
                  <th>Overall Progress</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>QC Pending</th>
                  <th>QC Rejected</th>
                  <th>Ready Handover</th>
                  <th>Kit %</th>
                  <th>Ward %</th>
                  <th>Van %</th>
                  <th>Door %</th>
                  <th>Health</th>
                  <th style={{ fontWeight: 'bold', color: 'var(--accent-purple)' }}>Required Action</th>
                </tr>
              </thead>
              <tbody>
                {towerSummary.map(t => {
                  const isTotalRow = t.id === 'site-total';
                  
                  // Compute Required Action locally
                  let requiredAction = "Normal Monitoring";
                  if (t.apartments === 0) {
                    requiredAction = "No Data";
                  } else if (t.qcRejected > 0) {
                    requiredAction = "QC Rectification";
                  } else if (t.qcPending > 0) {
                    requiredAction = "Complete QC";
                  } else if (t.executionInProgress > 10) {
                    requiredAction = "Increase Execution Team";
                  } else if (t.overallCompletionPct < 0.5) {
                    requiredAction = "Recovery Plan";
                  }

                  return (
                    <tr key={t.id} className={isTotalRow ? 'sum-row' : ''}>
                      <td><b>{t.tower}</b></td>
                      <td>{t.apartments}</td>
                      <td>{formatPct(t.materialInwardPct)}</td>
                      <td>{formatPct(t.overallCompletionPct)}</td>
                      <td>{t.completed}</td>
                      <td>{t.executionInProgress}</td>
                      <td>{t.qcPending}</td>
                      <td style={{ color: t.qcRejected > 0 ? '#f87171' : 'inherit' }}>{t.qcRejected}</td>
                      <td>{t.readyForHandover}</td>
                      <td>{formatPct(t.kitchenCompletionPct)}</td>
                      <td>{formatPct(t.wardrobeCompletionPct)}</td>
                      <td>{formatPct(t.vanityCompletionPct)}</td>
                      <td>{formatPct(t.doorCompletionPct)}</td>
                      <td>
                        <span className={`badge ${getHealthBadgeClass(t.health)}`}>
                          {t.health}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>
                        <span className={`badge ${getHealthBadgeClass(requiredAction)}`} style={{ textTransform: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', width: '100%', display: 'inline-block' }}>
                          {requiredAction}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Unit Type Risk Analysis */}
          <div className="card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <h3 className="card-title">📦 Unit Types Status Risk Matrix</h3>
            <table className="billing-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Type Code</th>
                  <th>Product</th>
                  <th>TypeName</th>
                  <th>Units Count</th>
                  <th>Execution %</th>
                  <th>QC/Handover Status</th>
                  <th style={{ fontWeight: 'bold', color: 'var(--accent-purple)' }}>Risk Profile</th>
                </tr>
              </thead>
              <tbody>
                {typeSummary.map((ts, idx) => {
                  // Compute Risk Status
                  let risk = "Normal";
                  if (ts.units === 0) {
                    risk = "No Units";
                  } else if (ts.qcHandoverPct < 0.5) {
                    risk = "High";
                  } else if (ts.qcHandoverPct < 0.8) {
                    risk = "Watch";
                  }

                  return (
                    <tr key={idx}>
                      <td><b>{ts.typeCode}</b></td>
                      <td>{ts.product}</td>
                      <td>{ts.typeName}</td>
                      <td>{ts.units}</td>
                      <td>{formatPct(ts.executionPct)}</td>
                      <td>{formatPct(ts.qcHandoverPct)}</td>
                      <td style={{ fontWeight: 'bold' }}>
                        <span className={`badge ${getHealthBadgeClass(risk)}`} style={{ padding: '0.3rem 0.75rem', width: '120px' }}>
                          {risk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. OPERATIONS DASHBOARD                                       */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'operations' && (
        <div className="dashboard-view-operations">
          {/* Full Unit Type summary */}
          <div className="card" style={{ overflowX: 'auto' }}>
            <h3 className="card-title">⚙️ Unit Type Specifications & Commercial Values</h3>
            <table className="billing-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Type Code</th>
                  <th>Product</th>
                  <th>TypeName</th>
                  <th>Units</th>
                  <th>Material Inw %</th>
                  <th>Execution %</th>
                  <th>QC/Handover %</th>
                  <th style={{ color: 'var(--accent-cyan)' }}>Client Contract Value</th>
                </tr>
              </thead>
              <tbody>
                {typeSummary.map((ts, idx) => (
                  <tr key={idx}>
                    <td><b>{ts.typeCode}</b></td>
                    <td>{ts.product}</td>
                    <td>{ts.typeName}</td>
                    <td>{ts.units}</td>
                    <td>{formatPct(ts.materialReceivedPct)}</td>
                    <td>{formatPct(ts.executionPct)}</td>
                    <td>{formatPct(ts.qcHandoverPct)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{formatCurrency(ts.clientContractValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Product Category rollup panels */}
          <div className="card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <h3 className="card-title">🗂️ Product Rollup Aggregations</h3>
            <table className="billing-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th>Product Category</th>
                  <th>Total Units (Site)</th>
                  <th>Material Inw %</th>
                  <th>Execution %</th>
                  <th>QC / Handover %</th>
                  <th>Overall Site %</th>
                </tr>
              </thead>
              <tbody>
                {["Kitchen", "Wardrobe", "Vanity", "Door"].map(prod => {
                  const matchingTypes = typeSummary.filter(ts => ts.product === prod);
                  
                  // Compute weighted averages across matchingTypes weighted by Units
                  const totalUnits = matchingTypes.reduce((sum, t) => sum + t.units, 0);
                  const sumMat = matchingTypes.reduce((sum, t) => sum + (t.materialReceivedPct * t.units), 0);
                  const sumExec = matchingTypes.reduce((sum, t) => sum + (t.executionPct * t.units), 0);
                  const sumQC = matchingTypes.reduce((sum, t) => sum + (t.qcHandoverPct * t.units), 0);

                  const avgMat = totalUnits > 0 ? (sumMat / totalUnits) : 0.0;
                  const avgExec = totalUnits > 0 ? (sumExec / totalUnits) : 0.0;
                  const avgQC = totalUnits > 0 ? (sumQC / totalUnits) : 0.0;

                  // Overall site percentage for this product category (from Tower Summary total row)
                  let overallSitePct = 0.0;
                  if (prod === "Kitchen") overallSitePct = siteTotal.kitchenCompletionPct;
                  if (prod === "Wardrobe") overallSitePct = siteTotal.wardrobeCompletionPct;
                  if (prod === "Vanity") overallSitePct = siteTotal.vanityCompletionPct;
                  if (prod === "Door") overallSitePct = siteTotal.doorCompletionPct;

                  return (
                    <tr key={prod}>
                      <td><b>{prod}s</b></td>
                      <td>{totalUnits} units</td>
                      <td>{formatPct(avgMat)}</td>
                      <td>{formatPct(avgExec)}</td>
                      <td>{formatPct(avgQC)}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{formatPct(overallSitePct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. HANDOVER DASHBOARD                                         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'handover' && (
        <div className="dashboard-view-handover">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Tower Handover Summary */}
            <div className="card" style={{ flex: 1, overflowX: 'auto' }}>
              <h3 className="card-title">🔑 Towers Handover Status</h3>
              <table className="billing-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Tower</th>
                    <th>QC Pend</th>
                    <th>QC Rej</th>
                    <th>Ready</th>
                    <th>Completed</th>
                    <th>Delayed</th>
                    <th>Overall %</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {towersList.map(t => (
                    <tr key={t.id}>
                      <td><b>{t.tower}</b></td>
                      <td>{t.qcPending}</td>
                      <td style={{ color: t.qcRejected > 0 ? '#f87171' : 'inherit' }}>{t.qcRejected}</td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{t.readyForHandover}</td>
                      <td>{t.completed}</td>
                      <td style={{ color: t.delayedApartments > 0 ? '#fb923c' : 'inherit' }}>{t.delayedApartments}</td>
                      <td>{formatPct(t.overallCompletionPct)}</td>
                      <td>
                        <span className={`badge ${getHealthBadgeClass(t.health)}`}>
                          {t.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unit Type Handover & Pending units */}
            <div className="card" style={{ flex: 1, overflowX: 'auto' }}>
              <h3 className="card-title">📦 Unit Types Pending QC / Handover</h3>
              <table className="billing-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Type Code</th>
                    <th>Product</th>
                    <th>Units</th>
                    <th>QC/Handover %</th>
                    <th style={{ color: '#fb923c', fontWeight: 'bold' }}>Pending Units</th>
                  </tr>
                </thead>
                <tbody>
                  {typeSummary.map((ts, idx) => {
                    const pendingUnits = ts.units * (1 - ts.qcHandoverPct);
                    return (
                      <tr key={idx}>
                        <td><b>{ts.typeCode}</b></td>
                        <td>{ts.product}</td>
                        <td>{ts.units}</td>
                        <td>{formatPct(ts.qcHandoverPct)}</td>
                        <td style={{ fontWeight: 'bold', color: pendingUnits > 0 ? '#fb923c' : '#34d399' }}>
                          {pendingUnits.toFixed(1)} units
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardsSection;
