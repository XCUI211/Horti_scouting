import { useState } from 'react';
import { isCellInSelection, toggleCellInSelection } from './mapSelection';

// Manages varying states to keep track of, for example, which floors are selected, how many floors are selected, and
// whether multi-select mode is currently turned on. These helper functions make it easier to implement the multi-select
// features within all maps, since each map.jsx file can now just call these functions, rather than having to '
// re-implement the same things for all maps.
export function useMapMultiSelect({ clearSingleSelection } = {}) {
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [multiReportCell, setMultiReportCell] = useState(null);

  const clearMultiSelection = () => {
    setSelectedCells([]);
    setMultiReportCell(null);
  };

  const toggleMultiSelectMode = () => {
    clearMultiSelection();
    clearSingleSelection?.();
    setMultiSelectEnabled((enabled) => !enabled);
  };

  const handleSelectableCellClick = (cell, handleSingleClick) => {
    if (multiSelectEnabled) {
      setSelectedCells((currentCells) => toggleCellInSelection(currentCells, cell));
      setMultiReportCell(null);
      clearSingleSelection?.();
      return;
    }

    clearMultiSelection();
    handleSingleClick(cell);
  };

  const selectAllCells = (cells) => {
    setMultiSelectEnabled(true);
    setSelectedCells(cells);
    setMultiReportCell(null);
    clearSingleSelection?.();
  };

  const openMultiReport = () => {
    if (selectedCells.length === 0) return;
    setMultiReportCell(selectedCells[0]);
    clearSingleSelection?.();
  };

  const closeMultiReport = ({ reset = false } = {}) => {
    setMultiReportCell(null);
    if (reset) {
      setSelectedCells([]);
      setMultiSelectEnabled(false);
    }
  };

  return {
    multiSelectEnabled,
    selectedCells,
    multiReportCell,
    toggleMultiSelectMode,
    handleSelectableCellClick,
    selectAllCells,
    clearMultiSelection,
    openMultiReport,
    closeMultiReport,
    isCellMultiSelected: (cell) => isCellInSelection(selectedCells, cell),
  };
}
