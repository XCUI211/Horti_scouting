import { useEffect } from 'react';

// Uses a specific event to actually listen for report submissions, so that, when a report is submitted
// and the backend updates the report status to "pending", the frontend can immediately be visually updated
// rather than having to refresh the page
export const REPORT_SUBMITTED_EVENT = 'hortihorti:report-submitted';

export function useMapReportStatusUpdates(mapName, setCellStatuses, pendingValue = 'pending') {
  useEffect(() => {
    const handleReportSubmitted = (event) => {
      if (event.detail?.mapName !== mapName || !Array.isArray(event.detail?.targets)) return;

      setCellStatuses((currentStatuses) => {
        const nextStatuses = { ...currentStatuses };

        event.detail.targets.forEach((target) => {
          const key = target?.block_key || target?.label;
          if (key) nextStatuses[key] = pendingValue;
        });

        return nextStatuses;
      });
    };

    window.addEventListener(REPORT_SUBMITTED_EVENT, handleReportSubmitted);
    return () => window.removeEventListener(REPORT_SUBMITTED_EVENT, handleReportSubmitted);
  }, [mapName, pendingValue, setCellStatuses]);
}
