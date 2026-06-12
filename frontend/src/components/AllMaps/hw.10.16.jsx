import React, { useState, useEffect } from 'react';
import mapData from './hw10.16.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import { useTranslation } from "react-i18next";
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { useMapReportStatusUpdates } from './useMapReportStatusUpdates';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const HW1016Map = ({ focusedReport, mapName = "HW 10.16" }) => {
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

  const staticCells = ["Deur naar 1500", "Deur naar 1700"];

  const getDisplayLabel = (label) => {
    const translations = {
      "Deur naar 1500": t("hw1016.DoorTo1500"),
      "Deur naar 1700": t("hw1016.DoorTo1700"),
    };

    return translations[label] || label;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
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
  }, []);

  useEffect(() => {
    if (focusedReport) {
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          if (String(mapData[r][c]) === focusedReport.cell_name) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedReport, mapName]);

  const getMergedBounds = (r, c, label) => {
    if (label === null || label === '') return null;
    let maxR = r;
    let maxC = c;
    while (maxC + 1 < mapData[r].length && mapData[r][maxC + 1] === label) { maxC++; }
    while (maxR + 1 < mapData.length) {
      const nextRowMatches = Array.from({ length: maxC - c + 1 }, (_, i) =>
        mapData[maxR + 1][c + i] === label
      ).every(Boolean);
      if (!nextRowMatches) break;
      maxR++;
    }
    const labelStr = String(label);
    return {
      label: labelStr,
      startRow: r,
      startCol: c,
      width: maxC - c + 1,
      height: maxR - r + 1,
      block_key: `${mapName}::${labelStr}::${r}:${c}`,
    };
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
        (mapData[row + height][col + width] !== null && mapData[row + height][col + width] !== '');
      if (!matches || !noExtraLeft || !noExtraRight) break;
      height++;
    }
    return { width, height };
  };

  const renderedCells = new Set();
  const gridElements = [];
  const selectableCells = [];

  mapData.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (renderedCells.has(`${rIdx}-${cIdx}`)) return;

      // NULL / empty → transparent corridor block
      if (cell === null || cell === '') {
        const { width, height } = getNullSpan(rIdx, cIdx);
        for (let i = rIdx; i < rIdx + height; i++)
          for (let j = cIdx; j < cIdx + width; j++)
            renderedCells.add(`${i}-${j}`);
        gridElements.push(
          <div
            key={`${rIdx}-${cIdx}`}
            className="grid-cell corridor-cell"
            style={{ gridRow: `span ${height}`, gridColumn: `span ${width}` }}
            aria-hidden="true"
          />
        );
        return;
      }

      const bounds = getMergedBounds(rIdx, cIdx, cell);
      if (!bounds) {
        renderedCells.add(`${rIdx}-${cIdx}`);
        return;
      }

      for (let i = rIdx; i < rIdx + bounds.height; i++)
        for (let j = cIdx; j < cIdx + bounds.width; j++)
          renderedCells.add(`${i}-${j}`);

      const isUnclickable = staticCells.includes(bounds.label);
      if (!isUnclickable) selectableCells.push(bounds);

      let statusClass = '';
      const currentStatus = cellStatuses[bounds.block_key] || cellStatuses[bounds.label];
      if (currentStatus === 'pending') statusClass = 'status-pending';
      if (currentStatus === 'approved') statusClass = 'status-approved';
      const isMultiSelected = !isUnclickable && isCellMultiSelected(bounds);

      gridElements.push(
        <div
          key={`${rIdx}-${cIdx}`}
          className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${selectedGroup?.block_key === bounds.block_key ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${statusClass}`}
          style={{
            gridRow: `span ${bounds.height}`,
            gridColumn: `span ${bounds.width}`,
          }}
          onClick={isUnclickable ? null : () => handleSelectableCellClick(bounds, (selectedCell) => {
            setSelectedGroup(selectedCell);
            setViewingReport(null);
          })}
        >
          {getDisplayLabel(bounds.label)}
        </div>
      );
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
            <div className="merged-grid-container" style={{display: 'grid', gridTemplateColumns: `repeat(${mapData[0].length}, minmax(22px, 1fr))`, gridAutoRows: 'minmax(45px, auto)',}}>
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

export default HW1016Map;
