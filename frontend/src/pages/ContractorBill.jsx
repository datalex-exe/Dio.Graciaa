import React, { useState, useEffect } from 'react';
import api from '../api.js';

function ContractorBill({ user, orderId }) {
  const [setup, setSetup] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContractorBills();
  }, [orderId]);

  const fetchContractorBills = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}/billing/contractor`);
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
        const numFields = ['eligibleUnitEquivalent', 'previousCertified', 'otherDeduction'];
        if (numFields.includes(field)) {
          parsedVal = value === '' ? null : parseFloat(value);
        }
        const updated = { ...line, [field]: parsedVal };
        
        // Live Recalculation on Frontend for instant feedback
        const rate = updated.rateUnit || 0;
        const allocated = updated.allocatedUnits || 0;
        const eligible = parseFloat(updated.eligibleUnitEquivalent || 0) || 0;
        
        const woValue = rate * allocated;
        const cumulativeEligible = rate * eligible;
        const eligibilityPct = allocated > 0 ? (eligible / allocated) : 0;
        
        const prevCertified = parseFloat(updated.previousCertified || 0) || 0;
        const currentGross = Math.max(0, cumulativeEligible - prevCertified);
        
        const retentionPct = setup.contractorRetentionPct || 5.0;
        const gstPct = setup.contractorGSTPct || 18.0;
        const tdsPct = setup.contractorTDSPct || 1.0;
        
        const retentionAmt = currentGross * (retentionPct / 100.0);
        const gstAmt = currentGross * (gstPct / 100.0);
        const tdsAmt = currentGross * (tdsPct / 100.0);
        const otherDeduction = parseFloat(updated.otherDeduction || 0) || 0;
        
        const netPayable = Math.max(0, currentGross - retentionAmt + gstAmt - tdsAmt - otherDeduction);

        return {
          ...updated,
          woValue: Math.round(woValue * 100) / 100,
          eligibilityPct: Math.round(eligibilityPct * 1000) / 1000,
          cumulativeEligible: Math.round(cumulativeEligible * 100) / 100,
          currentGross: Math.round(currentGross * 100) / 100,
          retentionAmt: Math.round(retentionAmt * 100) / 100,
          gstAmt: Math.round(gstAmt * 100) / 100,
          tdsAmt: Math.round(tdsAmt * 100) / 100,
          netPayable: Math.round(netPayable * 100) / 100
        };
      }
      return line;
    }));
  };

  const handleAddManualLine = () => {
    if (!setup?.unitTypeRates || setup.unitTypeRates.length === 0) {
      alert('Please configure Unit Types in Billing Setup first.');
      return;
    }
    const defaultType = setup.unitTypeRates[0];
    const newLine = {
      id: `temp_manual_${Date.now()}`,
      contractorName: 'New Contractor ID',
      unitTypeId: defaultType.id,
      unitType: defaultType,
      rateUnit: defaultType.contractorRate,
      allocatedUnits: 0,
      eligibleUnitEquivalent: 0,
      eligibilityPct: 0,
      woValue: 0,
      cumulativeEligible: 0,
      previousCertified: 0,
      currentGross: 0,
      retentionAmt: 0,
      gstAmt: 0,
      tdsAmt: 0,
      otherDeduction: 0,
      netPayable: 0,
      billNo: '',
      billDate: null,
      remarks: ''
    };
    setLines(prev => [...prev, newLine]);
  };

  const handleUnitTypeSelect = (lineId, typeId) => {
    const selectedUT = setup.unitTypeRates.find(ut => ut.id === typeId);
    if (!selectedUT) return;

    setLines(prev => prev.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          unitTypeId: typeId,
          unitType: selectedUT,
          rateUnit: selectedUT.contractorRate
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
      await api.put(`/orders/${orderId}/billing/contractor`, { lines });
      setSuccess('Contractor Running Bill ledger updated successfully.');
      fetchContractorBills(); // Refresh to sync database calculations
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save contractor ledger.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading contractor running bill ledger...</div>;

  const readOnly = user.role !== 'ROLE_A';

  // Summaries
  const sumWOValue = lines.reduce((sum, l) => sum + (l.woValue || 0), 0);
  const sumCumulativeEligible = lines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
  const sumCurrentGross = lines.reduce((sum, l) => sum + (l.currentGross || 0), 0);
  const sumNetPayable = lines.reduce((sum, l) => sum + (l.netPayable || 0), 0);

  return (
    <div className="contractor-bill-container">
      <div className="grid-controls-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3>👷 Contractor running Bill Ledger (by Contractor ID)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Assess work-done quantities and calculate contractor payables incorporating GST, TDS, and Retentions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!readOnly && (
            <button className="btn btn-secondary" onClick={handleAddManualLine}>
              ➕ Add Bill Line
            </button>
          )}
          {!readOnly && (
            <button className="btn btn-primary" onClick={handleSaveBills} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Ledger'}
            </button>
          )}
        </div>
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
        <table className="billing-table" style={{ fontSize: '0.8rem', minWidth: '1900px' }}>
          <thead>
            <tr>
              <th>Contractor ID</th>
              <th>Unit Type</th>
              <th>Product</th>
              <th>Rate / Unit (₹)</th>
              <th>Allocated Units</th>
              <th style={{ width: '130px', minWidth: '130px', background: 'rgba(255,255,255,0.05)' }}>Eligible Eq.</th>
              <th>Eligibility %</th>
              <th>WO Value (₹)</th>
              <th>Cum. Eligible (₹)</th>
              <th style={{ width: '130px', minWidth: '130px', background: 'rgba(255,255,255,0.05)' }}>Prev. Certified (₹)</th>
              <th>Current Gross (₹)</th>
              <th>Retention ({setup.contractorRetentionPct}%)</th>
              <th>GST ({setup.contractorGSTPct}%)</th>
              <th>TDS ({setup.contractorTDSPct}%)</th>
              <th style={{ width: '130px', minWidth: '130px', background: 'rgba(255,255,255,0.05)' }}>Deduction (₹)</th>
              <th style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Net Payable (₹)</th>
              <th style={{ width: '220px', minWidth: '220px' }}>Bill No</th>
              <th style={{ width: '160px' }}>Bill Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan="19" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No contractor IDs have been assigned to apartments in this project grid yet.
                </td>
              </tr>
            ) : (
              lines.map(line => (
                <tr key={line.id}>
                  {/* Contractor Name */}
                  <td>
                    {line.id.startsWith('temp_manual_') ? (
                      <input
                        type="text"
                        className="input-cell"
                        value={line.contractorName}
                        onChange={(e) => handleLineChange(line.id, 'contractorName', e.target.value)}
                        disabled={readOnly}
                        placeholder="Contractor ID"
                      />
                    ) : (
                      <b>{line.contractorName}</b>
                    )}
                  </td>

                  {/* Unit Type Dropdown */}
                  <td>
                    {line.id.startsWith('temp_manual_') ? (
                      <select
                        className="input-cell"
                        value={line.unitTypeId}
                        onChange={(e) => handleUnitTypeSelect(line.id, e.target.value)}
                        disabled={readOnly}
                      >
                        {setup.unitTypeRates.map(ut => <option key={ut.id} value={ut.id}>{ut.typeCode}</option>)}
                      </select>
                    ) : (
                      <span>{line.unitType?.typeCode}</span>
                    )}
                  </td>

                  <td>{line.unitType?.product}</td>
                  <td>₹{line.rateUnit?.toLocaleString()}</td>
                  <td>{line.allocatedUnits} units</td>

                  {/* Manual input 1: Eligible Unit Equivalent */}
                  <td style={{ background: 'rgba(255,255,255,0.02)', minWidth: '130px', width: '130px' }}>
                    <input
                      type="number"
                      step="0.1"
                      className="input-cell"
                      value={line.eligibleUnitEquivalent !== null && line.eligibleUnitEquivalent !== undefined ? line.eligibleUnitEquivalent : ''}
                      onChange={(e) => handleLineChange(line.id, 'eligibleUnitEquivalent', e.target.value)}
                      disabled={readOnly}
                      style={{ border: '1px solid var(--border-focus)' }}
                    />
                  </td>

                  <td>{(line.eligibilityPct * 100).toFixed(1)}%</td>
                  <td>₹{line.woValue?.toLocaleString()}</td>
                  <td>₹{line.cumulativeEligible?.toLocaleString()}</td>

                  {/* Manual input 2: Previous Certified */}
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

                  <td className="highlight-col">₹{line.currentGross?.toLocaleString()}</td>
                  <td>₹{line.retentionAmt?.toLocaleString()}</td>
                  <td>₹{line.gstAmt?.toLocaleString()}</td>
                  <td>₹{line.tdsAmt?.toLocaleString()}</td>

                  {/* Manual input 3: Other Deduction */}
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

                  {/* Net Current Payable */}
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.05)' }}>
                    ₹{line.netPayable?.toLocaleString()}
                  </td>

                  {/* Bill No, Date, Remarks */}
                  <td style={{ minWidth: '180px' }}>
                    <input
                      type="text"
                      className="input-cell"
                      value={line.billNo || ''}
                      onChange={(e) => handleLineChange(line.id, 'billNo', e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="input-cell"
                      value={line.billDate ? line.billDate.split('T')[0] : ''}
                      onChange={(e) => handleLineChange(line.id, 'billDate', e.target.value)}
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
                <td colSpan="4">TOTALS</td>
                <td>-</td>
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td>-</td>
                <td>₹{sumWOValue.toLocaleString()}</td>
                <td>₹{sumCumulativeEligible.toLocaleString()}</td>
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td>₹{sumCurrentGross.toLocaleString()}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td style={{ background: 'rgba(255,255,255,0.05)' }}>-</td>
                <td style={{ color: 'var(--accent-cyan)' }}>₹{sumNetPayable.toLocaleString()}</td>
                <td colSpan="3">-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ContractorBill;
