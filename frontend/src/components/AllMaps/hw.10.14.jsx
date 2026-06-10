import React, { useState, useEffect } from 'react';
import mapData from './hw10.14.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const HW1014Map = ({ focusedReport, mapName = "HW 10.14" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
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
    clearSingleSelection: () => {
      setSelectedGroup(null);
      setViewingReport(null);
    },
  });

  const isClickable = (labelStr) =>
    /^4P[A-Z]?\d+$/.test(labelStr) || 
    /^Baan \d+$/.test(labelStr) ||  
    /^4PD!$/.test(labelStr);        

  useEffect(() => {
    fetch(`http://localhost:8000/api/reports?map_id=${mapName}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') return;
        const statusMap = {};
        data.data.forEach(report => {
          const key = report.block_key || report.cell_name;
          const currentStatus = statusMap[key];
          
          if (report.status === 'approved') {
            statusMap[key] = 'approved';
          } else if (report.status === 'pending' && currentStatus !== 'approved') {
            statusMap[key] = 'pending';
          }
        });
        setCellStatuses(statusMap);
      })
      .catch(err => console.error("Failed to fetch map statuses:", err));
  }, [mapName]);

  useEffect(() => {
    if (focusedReport) {
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          if (mapData[r][c] !== null && String(mapData[r][c]).trim() === String(focusedReport.cell_name)) {
            
            const currentBlockKey = `${mapName}::${String(mapData[r][c]).trim()}::${r}:${c}`;
            
            if (focusedReport.block_key && focusedReport.block_key !== currentBlockKey) {
              continue; 
            }

            const { width, height } = getCellSpan(r, c, mapData[r][c]);
            const bounds = {
              label: String(mapData[r][c]).trim(),
              startRow: r,
              startCol: c,
              width,
              height,
              block_key: focusedReport.block_key || currentBlockKey
            };
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport, mapName]);

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    if (label === null || label === '') return { width, height };

    const labelStr = String(label).trim();
    
    const isPureText = !/\d/.test(labelStr);
    const isPureNumber = /^\d+(\.\d+)?$/.test(labelStr);
    const isBaan = /^Baan \d+$/.test(labelStr);

    if (!isPureText && !isPureNumber && !isBaan) {
      return { width, height };
    }

    while (col + width < mapData[row].length) {
      const nextCell = mapData[row][col + width];
      if (nextCell === null || nextCell === '') break;
      if (String(nextCell).trim() !== labelStr) break;
      width++;
    }

    while (row + height < mapData.length) {
      const nextRowMatches = Array.from({ length: width }, (_, i) => {
        const cellBelow = mapData[row + height][col + i];
        if (cellBelow === null || cellBelow === '') return false;
        return String(cellBelow).trim() === labelStr;
      }).every(Boolean);
      
      if (!nextRowMatches) break;
      height++;
    }

    return { width, height };
  };

  const getNullSpan = (row, col) => {
    let width = 1;
    while (
      col + width < mapData[row].length &&
      (mapData[row][col + width] === null || mapData[row][col + width] === '')
    ) {
      width++;
    }

    let height = 1;
    while (row + height < mapData.length) {
      const matches = Array.from({ length: width }, (_, i) =>
        mapData[row + height][col + i] === null || mapData[row + height][col + i] === ''
      ).every(Boolean);
      const noExtraLeft =
        col === 0 ||
        (mapData[row + height][col - 1] !== null && mapData[row + height][col - 1] !== '');
      const noExtraRight =
        col + width >= mapData[row].length ||
        (mapData[row + height][col + width] !== null &&
          mapData[row + height][col + width] !== '');
      if (!matches || !noExtraLeft || !noExtraRight) break;
      height++;
    }

    return { width, height };
  };

  const renderGrid = (selectableCells = []) => {
    const rendered = new Set();
    const cells = [];

    mapData.forEach((row, r) => {
      row.forEach((label, c) => {
        if (rendered.has(`${r}-${c}`)) return;

        if (label === null || label === '') {
          const { width, height } = getNullSpan(r, c);
          for (let i = r; i < r + height; i++)
            for (let j = c; j < c + width; j++)
              rendered.add(`${i}-${j}`);
          cells.push(
            <div
              key={`${r}-${c}`}
              className="grid-cell corridor-cell"
              style={{ gridRow: `span ${height}`, gridColumn: `span ${width}` }}
              aria-hidden="true"
            />
          );
          return;
        }

        const { width, height } = getCellSpan(r, c, label);
        for (let i = r; i < r + height; i++)
          for (let j = c; j < c + width; j++)
            rendered.add(`${i}-${j}`);

        const labelStr = String(label).trim();
        const clickable = isClickable(labelStr);

        const blockKey = `${mapName}::${labelStr}::${r}:${c}`;
        const cellInfo = { label: labelStr, startRow: r, startCol: c, width, height, block_key: blockKey };
        if (clickable) selectableCells.push(cellInfo);

        let statusClass = '';
        const currentStatus = cellStatuses[blockKey] || cellStatuses[labelStr];
        
        if (currentStatus === 'pending') statusClass = 'status-pending';
        if (currentStatus === 'approved') statusClass = 'status-approved';

        const isSelected = selectedGroup?.block_key === blockKey || 
                          (!selectedGroup?.block_key && selectedGroup?.label === labelStr && selectedGroup?.startRow === r && selectedGroup?.startCol === c);
        const isMultiSelected = clickable && isCellMultiSelected(cellInfo);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={[
              'grid-cell',
              'merged-block',
              clickable ? 'clickable-block' : 'static-block',
              statusClass,
              isSelected ? 'selected' : '',
              isMultiSelected ? 'multi-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            
            style={{
              gridRow: `span ${height}`,
              gridColumn: `span ${width}`,
              backgroundColor: clickable ? '#e8f5e9' : undefined,
            }}
            onClick={clickable ? () => handleSelectableCellClick(cellInfo, (selectedCell) => {
              setSelectedGroup(selectedCell);
              setViewingReport(null);
            }) : undefined}
          >
            {labelStr}
          </div>
        );
      });
    });

    return cells;
  };

  const selectableCells = [];
  const gridElements = renderGrid(selectableCells);
  const modalCell = multiReportCell || selectedGroup;
  const handleCloseModal = () => {
    setSelectedGroup(null);
    setViewingReport(null);
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
          wheel={{ disabled: false, step: 0.0004 }}
          pinch={{ disabled: false, step: 2.5, allowPanning: true }}
          panning={{ disabled: false, velocityDisabled: true }}
          autoAlignment={{ disabled: true }}
          velocityAnimation={{ disabled: true }}>
          <TransformComponent wrapperClass="map-transform-wrapper" contentClass="map-transform-content">
            <div className="merged-grid-container" style={{display: 'grid', gridTemplateColumns: `repeat(${mapData[0].length}, 45px)`, gridAutoRows: '45px',}}>
              {gridElements}
            </div>
        </TransformComponent>
        </TransformWrapper>
      </div>

      <ScoutReportModal
        isOpen={!!modalCell}
        onClose={handleCloseModal}
        cellInfo={modalCell}
        reportData={multiReportCell ? null : viewingReport}
        mapName={mapName}
        selectedCells={multiReportCell ? selectedCells : undefined}
      />
    </div>
  );
};

export default HW1014Map;
