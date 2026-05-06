import React, { useState, useEffect } from 'react';
import mapData from './hw10.15.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import { useTranslation } from "react-i18next";

const HW1015Map = ({ focusedReport, mapName = "HW 10.15" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const { t, i18n } = useTranslation(); //i18n for local language

  const unclickableLabels = ["Schuur", "Deur naar 1600", "1300"];

  const getDisplayLabel = (label) => {
    const translations = {
      "Schuur": t("hw1015.Shed"),
      "Deur naar 1600": t("hw1015.DoorTo1600"),
    };

    return translations[label] || label;
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/reports?map_id=${mapName}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const statusMap = {};
          data.data.forEach(report => {
            const currentStatus = statusMap[report.cell_name];
            if (report.status === 'approved') {
              statusMap[report.cell_name] = 'approved';
            } else if (report.status === 'pending' && currentStatus !== 'approved') {
              statusMap[report.cell_name] = 'pending';
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
            const bounds = getMergedBounds(r, c, mapData[r][c]);
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport]);

  const getMergedBounds = (r, c, label) => {
    const isNull = label === null || label === '';
    let maxR = r; let maxC = c;
    
    // 计算最大宽度
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
          
          let statusClass = '';
          if (cellStatuses[bounds.label] === 'pending') statusClass = 'status-pending';
          if (cellStatuses[bounds.label] === 'approved') statusClass = 'status-approved';

          gridElements.push(
            <div
              key={`${rIdx}-${cIdx}`}
              className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${selectedGroup?.label === bounds.label ? 'selected' : ''} ${statusClass}`}
              style={{
                gridRow: `span ${bounds.height}`,
                gridColumn: `span ${bounds.width}`
              }}
              onClick={isUnclickable ? null : () => {
                setSelectedGroup(bounds);
                setViewingReport(null);
              }}
            >
              {getDisplayLabel(bounds.label)}
            </div>
          );
        }
      }
    });
  });

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>{t("hw1015.Header")}</h2>
        <p className="mobile-hint">{t("hw1015.MobileHint")}</p>
      </div>
      <div className="map-viewport">
        <div className="merged-grid-container" style={{ display: 'grid', gridTemplateColumns: `repeat(${mapData[0].length}, minmax(22px, 1fr))`, gridAutoRows: 'minmax(45px, auto)' }}>
          {gridElements}
        </div>
      </div>
      <ScoutReportModal isOpen={!!selectedGroup} onClose={() => { setSelectedGroup(null); setViewingReport(null); }} cellInfo={selectedGroup} reportData={viewingReport} mapName={mapName} />
    </div>
  );
};

export default HW1015Map;