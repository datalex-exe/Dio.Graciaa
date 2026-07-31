import React from 'react';

function KPIHeader({ building, apartments = [] }) {
  const count = apartments.length;
  
  // Calculate aggregated stats
  let sumCompletion = 0.0;
  let completedCount = 0;
  let execInProgress = 0;
  let readyForHandover = 0;
  let materialReady = 0;
  let materialInward = 0;
  let delayedCount = 0;
  let qcRejectedCount = 0;
  let totalKitchenUnits = 0;
  let totalWardrobeVanityUnits = 0;
  let totalDoorUnits = 0;

  for (const apt of apartments) {
    sumCompletion += apt.overallCompletionPct || 0.0;
    
    // Status
    if (apt.apartmentStatus === "Completed") completedCount++;
    else if (apt.apartmentStatus === "Execution In Progress") execInProgress++;
    else if (apt.apartmentStatus === "Ready for Handover") readyForHandover++;
    else if (apt.apartmentStatus === "Material Ready") materialReady++;
    else if (apt.apartmentStatus === "Material Inward") materialInward++;
    else if (apt.apartmentStatus === "QC Rejected") qcRejectedCount++;

    // Health
    if (apt.health === "Delayed" || apt.health === "Critical") {
      delayedCount++;
    }

    // Units
    totalKitchenUnits += apt.kitchenQty || 0;
    totalWardrobeVanityUnits += (apt.wardrobeQty || 0) + (apt.vanityQty || 0);
    totalDoorUnits += apt.doorQty || 0;
  }

  const overallAvg = count > 0 ? (sumCompletion / count) : 0.0;

  return (
    <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)', borderLeft: '4px solid var(--accent-blue)', padding: '1.25rem' }}>
      {/* Building Meta Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>🏗️ {building.name} Summary</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Location Site: <b>{building.siteName}</b> | Capacity: <b>{building.capacity} Apartments</b>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Report Snapshot Date:</span>{' '}
            <b style={{ color: 'white' }}>{new Date(building.reportDate).toLocaleDateString()}</b>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Formula Weights:</span>{' '}
            <b style={{ color: 'white' }}>Mat: {building.materialWeight} / Exec: {building.executionWeight}</b>
          </div>
        </div>
      </div>

      {/* 15 Metrics grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Metric 1 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Overall Progress</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{(overallAvg * 100).toFixed(1)}%</div>
        </div>

        {/* Metric 2 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{completedCount}</div>
        </div>

        {/* Metric 3 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb923c' }}>{execInProgress}</div>
        </div>

        {/* Metric 4 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ready Handover</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>{readyForHandover}</div>
        </div>

        {/* Metric 5 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Material Ready</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c7d2fe' }}>{materialReady}</div>
        </div>

        {/* Metric 6 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Material Inward</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e9d5ff' }}>{materialInward}</div>
        </div>

        {/* Metric 7 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Delayed / Critical</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{delayedCount}</div>
        </div>

        {/* Metric 8 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>QC Rejects</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{qcRejectedCount}</div>
        </div>

        {/* Metric 9 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kitchen Units</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>{totalKitchenUnits}</div>
        </div>

        {/* Metric 10 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ward+Vanity Qty</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2dd4bf' }}>{totalWardrobeVanityUnits}</div>
        </div>

        {/* Metric 11 */}
        <div style={{ background: 'rgba(15,23,42,0.4)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Door Units</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f472b6' }}>{totalDoorUnits}</div>
        </div>
      </div>
    </div>
  );
}

export default KPIHeader;
