import React, { useState, useEffect } from 'react';
import mapData from './leg.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

// Declare unclickable cells
const STATIC_CELLS = ["PAD", "VERWERKINGSHAL", "Legmeerdijk", "Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4", "silo", "ketel", "wkk", "water ruimte", "Afdeling 3", "Afdeling 4", "Afdeling 2.2", "Afdeling 2.1", "Ketel en WWK", "WC", "Verwerkingshal // Buffer", "kantine"];

const Leg = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  // Load the data
  useEffect(() => {
    fetch('http://localhost:8000/api/reports')
      .then(res => res.json())
      .then(({ status, data }) => {
        if (status !== 'success') {
          return;
        }

        const statuses = {};
        data.forEach(({ cell_name, status }) => {
          const name = String(cell_name);
          
          // Overwrite the data if the form says the data is approved 
          if (status === 'approved' || !statuses[name]) {
            statuses[name] = status;
          }
        });

        setCellStatuses(statuses);
      }); 
  }, []);

  // Highlight a specific cell
  useEffect(() => {
    if (focusedReport) {
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

  const renderGrid = () => {
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
        const isSelected = selectedCell?.cell_name === key;

        return (
          <div
            key={`${r}-${c}`}
            className={[
              'grid-cell',
              label ? 'merged-block' : 'empty',
              isStatic ? 'static-block' : 'clickable-block',
              cellStatuses[key] || '',
              isSelected ? 'selected' : ''
            ].join(' ').trim()}
            // Stretch a cell for multiple row and column if needed
            style={{ gridRow: `span ${h}`, gridColumn: `span ${w}` }}
            // Click and fill the form 
            onClick={isStatic ? null : () => setSelectedCell({ cell_name: key })}
          >
            {label}
          </div>
        );
      })
    );
  };

  return (
    <div className="map-container">
      <div className="map-header"><h2>HW 13</h2></div>
      <div className="map-viewport">
        <div
          className="merged-grid-container"
          style={{ gridTemplateColumns: `repeat(${mapData[0].length}, 60px)`, gridAutoRows: '25px' }}
        >
          {renderGrid()}
        </div>
      </div>
      <ScoutReportModal
        // Pop-up from 
        isOpen={!!selectedCell}
        cellInfo={selectedCell}
        reportData={focusedReport?.cell_name === selectedCell?.cell_name ? focusedReport : null}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  );
};

export default Leg;