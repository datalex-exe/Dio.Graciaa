import React, { useState, useEffect } from 'react';
import api from '../api.js';

function BillingDashboard({ user, orderId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [orderId]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}/billing/dashboard`);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading billing dashboard analytics...</div>;
  if (!data) return <div className="card">No billing dashboard data available.</div>;

  const { summary, unitTypeTable, contractorTable } = data;

  return (
    <div className="billing-dashboard-container">
      {/* Row 1 KPI Cards */}
      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
        Contractor Payables & Client Contract base
      </h4>
      <div className="kpi-row">
        <div className="kpi-card" style={{ borderTop: '4px solid #a78bfa' }}>
          <div className="kpi-card-label">Contractor WO Value</div>
          <div className="kpi-card-value">₹{summary.contractorWOValue?.toLocaleString()}</div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #a78bfa' }}>
          <div className="kpi-card-label">Contractor Cum. Eligible</div>
          <div className="kpi-card-value">₹{summary.contractorCumulativeEligible?.toLocaleString()}</div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #fb923c' }}>
          <div className="kpi-card-label">Current Contractor Payable</div>
          <div className="kpi-card-value" style={{ color: '#f87171' }}>
            ₹{summary.contractorNetPayable?.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #60a5fa' }}>
          <div className="kpi-card-label">Client Contract Value</div>
          <div className="kpi-card-value">₹{summary.clientContractValue?.toLocaleString()}</div>
        </div>
      </div>

      {/* Row 2 KPI Cards */}
      <h4 style={{ margin: '1.5rem 0 0.75rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
        Client RA Recognition & Cash Flow Surplus
      </h4>
      <div className="kpi-row">
        <div className="kpi-card" style={{ borderTop: '4px solid #60a5fa' }}>
          <div className="kpi-card-label">Client Cum. Eligible</div>
          <div className="kpi-card-value">₹{summary.clientCumulativeEligible?.toLocaleString()}</div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #34d399' }}>
          <div className="kpi-card-label">Current Selected RA</div>
          <div className="kpi-card-value" style={{ color: '#34d399' }}>
            ₹{summary.clientCurrentGrossSelectedRA?.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #2dd4bf' }}>
          <div className="kpi-card-label">Billing Net Surplus</div>
          <div className="kpi-card-value" style={{ color: summary.billingSurplus >= 0 ? '#34d399' : '#f87171' }}>
            ₹{summary.billingSurplus?.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #2dd4bf' }}>
          <div className="kpi-card-label">Client Eligibility Pct</div>
          <div className="kpi-card-value">
            {(summary.clientEligibilityPct * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tables section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Table 1: Rollup by Unit Type */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 className="card-title">📦 Recognition Rollup by Unit Type Code</h3>
          <table className="billing-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Type Code</th>
                <th>Category</th>
                <th>Units Count</th>
                <th>Contract Value</th>
                <th>Material Eligible</th>
                <th>Execution Eligible</th>
                <th>Handover Eligible</th>
              </tr>
            </thead>
            <tbody>
              {unitTypeTable.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No unit type data active.
                  </td>
                </tr>
              ) : (
                unitTypeTable.map(row => (
                  <tr key={row.typeCode}>
                    <td><b>{row.typeCode}</b></td>
                    <td>{row.product}</td>
                    <td>{row.units} units</td>
                    <td>₹{row.contractValue?.toLocaleString()}</td>
                    <td>₹{row.materialEligibleAmt?.toLocaleString()}</td>
                    <td>₹{row.executionEligibleAmt?.toLocaleString()}</td>
                    <td>₹{row.handoverEligibleAmt?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Rollup by Contractor */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 className="card-title">👷 Ledger Summary by Contractor ID</h3>
          <table className="billing-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Contractor ID</th>
                <th>Unit Type Code</th>
                <th>Installation Completion</th>
                <th>Net Payable Amount</th>
              </tr>
            </thead>
            <tbody>
              {contractorTable.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No active contractor ID ledger entries found.
                  </td>
                </tr>
              ) : (
                contractorTable.map((row, idx) => (
                  <tr key={idx}>
                    <td><b>{row.contractor}</b></td>
                    <td>{row.unitType}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.eligibilityPct}%`, background: '#8b5cf6' }} />
                        </div>
                        <span>{row.eligibilityPct}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      ₹{row.netPayable?.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BillingDashboard;
