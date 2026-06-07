// Extra functions to make sure the correct cells are selected when using the multi-select mode. This uses the
// block-keys to properly handle floors with the same name. These functions are used in useMapMultiSelect.
export const getCellLabel = (cell) => cell?.label ?? cell?.cell_name ?? '';

export const getCellSelectionKey = (cell) => {
  if (!cell) return '';
  if (cell.block_key) return cell.block_key;

  const label = getCellLabel(cell);
  const row = cell.startRow ?? '';
  const col = cell.startCol ?? '';
  return `${label}::${row}:${col}`;
};

export const isCellInSelection = (selectedCells, cell) =>
  selectedCells.some((selectedCell) => getCellSelectionKey(selectedCell) === getCellSelectionKey(cell));

export const toggleCellInSelection = (selectedCells, cell) => {
  const key = getCellSelectionKey(cell);
  if (isCellInSelection(selectedCells, cell)) {
    return selectedCells.filter((selectedCell) => getCellSelectionKey(selectedCell) !== key);
  }

  return [...selectedCells, cell];
};

export const getFocusedReportForCell = (focusedReport, selectedCell) => {
  if (!focusedReport || !selectedCell) return null;

  if (focusedReport.block_key && selectedCell.block_key) {
    return focusedReport.block_key === selectedCell.block_key ? focusedReport : null;
  }

  return String(focusedReport.cell_name) === String(getCellLabel(selectedCell)) ? focusedReport : null;
};
