import React, { useState, useEffect } from 'react';
import api from '../api.js';

function BillingSetup({ user, orderId, buildings }) {
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Accordion active state
  const [expandedSection, setExpandedSection] = useState('global'); // 'global' | 'unit-rates' | 'contractor-milestones' | 'client-milestones' | 'tower-rates'

  // Subsections fields
  const [globalParams, setGlobalParams] = useState({});
  const [unitTypeRates, setUnitTypeRates] = useState([]);
  const [contractorMilestones, setContractorMilestones] = useState([]);
  const [clientRAMilestones, setClientRAMilestones] = useState([]);
  const [towerClientRates, setTowerClientRates] = useState([]);

  // Active sub-tabs inside Milestones section
  const [contractorActiveProd, setContractorActiveProd] = useState('Kitchen');
  const [clientActiveProd, setClientActiveProd] = useState('Kitchen');

  useEffect(() => {
    fetchSetup();
  }, [orderId]);

  const fetchSetup = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}/billing/setup`);
      const data = res.data;
      setSetup(data);
      
      setGlobalParams({
        contractorRetentionPct: data.contractorRetentionPct,
        contractorGSTPct: data.contractorGSTPct,
        contractorTDSPct: data.contractorTDSPct,
        clientRetentionPct: data.clientRetentionPct,
        clientGSTPct: data.clientGSTPct,
        clientOtherDeduction: data.clientOtherDeduction,
        clientMatEligiblePct: data.clientMatEligiblePct,
        clientExecEligiblePct: data.clientExecEligiblePct,
        clientHandoverEligiblePct: data.clientHandoverEligiblePct,
        billingPeriodFrom: data.billingPeriodFrom ? data.billingPeriodFrom.split('T')[0] : '',
        billingPeriodTo: data.billingPeriodTo ? data.billingPeriodTo.split('T')[0] : '',
        billDate: data.billDate ? data.billDate.split('T')[0] : ''
      });

      setUnitTypeRates(data.unitTypeRates || []);
      setContractorMilestones(data.contractorMilestones || []);
      setClientRAMilestones(data.clientRAMilestones || []);
      
      // Initialize tower client rates: for every building, ensure there is a row
      const existingTowerRates = data.towerClientRates || [];
      const initializedTowerRates = buildings.map(b => {
        const existing = existingTowerRates.find(tr => tr.buildingId === b.id);
        return {
          buildingId: b.id,
          buildingName: b.name,
          kitchenRate: existing ? existing.kitchenRate : 0,
          wardrobeRate: existing ? existing.wardrobeRate : 0,
          vanityRate: existing ? existing.vanityRate : 0,
          doorRate: existing ? existing.doorRate : 0
        };
      });
      setTowerClientRates(initializedTowerRates);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    setGlobalParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUnitRateChange = (idx, field, val) => {
    setUnitTypeRates(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleAddUnitRate = () => {
    setUnitTypeRates(prev => [
      ...prev,
      {
        typeCode: `NEW-TYPE-${prev.length + 1}`,
        product: 'Kitchen',
        typeName: 'New Custom Unit Type',
        contractorRate: 0,
        clientRate: 0,
        includeInCurrentRA: true
      }
    ]);
  };

  const handleRemoveUnitRate = (idx) => {
    setUnitTypeRates(prev => prev.filter((_, i) => i !== idx));
  };

  const handleContractorMilestoneChange = (idx, val) => {
    setContractorMilestones(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, percentage: parseFloat(val) || 0 };
      }
      return item;
    }));
  };

  const handleClientMilestoneChange = (idx, val) => {
    setClientRAMilestones(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, percentage: parseFloat(val) || 0 };
      }
      return item;
    }));
  };

  const handleTowerRateChange = (buildingId, productField, val) => {
    setTowerClientRates(prev => prev.map(tr => {
      if (tr.buildingId === buildingId) {
        return { ...tr, [productField]: parseFloat(val) || 0 };
      }
      return tr;
    }));
  };

  // Sum validations
  const getContractorMilestoneSum = (prod) => {
    return contractorMilestones
      .filter(m => m.product === prod)
      .reduce((sum, m) => sum + (m.percentage || 0), 0);
  };

  const getClientMilestoneSum = (prod) => {
    return clientRAMilestones
      .filter(m => m.product === prod)
      .reduce((sum, m) => sum + (m.percentage || 0), 0);
  };

  const handleSaveSetup = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    // 1. Validate Contractor Milestones sum to 100%
    const products = ['Kitchen', 'Wardrobe', 'Vanity', 'Door'];
    for (const p of products) {
      const cSum = getContractorMilestoneSum(p);
      if (Math.abs(cSum - 100.0) > 0.01) {
        setError(`Contractor milestones for ${p} must sum to exactly 100%. Current sum: ${cSum}%`);
        setSaving(false);
        return;
      }
    }

    // 2. Validate Client RA Eligibility settings sum to 100%
    const globalMat = parseFloat(globalParams.clientMatEligiblePct || 0);
    const globalExec = parseFloat(globalParams.clientExecEligiblePct || 0);
    const globalHandover = parseFloat(globalParams.clientHandoverEligiblePct || 0);
    const globalSum = globalMat + globalExec + globalHandover;
    if (Math.abs(globalSum - 100.0) > 0.01) {
      setError(`Client Eligibility settings (Material + Execution + Handover) must sum to exactly 100%. Current sum: ${globalSum}%`);
      setSaving(false);
      return;
    }

    // 3. Auto-scale client milestones to match the new global eligibility settings
    const updatedClientRAMilestones = clientRAMilestones.map(m => {
      const category = m.recognitionType;
      const currentSum = clientRAMilestones
        .filter(x => x.product === m.product && x.recognitionType === category)
        .reduce((sum, x) => sum + (x.percentage || 0), 0);

      if (currentSum > 0) {
        const targetSum = category === 'MATERIAL' ? globalMat : (category === 'EXECUTION' ? globalExec : globalHandover);
        const ratio = targetSum / currentSum;
        return {
          ...m,
          percentage: Math.round(m.percentage * ratio * 100) / 100
        };
      }
      return m;
    });

    try {
      const payload = {
        ...globalParams,
        unitTypeRates,
        contractorMilestones,
        clientRAMilestones: updatedClientRAMilestones,
        towerClientRates
      };

      await api.put(`/orders/${orderId}/billing/setup`, payload);
      setSuccess('Billing configurations saved successfully.');
      fetchSetup();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update billing setup.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading billing configurations...</div>;

  const readOnly = user.role !== 'ROLE_A';

  return (
    <div className="billing-setup-container">
      <div className="grid-controls-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3>⚙️ Project Billing Configuration</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Setup parameters, rate tables, tower overrides and recognition milestone weights.
          </p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={handleSaveSetup} disabled={saving}>
            {saving ? 'Saving changes...' : '💾 Save Setup Configurations'}
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

      {/* SECTION A: GLOBAL PARAMS */}
      <div className="accordion">
        <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'global' ? '' : 'global')}>
          <span>A. Global parameters & Client RA Eligibility % Settings</span>
          <span>{expandedSection === 'global' ? '▲' : '▼'}</span>
        </div>
        {expandedSection === 'global' && (
          <div className="accordion-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Contractor Retention %</label>
                <input
                  type="number"
                  name="contractorRetentionPct"
                  className="form-control"
                  value={globalParams.contractorRetentionPct || 0}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group">
                <label>Contractor GST %</label>
                <input
                  type="number"
                  name="contractorGSTPct"
                  className="form-control"
                  value={globalParams.contractorGSTPct || 0}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group">
                <label>Contractor TDS %</label>
                <input
                  type="number"
                  name="contractorTDSPct"
                  className="form-control"
                  value={globalParams.contractorTDSPct || 0}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group">
                <label>Client Retention %</label>
                <input
                  type="number"
                  name="clientRetentionPct"
                  className="form-control"
                  value={globalParams.clientRetentionPct || 0}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group">
                <label>Client GST %</label>
                <input
                  type="number"
                  name="clientGSTPct"
                  className="form-control"
                  value={globalParams.clientGSTPct || 0}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group">
                <label>Billing cycle date</label>
                <input
                  type="date"
                  name="billDate"
                  className="form-control"
                  value={globalParams.billDate || ''}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                />
              </div>
              <div className="form-group" style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.75rem' }}>
                <label>Client Material Eligibility %</label>
                <input
                  type="number"
                  name="clientMatEligiblePct"
                  className="form-control"
                  value={globalParams.clientMatEligiblePct ?? 100}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                  min={0}
                  max={100}
                />
              </div>
              <div className="form-group" style={{ borderLeft: '3px solid #f97316', paddingLeft: '0.75rem' }}>
                <label>Client Execution Eligibility %</label>
                <input
                  type="number"
                  name="clientExecEligiblePct"
                  className="form-control"
                  value={globalParams.clientExecEligiblePct ?? 100}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                  min={0}
                  max={100}
                />
              </div>
              <div className="form-group" style={{ borderLeft: '3px solid #10b981', paddingLeft: '0.75rem' }}>
                <label>Client Handover Eligibility %</label>
                <input
                  type="number"
                  name="clientHandoverEligiblePct"
                  className="form-control"
                  value={globalParams.clientHandoverEligiblePct ?? 100}
                  onChange={handleGlobalChange}
                  disabled={readOnly}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: UNIT TYPES */}
      <div className="accordion">
        <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'unit-rates' ? '' : 'unit-rates')}>
          <span>B. Unit type standard contract rates</span>
          <span>{expandedSection === 'unit-rates' ? '▲' : '▼'}</span>
        </div>
        {expandedSection === 'unit-rates' && (
          <div className="accordion-body">
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', padding: '0.75rem' }}>
              <table className="billing-table" style={{ minWidth: '1100px', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Type Code</th>
                    <th>Product Category</th>
                    <th>Type Name Label</th>
                    <th>Contractor Rate / Unit (₹)</th>
                    <th>Client Rate / Unit (₹)</th>
                    <th>Include in Current RA</th>
                    {!readOnly && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {unitTypeRates.map((ut, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="input-cell"
                          value={ut.typeCode}
                          onChange={(e) => handleUnitRateChange(idx, 'typeCode', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <select
                          className="input-cell"
                          value={ut.product}
                          onChange={(e) => handleUnitRateChange(idx, 'product', e.target.value)}
                          disabled={readOnly}
                        >
                          <option value="Kitchen">Kitchen</option>
                          <option value="Wardrobe">Wardrobe</option>
                          <option value="Vanity">Vanity</option>
                          <option value="Door">Door</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input-cell"
                          value={ut.typeName}
                          onChange={(e) => handleUnitRateChange(idx, 'typeName', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={ut.contractorRate}
                          onChange={(e) => handleUnitRateChange(idx, 'contractorRate', parseFloat(e.target.value) || 0)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={ut.clientRate}
                          onChange={(e) => handleUnitRateChange(idx, 'clientRate', parseFloat(e.target.value) || 0)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={ut.includeInCurrentRA}
                          onChange={(e) => handleUnitRateChange(idx, 'includeInCurrentRA', e.target.checked)}
                          disabled={readOnly}
                        />
                      </td>
                      {!readOnly && (
                        <td>
                          <button type="button" className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveUnitRate(idx)}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!readOnly && (
              <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleAddUnitRate}>
                ➕ Add New Unit Type Row
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION C: CONTRACTOR MILESTONES */}
      <div className="accordion">
        <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'contractor-milestones' ? '' : 'contractor-milestones')}>
          <span>C. Contractor installation milestone % weights</span>
          <span>{expandedSection === 'contractor-milestones' ? '▲' : '▼'}</span>
        </div>
        {expandedSection === 'contractor-milestones' && (
          <div className="accordion-body">
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              {['Kitchen', 'Wardrobe', 'Vanity', 'Door'].map(p => (
                <div key={p} className={`tab ${contractorActiveProd === p ? 'active' : ''}`} onClick={() => setContractorActiveProd(p)}>
                  {p} ({getContractorMilestoneSum(p)}%)
                </div>
              ))}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', padding: '0.75rem' }}>
              <table className="billing-table" style={{ minWidth: '600px', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Installation Milestone Stage Name</th>
                    <th style={{ width: '150px' }}>Payout Weight %</th>
                  </tr>
                </thead>
                <tbody>
                  {contractorMilestones
                    .map((m, idx) => ({ ...m, originalIndex: idx }))
                    .filter(m => m.product === contractorActiveProd)
                    .map(m => (
                      <tr key={m.id || m.originalIndex}>
                        <td>{m.milestoneName}</td>
                        <td>
                          <input
                            type="number"
                            className="input-cell"
                            value={m.percentage}
                            onChange={(e) => handleContractorMilestoneChange(m.originalIndex, e.target.value)}
                            disabled={readOnly}
                            max={100}
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                  <tr style={{ fontWeight: 'bold', background: 'rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ textAlign: 'left', paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>Total Payout %</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        color: Math.abs(getContractorMilestoneSum(contractorActiveProd) - 100) < 0.01 ? '#10b981' : '#ef4444',
                        background: Math.abs(getContractorMilestoneSum(contractorActiveProd) - 100) < 0.01 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: Math.abs(getContractorMilestoneSum(contractorActiveProd) - 100) < 0.01 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.9rem'
                      }}>
                        {Math.round(getContractorMilestoneSum(contractorActiveProd) * 100) / 100}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION D: CLIENT MILESTONES */}
      <div className="accordion">
        <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'client-milestones' ? '' : 'client-milestones')}>
          <span>D. Client RA automatic eligibility % weights</span>
          <span>{expandedSection === 'client-milestones' ? '▲' : '▼'}</span>
        </div>
        {expandedSection === 'client-milestones' && (
          <div className="accordion-body">
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              {['Kitchen', 'Wardrobe', 'Vanity', 'Door'].map(p => (
                <div key={p} className={`tab ${clientActiveProd === p ? 'active' : ''}`} onClick={() => setClientActiveProd(p)}>
                  {p} ({getClientMilestoneSum(p)}%)
                </div>
              ))}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', padding: '0.75rem' }}>
              <table className="billing-table" style={{ minWidth: '850px', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Recognition Category</th>
                    <th>Milestone Component Name</th>
                    <th>Apartment Field key mapping</th>
                    <th style={{ width: '150px' }}>Eligibility Weight %</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRAMilestones
                    .map((m, idx) => ({ ...m, originalIndex: idx }))
                    .filter(m => m.product === clientActiveProd)
                    .map(m => (
                      <tr key={m.id || m.originalIndex}>
                        <td>
                          <span className="badge" style={{ background: m.recognitionType === 'MATERIAL' ? '#1e3a8a' : (m.recognitionType === 'EXECUTION' ? '#7c2d12' : '#064e3b') }}>
                            {m.recognitionType}
                          </span>
                        </td>
                        <td>{m.milestoneName}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{m.fieldKey}</td>
                        <td>
                          <input
                            type="number"
                            className="input-cell"
                            value={m.percentage}
                            onChange={(e) => handleClientMilestoneChange(m.originalIndex, e.target.value)}
                            disabled={readOnly}
                            max={100}
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                  <tr style={{ fontWeight: 'bold', background: 'rgba(255, 255, 255, 0.05)' }}>
                    <td colSpan={3} style={{ textAlign: 'left', paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>Total Eligibility %</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        color: Math.abs(getClientMilestoneSum(clientActiveProd) - 100) < 0.01 ? '#10b981' : '#ef4444',
                        background: Math.abs(getClientMilestoneSum(clientActiveProd) - 100) < 0.01 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: Math.abs(getClientMilestoneSum(clientActiveProd) - 100) < 0.01 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.9rem'
                      }}>
                        {Math.round(getClientMilestoneSum(clientActiveProd) * 100) / 100}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION E: TOWER OVERRIDES */}
      <div className="accordion">
        <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'tower-rates' ? '' : 'tower-rates')}>
          <span>E. Tower-wise client contract rates overrides (Optional)</span>
          <span>{expandedSection === 'tower-rates' ? '▲' : '▼'}</span>
        </div>
        {expandedSection === 'tower-rates' && (
          <div className="accordion-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Set flat contract overrides per tower. If a field is set to 0, the system automatically uses the standard Unit Type rates defined in Section B.
            </p>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', padding: '0.75rem' }}>
              <table className="billing-table" style={{ minWidth: '850px', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Tower / Building Name</th>
                    <th>Kitchen Client Rate / Unit override (₹)</th>
                    <th>Wardrobe Client Rate / Unit override (₹)</th>
                    <th>Vanity Client Rate / Unit override (₹)</th>
                    <th>Door Client Rate / Unit override (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {towerClientRates.map((tr) => (
                    <tr key={tr.buildingId}>
                      <td style={{ fontWeight: 600 }}>{tr.buildingName}</td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={tr.kitchenRate}
                          onChange={(e) => handleTowerRateChange(tr.buildingId, 'kitchenRate', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={tr.wardrobeRate}
                          onChange={(e) => handleTowerRateChange(tr.buildingId, 'wardrobeRate', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={tr.vanityRate}
                          onChange={(e) => handleTowerRateChange(tr.buildingId, 'vanityRate', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input-cell"
                          value={tr.doorRate}
                          onChange={(e) => handleTowerRateChange(tr.buildingId, 'doorRate', e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BillingSetup;
