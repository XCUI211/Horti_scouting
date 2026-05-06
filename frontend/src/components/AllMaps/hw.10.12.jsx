import React, { useState, useEffect } from 'react';
import mapData from './hw10.12.json'; 
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const HW1012Map = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const mapId = "HW 10.12";

  const staticCells = [
    "Tranportbaan",    // 原表里就是这个拼写
    "Transport",
    "Deur naar kas 2",
    "Deur naar kas 3",
    "1100",
    "Piramides",
    "Bakken"
    // 注: F1/F2/G1/G3 等特殊编号格子目前保留为可点击。
    // 如果这些是标注而非可 scout 的区域, 把它们加到这里。
  ];

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
      setSelectedCell({ label: focusedReport.cell_name });
    }
  }, [focusedReport]);

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    if (!label) return { width, height };
    while (col + width < mapData[row].length && mapData[row][col + width] === label) width++;
    while (row + height < mapData.length && mapData[row + height][col] === label) height++;
    return { width, height };
  };

  const renderGrid = () => {
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

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${status || ''} ${selectedCell?.label === labelStr ? 'selected' : ''}`}
            style={{ 
              gridRow: `span ${height}`, 
              gridColumn: `span ${width}`,
              backgroundColor: typeof label === 'number' && !isStatic ? '#e8f5e9' : undefined 
            }}
            onClick={isStatic ? null : () => setSelectedCell({ label: labelStr })}
          >
            {labelStr}
          </div>
        );
      });
    });

    return cells;
  };

  return (
    <div className="map-container">
      <h2>HW 10.12 - Scouting Map</h2>
      <div
        className="merged-grid-container"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${mapData[0].length}, minmax(32px, 1fr))`,
          gridAutoRows: 'minmax(50px, auto)'
        }}
      >
        {renderGrid()}
      </div>

      <ScoutReportModal
        isOpen={!!selectedCell}
        cellInfo={selectedCell}
        mapName={mapId}
        reportData={focusedReport?.cell_name === selectedCell?.label ? focusedReport : null}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  );
};

export default HW1012Map;
