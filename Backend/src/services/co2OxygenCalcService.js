// src/services/co2OxygenCalcService.js
// Pure calculation service — no external API calls. Implements the exact
// formulas from section 6 of the architecture doc.

const CO2_KG_PER_TREE_PER_YEAR = 21;   // standard mature-tree estimate
const O2_KG_PER_TREE_PER_YEAR = 118;   // standard mature-tree estimate
const O2_KG_REQUIRED_PER_PERSON_PER_YEAR = 740;

/**
 * calculate({ estimatedTreeCount, population })
 * Returns CO2 absorbed/year, O2 released/year, O2 required for the
 * population, and whether there's a deficit (required > released).
 */
exports.calculate = ({ estimatedTreeCount, population }) => {
  const co2AbsorbedPerYear = estimatedTreeCount * CO2_KG_PER_TREE_PER_YEAR;
  const o2ReleasedPerYear = estimatedTreeCount * O2_KG_PER_TREE_PER_YEAR;
  const o2RequiredForPopulation = (population || 0) * O2_KG_REQUIRED_PER_PERSON_PER_YEAR;
  const o2Deficit = o2RequiredForPopulation > o2ReleasedPerYear;

  return {
    co2AbsorbedPerYear: Math.round(co2AbsorbedPerYear),
    o2ReleasedPerYear: Math.round(o2ReleasedPerYear),
    o2RequiredForPopulation: Math.round(o2RequiredForPopulation),
    o2Deficit,
  };
};