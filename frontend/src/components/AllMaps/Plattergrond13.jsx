import React, { useState, useEffect } from 'react';
import mapData from './hw_13.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { getFocusedReportForCell } from './mapSelection';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Declare unclickable cells
const STATIC_CELLS = ["PAD", "VERWERKINGSHAL", "Plattegrond HW13", "Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4"];

const Plattergrond13 = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});
  const {
    multiSelectEnabled,
    selectedCells,
    multiReportCell,
    toggleMultiSelectMode,
    handleSelectableCellClick,
    selectAllCells,
    clearMultiSelection,
    openMultiReport,
    closeMultiReport,
    isCellMultiSelected,
  } = useMapMultiSelect({
    clearSingleSelection: () => setSelectedCell(null),
  });

  // Load the data
  useEffect(() => {
    fetch(`http://localhost:5000/api/reports?map_id=${encodeURIComponent('HW 13')}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') return;
        const statusMap = {};
        const seenCells = new Set();
        data.data.forEach(report => {
          const key = report.block_key || report.cell_name;
          if (seenCells.has(key)) return;
          if (report.status === 'rejected') return;
          seenCells.add(key);
          if (report.status === 'pending') {
            statusMap[key] = 'pending';
          } else if (report.status === 'approved' && report.pests_found) {
            statusMap[key] = 'approved';
          }
        });
        setCellStatuses(statusMap);
      })
      .catch(err => console.error('Failed to fetch map statuses:', err));
  }, []);

  // Highlight a specific cell
  useEffect(() => {
    if (focusedReport) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCell(focusedReport);
    }
  }, [focusedReport]);

  // Join cells that have the same value
  const getSpan = (r, c, label) => {
    if (!label) {
      return { w: 1, h: 1 };
    }

    let w = 1, h = 1;
    while (mapData[r][c + w] === label) w++;
    while (mapData[r + h]?.[c] === label) h++;
    return { w, h };
  };

  const renderGrid = (selectableCells = []) => {
    const seen = new Set();
    return mapData.flatMap((row, r) =>
      row.map((label, c) => {
        // Skip already seen coordinates
        const currentCoordinate = `${r}-${c}`;
        if (seen.has(currentCoordinate)) {
          return null;
        }

        const { w, h } = getSpan(r, c, label);
        for (let i = r; i < r + h; i++) {
          for (let j = c; j < c + w; j++) {
            seen.add(`${i}-${j}`);
          }
        }

        const key = String(label);
        const isStatic = !label || STATIC_CELLS.includes(key);
        const blockKey = `HW 13::${key}::${r}:${c}`;
        const cellInfo = { label: key, startRow: r, startCol: c, width: w, height: h, block_key: blockKey };
        if (!isStatic) selectableCells.push(cellInfo);
        const isSelected = selectedCell?.block_key === blockKey || selectedCell?.cell_name === key;
        const isMultiSelected = !isStatic && isCellMultiSelected(cellInfo);
        const currentStatus = cellStatuses[blockKey] || cellStatuses[key];
        const statusClass = currentStatus === 'approved' ? 'status-approved'
                         : currentStatus === 'pending'  ? 'status-pending'
                         : '';

        return (
          <div
            key={`${r}-${c}`}
            className={[
              'grid-cell',
              label ? 'merged-block' : 'empty',
              isStatic ? 'static-block' : 'clickable-block',
              statusClass,
              isSelected ? 'selected' : '',
              isMultiSelected ? 'multi-selected' : ''
            ].join(' ').trim()}
            // Stretch a cell for multiple row and column if needed
            style={{ gridRow: `span ${h}`, gridColumn: `span ${w}` }}
            // Click and fill the form
            onClick={isStatic ? null : () => handleSelectableCellClick(cellInfo, setSelectedCell)}
          >
            {label}
          </div>
        );
      })
    );
  };

  const selectableCells = [];
  const gridElements = renderGrid(selectableCells);
  const modalCell = multiReportCell || selectedCell;
  const handleCloseModal = () => {
    setSelectedCell(null);
    closeMultiReport({ reset: !!multiReportCell });
  };

  return (
    <div className="map-container">
      {!focusedReport && (
        <MapMultiSelectToolbar
          enabled={multiSelectEnabled}
          selectedCount={selectedCells.length}
          totalCount={selectableCells.length}
          onToggle={toggleMultiSelectMode}
          onSelectAll={() => selectAllCells(selectableCells)}
          onClear={clearMultiSelection}
          onCreateReport={openMultiReport}
        />
      )}
      <div className="map-viewport">
        <TransformWrapper
          initialScale={1}
          minScale={0.4}
          maxScale={2.5}
          centerOnInit
          limitToBounds={false}
          doubleClick={{ disabled: true }}
          wheel={{ disabled: false, step: 0.004 }}
          pinch={{ disabled: false, step: 2.5, allowPanning: true }}
          panning={{ disabled: false, velocityDisabled: true }}
          autoAlignment={{ disabled: true }}
          velocityAnimation={{ disabled: true }}>
          <TransformComponent wrapperClass="map-transform-wrapper" contentClass="map-transform-content">
            <div className="merged-grid-container" style={{ gridTemplateColumns: `repeat(${mapData[0].length}, 60px)`, gridAutoRows: '25px' }}>
              {gridElements}
            </div>
        </TransformComponent>
        </TransformWrapper>
      </div>
      <ScoutReportModal
        isOpen={!!modalCell}
        cellInfo={modalCell}
        reportData={multiReportCell ? null : getFocusedReportForCell(focusedReport, modalCell)}
        onClose={handleCloseModal}
        mapName="HW 13"
        selectedCells={multiReportCell ? selectedCells : undefined}
      />
    </div>
  );
};

export default Plattergrond13;
