import React from 'react';
import { useTranslation } from 'react-i18next';

// Toolbar component used for multi-select mode so that users can easily turn multi-select on/off, select/deselect all
// floors, and see the amount of selected floors.
export default function MapMultiSelectToolbar({
  enabled,
  selectedCount,
  totalCount,
  onToggle,
  onSelectAll,
  onClear,
  onCreateReport,
}) {
  const { t } = useTranslation();

  if (totalCount <= 1) return null;

  return (
    <div className={`map-multiselect-toolbar ${enabled ? 'active' : ''}`}>
      <button type="button" className="map-multiselect-toggle" onClick={onToggle}>
        {enabled ? t('MapMultiSelect.Disable') : t('MapMultiSelect.Enable')}
      </button>

      {enabled && (
        <>
          <span className="map-multiselect-count">
            {t('MapMultiSelect.SelectedCount', { count: selectedCount, total: totalCount })}
          </span>
          <button type="button" className="map-multiselect-action" onClick={onSelectAll}>
            {t('MapMultiSelect.SelectAll')}
          </button>
          <button type="button" className="map-multiselect-action" onClick={onClear} disabled={selectedCount === 0}>
            {t('MapMultiSelect.Clear')}
          </button>
          <button type="button" className="map-multiselect-submit" onClick={onCreateReport} disabled={selectedCount === 0}>
            {t('MapMultiSelect.CreateReport')}
          </button>
        </>
      )}
    </div>
  );
}
