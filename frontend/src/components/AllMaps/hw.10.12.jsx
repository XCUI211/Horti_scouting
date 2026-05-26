import React, { useState, useEffect } from 'react';
import mapData from './hw10.12.json'; 
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const HW1012Map = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

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
        
        const blockKey = `${mapId}::${labelStr}::${r}:${c}`;
        const statusClass = cellStatuses[blockKey] || cellStatuses[labelStr] || '';

        const isSelected = selectedCell?.block_key === blockKey || 
                          (!selectedCell?.block_key && selectedCell?.label === labelStr);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${statusClass} ${isSelected ? 'selected' : ''}`}
            style={{ 
              gridRow: `span ${height}`, 
              gridColumn: `span ${width}`,
              backgroundColor: typeof label === 'number' && !isStatic ? '#e8f5e9' : undefined 
            }}
            onClick={isStatic ? null : () => setSelectedCell({ 
              label: labelStr,
              block_key: blockKey 
            })}
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
          gridTemplateColumns: `repeat(${mapData[0].length}, minmax(40px, 1fr))` 
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