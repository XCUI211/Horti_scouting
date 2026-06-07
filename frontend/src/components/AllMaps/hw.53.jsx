import React, { useState, useEffect } from 'react';
import mapData from './hw53.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import { useTranslation } from "react-i18next";
import MapMultiSelectToolbar from './MapMultiSelectToolbar';
import { useMapMultiSelect } from './useMapMultiSelect';
import { getFocusedReportForCell } from './mapSelection';

const HW53Map = ({ focusedReport }) => {
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

  const { t } = useTranslation();

  const mapId = "HW 53";

  const staticCells = [
    "HW 53",
    "water ruimte",
    "schuur/ketelhuis",
    "wkk/kunstmest unit",
    "21"
  ];

  const getDisplayLabel = (label) => {
    const translations = {
      "water ruimte": t("hw53.WaterRoom"),
      "schuur/ketelhuis": t("hw53.ShedBoilerHouse"),
      "wkk/kunstmest unit": t("hw53.FertilizerUnit"),
    };

    return translations[label] || label;
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/reports?map_id=${encodeURIComponent(mapId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') return;
        const statuses = {};
        data.data.forEach(report => {
          if (report.status === 'approved' || !statuses[report.cell_name]) {
            statuses[report.cell_name] = report.status;
          }
        });
        setCellStatuses(statuses);
      });
  }, []);

  useEffect(() => {
    if (focusedReport) {
      // focusedReport 来自后端, 字段是 cell_name; modal 用的是 label
      setSelectedCell({
        label: focusedReport.cell_name,
        block_key: focusedReport.block_key,
      });
    }
  }, [focusedReport]);

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    if (!label) return { width, height };
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
        const status = cellStatuses[labelStr];
        const blockKey = `${mapId}::${labelStr}::${r}:${c}`;
        const cellInfo = { label: labelStr, startRow: r, startCol: c, width, height, block_key: blockKey };
        if (!isStatic) selectableCells.push(cellInfo);
        const isMultiSelected = !isStatic && isCellMultiSelected(cellInfo);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${status || ''} ${
              selectedCell?.block_key === blockKey || (!selectedCell?.block_key && selectedCell?.label === labelStr) ? 'selected' : ''
            } ${isMultiSelected ? 'multi-selected' : ''}`}
            style={{
              gridRow: `span ${height}`,
              gridColumn: `span ${width}`,
              backgroundColor: typeof label === 'number' && !isStatic ? '#e8f5e9' : undefined
            }}
            onClick={isStatic ? null : () => handleSelectableCellClick(cellInfo, setSelectedCell)}
          >
            {getDisplayLabel(labelStr)}
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
        <div
          className="merged-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${mapData[0].length}, minmax(80px, 1fr))`,
            gridAutoRows: 'minmax(55px, auto)'
          }}
        >
          {gridElements}
        </div>
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

export default HW53Map;
