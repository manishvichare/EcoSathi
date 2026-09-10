// src/services/healthScoreService.js
// Combines green cover, AQI, and O2/CO2 balance into the single 0-100
// "Overall Health Score" shown on the dashboard gauge (section 6 of the doc):
//   Score = 0.35×(green cover score) + 0.35×(inverse AQI score)
//         + 0.15×(O2 sufficiency score) + 0.15×(CO2 balance score)
//
// NOTE: the doc gives the weights but not the exact sub-score scaling —
// the assumptions below are documented so you can tweak them and note them
// in docs/api-contract.md as the doc instructs.

const WEIGHTS = {
  greenCover: 0.35,
  inverseAqi: 0.35,
  o2Sufficiency: 0.15,
  co2Balance: 0.15,
};

// Green cover % is already 0-100, use it directly (capped just in case)
const scoreGreenCover = (greenCoverPercent) => Math.min(Math.max(greenCoverPercent, 0), 100);

// WAQI AQI scale is roughly 0-500 (0 = best). Invert it to a 0-100 "good air" score.
// Assumption: AQI 0 -> 100 score, AQI 500+ -> 0 score.
const scoreInverseAqi = (aqi) => {
  if (aqi == null) return 50; // neutral fallback if AQI data is missing
  return Math.min(Math.max(100 - aqi / 5, 0), 100);
};

// How much of the population's required O2 is actually being produced locally
const scoreO2Sufficiency = (o2ReleasedPerYear, o2RequiredForPopulation) => {
  if (!o2RequiredForPopulation) return 100; // no population data -> don't penalize
  return Math.min((o2ReleasedPerYear / o2RequiredForPopulation) * 100, 100);
};

// Rough proxy for CO2 balance: how much CO2 absorption exists relative to
// the same population-driven baseline used for O2. This is a simplified
// hackathon stand-in, not a scientific carbon-budget calculation.
const scoreCo2Balance = (co2AbsorbedPerYear, o2RequiredForPopulation) => {
  if (!o2RequiredForPopulation) return 100;
  return Math.min((co2AbsorbedPerYear / o2RequiredForPopulation) * 100, 100);
};

/**
 * calculate({ greenCoverPercent, aqi, o2ReleasedPerYear, o2RequiredForPopulation, co2AbsorbedPerYear })
 * Returns a single 0-100 health score.
 */
exports.calculate = ({
  greenCoverPercent,
  aqi,
  o2ReleasedPerYear,
  o2RequiredForPopulation,
  co2AbsorbedPerYear,
}) => {
  const greenCoverScore = scoreGreenCover(greenCoverPercent);
  const inverseAqiScore = scoreInverseAqi(aqi);
  const o2Score = scoreO2Sufficiency(o2ReleasedPerYear, o2RequiredForPopulation);
  const co2Score = scoreCo2Balance(co2AbsorbedPerYear, o2RequiredForPopulation);

  const healthScore =
    WEIGHTS.greenCover * greenCoverScore +
    WEIGHTS.inverseAqi * inverseAqiScore +
    WEIGHTS.o2Sufficiency * o2Score +
    WEIGHTS.co2Balance * co2Score;

  return Math.round(Math.min(Math.max(healthScore, 0), 100));
};