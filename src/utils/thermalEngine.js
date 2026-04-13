/**
 * thermalEngine.js
 * Climate-aware, architecturally nuanced thermal scoring engine.
 */

// ─── Material Tables ──────────────────────────────────────────

const WALL_U_VALUES = {
  insulated: 0.35, aac: 0.65, brick: 1.80, rcc: 3.20,
};
const WALL_THERMAL_MASS = {
  rcc: 9, brick: 7, aac: 4, insulated: 3,
};
const WALL_SCORES  = { insulated: 8,  aac: 5,  brick: 0,  rcc: -4 };
const ROOF_SCORES  = { cool_roof: 10, rcc_insulation: 6, rcc: 0, metal: -8 };

const ORIENT_SOLAR_GAIN = {
  N: 1, NE: 2, E: 4, SE: 5, S: 4, SW: 8, W: 9, NW: 4,
};
const ORIENT_SCORE_MAP = {
  N: 3, NE: 2, E: 1, SE: 0, S: 0, SW: -3, W: -6, NW: -2,
};

const STRATEGY_BONUSES = {
  shading: 6, courtyard: 4, ventilation: 6, insulation: 4,
};

// ─── Climate Classification ───────────────────────────────────

const classifyClimate = (temp, humidity, windSpeed) => {
  if (temp > 35 && humidity > 70) return 'hot_humid';
  if (temp > 35 && humidity < 50) return 'hot_dry';
  if (temp < 20)                  return 'cold';
  if (humidity > 70)              return 'warm_humid';
  return 'composite';
};

// ─── Main Engine ──────────────────────────────────────────────

export const calculateThermalScore = (buildingData, weatherData) => {
  const {
    wallType          = 'brick',
    roofType          = 'rcc',
    orientation       = 'N',
    passiveStrategies = [],
  } = buildingData;

  const wwr = typeof buildingData.wwr === 'number'
    ? buildingData.wwr
    : parseFloat(buildingData.wwr) || 30;

  const {
    temp        = 28,
    humidity    = 60,
    windSpeed   = 3,
    uvIndex     = 5,
    description = '',
  } = weatherData ?? {};

  const climate   = classifyClimate(temp, humidity, windSpeed);
  const wallScore = WALL_SCORES[wallType]  ?? 0;
  const roofScore = ROOF_SCORES[roofType]  ?? 0;

  const wwrPenalty    = Math.round(((wwr - 10) / 80) * 10);
  const orientScore   = ORIENT_SCORE_MAP[orientation] ?? 0;
  const strategyBonus = passiveStrategies.reduce(
    (s, id) => s + (STRATEGY_BONUSES[id] ?? 0), 0
  );

  // Climate stress (0–1)
  const tNorm  = Math.min(Math.max((temp - 18) / 24, 0), 1);
  const hNorm  = Math.min(Math.max((humidity - 30) / 60, 0), 1);
  const wNorm  = 1 - Math.min(Math.max(windSpeed / 8, 0), 1);
  const uvNorm = Math.min(Math.max(uvIndex / 11, 0), 1);
  const climateStressRaw = weatherData
    ? 0.40 * tNorm + 0.25 * hNorm + 0.20 * wNorm + 0.15 * uvNorm
    : 0;
  const climatePenalty = Math.round(40 * climateStressRaw);

  const raw   = 60 + wallScore + roofScore - wwrPenalty + orientScore + strategyBonus - climatePenalty;
  const score = Math.round(Math.min(Math.max(raw, 0), 100));

  const comfortIndex  = Math.round((1 - climateStressRaw) * 100);
  const climateStress = Math.round(climateStressRaw * 100);

  // Ventilation potential: wind + humidity inverse + not hot_humid
  const ventPotential = Math.round(
    Math.min(
      (windSpeed / 8) * 50 +
      (1 - hNorm) * 30 +
      (climate === 'cold' || climate === 'composite' ? 20 : 0),
      100
    )
  );

  const overheatingRisk =
    score < 45 || (climateStressRaw > 0.7 && wwr > 40) ? 'High'
    : score < 65 ? 'Medium'
    : 'Low';

  const materialScore    = wallScore + roofScore;
  const orientationScore = orientScore;

  // ── Suggestion Engine ─────────────────────────────────────
  const suggestions = [];
  const solarGain      = ORIENT_SOLAR_GAIN[orientation] ?? 3;
  const hasShadowing   = passiveStrategies.includes('shading');
  const hasVentilation = passiveStrategies.includes('ventilation');
  const hasInsulation  = passiveStrategies.includes('insulation');
  const hasCourtyard   = passiveStrategies.includes('courtyard');

  // ── ALWAYS-ON suggestions (fire regardless of weather) ────

  // A ── Wall material baseline (always evaluate)
  if (wallType === 'rcc') {
    suggestions.push({
      category: 'envelope',
      priority: 'High',
      title: 'Replace RCC Walls with AAC or Insulated System',
      reason: `Solid RCC walls have a U-value of ~3.2 W/m²K — among the worst thermally performing wall systems. AAC blocks reduce this to ~0.65 W/m²K and cut wall heat gain by 80%. RCC also has extremely high thermal mass (9/10), causing it to absorb heat all day and release it into occupied spaces at night. For any climate except extreme cold, this is the highest-priority envelope fix available.`,
      impact: 'high',
    });
  }

  if (wallType === 'brick') {
    suggestions.push({
      category: 'envelope',
      priority: 'Medium',
      title: 'Upgrade Brick Walls: Add External Insulation',
      reason: `Exposed brick walls have a U-value of ~1.8 W/m²K with high thermal mass (7/10). While traditional in Indian construction, bare brick conducts heat readily in summer. Adding 50 mm EPS or mineral wool on the exterior face — covered by a ventilated cladding or plaster — can bring U-value down to ~0.55 W/m²K, significantly reducing peak heat gain between 11 AM and 4 PM.`,
      impact: 'medium',
    });
  }

  // B ── Metal roof (always critical)
  if (roofType === 'metal') {
    suggestions.push({
      category: 'envelope',
      priority: 'High',
      title: 'Address Metal Roof Heat Gain Urgently',
      reason: `Uninsulated metal sheet roofs are the worst-performing roof type — thin profile means near-zero thermal resistance, and dark finishes can reach 70–80°C surface temperature in direct sun. The roof-ceiling heat flux can exceed 200 W/m² at peak. Minimum intervention: add 75 mm glass wool or rockwool insulation board below the metal deck, plus a reflective foil barrier. Ideal: replace with a cool roof over RCC slab.`,
      impact: 'high',
    });
  }

  // C ── Low passive strategy adoption (always flag)
  if (passiveStrategies.length === 0) {
    suggestions.push({
      category: 'ventilation',
      priority: 'High',
      title: 'No Passive Strategies Active — Critical Gap',
      reason: `This building relies entirely on the envelope for thermal control with zero passive design strategies enabled. In Indian climates, passive strategies (cross ventilation, external shading, roof insulation, courtyard) collectively contribute up to +20 points to the thermal score. Enabling even two of these — shading and cross ventilation — can shift a High risk building to Medium risk without any structural changes.`,
      impact: 'high',
    });
  } else if (passiveStrategies.length === 1) {
    suggestions.push({
      category: 'ventilation',
      priority: 'Medium',
      title: 'Expand Passive Strategy Set Beyond Single Measure',
      reason: `Only one passive strategy is active. Passive systems work synergistically — shading reduces solar gain, ventilation removes residual heat, and insulation prevents re-radiation at night. Each additional strategy compounds the benefit of existing ones. Enabling two more complementary strategies typically adds 8–14 points to the overall thermal score.`,
      impact: 'medium',
    });
  }

  // D ── WWR always evaluated
  if (wwr > 40) {
    suggestions.push({
      category: 'glazing',
      priority: orientation === 'W' || orientation === 'SW' ? 'High' : 'Medium',
      title: `Reduce Window-to-Wall Ratio from ${wwr}% to Below 35%`,
      reason: `ECBC 2017 mandates WWR ≤ 40% for most Indian climate zones; best practice targets ≤ 30% for non-north facades. At ${wwr}%, glazing is a dominant heat gain pathway. Every 10% reduction in WWR on east/west facades reduces peak cooling load by approximately 8–12%. If the glazing area cannot be reduced architecturally, switch to high-performance low-E glass (SHGC ≤ 0.25, U ≤ 1.6 W/m²K) and deploy deep horizontal overhangs.`,
      impact: wwr > 50 ? 'high' : 'medium',
    });
  } else if (wwr > 30 && (orientation === 'W' || orientation === 'SW')) {
    suggestions.push({
      category: 'glazing',
      priority: 'Medium',
      title: 'Reduce West/SW Glazing — Even Moderate WWR Causes Afternoon Overheating',
      reason: `West-facing glass at ${wwr}% WWR receives intense low-angle afternoon sun (3–6 PM peak). Unlike high-angle overhead sun which overhangs can block, this radiation enters at near-horizontal angles that no fixed overhang can intercept. Vertical fins with depth ≥ 600 mm spaced every 1.2 m, or opaque spandrel panels replacing lower glazing, are the most effective solutions.`,
      impact: 'medium',
    });
  }

  // ── WEATHER-CONDITIONAL suggestions ──────────────────────

  // 1 ── Cool roof
  if (roofType !== 'cool_roof' && roofType !== 'metal' && temp > 26) {
    suggestions.push({
      category: 'envelope',
      priority: uvIndex > 6 ? 'High' : 'Medium',
      title: 'Apply Cool Roof Coating (Immediate High-ROI Upgrade)',
      reason: `Your ${roofType === 'rcc' ? 'bare RCC slab' : 'current roof finish'} absorbs significant solar radiation in ${temp}°C ambient conditions. A cool roof coating with Solar Reflectance Index (SRI) ≥ 78 reduces roof surface temperature by 20–30°C, cutting heat flux through the ceiling by up to 40%. Cost: ₹25–50/sqft. This is the single highest return-on-investment envelope intervention available — typically recovering cost in one cooling season through reduced AC load.`,
      impact: uvIndex > 6 ? 'high' : 'medium',
    });
  }

  // 2 ── High WWR on worst orientations (weather-amplified)
  if (wwr > 25 && (orientation === 'W' || orientation === 'SW') && temp > 26) {
    suggestions.push({
      category: 'glazing',
      priority: 'High',
      title: 'Prioritise West-Façade Solar Control — Highest Overheating Risk',
      reason: `${orientation}-facing glazing at ${wwr}% WWR in ${temp}°C conditions creates severe afternoon overheating risk. Peak solar gain occurs 3–6 PM when outdoor temperature is already at its daily maximum — a double thermal load. External vertical fins (depth ≥ L/H ratio of 1.5), electrochromic glazing, or terracotta louvre screens are the three most effective interventions. Internal blinds reduce only 30% of solar gain since heat has already crossed the glass.`,
      impact: 'high',
    });
  }

  // 3 ── External shading for solar-heavy orientations
  if (!hasShadowing && solarGain >= 3) {
    suggestions.push({
      category: 'shading',
      priority: solarGain >= 7 ? 'High' : solarGain >= 4 ? 'Medium' : 'Low',
      title: 'Add External Shading Devices — Before Glazing, Not After',
      reason: `${orientation}-facing windows receive ${solarGain >= 7 ? 'very high' : solarGain >= 4 ? 'moderate-to-high' : 'moderate'} direct solar radiation. Fixed horizontal overhangs (projection factor ≥ 0.5 for south glass) and vertical fins for east/west glazing intercept 60–75% of solar gain before it crosses the glass surface. This matters: external shading is 3× more effective than internal blinds because it prevents heat from entering the building rather than absorbing it inside. In Indian summers, this single intervention can reduce peak indoor temperature by 2–4°C.`,
      impact: solarGain >= 7 ? 'high' : 'medium',
    });
  }

  // 4 ── Cross ventilation in humid climates
  if (!hasVentilation && (climate === 'hot_humid' || climate === 'warm_humid')) {
    suggestions.push({
      category: 'ventilation',
      priority: 'High',
      title: 'Design for Cross Ventilation — Primary Cooling Strategy in Humid Climates',
      reason: `In ${climate === 'hot_humid' ? 'hot-humid' : 'warm-humid'} conditions (${temp}°C, ${humidity}% RH), cross ventilation is the single most effective passive cooling tool. Align primary openings with the prevailing wind direction and place matching exhaust openings on the opposite wall — minimum 5% of floor area each. Even 1 m/s airflow over skin creates a perceived cooling effect of 3–4°C, equivalent to a 3-point score improvement. Critical detail: avoid deep plan buildings (>10 m between openings) — they require supplementary wind towers or ceiling fans to distribute airflow.`,
      impact: 'high',
    });
  }

  // 5 ── Stack ventilation for low-wind sites
  if (!hasVentilation && windSpeed < 2.5 && temp > 27) {
    suggestions.push({
      category: 'ventilation',
      priority: 'Medium',
      title: 'Stack Ventilation Required — Wind Speed Too Low for Cross Ventilation',
      reason: `Wind speed of ${windSpeed.toFixed(1)} m/s is insufficient for reliable cross ventilation. Stack ventilation leverages temperature-driven buoyancy: cool air enters through low openings, warms, rises, and exits through high exhausts (clerestory windows, ridge vents, or a wind catcher). A height differential of 3–5 m between inlet and outlet generates 0.5–1 m/s internal airflow even on still days. This is the standard passive cooling mechanism used in traditional Indian vernacular architecture (havelis, step-wells) for exactly this wind condition.`,
      impact: 'medium',
    });
  }

  // 6 ── Thermal mass mismatch in humid climate
  if (climate === 'hot_humid' && WALL_THERMAL_MASS[wallType] >= 7) {
    suggestions.push({
      category: 'thermal_mass',
      priority: 'Medium',
      title: 'High Thermal Mass Walls Are Counterproductive in Hot-Humid Climates',
      reason: `${wallType === 'rcc' ? 'RCC' : 'Brick'} walls have high thermal mass (${WALL_THERMAL_MASS[wallType]}/10). In dry climates this stores daytime heat for night-flush release — highly beneficial. But in hot-humid zones like this one, nights stay warm and humid (rarely below 27°C), so the mass never discharges. Instead it re-radiates stored heat into occupied spaces from 10 PM onward, making rooms hotter at night than they were at noon. AAC blocks with exterior insulation offer a lower U-value (~0.65 W/m²K) with faster thermal response — far better matched to this climate.`,
      impact: 'medium',
    });
  }

  // 7 ── Insulation for hot-dry or cold climates
  if (!hasInsulation && (climate === 'hot_dry' || climate === 'cold') && wallType !== 'insulated') {
    suggestions.push({
      category: 'envelope',
      priority: 'High',
      title: `Wall Insulation is Essential for ${climate === 'cold' ? 'Heat Retention' : 'Heat Exclusion'} in This Climate`,
      reason: climate === 'cold'
        ? `At ${temp}°C, an uninsulated ${wallType} wall (U ≈ ${WALL_U_VALUES[wallType]} W/m²K) loses heat rapidly. 50 mm EPS or mineral wool insulation on the inner face reduces U-value to ~0.45 W/m²K, cutting heating loads by 35–50%. Place vapour barrier on the warm (interior) side — incorrect placement causes interstitial condensation and mould. Combined with insulated glazing (double-pane, U ≤ 2.0), this can reduce heating energy demand by over 60%.`
        : `In this hot-dry climate, the diurnal temperature swing of 15–20°C makes insulated walls highly effective. Exterior insulation keeps thermal mass on the interior — it moderates indoor temperature swings during the day (mass absorbs heat slowly) and benefits from night-flush ventilation when outdoor temperature drops. This two-phase daily cycle is the defining passive strategy for hot-dry climates and requires insulation to function correctly.`,
      impact: 'high',
    });
  }

  // 8 ── Courtyard for hot climates
  if (!hasCourtyard && (climate === 'hot_dry' || climate === 'hot_humid' || climate === 'warm_humid') && temp > 28) {
    suggestions.push({
      category: 'ventilation',
      priority: 'Low',
      title: 'Consider a Central Courtyard — Proven Climate-Responsive Typology',
      reason: `Courtyards are the defining climate-responsive building typology across South Asian and Middle Eastern hot climates. The enclosed airspace creates a microclimate: shaded during the day by surrounding walls, it stores cool night air which sinks and displaces hot air from adjacent rooms through stack effect. Even a compact 4×4 m central void improves natural ventilation depth, increases daylighting penetration for interior rooms, and reduces the reliance on perimeter ventilation that may not reach building cores. The typology is well-documented in ECBC passive design guidelines.`,
      impact: 'low',
    });
  }

  // 9 ── Orientation improvement
  if (orientScore < -1) {
    suggestions.push({
      category: 'orientation',
      priority: orientScore <= -3 ? 'High' : 'Medium',
      title: `Reorient Primary Façade Away from ${orientation} — High Solar Exposure`,
      reason: `${orientation}-facing is a thermally disadvantaged orientation for Indian latitudes. ${orientation === 'W' ? 'West-facing receives maximum afternoon sun when outdoor temperatures are already at peak — a compounding thermal load.' : orientation === 'SW' ? 'South-west facing combines south summer sun with west afternoon exposure.' : 'This orientation receives above-average direct radiation.'} If building massing permits even a 15–20° rotation toward north, peak solar gain drops measurably. The ideal orientation for Indian climates is a north-south long axis with the primary glazed façade facing north — maximising diffuse daylight while minimising direct solar gain. Even partial rotation captures a significant portion of this benefit.`,
      impact: orientScore <= -3 ? 'high' : 'medium',
    });
  }

  // 10 ── RCC roof without insulation
  if (roofType === 'rcc' && !hasInsulation && temp > 24) {
    suggestions.push({
      category: 'envelope',
      priority: temp > 32 ? 'High' : 'Medium',
      title: 'Insulate the RCC Roof Slab — Second Highest Impact After Cool Roof',
      reason: `Bare RCC slabs have near-zero insulation value (U ≈ 3.8 W/m²K for a 150 mm slab). In ${temp}°C ambient temperature, roof heat flux into top-floor spaces can reach 80–120 W/m². A 75 mm EPS or XPS board under the screed reduces this by 60–70%. The inverted roof system (insulation above waterproofing) performs better long-term as it protects the waterproofing membrane from thermal shock. Combined with a cool roof coating above, this dual intervention is the most effective roof upgrade sequence — addressing both solar reflection and conductive resistance.`,
      impact: temp > 32 ? 'high' : 'medium',
    });
  }

  // 11 ── Low score overall
  if (score < 55) {
    suggestions.push({
      category: 'envelope',
      priority: 'High',
      title: `Score of ${score}/100 — Prioritised Upgrade Roadmap`,
      reason: `This score indicates significant thermal vulnerability across multiple parameters. Recommended upgrade sequence by cost-effectiveness: (1) Cool roof coating — ₹25–50/sqft, immediate 5–8 point gain; (2) External shading on west/south glazing — most impactful after roof; (3) Wall insulation or AAC replacement — largest structural investment, highest long-term gain; (4) Cross ventilation redesign — may require plan-level changes but adds 6 points. Addressing all four in sequence can realistically raise this score by 30–40 points and reduce mechanical cooling load by 40–60%.`,
      impact: 'high',
    });
  }

  // 12 ── Composite / transitional climate — specific guidance
  if (climate === 'composite') {
    suggestions.push({
      category: 'thermal_mass',
      priority: 'Low',
      title: 'Composite Climate Strategy: Balance Mass and Ventilation',
      reason: `The composite climate (${temp}°C, ${humidity}% RH) requires a balanced approach rather than extreme passive measures. Moderate thermal mass (AAC blocks — mass index 4/10) combined with controlled night ventilation and adjustable shading gives the most flexibility. Avoid high-mass walls (brick/RCC) without insulation — they perform poorly in both warm and cool seasons. Operable shading (external venetian blinds or adjustable louvres) that can be opened in winter for solar gain and closed in summer for shading is ideal for this climate type.`,
      impact: 'low',
    });
  }

  // Sort: High → Medium → Low
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    score,
    overheatingRisk,
    comfortIndex,
    climateStress,
    ventPotential,       // ← NEW: was missing, caused undefined in metric pill
    climate,
    materialScore,
    orientationScore,
    strategyBonus,
    climatePenalty,
    recommendations: suggestions,
  };
};