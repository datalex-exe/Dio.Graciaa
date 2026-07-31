import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import KPIHeader from '../components/KPIHeader.jsx';

const EDITABLE_FIELDS = [
  'srNo',
  'apartmentNo',
  'floor',
  'priority',
  'kitchenQty',
  'wardrobeQty',
  'vanityQty',
  'doorQty',
  'supervisorName',
  // Group 2
  'kitchenLowerCarcassInward',
  'kitchenUpperCarcassInward',
  'kitchenStoneInward',
  'kitchenShutterInward',
  'kitchenHardwareInward',
  'kitchenApplianceInward',
  'wardrobeCabinetInward',
  'wardrobeShutterHardwareInward',
  'vanityCabinetInward',
  'vanityShutterHardwareInward',
  'doorFrameHardwareInward',
  // Group 3
  'kitchenLowerCarcassInstalled',
  'kitchenUpperCarcassInstalled',
  'kitchenStoneInstalled',
  'kitchenShutterHardwareInstalled',
  'kitchenApplianceInstalled',
  'kitchenHandedOver',
  'wardrobeCabinetInstalled',
  'wardrobeShutterHardwareInstalled',
  'wardrobeHandedOver',
  'vanityCabinetInstalled',
  'vanityShutterHardwareInstalled',
  'vanityHandedOver',
  'doorFrameHardwareInstalled',
  'doorHandedOver',
  // Group 4
  'plannedStart',
  'plannedCompletion',
  'actualStart',
  'actualCompletion',
  'contractor',
  'contractorName',
  'delayReason',
  'remarks',
  // Group 6
  'kitchenQC_VisibleScrews',
  'kitchenQC_Chipping',
  'kitchenQC_FillerMissing',
  'kitchenQC_Scratches',
  'kitchenQC_DrawersFunction',
  'kitchenQC_CutleryTray',
  'kitchenQC_DishDrainer',
  'wardrobeQC_VisibleScrews',
  'wardrobeQC_Chipping',
  'wardrobeQC_FillerMissing',
  'wardrobeQC_Scratches',
  'wardrobeQC_DrawersFunction',
  'vanityQC_VisibleScrews',
  'vanityQC_Chipping',
  'vanityQC_FillerMissing',
  'vanityQC_Scratches',
  'vanityQC_DrawersFunction',
  'doorQC_Chipping',
  'doorQC_Alignment',
  // Group 8
  'kitchenType',
  'wardrobeType',
  'vanityType',
  'doorType'
];

const parseMultiTypes = (typeStr, qty = 0) => {
  if (!typeStr) return [];
  if (typeStr.startsWith('[')) {
    try {
      return JSON.parse(typeStr);
    } catch (e) { }
  }
  return typeStr ? [{ type: typeStr, qty: qty || 0 }] : [];
};

const formatMultiTypes = (typeStr, qty) => {
  if (!typeStr) return '-';
  if (typeStr.startsWith('[')) {
    try {
      const list = JSON.parse(typeStr);
      if (list.length === 0) return '-';
      return list.map(item => `${item.type} (${item.qty})`).join(', ');
    } catch (e) { }
  }
  return typeStr ? `${typeStr} (${qty || 0})` : '-';
};

function BuildingGrid({ user, orderId, buildingId, navigate }) {
  const [building, setBuilding] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [activeMultiEdit, setActiveMultiEdit] = useState(null);

  // Unsaved changes local state
  const [modifiedApartments, setModifiedApartments] = useState({});

  // Snapshot of the last server-fetched apartments — used to determine lock state.
  // This is NOT updated by handleCellChange so it always reflects saved-to-DB values.
  const savedApartmentsRef = useRef([]);

  // Excel-like drag states
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState(null);
  const [dragCurrentColIndex, setDragCurrentColIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filters state
  const [floorFilter, setFloorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');
  const [delayedOnly, setDelayedOnly] = useState(false);

  // Audit Logs drawer states
  const [selectedAptLogs, setSelectedAptLogs] = useState(null); // apartment object
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchBuildingData();
  }, [buildingId]);

  const fetchBuildingData = async () => {
    try {
      setLoading(true);
      const bRes = await api.get(`/buildings/${buildingId}`);
      setBuilding(bRes.data);

      const aRes = await api.get(`/buildings/${buildingId}/apartments`);
      setApartments(aRes.data);
      // Deep-clone so savedApartmentsRef is fully independent from the apartments state.
      // handleCellChange mutates apartments state in place, but this ref stays pristine.
      savedApartmentsRef.current = JSON.parse(JSON.stringify(aRes.data));

      // Load unit types from billing setup for dropdown selection
      try {
        const setupRes = await api.get(`/orders/${orderId}/billing/setup`);
        setUnitTypes(setupRes.data.unitTypeRates || []);
      } catch (err) {
        console.warn('Billing setup rates could not be loaded for dropdowns, using default fallbacks.');
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCellChange = (aptId, fieldName, value) => {
    let extraUpdates = {};

    if (fieldName === 'contractor') {
      if (value === building?.order?.contractorId) {
        extraUpdates.contractorName = building?.order?.contractorName || '';
      } else if (!value) {
        extraUpdates.contractorName = '';
      }
    } else if (fieldName === 'contractorName') {
      if (value === building?.order?.contractorName) {
        extraUpdates.contractor = building?.order?.contractorId || '';
      } else if (!value) {
        extraUpdates.contractor = '';
      }
    }

    // 1. Update local display state immediately
    setApartments(prev => prev.map(apt => {
      if (apt.id === aptId) {
        return { ...apt, [fieldName]: value, ...extraUpdates };
      }
      return apt;
    }));

    // 2. Track changes locally for batch saving
    setModifiedApartments(prev => {
      const prevAptChanges = prev[aptId] || {};
      return {
        ...prev,
        [aptId]: {
          ...prevAptChanges,
          [fieldName]: value,
          ...extraUpdates
        }
      };
    });
  };

  const handleSaveChanges = async () => {
    const items = Object.entries(modifiedApartments).map(([id, updates]) => ({
      id,
      updates
    }));

    if (items.length === 0) return;

    setSavingId('all');
    try {
      await api.patch(`/buildings/${buildingId}/apartments/batch`, { items });
      setModifiedApartments({});
      await fetchBuildingData();
      alert('All changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDiscardChanges = () => {
    // Restore apartments to the last server-confirmed snapshot.
    // We deep-cloned it on fetch so it's fully independent of local edits.
    setApartments(JSON.parse(JSON.stringify(savedApartmentsRef.current)));
    setModifiedApartments({});
  };

  const handleGoBack = () => {
    if (Object.keys(modifiedApartments).length > 0) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        return;
      }
    }
    navigate('order-detail', { orderId });
  };

  const isFieldEditable = (fieldName) => {
    return user.role === 'ROLE_A';
  };

  /**
   * Returns true when a ROLE_B user should NOT be allowed to edit the given field
   * because it already has a SAVED (confirmed by server) non-zero / non-empty value.
   *
   * IMPORTANT: We read from savedApartmentsRef.current (the last server snapshot),
   * NOT from the live `apt` object which reflects unsaved local edits.
   * This ensures the cell only locks AFTER the user presses Save — not while typing.
   *
   * ROLE_A is never locked — admins can always correct data.
   */
  const isLockedForRoleB = (apt, fieldName) => {
    if (user.role !== 'ROLE_B') return false; // Only apply to ROLE_B

    // Look up the saved (server-confirmed) state for this apartment
    const savedApt = savedApartmentsRef.current.find(a => a.id === apt.id);
    if (!savedApt) return false; // If no saved record, nothing to lock against

    // Percentage fields (integers 0-100): locked once saved value > 0
    const pctFields = [
      'kitchenLowerCarcassInward', 'kitchenUpperCarcassInward', 'kitchenStoneInward',
      'kitchenShutterInward', 'kitchenHardwareInward', 'kitchenApplianceInward',
      'wardrobeCabinetInward', 'wardrobeShutterHardwareInward',
      'vanityCabinetInward', 'vanityShutterHardwareInward',
      'doorFrameHardwareInward',
      'kitchenLowerCarcassInstalled', 'kitchenUpperCarcassInstalled', 'kitchenStoneInstalled',
      'kitchenShutterHardwareInstalled', 'kitchenApplianceInstalled', 'kitchenHandedOver',
      'wardrobeCabinetInstalled', 'wardrobeShutterHardwareInstalled', 'wardrobeHandedOver',
      'vanityCabinetInstalled', 'vanityShutterHardwareInstalled', 'vanityHandedOver',
      'doorFrameHardwareInstalled', 'doorHandedOver',
    ];
    if (pctFields.includes(fieldName)) {
      return savedApt[fieldName] !== null && savedApt[fieldName] !== undefined;
    }

    // Text / date fields: locked once saved value is non-empty
    const textFields = [
      'plannedStart', 'plannedCompletion', 'actualStart', 'actualCompletion',
      'contractor', 'delayReason', 'remarks',
      'kitchenQC_VisibleScrews', 'kitchenQC_Chipping', 'kitchenQC_FillerMissing',
      'kitchenQC_Scratches', 'kitchenQC_DrawersFunction', 'kitchenQC_CutleryTray', 'kitchenQC_DishDrainer',
      'wardrobeQC_VisibleScrews', 'wardrobeQC_Chipping', 'wardrobeQC_FillerMissing',
      'wardrobeQC_Scratches', 'wardrobeQC_DrawersFunction',
      'vanityQC_VisibleScrews', 'vanityQC_Chipping', 'vanityQC_FillerMissing',
      'vanityQC_Scratches', 'vanityQC_DrawersFunction',
      'doorQC_Chipping', 'doorQC_Alignment',
    ];
    if (textFields.includes(fieldName)) {
      const val = savedApt[fieldName];
      return val !== null && val !== undefined && String(val).trim() !== '';
    }

    return false;
  };

  const handleDragHandleMouseDown = (e, aptId, fieldName, value, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const colIndex = EDITABLE_FIELDS.indexOf(fieldName);
    setIsDragging(true);
    setDragStart({ aptId, fieldName, startIndex: rowIndex, colIndex, value });
    setDragCurrentIndex(rowIndex);
    setDragCurrentColIndex(colIndex);
  };

  const handleCellMouseEnter = (rowIndex) => {
    if (isDragging && dragStart) {
      setDragCurrentIndex(rowIndex);
    }
  };

  const handleAddApartment = async () => {
    try {
      setSavingId('new');
      await api.post(`/buildings/${buildingId}/apartments`, {});
      fetchBuildingData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to add apartment row.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteApartment = async (aptId, aptNo) => {
    if (!window.confirm(`Are you sure you want to delete apartment "${aptNo || aptId}"?`)) {
      return;
    }
    try {
      setSavingId(aptId);
      await api.delete(`/apartments/${aptId}`);
      fetchBuildingData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete apartment row.');
    } finally {
      setSavingId(null);
    }
  };

  const handleViewAuditLogs = async (apt) => {
    setSelectedAptLogs(apt);
    setLoadingLogs(true);
    try {
      const res = await api.get(`/apartments/${apt.id}/audit-logs`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleExportExcel = () => {
    window.open(`/api/buildings/${buildingId}/export?token=${localStorage.getItem('dio_grace_token')}`, '_blank');
  };

  // Helper lists
  const floors = ['All', ...new Set(apartments.map(a => a.floor).filter(Boolean))];
  const statuses = [
    'All',
    'Not Started',
    'Material Inward',
    'Material Ready',
    'Execution In Progress',
    'Ready for Handover',
    'Completed',
    'QC Rejected',
    'QC Pending'
  ];
  const healths = ['All', 'Excellent', 'Good', 'Watch', 'Delayed', 'Critical'];

  // Filter logic
  const filteredApartments = apartments.filter(apt => {
    if (floorFilter !== 'All' && apt.floor !== floorFilter) return false;
    if (statusFilter !== 'All' && apt.apartmentStatus !== statusFilter) return false;
    if (healthFilter !== 'All' && apt.health !== healthFilter) return false;
    if (delayedOnly && apt.health !== 'Delayed' && apt.health !== 'Critical') return false;
    return true;
  });

  // Disable body text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  }, [isDragging]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging && dragStart) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const cell = elements.find(el => el.hasAttribute && el.hasAttribute('data-fieldname'));
        if (cell) {
          const fieldName = cell.getAttribute('data-fieldname');
          const colIndex = EDITABLE_FIELDS.indexOf(fieldName);
          const rowEl = cell.closest('tr');
          if (rowEl && colIndex !== -1) {
            const rowIndex = parseInt(rowEl.getAttribute('data-rowindex'), 10);
            if (!isNaN(rowIndex)) {
              setDragCurrentIndex(rowIndex);
              setDragCurrentColIndex(colIndex);
            }
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart) {
        const startIndex = dragStart.startIndex;
        const endIndex = dragCurrentIndex !== null ? dragCurrentIndex : startIndex;
        const startCol = dragStart.colIndex;
        const endCol = dragCurrentColIndex !== null ? dragCurrentColIndex : startCol;
        const startFieldName = dragStart.fieldName;
        const value = dragStart.value;

        const rowDelta = Math.abs(endIndex - startIndex);
        const colDelta = Math.abs(endCol - startCol);
        const isVerticalDrag = rowDelta >= colDelta;

        if (isVerticalDrag) {
          // Vertical Copy
          const minIdx = Math.min(startIndex, endIndex);
          const maxIdx = Math.max(startIndex, endIndex);
          const affectedApts = filteredApartments.slice(minIdx, maxIdx + 1);
          const affectedIds = new Set(affectedApts.map(a => a.id));

          setModifiedApartments(prevMod => {
            const nextMod = { ...prevMod };
            affectedApts.forEach(apt => {
              nextMod[apt.id] = {
                ...(nextMod[apt.id] || {}),
                [startFieldName]: value
              };
            });
            return nextMod;
          });

          setApartments(prev => prev.map(apt => {
            if (affectedIds.has(apt.id)) {
              return { ...apt, [startFieldName]: value };
            }
            return apt;
          }));
        } else {
          // Horizontal Copy
          const targetApt = filteredApartments[startIndex];
          if (targetApt) {
            const minCol = Math.min(startCol, endCol);
            const maxCol = Math.max(startCol, endCol);
            const affectedFields = EDITABLE_FIELDS.slice(minCol, maxCol + 1);
            const allowedFields = affectedFields.filter(isFieldEditable);

            setModifiedApartments(prevMod => {
              const prevAptMod = prevMod[targetApt.id] || {};
              const nextAptMod = { ...prevAptMod };
              allowedFields.forEach(field => {
                nextAptMod[field] = value;
              });
              return {
                ...prevMod,
                [targetApt.id]: nextAptMod
              };
            });

            setApartments(prev => prev.map(apt => {
              if (apt.id === targetApt.id) {
                const nextApt = { ...apt };
                allowedFields.forEach(field => {
                  nextApt[field] = value;
                });
                return nextApt;
              }
              return apt;
            }));
          }
        }
      }
      setIsDragging(false);
      setDragStart(null);
      setDragCurrentIndex(null);
      setDragCurrentColIndex(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragCurrentIndex, dragCurrentColIndex, filteredApartments]);

  const renderEditableCell = (apt, fieldName, rowIndex, disabled, content, extraProps = {}) => {
    const isModified = modifiedApartments[apt.id]?.[fieldName] !== undefined;

    // Check if dragging is locked to vertical or horizontal
    const isVerticalDrag = Math.abs((dragCurrentIndex || 0) - (dragStart?.startIndex || 0)) >= Math.abs((dragCurrentColIndex || 0) - (dragStart?.colIndex || 0));

    let isInDragRange = false;
    if (isDragging && dragStart) {
      if (isVerticalDrag) {
        isInDragRange = (dragStart.fieldName === fieldName) &&
          (rowIndex >= Math.min(dragStart.startIndex, dragCurrentIndex)) &&
          (rowIndex <= Math.max(dragStart.startIndex, dragCurrentIndex));
      } else {
        const thisColIdx = EDITABLE_FIELDS.indexOf(fieldName);
        const startColIdx = dragStart.colIndex;
        isInDragRange = (rowIndex === dragStart.startIndex) &&
          (thisColIdx !== -1) &&
          (thisColIdx >= Math.min(startColIdx, dragCurrentColIndex)) &&
          (thisColIdx <= Math.max(startColIdx, dragCurrentColIndex));
      }
    }

    const isSticky = extraProps.className?.includes('sticky-col');
    const cellStyle = {
      position: isSticky ? 'sticky' : 'relative',
      zIndex: isSticky ? 3 : 1,
      outline: isInDragRange ? '2px dashed #10b981' : (isModified ? '1.5px solid #eab308' : 'none'),
      paddingRight: !disabled ? '12px' : '4px',
      ...extraProps.style
    };

    if (isInDragRange) {
      cellStyle.backgroundColor = 'rgba(16, 185, 129, 0.2)';
    } else if (extraProps.style?.backgroundColor) {
      cellStyle.backgroundColor = extraProps.style.backgroundColor;
    } else if (extraProps.style?.background) {
      cellStyle.background = extraProps.style.background;
    }

    return (
      <td
        onMouseEnter={() => handleCellMouseEnter(rowIndex)}
        className={extraProps.className}
        style={cellStyle}
        data-fieldname={fieldName}
      >
        {content}
        {!disabled && (
          <div
            className="excel-drag-handle"
            onMouseDown={(e) => handleDragHandleMouseDown(e, apt.id, fieldName, apt[fieldName], rowIndex)}
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              backgroundColor: '#10b981',
              border: '1px solid #ffffff',
              borderRadius: '1px',
              cursor: 'ns-resize',
              zIndex: 10
            }}
            title="Drag down to copy value"
          />
        )}
      </td>
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge-completed';
      case 'Ready for Handover': return 'badge-ready';
      case 'Execution In Progress': return 'badge-progress';
      case 'Material Ready': return 'badge-mat-ready';
      case 'Material Inward': return 'badge-mat-inw';
      case 'QC Rejected': return 'badge-rejected';
      case 'QC Pending': return 'badge-pending';
      default: return 'badge-not-started';
    }
  };

  const getHealthClass = (health) => {
    switch (health) {
      case 'Excellent': return 'health-excellent';
      case 'Good': return 'health-good';
      case 'Delayed': return 'health-delayed';
      case 'Critical': return 'health-critical';
      default: return 'health-watch';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading spreadsheet grid...</div>;
  }

  if (!building) {
    return (
      <div className="card">
        <h3>Building Grid Not Found</h3>
        <button className="btn btn-secondary" onClick={() => navigate('order-detail', { orderId })}>
          Back to Order Details
        </button>
      </div>
    );
  }

  // Filter unit types by product
  const kitchenTypes = unitTypes.filter(ut => ut.product === 'Kitchen').map(ut => ut.typeCode);
  const wardrobeTypes = unitTypes.filter(ut => ut.product === 'Wardrobe').map(ut => ut.typeCode);
  const vanityTypes = unitTypes.filter(ut => ut.product === 'Vanity').map(ut => ut.typeCode);
  const doorTypes = unitTypes.filter(ut => ut.product === 'Door').map(ut => ut.typeCode);

  return (
    <div>
      {/* KPI Summary Block */}
      <KPIHeader building={building} apartments={apartments} />

      {/* Control Header & Filters */}
      <div className="grid-controls-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleGoBack}>
            ⬅️ Tower List
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ background: '#1e3a24', color: '#a7f3d0', borderColor: '#064e3b' }}>
            📥 Export Excel (.xlsx)
          </button>
          {user.role === 'ROLE_A' && (
            <button className="btn btn-primary" onClick={handleAddApartment}>
              ➕ Add Apartment Row
            </button>
          )}
          {Object.keys(modifiedApartments).length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(234, 179, 8, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(234, 179, 8, 0.2)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                ⚠️ Unsaved Changes
              </span>
              <button
                className="btn btn-primary"
                onClick={handleSaveChanges}
                style={{ background: '#10b981', borderColor: '#059669', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                disabled={savingId === 'all'}
              >
                {savingId === 'all' ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleDiscardChanges}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                disabled={savingId === 'all'}
              >
                Discard
              </button>
            </div>
          )}
          {savingId && savingId !== 'all' && (
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Saving calculations...
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-group">
            <label>Floor:</label>
            <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
              {floors.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Health:</label>
            <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
              {healths.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ cursor: 'pointer' }} onClick={() => setDelayedOnly(!delayedOnly)}>
            <input type="checkbox" checked={delayedOnly} readOnly />
            <span style={{ fontSize: '0.85rem' }}>⚠️ Delayed Only</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="grid-container">
        <table className="grid-table" style={{ minWidth: '10460px', tableLayout: 'fixed' }}>
          <thead>
            {/* Main Categories Group Headers */}
            <tr>
              <th colSpan="9" className="col-g1">Group 1: Apartment & Product details (Role A Setup)</th>
              <th colSpan="11" className="col-g2">Group 2: Stage 1 Material Inward (Role B Quantities)</th>
              <th colSpan="14" className="col-g3">Group 3: Stage 2 Execution/Installation (Role B Quantities)</th>
              <th colSpan="9" className="col-g4">Group 4: Planning & Remarks (Role B)</th>
              <th colSpan="9" className="col-g5">Group 5: Automatic Analysis (Formula Outputs)</th>
              <th colSpan="19" className="col-g6">Group 6: Quality Control Checkpoints (Role B Dropdowns)</th>
              <th colSpan="5" className="col-g7">Group 7: QC Approval & Handover</th>
              <th rowSpan="2" style={{ background: '#1e293b', borderLeft: '2px solid var(--border-color)', zIndex: 11, width: '140px', minWidth: '140px' }}>Audit</th>
            </tr>
            {/* Exact Field Columns */}
            <tr>
              {/* Group 1 */}
              <th className="sticky-col" style={{ left: 0, width: '70px', minWidth: '70px' }}>Sr No</th>
              <th className="sticky-col" style={{ left: '70px', width: '120px', minWidth: '120px' }}>Apt No</th>
              <th style={{ width: '100px', minWidth: '100px' }}>Floor</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Priority</th>
              <th style={{ width: '90px', minWidth: '90px' }}>Kit Qty</th>
              <th style={{ width: '90px', minWidth: '90px' }}>Ward Qty</th>
              <th style={{ width: '90px', minWidth: '90px' }}>Van Qty</th>
              <th style={{ width: '90px', minWidth: '90px' }}>Door Qty</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Supervisor</th>

              {/* Group 2 */}
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Low Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Upp Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Stone Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Shut Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Hard Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Appl Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Cab Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Shut Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Cab Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Shut Inw</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Door & Har Inw</th>

              {/* Group 3 */}
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Low Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Upp Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Stone Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Shut Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Appl Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Handed</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Cab Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Shut Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Handed</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Cab Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Shut Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Handed</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Door & Har Inst</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Door Handed</th>

              {/* Group 4 */}
              <th style={{ width: '150px', minWidth: '150px' }}>Plan Start</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Plan Comp</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Act Start</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Act Comp</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Contractor ID</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Contractor Name</th>
              <th style={{ width: '200px', minWidth: '200px' }}>Delay Reason</th>
              <th style={{ width: '220px', minWidth: '220px' }}>Remarks</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Responsible Eng</th>

              {/* Group 5 */}
              <th style={{ width: '120px', minWidth: '120px' }}>Mat Inward %</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Comp %</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Comp %</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Comp %</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Door Comp %</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Overall %</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Status</th>
              <th style={{ width: '110px', minWidth: '110px' }}>Delay Days</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Health</th>

              {/* Group 6 */}
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Screws</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Chips</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Filler</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Scratches</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Drawers</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Cutlery</th>
              <th style={{ width: '130px', minWidth: '130px' }}>K QC: Drainer</th>

              <th style={{ width: '130px', minWidth: '130px' }}>W QC: Screws</th>
              <th style={{ width: '130px', minWidth: '130px' }}>W QC: Chips</th>
              <th style={{ width: '130px', minWidth: '130px' }}>W QC: Filler</th>
              <th style={{ width: '130px', minWidth: '130px' }}>W QC: Scratches</th>
              <th style={{ width: '130px', minWidth: '130px' }}>W QC: Drawers</th>

              <th style={{ width: '130px', minWidth: '130px' }}>V QC: Screws</th>
              <th style={{ width: '130px', minWidth: '130px' }}>V QC: Chips</th>
              <th style={{ width: '130px', minWidth: '130px' }}>V QC: Filler</th>
              <th style={{ width: '130px', minWidth: '130px' }}>V QC: Scratches</th>
              <th style={{ width: '130px', minWidth: '130px' }}>V QC: Drawers</th>

              <th style={{ width: '130px', minWidth: '130px' }}>D QC: Chips</th>
              <th style={{ width: '130px', minWidth: '130px' }}>D QC: Align</th>

              {/* Group 7 */}
              <th style={{ width: '120px', minWidth: '120px' }}>Kit Gate</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Ward Gate</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Van Gate</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Door Gate</th>
              <th style={{ width: '220px', minWidth: '220px' }}>Handover Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredApartments.map((apt, rowIndex) => {
              const disabledRoleA = user.role !== 'ROLE_A';
              const disabledRoleB = !(user.role === 'ROLE_B' || user.role === 'ROLE_A');

              return (
                <tr key={apt.id} data-rowindex={rowIndex}>
                  {/* Group 1 */}
                  {renderEditableCell(apt, 'srNo', rowIndex, disabledRoleA, (
                    <input
                      type="number"
                      value={apt.srNo}
                      onChange={(e) => handleCellChange(apt.id, 'srNo', parseInt(e.target.value, 10))}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1 sticky-col", style: { left: 0, width: '70px', minWidth: '70px', fontWeight: 700, textAlign: 'center', background: '#14221a' } })}

                  {renderEditableCell(apt, 'apartmentNo', rowIndex, disabledRoleA, (
                    <input
                      type="text"
                      value={apt.apartmentNo || ''}
                      onChange={(e) => handleCellChange(apt.id, 'apartmentNo', e.target.value)}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1 sticky-col", style: { left: '70px', width: '120px', minWidth: '120px', background: '#14221a', fontWeight: 600 } })}

                  {renderEditableCell(apt, 'floor', rowIndex, disabledRoleA, (
                    <input
                      type="text"
                      value={apt.floor || ''}
                      onChange={(e) => handleCellChange(apt.id, 'floor', e.target.value)}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1", style: { width: '100px', minWidth: '100px' } })}

                  {renderEditableCell(apt, 'priority', rowIndex, disabledRoleA, (
                    <select
                      value={apt.priority}
                      onChange={(e) => handleCellChange(apt.id, 'priority', e.target.value)}
                      disabled={disabledRoleA}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ), { className: "cell-g1", style: { width: '120px', minWidth: '120px' } })}

                  {renderEditableCell(apt, 'kitchenQty', rowIndex, disabledRoleA, (
                    <input
                      type="number"
                      value={apt.kitchenQty !== null && apt.kitchenQty !== undefined ? apt.kitchenQty : ''}
                      onClick={() => {
                        if (!disabledRoleA) {
                          const parsed = parseMultiTypes(apt.kitchenType, apt.kitchenQty);
                          setActiveMultiEdit({
                            aptId: apt.id,
                            apartmentNo: apt.apartmentNo,
                            product: 'Kitchen',
                            types: parsed,
                            availableTypes: kitchenTypes
                          });
                        }
                      }}
                      readOnly
                      style={{ cursor: disabledRoleA ? 'default' : 'pointer', caretColor: 'transparent' }}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1", style: { width: '90px', minWidth: '90px' } })}

                  {renderEditableCell(apt, 'wardrobeQty', rowIndex, disabledRoleA, (
                    <input
                      type="number"
                      value={apt.wardrobeQty !== null && apt.wardrobeQty !== undefined ? apt.wardrobeQty : ''}
                      onClick={() => {
                        if (!disabledRoleA) {
                          const parsed = parseMultiTypes(apt.wardrobeType, apt.wardrobeQty);
                          setActiveMultiEdit({
                            aptId: apt.id,
                            apartmentNo: apt.apartmentNo,
                            product: 'Wardrobe',
                            types: parsed,
                            availableTypes: wardrobeTypes
                          });
                        }
                      }}
                      readOnly
                      style={{ cursor: disabledRoleA ? 'default' : 'pointer', caretColor: 'transparent' }}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1", style: { width: '90px', minWidth: '90px' } })}

                  {renderEditableCell(apt, 'vanityQty', rowIndex, disabledRoleA, (
                    <input
                      type="number"
                      value={apt.vanityQty !== null && apt.vanityQty !== undefined ? apt.vanityQty : ''}
                      onClick={() => {
                        if (!disabledRoleA) {
                          const parsed = parseMultiTypes(apt.vanityType, apt.vanityQty);
                          setActiveMultiEdit({
                            aptId: apt.id,
                            apartmentNo: apt.apartmentNo,
                            product: 'Vanity',
                            types: parsed,
                            availableTypes: vanityTypes
                          });
                        }
                      }}
                      readOnly
                      style={{ cursor: disabledRoleA ? 'default' : 'pointer', caretColor: 'transparent' }}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1", style: { width: '90px', minWidth: '90px' } })}

                  {renderEditableCell(apt, 'doorQty', rowIndex, disabledRoleA, (
                    <input
                      type="number"
                      value={apt.doorQty !== null && apt.doorQty !== undefined ? apt.doorQty : ''}
                      onClick={() => {
                        if (!disabledRoleA) {
                          const parsed = parseMultiTypes(apt.doorType, apt.doorQty);
                          setActiveMultiEdit({
                            aptId: apt.id,
                            apartmentNo: apt.apartmentNo,
                            product: 'Door',
                            types: parsed,
                            availableTypes: doorTypes
                          });
                        }
                      }}
                      readOnly
                      style={{ cursor: disabledRoleA ? 'default' : 'pointer', caretColor: 'transparent' }}
                      disabled={disabledRoleA}
                    />
                  ), { className: "cell-g1", style: { width: '90px', minWidth: '90px' } })}

                  {renderEditableCell(apt, 'supervisorName', rowIndex, disabledRoleA, (
                    <input
                      type="text"
                      value={apt.supervisorName || apt.responsibleEngineer || ''}
                      onChange={(e) => {
                        handleCellChange(apt.id, 'supervisorName', e.target.value);
                        handleCellChange(apt.id, 'responsibleEngineer', e.target.value);
                      }}
                      disabled={disabledRoleA}
                      placeholder="Supervisor Name"
                    />
                  ), { className: "cell-g1", style: { width: '180px', minWidth: '180px' } })}

                  {/* Group 2 — Material Inward (Percentage Dropdowns) */}
                  {[
                    'kitchenLowerCarcassInward',
                    'kitchenUpperCarcassInward',
                    'kitchenStoneInward',
                    'kitchenShutterInward',
                    'kitchenHardwareInward',
                    'kitchenApplianceInward',
                    'wardrobeCabinetInward',
                    'wardrobeShutterHardwareInward',
                    'vanityCabinetInward',
                    'vanityShutterHardwareInward',
                    'doorFrameHardwareInward'
                  ].map(f => {
                    const locked = disabledRoleB || isLockedForRoleB(apt, f);
                    return renderEditableCell(apt, f, rowIndex, locked, (
                      <select
                        value={apt[f] !== null && apt[f] !== undefined ? String(apt[f]) : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          handleCellChange(apt.id, f, val);
                        }}
                        disabled={locked}
                        title={isLockedForRoleB(apt, f) ? '🔒 This field is locked after saving' : ''}
                      >
                        <option value="">-</option>
                        <option value="0">0%</option>
                        <option value="25">25%</option>
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                      </select>
                    ), { className: "cell-g2", style: { width: '120px', minWidth: '120px', opacity: isLockedForRoleB(apt, f) ? 0.6 : 1 } });
                  })}

                  {/* Group 3 — Stage 2: Item-wise Execution/Installation (Percentage Dropdowns) */}
                  {[
                    'kitchenLowerCarcassInstalled',
                    'kitchenUpperCarcassInstalled',
                    'kitchenStoneInstalled',
                    'kitchenShutterHardwareInstalled',
                    'kitchenApplianceInstalled',
                    'kitchenHandedOver',
                    'wardrobeCabinetInstalled',
                    'wardrobeShutterHardwareInstalled',
                    'wardrobeHandedOver',
                    'vanityCabinetInstalled',
                    'vanityShutterHardwareInstalled',
                    'vanityHandedOver',
                    'doorFrameHardwareInstalled',
                    'doorHandedOver'
                  ].map(f => {
                    const locked = disabledRoleB || isLockedForRoleB(apt, f);
                    return renderEditableCell(apt, f, rowIndex, locked, (
                      <select
                        value={apt[f] !== null && apt[f] !== undefined ? String(apt[f]) : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          handleCellChange(apt.id, f, val);
                        }}
                        disabled={locked}
                        title={isLockedForRoleB(apt, f) ? '🔒 This field is locked after saving' : ''}
                      >
                        <option value="">-</option>
                        <option value="0">0%</option>
                        <option value="25">25%</option>
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                      </select>
                    ), { className: "cell-g3", style: { width: '120px', minWidth: '120px', opacity: isLockedForRoleB(apt, f) ? 0.6 : 1 } });
                  })}

                  {/* Group 4 */}
                  {renderEditableCell(apt, 'plannedStart', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'plannedStart'), (
                    <input
                      type="date"
                      value={apt.plannedStart ? apt.plannedStart.split('T')[0] : ''}
                      onChange={(e) => handleCellChange(apt.id, 'plannedStart', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'plannedStart')}
                      title={isLockedForRoleB(apt, 'plannedStart') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '150px', minWidth: '150px', opacity: isLockedForRoleB(apt, 'plannedStart') ? 0.6 : 1 } })}
                  {renderEditableCell(apt, 'plannedCompletion', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'plannedCompletion'), (
                    <input
                      type="date"
                      value={apt.plannedCompletion ? apt.plannedCompletion.split('T')[0] : ''}
                      onChange={(e) => handleCellChange(apt.id, 'plannedCompletion', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'plannedCompletion')}
                      title={isLockedForRoleB(apt, 'plannedCompletion') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '150px', minWidth: '150px', opacity: isLockedForRoleB(apt, 'plannedCompletion') ? 0.6 : 1 } })}
                  {renderEditableCell(apt, 'actualStart', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'actualStart'), (
                    <input
                      type="date"
                      value={apt.actualStart ? apt.actualStart.split('T')[0] : ''}
                      onChange={(e) => handleCellChange(apt.id, 'actualStart', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'actualStart')}
                      title={isLockedForRoleB(apt, 'actualStart') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '150px', minWidth: '150px', opacity: isLockedForRoleB(apt, 'actualStart') ? 0.6 : 1 } })}
                  {renderEditableCell(apt, 'actualCompletion', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'actualCompletion'), (
                    <input
                      type="date"
                      value={apt.actualCompletion ? apt.actualCompletion.split('T')[0] : ''}
                      onChange={(e) => handleCellChange(apt.id, 'actualCompletion', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'actualCompletion')}
                      max={(() => {
                        const d = new Date();
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      })()}
                      title={isLockedForRoleB(apt, 'actualCompletion') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '150px', minWidth: '150px', opacity: isLockedForRoleB(apt, 'actualCompletion') ? 0.6 : 1 } })}
                  {renderEditableCell(apt, 'contractor', rowIndex, disabledRoleA, (
                    <input
                      type="text"
                      value={apt.contractor || ''}
                      onChange={(e) => handleCellChange(apt.id, 'contractor', e.target.value)}
                      disabled={disabledRoleA}
                      placeholder={building.order?.contractorId || 'Contractor ID'}
                    />
                  ), { className: "cell-g4", style: { width: '150px', minWidth: '150px' } })}
                  {renderEditableCell(apt, 'contractorName', rowIndex, disabledRoleA, (
                    <input
                      type="text"
                      value={apt.contractorName || ''}
                      onChange={(e) => handleCellChange(apt.id, 'contractorName', e.target.value)}
                      disabled={disabledRoleA}
                      placeholder={building.order?.contractorName || 'Contractor Name'}
                    />
                  ), { className: "cell-g4", style: { width: '180px', minWidth: '180px' } })}
                  {renderEditableCell(apt, 'delayReason', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'delayReason'), (
                    <input
                      type="text"
                      value={apt.delayReason || ''}
                      onChange={(e) => handleCellChange(apt.id, 'delayReason', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'delayReason')}
                      title={isLockedForRoleB(apt, 'delayReason') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '200px', minWidth: '200px', opacity: isLockedForRoleB(apt, 'delayReason') ? 0.6 : 1 } })}
                  {renderEditableCell(apt, 'remarks', rowIndex, disabledRoleB || isLockedForRoleB(apt, 'remarks'), (
                    <input
                      type="text"
                      value={apt.remarks || ''}
                      onChange={(e) => handleCellChange(apt.id, 'remarks', e.target.value)}
                      disabled={disabledRoleB || isLockedForRoleB(apt, 'remarks')}
                      title={isLockedForRoleB(apt, 'remarks') ? '🔒 Locked after saving' : ''}
                    />
                  ), { className: "cell-g4", style: { width: '220px', minWidth: '220px', opacity: isLockedForRoleB(apt, 'remarks') ? 0.6 : 1 } })}
                  <td className="cell-g4" style={{ width: '180px', minWidth: '180px' }}>
                    <input
                      type="text"
                      value={apt.supervisorName || apt.responsibleEngineer || ''}
                      disabled
                    />
                  </td>

                  {/* Group 5 */}
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 600, width: '120px', minWidth: '120px' }}>{((apt.materialInwardPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 600, width: '120px', minWidth: '120px' }}>{((apt.kitchenCompletionPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 600, width: '120px', minWidth: '120px' }}>{((apt.wardrobeCompletionPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 600, width: '120px', minWidth: '120px' }}>{((apt.vanityCompletionPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 600, width: '120px', minWidth: '120px' }}>{((apt.doorCompletionPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-cyan)', width: '120px', minWidth: '120px' }}>{((apt.overallCompletionPct || 0) * 100).toFixed(0)}%</td>
                  <td className="cell-g5" style={{ textAlign: 'center', width: '180px', minWidth: '180px' }}>
                    <span className={`badge ${getStatusBadgeClass(apt.apartmentStatus)}`}>
                      {apt.apartmentStatus}
                    </span>
                  </td>
                  <td className="cell-g5" style={{ textAlign: 'center', width: '110px', minWidth: '110px' }}>{apt.delayDays || 0} days</td>
                  <td className={`health-cell ${getHealthClass(apt.health)} cell-g5`} style={{ width: '120px', minWidth: '120px' }}>{apt.health}</td>

                  {/* Group 6 */}
                  {[
                    'kitchenQC_VisibleScrews',
                    'kitchenQC_Chipping',
                    'kitchenQC_FillerMissing',
                    'kitchenQC_Scratches',
                    'kitchenQC_DrawersFunction',
                    'kitchenQC_CutleryTray',
                    'kitchenQC_DishDrainer',
                    'wardrobeQC_VisibleScrews',
                    'wardrobeQC_Chipping',
                    'wardrobeQC_FillerMissing',
                    'wardrobeQC_Scratches',
                    'wardrobeQC_DrawersFunction',
                    'vanityQC_VisibleScrews',
                    'vanityQC_Chipping',
                    'vanityQC_FillerMissing',
                    'vanityQC_Scratches',
                    'vanityQC_DrawersFunction',
                    'doorQC_Chipping',
                    'doorQC_Alignment'
                  ].map(f => {
                    const locked = disabledRoleB || isLockedForRoleB(apt, f);
                    return renderEditableCell(apt, f, rowIndex, locked, (
                      <select
                        value={apt[f] || ''}
                        onChange={(e) => handleCellChange(apt.id, f, e.target.value || null)}
                        disabled={locked}
                        title={isLockedForRoleB(apt, f) ? '🔒 This field is locked after saving' : ''}
                      >
                        <option value="">-</option>
                        <option value="OK">OK</option>
                        <option value="Not OK">Not OK</option>
                      </select>
                    ), { className: "cell-g6", style: { width: '130px', minWidth: '130px', opacity: isLockedForRoleB(apt, f) ? 0.6 : 1 } });
                  })}

                  {/* Group 7 */}
                  <td className="cell-g7" style={{ fontWeight: 600, textAlign: 'center', width: '120px', minWidth: '120px' }}>{apt.kitchenQCGate}</td>
                  <td className="cell-g7" style={{ fontWeight: 600, textAlign: 'center', width: '120px', minWidth: '120px' }}>{apt.wardrobeQCGate}</td>
                  <td className="cell-g7" style={{ fontWeight: 600, textAlign: 'center', width: '120px', minWidth: '120px' }}>{apt.vanityQCGate}</td>
                  <td className="cell-g7" style={{ fontWeight: 600, textAlign: 'center', width: '120px', minWidth: '120px' }}>{apt.doorQCGate}</td>
                  <td className="cell-g7" style={{ fontWeight: 700, textAlign: 'center', width: '220px', minWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.handoverApprovalStatus}</td>


                  {/* Audit & Row Actions */}
                  <td style={{ textAlign: 'center', borderLeft: '2px solid var(--border-color)', width: '140px', minWidth: '140px' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                        onClick={() => handleViewAuditLogs(apt)}
                        title="View Audit Trail Log"
                      >
                        📜 Log
                      </button>
                      {!disabledRoleA && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                          onClick={() => handleDeleteApartment(apt.id, apt.apartmentNo)}
                          title="Delete apartment row"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Audit Logs Sidebar / Drawer Modal */}
      {selectedAptLogs && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '450px',
          height: '100vh',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.4)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem' }}>📜 Audit Trail: {selectedAptLogs.apartmentNo}</h3>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedAptLogs(null)}>
              Close
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading log stream...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
                No modifications recorded for this unit.
              </div>
            ) : (
              <div className="audit-list">
                {logs.map(log => (
                  <div key={log.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{log.user?.name}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{new Date(log.changedAt).toLocaleString()}</span>
                    </div>
                    <div>
                      Field <b>{log.fieldName}</b> changed:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: '#7f1d1d', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#fca5a5' }}>
                        {log.oldValue || 'blank'}
                      </span>
                      <span>➡️</span>
                      <span style={{ background: '#064e3b', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#6ee7b7' }}>
                        {log.newValue || 'blank'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configure Multi-Types modal */}
      {activeMultiEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 3000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeMultiEdit.product === 'Kitchen' ? '🍳' : (activeMultiEdit.product === 'Wardrobe' ? '👗' : (activeMultiEdit.product === 'Vanity' ? '🧼' : '🚪'))} Configure {activeMultiEdit.product}s
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Apartment: <b>{activeMultiEdit.apartmentNo}</b>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
              {activeMultiEdit.availableTypes.map(t => {
                const currentVal = activeMultiEdit.types.find(item => item.type === t)?.qty || 0;
                return (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.1rem 0.4rem', minWidth: '24px', fontSize: '0.85rem' }}
                        onClick={() => {
                          const nextQty = Math.max(0, currentVal - 1);
                          setActiveMultiEdit(prev => ({
                            ...prev,
                            types: nextQty === 0
                              ? prev.types.filter(item => item.type !== t)
                              : [...prev.types.filter(item => item.type !== t), { type: t, qty: nextQty }]
                          }));
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{currentVal}</span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.1rem 0.4rem', minWidth: '24px', fontSize: '0.85rem' }}
                        onClick={() => {
                          const nextQty = currentVal + 1;
                          setActiveMultiEdit(prev => ({
                            ...prev,
                            types: [...prev.types.filter(item => item.type !== t), { type: t, qty: nextQty }]
                          }));
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600 }}>Total Quantity:</span>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>
                {activeMultiEdit.types.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setActiveMultiEdit(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem' }}
                onClick={() => {
                  const totalQty = activeMultiEdit.types.reduce((sum, item) => sum + item.qty, 0);
                  const serialized = activeMultiEdit.types.length > 0
                    ? JSON.stringify(activeMultiEdit.types.sort((a, b) => a.type.localeCompare(b.type)))
                    : '';

                  if (activeMultiEdit.product === 'Kitchen') {
                    handleCellChange(activeMultiEdit.aptId, 'kitchenQty', totalQty);
                    handleCellChange(activeMultiEdit.aptId, 'kitchenType', serialized);
                  } else if (activeMultiEdit.product === 'Wardrobe') {
                    handleCellChange(activeMultiEdit.aptId, 'wardrobeQty', totalQty);
                    handleCellChange(activeMultiEdit.aptId, 'wardrobeType', serialized);
                  } else if (activeMultiEdit.product === 'Vanity') {
                    handleCellChange(activeMultiEdit.aptId, 'vanityQty', totalQty);
                    handleCellChange(activeMultiEdit.aptId, 'vanityType', serialized);
                  } else if (activeMultiEdit.product === 'Door') {
                    handleCellChange(activeMultiEdit.aptId, 'doorQty', totalQty);
                    handleCellChange(activeMultiEdit.aptId, 'doorType', serialized);
                  }
                  setActiveMultiEdit(null);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for loader spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BuildingGrid;
