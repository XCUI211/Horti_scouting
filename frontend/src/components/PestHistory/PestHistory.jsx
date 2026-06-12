import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axios from 'axios';
import { formatPestName, getPestColor } from '../../constants/pestNames';
import './PestHistory.css';
import { useTranslation } from "react-i18next";
import { MAP_ORDER } from '../../constants/mapOrder';

const PERIOD_KEYS = [
    { key: 'week', labelKey: 'PestHistory.Periods.Week' },
    { key: 'month', labelKey: 'PestHistory.Periods.Month' },
    { key: 'year', labelKey: 'PestHistory.Periods.Year' },
    { key: 'all', labelKey: 'PestHistory.Periods.All' },];

// Used to format the "tooltip" when hovering over a pest in the bar plot
function PestHistoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (<div className="pest-history-tooltip">
          <div className="pest-history-tooltip-title">{item.name}</div>
          <div className="pest-history-tooltip-value">{item.value} reports</div>
          </div>);
}

// Main part that takes care of getting the data for the bar plot, actually creating the plot, and showing the details
// of the pest when overing over one of the options in the bar plot.
export default function PestHistory() {const { t } = useTranslation();
                                       const [period, setPeriod] = useState('month');
                                       const [selectedMap, setSelectedMap] = useState('all');
                                       const [data, setData] = useState([]);
                                       const [loading, setLoading] = useState(true);
                                       const [error, setError] = useState(null);
                                       const [selectedPest, setSelectedPest] = useState(null);
                                       const [detailLoading, setDetailLoading] = useState(false);
                                       const [detailError, setDetailError] = useState(null);
                                       const [detailData, setDetailData] = useState(null);
                                       const [comparisonData, setComparisonData] = useState([]);
                                       const [comparisonLoading, setComparisonLoading] = useState(true);
                                       const [comparisonError, setComparisonError] = useState(null);

  const formatBiologyTypes = (biologyTypes) => {
    if (!Array.isArray(biologyTypes)) return [];

    return biologyTypes.map((biologyType) => {
      const match = /^bio(\d+)$/i.exec(String(biologyType));
      if (!match) return biologyType;

      return t(`ScoutReportModal.Bio${match[1]}`, { defaultValue: biologyType });
    });
  };

  // Whenever the selected time period or map changes, retrieve the reports for that specific filter
  useEffect(() => {
    const controller = new AbortController();

    const fetchHistory = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          'http://localhost:5000/api/analytics/pest-history',
          {
            signal: controller.signal,
            params: {
              period,
              map_id: selectedMap,
            },
          }
        );

        if (response.data.status === 'success') {
          const chartData = (response.data.data || []).map((item) => ({
            name: formatPestName(item.pest_type),
            internalName: item.pest_type,
            value: Number(item.count),
          }));

          setData(chartData);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load pest history');
          setData([]);
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;

        console.error('Error fetching pest history:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load pest history');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => controller.abort();
  }, [period, selectedMap]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPest(null);
    setDetailData(null);
    setDetailError(null);
  }, [period, selectedMap]);

  const totalCount = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const chartHeight = Math.max(260, data.length * 44 + 40);

  useEffect(() => {
    if (!selectedPest) {
      return;
    }

    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        setDetailLoading(true);

        const response = await axios.get(
          'http://localhost:5000/api/analytics/pest-history-details',
          {
            signal: controller.signal,
            params: {
              period,
              pest_type: selectedPest.internalName,
              map_id: selectedMap,
            },
          }
        );

        if (response.data.status === 'success') {
          setDetailData(response.data.data);
          setDetailError(null);
        } else {
          setDetailData(null);
          setDetailError(response.data.message || 'Failed to load pest details');
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;

        console.error('Error fetching pest details:', err);
        setDetailData(null);
        setDetailError(err.response?.data?.message || err.message || 'Failed to load pest details');
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();

    return () => controller.abort();
  }, [selectedPest, period, selectedMap]);

    useEffect(() => {
    const controller = new AbortController();

    const fetchComparison = async () => {
      try {
        setComparisonLoading(true);

        const response = await axios.get(
          'http://localhost:5000/api/analytics/pest-week-comparison',
          {
            signal: controller.signal,
            params: {
              map_id: selectedMap,
            },
          }
        );

        if (response.data.status === 'success') {
          setComparisonData(response.data.data || []);
          setComparisonError(null);
        } else {
          setComparisonData([]);
          setComparisonError(response.data.message || 'Failed to load weekly comparison');
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;

        console.error('Error fetching weekly comparison:', err);
        setComparisonData([]);
        setComparisonError(err.response?.data?.message || err.message || 'Failed to load weekly comparison');
      } finally {
        setComparisonLoading(false);
      }
    };

    fetchComparison();

    return () => controller.abort();
  }, [selectedMap]);
    const getComparisonStatusLabel = (status) => {
    if (status === 'improved') return 'Improved';
    if (status === 'worse') return 'Worse';
    if (status === 'new_issue') return 'New issue';
    return 'No change';
  };

  const getDifferenceText = (difference) => {
    if (difference > 0) return `+${difference}`;
    return String(difference);
  };

  // Whenever the time period is changed, also reset the selected pest and the pest details, since said information
  // is based on the selected time period
  return (
    <div className="pest-history-page-wrapper">
      <section className="pest-history-container">
        <div className="pest-history-header">
          <div>
            <h2 className="pest-history-title">Pest history</h2>
            <p className="pest-history-subtitle">Bar chart of pest counts for the selected time period.</p>
          </div>

          <div className="pest-history-controls">
            <label className="pest-history-map-filter">
              <span>Map</span>
              <select
                value={selectedMap}
                onChange={(event) => setSelectedMap(event.target.value)}
              >
                <option value="all">All maps</option>
                {MAP_ORDER.map((mapName) => (
                  <option key={mapName} value={mapName}>
                    {mapName}
                  </option>
                ))}
              </select>
            </label>

            <div className="pest-history-periods" role="tablist" aria-label={t?.('PestHistory.Periods.Label', 'Pest history period')}>
              {PERIOD_KEYS.map((item) => {
                const label = t(item.labelKey, { defaultValue: item.key.charAt(0).toUpperCase() + item.key.slice(1) });

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`pest-history-period-btn ${period === item.key ? 'active' : ''}`}
                    onClick={() => setPeriod(item.key)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Show different states: loading, error, empty, or the actual bar graph and details */}
        {loading ? (
          <div className="pest-history-state">Loading...</div>
        ) : error ? (
          <div className="pest-history-state error">Error: {error}</div>
        ) : data.length === 0 ? (
          <div className="pest-history-state empty">No pest history found for this period.</div>
        ) : (
          <>
            <div className="pest-history-chart-wrap">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<PestHistoryTooltip />} cursor={{ fill: 'rgba(25, 118, 210, 0.06)' }} />
                  <Bar dataKey="value" barSize={26} radius={[0, 6, 6, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={getPestColor(entry.internalName)}
                        style={{ cursor: 'pointer', opacity: selectedPest?.internalName && selectedPest.internalName !== entry.internalName ? 0.55 : 1 }}
                        onClick={() => setSelectedPest(entry)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pest-history-summary">
              <p> Total pest reports: {totalCount} {selectedMap === 'all' ? ' (All maps)' : ` (${selectedMap})`} </p>
            </div>

            <div className="pest-history-detail-card">
                <div className="pest-history-detail-header">
                  <div>
                    <div className="pest-history-detail-kicker">Pest report summary</div>
                    <h3 className="pest-history-detail-title">
                      {selectedPest ? formatPestName(selectedPest.internalName) : 'Select a pest'}
                    </h3></div>
                  <div className="pest-history-detail-header-right">
                    {selectedPest && (
                      <div className="pest-history-detail-selected-count">
                        Amount of reports: {detailData?.historyCount ?? 0}
                      </div>
                    )}
                  </div>
                </div>

              {/* When a pest in the bar plot is clicked on, show the all approved reports regarding that pest, based on
              the selected time period */}
              {!selectedPest ? (
                <div className="pest-history-detail-empty">
                  Click on a bar to see the approved history for that pest.
                </div>
              ) : detailLoading ? (
                <div className="pest-history-detail-empty">Loading pest details...</div>
              ) : detailError ? (
                <div className="pest-history-detail-empty error">Error: {detailError}</div>
              ) : detailData ? (
                <div className="pest-history-detail-body">
                  <div className="pest-history-detail-section">
                    {detailData.history.length === 0 ? (
                      <div className="pest-history-detail-empty-box">No approved reports found for this pest in the selected period.</div>
                    ) : (
                      <div className="pest-history-detail-list">
                          {detailData.history.map((item) => (
                            <div key={item.report_id} className="pest-history-detail-item">
                              <div className="pest-history-detail-item-wrapper">
                                <div className="pest-history-detail-item-left">
                                  <div className="pest-history-detail-status-row">
                                    <span className="pest-history-detail-date">{item.entry_date}</span>
                                  </div>
                                  <div className="pest-history-detail-meta">
                                    <strong>Map:</strong> {item.map_id}
                                  </div>
                                  <div className="pest-history-detail-meta">
                                    <strong>Floor:</strong> {item.cell_name}
                                  </div>
                                  <div className="pest-history-detail-meta">
                                    <strong>Scout:</strong> {item.reporter_name}
                                  </div>
                                  <div className="pest-history-detail-meta">
                                    <strong>Severity:</strong> {item.severity != null ? `Level ${item.severity}` : 'Not available'}
                                  </div>
                                </div>
                                <div className="pest-history-detail-item-right">
                                  <div className="pest-history-detail-status-row"></div>
                                  <div className="pest-history-biology-section">
                                    <div className="pest-history-detail-meta">
                                      <strong>Biology:</strong> {item.biology_used ? 'Yes' : 'No'}
                                    </div>
                                    <div className="pest-history-detail-meta">
                                      <strong>Type(s):</strong> {item.biology_types && item.biology_types.length > 0
                                        ? formatBiologyTypes(item.biology_types).join(', ')
                                        : '-'}
                                    </div>
                                  </div>
                                  <div className="pest-history-chemicals-section">
                                    <div className="pest-history-detail-meta">
                                      <strong>Chemicals:</strong> {item.chemicals_used ? 'Yes' : 'No'}
                                    </div>
                                    <div className="pest-history-detail-meta">
                                      <strong>Type(s):</strong> {item.chemicals_types && item.chemicals_types.length > 0 ? item.chemicals_types.join(', ') : '-'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pest-comparison-card">
              <div className="pest-comparison-header">
                <div>
                  <div className="pest-history-detail-kicker">Week comparison</div>
                  <h3 className="pest-history-detail-title">
                    This week vs last week
                  </h3>
                </div>

                <div className="pest-comparison-scope">
                  {selectedMap === 'all' ? 'All maps' : selectedMap}
                </div>
              </div>

              <p className="pest-history-subtitle">
                Compares approved pest reports on the same map and floor. This helps highlight whether treatment may have reduced the issue.
              </p>

              {comparisonLoading ? (
                <div className="pest-history-state">Loading weekly comparison...</div>
              ) : comparisonError ? (
                <div className="pest-history-state error">Error: {comparisonError}</div>
              ) : comparisonData.length === 0 ? (
                <div className="pest-history-state empty">
                  No approved pest reports found for this week or last week.
                </div>
              ) : (
                <div className="pest-comparison-table-wrapper">
                  <table className="pest-comparison-table">
                    <thead>
                      <tr>
                        <th>Map</th>
                        <th>Floor</th>
                        <th>Pest</th>
                        <th>Last week</th>
                        <th>This week</th>
                        <th>Difference</th>
                        <th>Severity</th>
                        <th>Treatment</th>
                        <th>Result</th>
                      </tr>
                    </thead>

                    <tbody>
                      {comparisonData.map((item) => (
                        <tr key={`${item.map_id}-${item.cell_name}-${item.pest_type}`}>
                          <td>{item.map_id}</td>
                          <td>{item.cell_name}</td>
                          <td>{formatPestName(item.pest_type)}</td>
                          <td>{item.previous_reports}</td>
                          <td>{item.current_reports}</td>
                          <td className={item.report_difference > 0 ? 'pest-comparison-worse' : item.report_difference < 0 ? 'pest-comparison-improved' : ''}>
                            {getDifferenceText(item.report_difference)}
                          </td>
                          <td>
                            {item.previous_avg_severity ?? '-'} → {item.current_avg_severity ?? '-'}
                          </td>
                          <td>
                            {item.previous_treatment_used ? 'Used last week' : 'No treatment last week'}
                          </td>
                          <td>
                            <span className={`pest-comparison-badge ${item.status}`}>
                              {getComparisonStatusLabel(item.status)}
                            </span>
                            <div className="pest-comparison-effect">
                              {item.treatment_effect}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
