import React, { useState, useEffect } from 'react';
import mapData from './hw10.15.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import { useTranslation } from "react-i18next";
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { useMapReportStatusUpdates } from './useMapReportStatusUpdates';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const HW1015Map = ({ focusedReport, mapName = "HW 10.15" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});
  useMapReportStatusUpdates(mapName, setCellStatuses);
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

  const { t } = useTranslation();

  const unclickableLabels = ["Schuur", "Deur naar 1600", "1300"];

  const getDisplayLabel = (label) => {
    const translations = {
      "Schuur": t("hw1015.Shed"),
      "Deur naar 1600": t("hw1015.DoorTo1600"),
    };

    return translations[label] || label;
  };

  useEffect(() => {
    fetch(`/api/reports?map_id=${mapName}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
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
        }
      })
      .catch(err => console.error("Failed to fetch map statuses:", err));
  }, [mapName]);

  useEffect(() => {
    if (focusedReport) {
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          if (mapData[r][c] !== null && String(mapData[r][c]) === String(focusedReport.cell_name)) {
            const currentBlockKey = `${mapName}::${String(mapData[r][c])}::${r}:${c}`;
            
            if (focusedReport.block_key && focusedReport.block_key !== currentBlockKey) {
              continue;
            }

            // eslint-disable-next-line react-hooks/immutability
            const bounds = getMergedBounds(r, c, mapData[r][c]);
            bounds.block_key = focusedReport.block_key || currentBlockKey;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport, mapName]);

  const getMergedBounds = (r, c, label) => {
    const isNull = label === null || label === '';
    let maxR = r; let maxC = c;
    
    while (maxC + 1 < mapData[r].length && 
          (isNull ? (mapData[r][maxC + 1] === null || mapData[r][maxC + 1] === '') 
                  : mapData[r][maxC + 1] === label)) { 
      maxC++; 
    }
    
    // 基于宽度计算最大高度
    while (maxR + 1 < mapData.length) {
      let nextRowMatches = true;
      for (let i = c; i <= maxC; i++) {
        const nextCell = mapData[maxR + 1][i];
        if (isNull ? (nextCell !== null && nextCell !== '') : nextCell !== label) {
          nextRowMatches = false;
          break;
        }
      }
      if (!nextRowMatches) break;
      maxR++;
    }
    
    return { 
      label: isNull ? '' : String(label), 
      isNull, 
      startRow: r, 
      startCol: c, 
      width: maxC - c + 1, 
      height: maxR - r + 1 
    };
  };

  const renderedCells = new Set();
  const gridElements = [];
  const selectableCells = [];

  mapData.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (renderedCells.has(`${rIdx}-${cIdx}`)) return;
      const bounds = getMergedBounds(rIdx, cIdx, cell);

      if (bounds) {
        for (let i = rIdx; i < rIdx + bounds.height; i++) {
          for (let j = cIdx; j < cIdx + bounds.width; j++) { renderedCells.add(`${i}-${j}`); }
        }

        if (bounds.isNull) {
          gridElements.push(
            <div
              key={`${rIdx}-${cIdx}`}
              className="grid-cell empty"
              style={{
                gridRow: `span ${bounds.height}`,
                gridColumn: `span ${bounds.width}`,
                visibility: 'hidden' // 渲染为空白占位，完全不显示边框和背景
              }}
            />
          );
        } else {
          const isUnclickable = unclickableLabels.includes(bounds.label);
          const blockKey = `${mapName}::${bounds.label}::${rIdx}:${cIdx}`;
          const cellInfo = { ...bounds, block_key: blockKey };
          if (!isUnclickable) selectableCells.push(cellInfo);
          
          let statusClass = '';
          const currentStatus = cellStatuses[blockKey] || cellStatuses[bounds.label];
          if (currentStatus === 'pending') statusClass = 'status-pending';
          if (currentStatus === 'approved') statusClass = 'status-approved';

          const isSelected = selectedGroup?.block_key === blockKey || 
                            (!selectedGroup?.block_key && selectedGroup?.label === bounds.label && selectedGroup?.startRow === rIdx && selectedGroup?.startCol === cIdx);
          const isMultiSelected = !isUnclickable && isCellMultiSelected(cellInfo);

          gridElements.push(
            <div
              key={`${rIdx}-${cIdx}`}
              className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${statusClass}`}
              style={{
                gridRow: `span ${bounds.height}`,
                gridColumn: `span ${bounds.width}`
              }}
              onClick={isUnclickable ? null : () => handleSelectableCellClick(cellInfo, (selectedCell) => {
                setSelectedGroup(selectedCell);
                setViewingReport(null);
              })}
            >
              {getDisplayLabel(bounds.label)}
            </div>
          );
        }
      }
    });
  });

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
          wheel={{ disabled: false, step: 0.004 }}
          pinch={{ disabled: false, step: 2.5, allowPanning: true }}
          panning={{ disabled: false, velocityDisabled: true }}
          autoAlignment={{ disabled: true }}
          velocityAnimation={{ disabled: true }}>
          <TransformComponent wrapperClass="map-transform-wrapper" contentClass="map-transform-content">
            <div className="merged-grid-container" style={{ display: 'grid', gridTemplateColumns: `repeat(${mapData[0].length}, minmax(22px, 1fr))`, gridAutoRows: 'minmax(45px, auto)' }}>
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

export default HW1015Map;
