import React, { useState, useEffect } from 'react';
import mapData from './hw10.12.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { getFocusedReportForCell } from './mapSelection';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const HW1012Map = ({ focusedReport }) => {
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

  const mapId = "HW 10.12";

  const staticCells = [
    "Tranportbaan",
    "Transport",
    "Deur naar kas 2",
    "Deur naar kas 3",
    "1100",
    "Piramides",
    "Bakken"
  ];

  // 1. 获取状态：支持 block_key 精准匹配
  useEffect(() => {
    fetch(`http://localhost:8000/api/reports?map_id=${encodeURIComponent(mapId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') return;
        const statuses = {};
        data.data.forEach(report => {
          const key = report.block_key || report.cell_name;
          const currentStatus = statuses[key];

          if (report.status === 'approved') {
            statuses[key] = 'status-approved';
          } else if (report.status === 'pending' && currentStatus !== 'status-approved') {
            statuses[key] = 'status-pending';
          }
        });
        setCellStatuses(statuses);
      });
  }, [mapId]);

  useEffect(() => {
    if (focusedReport) {
      setSelectedCell({
        label: focusedReport.cell_name,
        block_key: focusedReport.block_key
      });
    }
  }, [focusedReport]);

  const spanOverrides = {"Tranportbaan": { width: 2, height: 3 },
                                                 "1100": { width: 10, height: 3 }};

  const isBlank = (value) =>
  value === null || value === undefined || value === "";

  const columnSizes = mapData[0].map((_, c) => {const hasContent = mapData.some(row => !isBlank(row[c]));
                                                       return hasContent ? "43px" : "0px"});

  const rowSizes = mapData.map(row => {const hasContent = row.some(cell => !isBlank(cell));
                                       return hasContent ? "35px" : "0px"});

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    if (!label) return { width, height };
    const override = spanOverrides[String(label)];
    if (override) return override;
    while (col + width < mapData[row].length && mapData[row][col + width] === label) width++;
    while (row + height < mapData.length && mapData[row + height][col] === label) height++;
    return { width, height };
  };

  const renderGrid = (selectableCells = []) => {
    const rendered = new Set();
    const cells = [];

    mapData.forEach((row, r) => {
      row.forEach((label, c) => {
        if (rendered.has(`${r}-${c}`) || label === null || label === "") return;

        const { width, height } = getCellSpan(r, c, label);

        for (let i = r; i < r + height; i++)
          for (let j = c; j < c + width; j++)
            rendered.add(`${i}-${j}`);

        const labelStr = String(label);
        const isStatic = staticCells.includes(labelStr);

        const blockKey = `${mapId}::${labelStr}::${r}:${c}`;
        const cellInfo = { label: labelStr, startRow: r, startCol: c, width, height, block_key: blockKey };
        if (!isStatic) selectableCells.push(cellInfo);
        const statusClass = cellStatuses[blockKey] || cellStatuses[labelStr] || '';

        const isSelected = selectedCell?.block_key === blockKey ||
                          (!selectedCell?.block_key && selectedCell?.label === labelStr);
        const isMultiSelected = !isStatic && isCellMultiSelected(cellInfo);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${statusClass} ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''}`}
            style={{
              gridRow: `${r + 1} / span ${height}`,
              gridColumn: `${c + 1} / span ${width}`,
              backgroundColor: typeof label === 'number' && !isStatic ? '#e8f5e9' : undefined
            }}
            onClick={isStatic ? null : () => handleSelectableCellClick(cellInfo, setSelectedCell)}
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
          wheel={{ disabled: false, step: 0.0004 }}
          pinch={{ disabled: false, step: 2.5, allowPanning: true }}
          panning={{ disabled: false, velocityDisabled: true }}
          autoAlignment={{ disabled: true }}
          velocityAnimation={{ disabled: true }}>
          <TransformComponent wrapperClass="map-transform-wrapper" contentClass="map-transform-content">
            <div className="merged-grid-container" style={{display: "grid", gridTemplateColumns: columnSizes.join(" "), gridTemplateRows: rowSizes.join(" "),}}>
              {gridElements}
            </div>
        </TransformComponent>
        </TransformWrapper>
      </div>
      <ScoutReportModal
        isOpen={!!modalCell}
        cellInfo={modalCell}
        mapName={mapId}
        reportData={multiReportCell ? null : getFocusedReportForCell(focusedReport, modalCell)}
        onClose={handleCloseModal}
        selectedCells={multiReportCell ? selectedCells : undefined}
      />
    </div>
  );
};

export default HW1012Map;
