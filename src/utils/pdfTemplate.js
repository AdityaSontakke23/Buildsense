import { PASSIVE_STRATEGIES, WALL_TYPES, ROOF_TYPES } from './constants';

const getLabel = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value;

const riskColors     = { Low: '#16A34A', Medium: '#D97706', High: '#DC2626' };
const priorityColors = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };

// Impact color is INVERTED from priority — high impact = green (good), low = red
const impactColors = { high: '#16A34A', medium: '#D97706', low: '#DC2626' };

const scoreGaugeSvg = (score) => {
  const radius = 54;
  const cx = 70, cy = 70;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const color = score >= 70 ? '#16A34A' : score >= 45 ? '#D97706' : '#DC2626';

  return `
    <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 70 A 54 54 0 0 1 124 70"
        fill="none" stroke="#E5E7EB" stroke-width="12" stroke-linecap="round"/>
      <path d="M 16 70 A 54 54 0 0 1 124 70"
        fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        style="transition: stroke-dashoffset 1s ease"/>
      <text x="70" y="66" text-anchor="middle"
        font-family="Georgia, serif" font-size="22" font-weight="700" fill="${color}">${score}</text>
      <text x="70" y="78" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="9" fill="#6B7280">out of 100</text>
    </svg>`;
};

export const buildPdfHtml = (project, results) => {
  const {
    name, city, area, floors, orientation, wallType,
    roofType, wwr, passiveStrategies = [], weather, created_at,
  } = project;

  const dateStr = created_at
    ? new Date(created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'N/A';

  const riskColor      = riskColors[results.overheatingRisk] ?? '#6B7280';
  const enabledStrats  = PASSIVE_STRATEGIES.filter((s) => passiveStrategies.includes(s.id));
  const disabledStrats = PASSIVE_STRATEGIES.filter((s) => !passiveStrategies.includes(s.id));

  const recsHtml = (results.recommendations ?? []).map((rec) => {
    const pColor      = priorityColors[rec.priority] ?? '#6B7280';
    const iColor      = impactColors[rec.impact]     ?? '#6B7280';
    const impactWidth = rec.impact === 'high' ? 90 : rec.impact === 'medium' ? 55 : 25;
    const impactLabel = rec.impact
      ? rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)
      : '';

    return `
      <div style="border:1.5px solid #E5E7EB; border-radius:10px; padding:16px; margin-bottom:12px; page-break-inside:avoid;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <span style="font-weight:700; font-size:13px; color:#111827; flex:1;">${rec.title}</span>
          <span style="background:${pColor}20; color:${pColor}; font-size:11px; font-weight:700;
            padding:2px 10px; border-radius:20px; margin-left:8px;">${rec.priority}</span>
        </div>
        <p style="font-size:12px; color:#4B5563; line-height:1.7; margin:0 0 10px 0;">${rec.reason}</p>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:11px; color:#9CA3AF; width:38px;">Impact</span>
          <div style="flex:1; height:5px; background:#E5E7EB; border-radius:3px; overflow:hidden;">
            <div style="width:${impactWidth}%; height:100%; background:${iColor}; border-radius:3px;"></div>
          </div>
          <span style="font-size:11px; color:${iColor}; font-weight:700; width:44px;">${impactLabel}</span>
        </div>
      </div>`;
  }).join('');

  const stratBadge = (s, enabled) => `
    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 12px;
      border-radius:20px; font-size:11px; font-weight:600; margin:3px;
      background:${enabled ? '#D1FAE520' : '#F3F4F6'}; color:${enabled ? '#065F46' : '#9CA3AF'};
      border:1px solid ${enabled ? '#6EE7B780' : '#E5E7EB'};">
      ${enabled ? '✓' : '○'} ${s.label}
    </span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${name} — BuildSense Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px; color: #111827; background: #F9FAFB;
    padding: 0; line-height: 1.6;
  }
  .page { max-width: 720px; margin: 0 auto; background: #fff; }

  .cover {
    background: linear-gradient(135deg, #1D4ED8 0%, #0F172A 100%);
    color: white; padding: 48px 40px 40px; position: relative; overflow: hidden;
  }
  .cover::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .cover-brand { font-size: 13px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 32px; }
  .cover-title { font-size: 30px; font-weight: 800; margin-bottom: 8px; }
  .cover-city  { font-size: 16px; color: rgba(255,255,255,0.75); margin-bottom: 32px; }
  .cover-meta  { display: flex; gap: 24px; flex-wrap: wrap; }
  .cover-meta-item { font-size: 12px; color: rgba(255,255,255,0.6); }
  .cover-meta-item strong { display: block; font-size: 16px; color: white; font-weight: 700; }

  .score-band {
    display: flex; align-items: center; gap: 32px;
    padding: 28px 40px; background: #F8FAFC;
    border-bottom: 1px solid #E5E7EB;
  }
  .score-right { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .metric { background: white; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px 16px; }
  .metric-label { font-size: 11px; color: #9CA3AF; margin-bottom: 4px; }
  .metric-value { font-size: 20px; font-weight: 800; color: #111827; }

  .section { padding: 28px 40px; border-bottom: 1px solid #F3F4F6; }
  .section-title {
    font-size: 13px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1px; color: #6B7280; margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::before {
    content: ''; display: inline-block; width: 3px; height: 16px;
    background: #2563EB; border-radius: 2px;
  }

  .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .data-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid #F9FAFB;
  }
  .data-label { color: #9CA3AF; font-size: 12px; }
  .data-value { color: #111827; font-weight: 600; font-size: 12px; text-transform: capitalize; }

  .breakdown-row {
    display: flex; justify-content: space-between; padding: 7px 14px;
    border-radius: 6px; margin-bottom: 3px;
  }
  .breakdown-row:nth-child(even) { background: #F9FAFB; }

  .footer {
    padding: 20px 40px; text-align: center;
    font-size: 11px; color: #9CA3AF; background: #F9FAFB;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-brand">BuildSense · Thermal Performance Report</div>
    <div class="cover-title">${name}</div>
    <div class="cover-city">📍 ${city}</div>
    <div class="cover-meta">
      <div class="cover-meta-item"><strong>${area} m²</strong>Floor Area</div>
      <div class="cover-meta-item"><strong>${floors}</strong>Floors</div>
      <div class="cover-meta-item"><strong>${orientation}</strong>Orientation</div>
      <div class="cover-meta-item"><strong>${wwr}%</strong>WWR</div>
      <div class="cover-meta-item"><strong>${dateStr}</strong>Report Date</div>
    </div>
  </div>

  <!-- Score band -->
  <div class="score-band">
    ${scoreGaugeSvg(results.score)}
    <div class="score-right">
      <div class="metric">
        <div class="metric-label">Risk Level</div>
        <div class="metric-value" style="color:${riskColor};">${results.overheatingRisk}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Comfort Index</div>
        <div class="metric-value">${results.comfortIndex}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Climate Stress</div>
        <div class="metric-value">${results.climateStress}%</div>
      </div>
    </div>
  </div>

  <!-- Score breakdown -->
  <div class="section">
    <div class="section-title">Score Breakdown</div>
    ${[
      ['Base Score',         '+60',                                                                    '#2563EB'],
      ['Material Impact',    `${results.materialScore   >= 0 ? '+' : ''}${results.materialScore}`,    results.materialScore   >= 0 ? '#16A34A' : '#DC2626'],
      ['Orientation Impact', `${results.orientationScore >= 0 ? '+' : ''}${results.orientationScore}`,results.orientationScore >= 0 ? '#16A34A' : '#DC2626'],
      ['Passive Bonus',      `+${results.strategyBonus}`,                                             '#16A34A'],
      ['Climate Penalty',    `-${results.climatePenalty}`,                                            '#DC2626'],
      ['Final Score',        `${results.score} / 100`,                                                '#111827'],
    ].map(([label, value, color]) => `
      <div class="breakdown-row">
        <span style="font-size:12px; color:#374151;">${label}</span>
        <span style="font-size:13px; font-weight:700; color:${color};">${value}</span>
      </div>`).join('')}
  </div>

  <!-- Location + weather -->
  ${weather ? `
  <div class="section">
    <div class="section-title">Location &amp; Weather</div>
    <div class="data-grid">
      <div>
        <div class="data-row"><span class="data-label">City</span><span class="data-value">${city}</span></div>
        <div class="data-row"><span class="data-label">Temperature</span><span class="data-value">${weather.temp}°C</span></div>
        <div class="data-row"><span class="data-label">Humidity</span><span class="data-value">${weather.humidity}%</span></div>
      </div>
      <div>
        <div class="data-row"><span class="data-label">Wind Speed</span><span class="data-value">${weather.windSpeed} m/s</span></div>
        <div class="data-row"><span class="data-label">Condition</span><span class="data-value">${weather.description ?? 'N/A'}</span></div>
        <div class="data-row"><span class="data-label">Climate Type</span><span class="data-value">${(results.climate ?? '').replace('_', ' ')}</span></div>
      </div>
    </div>
  </div>` : ''}

  <!-- Envelope -->
  <div class="section">
    <div class="section-title">Envelope</div>
    <div class="data-grid">
      <div>
        <div class="data-row"><span class="data-label">Wall Type</span><span class="data-value">${getLabel(WALL_TYPES, wallType)}</span></div>
        <div class="data-row"><span class="data-label">Roof Type</span><span class="data-value">${getLabel(ROOF_TYPES, roofType)}</span></div>
      </div>
      <div>
        <div class="data-row"><span class="data-label">WWR</span><span class="data-value">${wwr}%</span></div>
        <div class="data-row"><span class="data-label">Orientation</span><span class="data-value">${orientation}</span></div>
      </div>
    </div>
  </div>

  <!-- Passive strategies -->
  <div class="section">
    <div class="section-title">Passive Strategies</div>
    <div style="margin-bottom:6px;">
      ${enabledStrats.map((s) => stratBadge(s, true)).join('')}
      ${disabledStrats.map((s) => stratBadge(s, false)).join('')}
    </div>
  </div>

  <!-- Recommendations -->
  ${results.recommendations?.length ? `
  <div class="section">
    <div class="section-title">Architectural Recommendations (${results.recommendations.length})</div>
    ${recsHtml}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    Generated by BuildSense · ${dateStr} · This report is for design guidance purposes only.
  </div>

</div>
</body>
</html>`;
};