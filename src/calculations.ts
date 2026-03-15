// calculations.ts
export interface FarmInputs {
  breed: string;
  eggsPerYear: number;
  layingStartDays: number;
  targetEggsPerMonth: number;
  eggPrice: number;
  meatPrice: number;
  bodyWeight: number;
  retirementAgeMonths: number;
  totalYears: number;
  chickCost: number;
  feedCostChick: number;
  feedCostGrower: number;
  feedCostLayer: number;
  mortalityChick: number;
  mortalityGrower: number;
  mortalityLayer: number;
  medicineCost: number;
  laborCost: number;
  electricity: number;
  depreciation: number;
  femalePercentage: number;
  malePercentage: number;
}

export function calculateSummary(inputs: FarmInputs, years: number = inputs.totalYears) {
  // Rough math approximations based on user inputs.
  const layingMonths = inputs.retirementAgeMonths - Math.ceil(inputs.layingStartDays / 30);
  const eggsPerMonthPerHen = inputs.eggsPerYear / 12;

  const targetLayingStock = inputs.targetEggsPerMonth ? (inputs.targetEggsPerMonth / eggsPerMonthPerHen) : 0;
  const hensPerMonthAdded = layingMonths > 0 ? Math.ceil(targetLayingStock / layingMonths) : 0;

  const totalLayingHens = hensPerMonthAdded * layingMonths;

  const monthlyEggs = totalLayingHens * eggsPerMonthPerHen;
  const monthlyRevenue = monthlyEggs * inputs.eggPrice;

  // Retired bird revenue per month = meatPrice * bodyWeight * birds retiring
  const retiredHensMonthly = hensPerMonthAdded * (1 - (inputs.mortalityLayer/100)); // Simple survival avg
  const monthlyMeatRevenue = retiredHensMonthly * inputs.bodyWeight * inputs.meatPrice;
  
  const totalRevenue = (monthlyRevenue + monthlyMeatRevenue) * 12 * years;
  
  // Cost calculation (simplified version for display)
  const monthlyFixedCost = inputs.laborCost + inputs.electricity + inputs.depreciation;
  const feedCostMonthly = totalLayingHens * inputs.feedCostLayer + (hensPerMonthAdded*2) * inputs.feedCostGrower;
  
  const totalCost = (feedCostMonthly + monthlyFixedCost) * 12 * years;

  return {
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    monthlyRevenue,
    feedCostMonthly,
    breakEvenMonth: totalRevenue > 0 ? totalCost / (totalRevenue / (years * 12)) : 0
  };
}

export function generateMonthlyData(inputs: FarmInputs, months: number = 60) {
  const layingMonths = inputs.retirementAgeMonths - Math.ceil(inputs.layingStartDays / 30);
  const eggsPerMonthPerHen = inputs.eggsPerYear / 12;
  const targetLayingStock = inputs.targetEggsPerMonth ? (inputs.targetEggsPerMonth / eggsPerMonthPerHen) : 0;
  const hensPerMonthAdded = layingMonths > 0 ? Math.ceil(targetLayingStock / layingMonths) : 0;

  const data = [];
  let currentStock = 0;
  
  for (let m = 1; m <= months; m++) {
    const currentChicks = hensPerMonthAdded;
    const maturityMonth = Math.ceil(inputs.layingStartDays / 30);
    
    if (m >= maturityMonth) {
      // Adding new mature birds each month after maturity period
      currentStock += hensPerMonthAdded;
    }
    
    if (m >= inputs.retirementAgeMonths) {
       // Retiring birds that reach retirement age
       currentStock -= hensPerMonthAdded; 
    }
    
    if (currentStock < 0) currentStock = 0;
    
    const eggs = currentStock * (inputs.eggsPerYear / 12);
    const feed = (currentStock * inputs.feedCostLayer) + (currentChicks * inputs.feedCostChick);
    const cost = feed + inputs.laborCost + inputs.electricity + (inputs.medicineCost * currentStock);
    const revenue = eggs * inputs.eggPrice;
    
    data.push({
      month: m,
      chicks: currentChicks,
      stock: currentStock,
      eggs: Math.round(eggs),
      feedCost: Math.round(feed),
      totalCost: Math.round(cost),
      revenue: Math.round(revenue),
      profit: Math.round(revenue - cost)
    });
  }
  
  return data;
}
