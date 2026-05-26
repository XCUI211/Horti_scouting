import React, { useState, useEffect } from 'react';
import mapData from './hw.15.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const HW15Map = ({ focusedReport, mapName = "HW 15" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const isClickable = (labelStr) => {
    const str = labelStr.trim();
    return /^\d+(\.\d+)?$/.test(str) || /^[A-Z][^a-zA-Z]*$/.test(str);
  };

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
    const isNumberCell = /^\d+$/.test(labelStr);

    while (col + width < mapData[row].length) {
      const nextCell = mapData[row][col + width];
      if (nextCell === null || nextCell === '') break;
      if (String(nextCell).trim() !== labelStr) break;
      if (isNumberCell && width >= 2) break;
      width++;
    }

    if (!isNumberCell) {
      while (row + height < mapData.length) {
        const nextRowMatches = Array.from({ length: width }, (_, i) => {
          const cellBelow = mapData[row + height][col + i];
          if (cellBelow === null || cellBelow === '') return false;
          return String(cellBelow).trim() === labelStr;
        }).every(Boolean);
        if (!nextRowMatches) break;
        height++;
      }
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

  const renderGrid = () => {
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

        let statusClass = '';
        const currentStatus = cellStatuses[blockKey] || cellStatuses[labelStr];
        if (currentStatus === 'pending') statusClass = 'status-pending';
        if (currentStatus === 'approved') statusClass = 'status-approved';

        const isSelected = selectedGroup?.block_key === blockKey || 
                          (!selectedGroup?.block_key && selectedGroup?.label === labelStr && selectedGroup?.startRow === r && selectedGroup?.startCol === c);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={[
              'grid-cell',
              'merged-block',
              clickable ? 'clickable-block' : 'static-block',
              statusClass,
              isSelected ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              gridRow: `span ${height}`,
              gridColumn: `span ${width}`,
              backgroundColor: clickable ? '#e8f5e9' : undefined,
            }}
            onClick={clickable ? () => {
              setSelectedGroup({ label: labelStr, startRow: r, startCol: c, width, height, block_key: blockKey });
              setViewingReport(null);
            } : undefined}
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
      <div className="map-header">
        <h2>HW15 - Scouting Map</h2>
        <p className="mobile-hint">Drag your finger to move the map • Tap a section to report</p>
      </div>

      <div className="map-viewport">
        <div
          className="merged-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${mapData[0].length}, 45px)`,
            gridAutoRows: '45px',
          }}
        >
          {renderGrid()}
        </div>
      </div>

      <ScoutReportModal
        isOpen={!!selectedGroup}
        onClose={() => { setSelectedGroup(null); setViewingReport(null); }}
        cellInfo={selectedGroup}
        reportData={viewingReport}
        mapName={mapName}
      />
    </div>
  );
};

export default HW15Map;