import React, { useState, useEffect } from 'react';
import api from '../api.js';

function ClientRABill({ user, orderId }) {
  const [setup, setSetup] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchClientRABill();
  }, [orderId]);

  const fetchClientRABill = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}/billing/client-ra`);
      setSetup(res.data.setup);
      setLines(res.data.lines || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLineChange = (lineId, field, value) => {
    setLines(prev => prev.map(line => {
      if (line.id === lineId) {
        let parsedVal = value;
        const numFields = ['previousCertified', 'otherDeduction'];
        if (numFields.includes(field)) {
          parsedVal = value === '' ? null : parseFloat(value);
        }
        const updated = { ...line, [field]: parsedVal };

        // Live Recalculations on Frontend for instant feedback
        const include = updated.includeInCurrentRA ?? true;
        const cumulativeEligible = updated.cumulativeEligible || 0.0;
        const prevCertified = parseFloat(updated.previousCertified || 0) || 0.0;
        
        const currentGross = include ? Math.max(0, cumulativeEligible - prevCertified) : 0.0;

        const retentionPct = setup.clientRetentionPct || 5.0;
        const gstPct = setup.clientGSTPct || 18.0;

        const retentionAmt = currentGross * (retentionPct / 100.0);
        const gstAmt = currentGross * (gstPct / 100.0);
        const otherDeduction = parseFloat(updated.otherDeduction || 0) || 0.0;

        const netRA = Math.max(0, currentGross - retentionAmt + gstAmt - otherDeduction);

        return {
          ...updated,
          currentGross: Math.round(currentGross * 100) / 100,
          retentionAmt: Math.round(retentionAmt * 100) / 100,
          gstAmt: Math.round(gstAmt * 100) / 100,
          netRA: Math.round(netRA * 100) / 100
        };
      }
      return line;
    }));
  };

  const handleSaveBills = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put(`/orders/${orderId}/billing/client-ra`, { lines });
      setSuccess('Client RA Bill ledger updated successfully.');
      fetchClientRABill(); // Refresh to sync database calculations
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save client RA ledger.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading client RA bill ledger...</div>;

  const readOnly = user.role !== 'ROLE_A';

  // Summaries
  const sumContractValue = lines.reduce((sum, l) => sum + (l.contractValue || 0), 0);
  const sumCumulativeEligible = lines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
  const sumCurrentGross = lines.reduce((sum, l) => sum + (l.currentGross || 0), 0);
  const sumNetRA = lines.reduce((sum, l) => sum + (l.netRA || 0), 0);

  return (
    <div className="client-ra-container">
      <div className="grid-controls-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3>📊 Client RA (Running Account) Bill Ledger</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Fully formula-driven billing values calculated directly from site execution data, with toggles to defer or include items.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              📦 Material Eligibility: <b>{setup?.clientMatEligiblePct ?? 100}%</b>
            </span>
            <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              ⚙️ Execution Eligibility: <b>{setup?.clientExecEligiblePct ?? 100}%</b>
            </span>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              🔑 Handover Eligibility: <b>{setup?.clientHandoverEligiblePct ?? 100}%</b>
            </span>
          </div>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={handleSaveBills} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Ledger'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ✅ {success}
        </div>
      )}

      {/* Grid Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
        <table className="billing-table" style={{ fontSize: '0.8rem', minWidth: '2100px' }}>
          <thead>
            <tr>
              <th style={{ width: '110px', background: 'rgba(255,255,255,0.05)' }}>Inc in current RA?</th>
              <th>Tower / Building</th>
              <th>Unit Type</th>
              <th>Product</th>
              <th>Units Count</th>
              <th>Client Rate (₹)</th>
              <th>Contract Value (₹)</th>
              <th style={{ background: 'rgba(59, 130, 246, 0.05)' }}>Mat Elig %</th>
              <th>Mat Elig Amt (₹)</th>
              <th style={{ background: 'rgba(59, 130, 246, 0.05)' }}>Exec Elig %</th>
              <th>Exec Elig Amt (₹)</th>
              <th style={{ background: 'rgba(59, 130, 246, 0.05)' }}>Handover Elig %</th>
              <th>Handover Elig Amt (₹)</th>
              <th style={{ fontWeight: 'bold' }}>Cum. Eligible (₹)</th>
              <th>Elig %</th>
              <th style={{ width: '130px', minWidth: '130px', background: 'rgba(255,255,255,0.05)' }}>Prev. Certified (₹)</th>
              <th style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Current Gross RA (₹)</th>
              <th>Retention ({setup.clientRetentionPct}%)</th>
              <th>GST ({setup.clientGSTPct}%)</th>
              <th style={{ width: '130px', minWidth: '130px', background: 'rgba(255,255,255,0.05)' }}>Deduction (₹)</th>
              <th style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Net Current RA (₹)</th>
              <th style={{ width: '220px', minWidth: '220px' }}>RA Bill No</th>
              <th style={{ width: '160px' }}>RA Bill Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan="24" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No apartments with unit types exist under this project yet.
                </td>
              </tr>
            ) : (
              lines.map(line => (
                <tr key={line.id} style={{ opacity: line.includeInCurrentRA ? 1 : 0.6 }}>
                  {/* Toggle Include */}
                  <td style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={line.includeInCurrentRA}
                      onChange={(e) => handleLineChange(line.id, 'includeInCurrentRA', e.target.checked)}
                      disabled={readOnly}
                    />
                  </td>

                  <td><b>{line.buildingName}</b></td>
                  <td>{line.unitType?.typeCode}</td>
                  <td>{line.unitType?.product}</td>
                  <td>{line.unitsCount} units</td>
                  <td>₹{line.rateUnit?.toLocaleString()}</td>
                  <td>₹{line.contractValue?.toLocaleString()}</td>

                  {/* Automatic milestone rollups */}
                  <td style={{ background: 'rgba(59, 130, 246, 0.02)', fontWeight: 'bold', textAlign: 'center' }}>
                    {(line.materialEligibilityPct * 100).toFixed(1)}%
                  </td>
                  <td>₹{line.materialEligibleAmt?.toLocaleString()}</td>
                  <td style={{ background: 'rgba(59, 130, 246, 0.02)', fontWeight: 'bold', textAlign: 'center' }}>
                    {(line.executionEligibilityPct * 100).toFixed(1)}%
                  </td>
                  <td>₹{line.executionEligibleAmt?.toLocaleString()}</td>
                  <td style={{ background: 'rgba(59, 130, 246, 0.02)', fontWeight: 'bold', textAlign: 'center' }}>
                    {(line.handoverEligibilityPct * 100).toFixed(1)}%
                  </td>
                  <td>₹{line.handoverEligibleAmt?.toLocaleString()}</td>

                  <td style={{ fontWeight: 'bold' }}>₹{line.cumulativeEligible?.toLocaleString()}</td>
                  <td>{(line.overallEligPct * 100).toFixed(1)}%</td>

                  {/* Manual Input 1: Previous Certified */}
                  <td style={{ background: 'rgba(255,255,255,0.02)', minWidth: '130px', width: '130px' }}>
                    <input
                      type="number"
                      className="input-cell"
                      value={line.previousCertified !== null && line.previousCertified !== undefined ? line.previousCertified : ''}
                      onChange={(e) => handleLineChange(line.id, 'previousCertified', e.target.value)}
                      disabled={readOnly}
                      style={{ border: '1px solid var(--border-focus)' }}
                    />
                  </td>

                  {/* Current Gross */}
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                    ₹{line.currentGross?.toLocaleString()}
                  </td>

                  <td>₹{line.retentionAmt?.toLocaleString()}</td>
                  <td>₹{line.gstAmt?.toLocaleString()}</td>

                  {/* Manual Input 2: Other Deduction */}
                  <td style={{ background: 'rgba(255,255,255,0.02)', minWidth: '130px', width: '130px' }}>
                    <input
                      type="number"
                      className="input-cell"
                      value={line.otherDeduction !== null && line.otherDeduction !== undefined ? line.otherDeduction : ''}
                      onChange={(e) => handleLineChange(line.id, 'otherDeduction', e.target.value)}
                      disabled={readOnly}
                      style={{ border: '1px solid var(--border-focus)' }}
                    />
                  </td>

                  {/* Net RA */}
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.05)' }}>
                    ₹{line.netRA?.toLocaleString()}
                  </td>

                  {/* RA Bill details */}
                  <td style={{ minWidth: '180px' }}>
                    <input
                      type="text"
                      className="input-cell"
                      value={line.raBillNo || ''}
                      onChange={(e) => handleLineChange(line.id, 'raBillNo', e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="input-cell"
                      value={line.raBillDate ? line.raBillDate.split('T')[0] : ''}
                      onChange={(e) => handleLineChange(line.id, 'raBillDate', e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-cell"
                      value={line.remarks || ''}
                      onChange={(e) => handleLineChange(line.id, 'remarks', e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                </tr>
              ))
            )}

            {/* Totals Row */}
            {lines.length > 0 && (
              <tr className="sum-row">
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td colSpan="5">TOTALS</td>
                <td>₹{sumContractValue.toLocaleString()}</td>
                <td style={{ background: 'rgba(59, 130, 246, 0.05)' }}>-</td>
                <td>-</td>
                <td style={{ background: 'rgba(59, 130, 246, 0.05)' }}>-</td>
                <td>-</td>
                <td style={{ background: 'rgba(59, 130, 246, 0.05)' }}>-</td>
                <td>-</td>
                <td>₹{sumCumulativeEligible.toLocaleString()}</td>
                <td>-</td>
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td style={{ color: 'var(--accent-cyan)' }}>₹{sumCurrentGross.toLocaleString()}</td>
                <td>-</td>
                <td>-</td>
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td style={{ color: 'var(--accent-cyan)' }}>₹{sumNetRA.toLocaleString()}</td>
                <td colSpan="3">-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientRABill;
