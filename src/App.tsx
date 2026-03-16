import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  Egg, 
  Bird, 
  IndianRupee, 
  CalendarDays, 
  Settings, 
  TrendingUp,
  TrendingDown,
  Scale,
  RotateCcw,
  BarChart4,
  Map,
  Wallet,
  Coins
} from 'lucide-react';

const BREED_PRESETS = {
  'Custom': {
    eggsPerYear: 200, monthsToLaying: 5, pricePerEgg: 8, pricePerKg: 250, avgWeight: 2, sellBatchAt: 18, costPerChick: 30, monthlyCostPerBird: 60
  },
  'Kadaknath': {
    eggsPerYear: 120, monthsToLaying: 6, pricePerEgg: 30, pricePerKg: 300, avgWeight: 1.3, sellBatchAt: 18, costPerChick: 60, monthlyCostPerBird: 60
  },
  'Nati Koli (Karnataka)': {
    eggsPerYear: 70, monthsToLaying: 7, pricePerEgg: 15, pricePerKg: 400, avgWeight: 1.4, sellBatchAt: 18, costPerChick: 40, monthlyCostPerBird: 50
  },
  'Giriraj': {
    eggsPerYear: 150, monthsToLaying: 6, pricePerEgg: 10, pricePerKg: 200, avgWeight: 3.0, sellBatchAt: 18, costPerChick: 35, monthlyCostPerBird: 80
  },
  'Vanaraja': {
    eggsPerYear: 110, monthsToLaying: 6, pricePerEgg: 8, pricePerKg: 180, avgWeight: 2.5, sellBatchAt: 18, costPerChick: 35, monthlyCostPerBird: 80
  },
  'Kuroiler': {
    eggsPerYear: 180, monthsToLaying: 5, pricePerEgg: 10, pricePerKg: 250, avgWeight: 2.8, sellBatchAt: 18, costPerChick: 35, monthlyCostPerBird: 80
  },
  'Gramapriya': {
    eggsPerYear: 210, monthsToLaying: 5, pricePerEgg: 7, pricePerKg: 160, avgWeight: 1.8, sellBatchAt: 18, costPerChick: 35, monthlyCostPerBird: 70
  },
  'Commercial Layer (BV-300)': {
    eggsPerYear: 320, monthsToLaying: 5, pricePerEgg: 6, pricePerKg: 100, avgWeight: 1.5, sellBatchAt: 18, costPerChick: 45, monthlyCostPerBird: 100
  },
  'Commercial Broiler': {
    eggsPerYear: 0, monthsToLaying: 6, pricePerEgg: 0, pricePerKg: 120, avgWeight: 2.2, sellBatchAt: 2, costPerChick: 40, monthlyCostPerBird: 120
  }
};

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

function Simulator() {
  // Farm Settings - Now driven by Target Egg Sales
  const [targetMonthlyEggs, setTargetMonthlyEggs] = useState(10000);
  
  // Business Expansion Settings
  const [isExpansionEnabled, setIsExpansionEnabled] = useState(false);
  const [expansionInterval, setExpansionInterval] = useState(6);

  // Breed specific settings
  const [selectedBreed, setSelectedBreed] = useState('Kadaknath');
  const [eggsPerYear, setEggsPerYear] = useState(BREED_PRESETS['Kadaknath'].eggsPerYear);
  const [monthsToLaying, setMonthsToLaying] = useState(BREED_PRESETS['Kadaknath'].monthsToLaying);
  const [pricePerEgg, setPricePerEgg] = useState(BREED_PRESETS['Kadaknath'].pricePerEgg);
  const [pricePerKg, setPricePerKg] = useState(BREED_PRESETS['Kadaknath'].pricePerKg);
  const [avgWeight, setAvgWeight] = useState(BREED_PRESETS['Kadaknath'].avgWeight);
  const [sellBatchAt, setSellBatchAt] = useState(BREED_PRESETS['Kadaknath'].sellBatchAt);
  const [costPerChick, setCostPerChick] = useState(BREED_PRESETS['Kadaknath'].costPerChick);
  const [monthlyCostPerBird, setMonthlyCostPerBird] = useState(BREED_PRESETS['Kadaknath'].monthlyCostPerBird);

  // AUTO-CALCULATED CYCLE METRICS
  const isMeatOnly = eggsPerYear === 0;

  // Calculate required batch size to hit the monthly egg target
  const eggsPerMonthPerBird = eggsPerYear / 12;
  const batchSize = isMeatOnly ? targetMonthlyEggs : Math.ceil(targetMonthlyEggs / eggsPerMonthPerBird);
  
  // Frequency ensures a new batch starts laying exactly when the old one is sold
  const batchFrequency = Math.max(1, sellBatchAt - monthsToLaying); 
  const requiredBatches = Math.ceil(sellBatchAt / batchFrequency);
  const totalPeakCapacity = requiredBatches * batchSize;
  const initialLandRequired = (totalPeakCapacity / 10000).toFixed(2); // 1 acre per 10k birds
  
  // Actual eggs might be slightly higher due to rounding up birds
  const actualMonthlyEggsPerBatch = isMeatOnly ? 0 : Math.round(batchSize * eggsPerMonthPerBird);

  // Apply preset when breed changes
  useEffect(() => {
    if (selectedBreed !== 'Custom') {
      const p = BREED_PRESETS[selectedBreed];
      setEggsPerYear(p.eggsPerYear);
      setMonthsToLaying(p.monthsToLaying);
      setPricePerEgg(p.pricePerEgg);
      setPricePerKg(p.pricePerKg);
      setAvgWeight(p.avgWeight);
      setSellBatchAt(p.sellBatchAt);
      setCostPerChick(p.costPerChick);
      setMonthlyCostPerBird(p.monthlyCostPerBird);
    }
  }, [selectedBreed]);

  // Simulation Logic
  const simulationData = useMemo(() => {
    let batches = [];
    let monthlyData = [];
    let total5YearEggRev = 0;
    let total5YearMeatRev = 0;
    let total5YearCost = 0;
    
    // Calculate how many streams of expansion we'll potentially need (5 years = 60 months)
    let numStreams = isExpansionEnabled ? Math.floor(59 / expansionInterval) + 1 : 1;
    
    // Simulate 60 months (5 years)
    for (let month = 1; month <= 60; month++) {
      let monthlyCost = 0;
      let newBatchesThisMonth = 0;
      let newBirdsThisMonth = 0;

      // 1. Introduce new batches
      for (let k = 0; k < numStreams; k++) {
        let startMonth = 1 + k * expansionInterval;
        
        // If we have reached the month where this stream begins
        if (month >= startMonth) {
          // Introduce a replacement batch on this stream's specific frequency cadence
          if ((month - startMonth) % batchFrequency === 0) {
            batches.push({ id: `M${month}-S${k}`, age: 0, size: batchSize });
            monthlyCost += batchSize * costPerChick; // Initial purchase cost of chicks
            newBatchesThisMonth++;
            newBirdsThisMonth += batchSize;
          }
        }
      }

      let monthlyEggs = 0;
      let monthlyMeatBirds = 0;
      let broodingChicks = 0; // Age 1 (First month of growth/incubation from day-old chick)
      let growingChicks = 0;  // Age > 1 && Age <= monthsToLaying
      let currentHens = 0;    // Age > monthsToLaying && Age <= sellBatchAt
      let growingBatchesCount = 0;
      let layingBatchesCount = 0;

      // 2. Age batches and calculate production
      batches.forEach(batch => {
        batch.age += 1;

        // Add monthly feed and maintenance cost for this batch
        monthlyCost += batch.size * monthlyCostPerBird;

        // Calculate egg production for mature hens before they are potentially sold
        if (batch.age > monthsToLaying && batch.age <= sellBatchAt) {
          monthlyEggs += batch.size * (eggsPerYear / 12);
        }

        // Sell batch condition (birds reach selling age this month)
        if (batch.age === sellBatchAt) {
          monthlyMeatBirds += batch.size;
          batch.size = 0; // Mark as sold
        }

        // Snapshot active population AT THE END of the month (excludes sold birds)
        if (batch.size > 0) {
          if (batch.age <= monthsToLaying) {
            growingBatchesCount++;
            if (batch.age === 1) {
              broodingChicks += batch.size;
            } else {
              growingChicks += batch.size;
            }
          } else {
            currentHens += batch.size;
            layingBatchesCount++;
          }
        }
      });

      // 3. Remove sold batches from memory
      batches = batches.filter(b => b.size > 0);

      // 4. Financials
      const eggRevenue = monthlyEggs * pricePerEgg;
      const meatRevenue = monthlyMeatBirds * avgWeight * pricePerKg;
      const totalRevenue = eggRevenue + meatRevenue;
      const netProfit = totalRevenue - monthlyCost;

      total5YearEggRev += eggRevenue;
      total5YearMeatRev += meatRevenue;
      total5YearCost += monthlyCost;

      const currentTotalChicks = broodingChicks + growingChicks;

      monthlyData.push({
        month,
        year: Math.ceil(month / 12),
        newBatchesThisMonth,
        newBirdsThisMonth,
        broodingChicks,
        growingChicks,
        currentChicks: currentTotalChicks,
        currentHens,
        growingBatchesCount,
        layingBatchesCount,
        activeBatches: batches.length,
        totalActiveFlock: currentTotalChicks + currentHens,
        monthlyEggs,
        monthlyMeatBirds,
        eggRevenue,
        meatRevenue,
        totalRevenue,
        monthlyCost,
        netProfit
      });
    }

    // 5. Aggregate into Yearly Data for tables
    const yearlyData = Array.from({length: 5}, (_, i) => {
      const year = i + 1;
      const yearMonths = monthlyData.filter(d => d.year === year);
      
      return {
        year,
        newBatchesIntroduced: yearMonths.reduce((sum, d) => sum + d.newBatchesThisMonth, 0),
        averageActiveFlock: Math.round(yearMonths.reduce((sum, m) => sum + m.totalActiveFlock, 0) / 12),
        yearEndTotal: yearMonths[11].totalActiveFlock,
        peakActiveFlock: Math.max(...yearMonths.map(m => m.totalActiveFlock)),
        peakChicks: Math.max(...yearMonths.map(m => m.currentChicks)),
        peakHens: Math.max(...yearMonths.map(m => m.currentHens)),
        peakGrowingBatches: Math.max(...yearMonths.map(m => m.growingBatchesCount)),
        peakLayingBatches: Math.max(...yearMonths.map(m => m.layingBatchesCount)),
        totalEggs: yearMonths.reduce((sum, d) => sum + d.monthlyEggs, 0),
        averageMonthlyEggs: Math.round(yearMonths.reduce((sum, d) => sum + d.monthlyEggs, 0) / 12),
        totalMeatBirds: yearMonths.reduce((sum, d) => sum + d.monthlyMeatBirds, 0),
        eggRevenue: yearMonths.reduce((sum, d) => sum + d.eggRevenue, 0),
        meatRevenue: yearMonths.reduce((sum, d) => sum + d.meatRevenue, 0),
        totalRevenue: yearMonths.reduce((sum, d) => sum + d.totalRevenue, 0),
        totalCost: yearMonths.reduce((sum, d) => sum + d.monthlyCost, 0),
        totalProfit: yearMonths.reduce((sum, d) => sum + d.netProfit, 0),
      }
    });

    const maxFlockAcross5Years = Math.max(...yearlyData.map(d => d.peakActiveFlock));

    return { 
      monthlyData, 
      yearlyData, 
      summary: {
        totalRevenue: total5YearEggRev + total5YearMeatRev,
        totalCost: total5YearCost,
        netProfit: (total5YearEggRev + total5YearMeatRev) - total5YearCost,
        totalEggRev: total5YearEggRev,
        totalMeatRev: total5YearMeatRev,
        peakLandRequired: (maxFlockAcross5Years / 10000).toFixed(2)
      } 
    };
  }, [batchSize, batchFrequency, eggsPerYear, monthsToLaying, pricePerEgg, pricePerKg, avgWeight, sellBatchAt, costPerChick, monthlyCostPerBird, isExpansionEnabled, expansionInterval]);

  return (
    <div className="pb-12">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bird className="h-8 w-8 text-emerald-200" />
            <h1 className="text-2xl font-bold tracking-tight">Free Range Poultry Simulator (India)</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar - Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center">
              <Settings className="h-5 w-5 text-slate-500 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">Farm Parameters</h2>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Breed Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Breed</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-emerald-500 focus:border-emerald-500"
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                >
                  {Object.keys(BREED_PRESETS).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Cycle Settings & Expansion */}
              <div className="pt-2 border-t border-slate-100">
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {isMeatOnly ? "Initial Monthly Meat Bird Target" : "Initial Monthly Egg Target"}
                  </label>
                  <input type="number" step="100" value={targetMonthlyEggs} onChange={e => setTargetMonthlyEggs(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2" />
                  
                  {/* Expansion Checkbox */}
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="expansion"
                      checked={isExpansionEnabled}
                      onChange={(e) => setIsExpansionEnabled(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                    />
                    <label htmlFor="expansion" className="ml-2 block text-sm font-medium text-slate-700">
                      Auto-Expand Business
                    </label>
                  </div>
                  
                  {/* Expansion Dropdown (Conditional) */}
                  {isExpansionEnabled && (
                    <div className="mt-3 ml-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Add Farm Capacity Every:</label>
                      <select
                        value={expansionInterval}
                        onChange={(e) => setExpansionInterval(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value={6}>6 Months (Aggressive Growth)</option>
                        <option value={12}>12 Months (Steady Growth)</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-emerald-800">Replacement Cycle (Auto)</span>
                    <span className="text-sm font-bold text-emerald-700">Base: Every {batchFrequency} Mos</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    {isMeatOnly ? (
                      <>To achieve <b>{batchSize.toLocaleString('en-IN')} meat birds/month</b> initially, you need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>.</>
                    ) : (
                      <>To achieve ~<b>{actualMonthlyEggsPerBatch.toLocaleString('en-IN')} eggs/month</b> initially, you need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>.</>
                    )}
                    
                    {isExpansionEnabled ? (
                      <span className="block mt-2 font-semibold text-emerald-800">
                        Expansion ON: A new production stream is added every {expansionInterval} months, continuously compounding your capacity!
                      </span>
                    ) : (
                      <span className="block mt-2">
                        You will maintain up to <b>{requiredBatches} concurrent batch(es)</b> on the farm at peak, requiring an initial farm capacity of <b>{totalPeakCapacity.toLocaleString('en-IN')} birds</b> (approx <b>{initialLandRequired} Acres</b>).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Biological Settings */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center"><Egg className="h-4 w-4 mr-1 text-amber-500" /> Production</h3>
                
                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                    <span>Eggs Per Year (Per Hen)</span>
                    <span className="text-emerald-600 font-bold">{eggsPerYear}</span>
                  </label>
                  <input type="range" min="0" max="320" value={eggsPerYear} onChange={e => {setEggsPerYear(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full accent-emerald-600" />
                </div>
                
                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                    <span>Months to Laying (Chick Phase)</span>
                    <span className="text-emerald-600 font-bold">{monthsToLaying} Mos</span>
                  </label>
                  <input type="range" min="4" max="9" value={monthsToLaying} onChange={e => {setMonthsToLaying(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full accent-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sell Batch At (Age in Months)</label>
                  <select value={sellBatchAt} onChange={e => {setSellBatchAt(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2">
                    <option value={2}>2 Months (Broiler/Meat)</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months (1.5 Years)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                  </select>
                </div>
              </div>

              {/* Financial Settings */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-emerald-600" /> Economics & Costs</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Price per Egg (₹)</label>
                    <input type="number" value={pricePerEgg} onChange={e => {setPricePerEgg(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Price per Kg (₹)</label>
                    <input type="number" value={pricePerKg} onChange={e => {setPricePerKg(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Chick Cost (₹/bird)</label>
                    <input type="number" value={costPerChick} onChange={e => {setCostPerChick(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2 bg-rose-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Feed/Upkeep (₹/mo)</label>
                    <input type="number" value={monthlyCostPerBird} onChange={e => {setMonthlyCostPerBird(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2 bg-rose-50/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Average Weight at Sale (Kg)</label>
                  <input type="number" step="0.1" value={avgWeight} onChange={e => {setAvgWeight(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Content - Analytics & Tables */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" /> Total 5-Yr Revenue
              </div>
              <div className="text-2xl font-bold text-slate-800">{formatINR(simulationData.summary.totalRevenue)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-rose-500" /> Total 5-Yr Cost
              </div>
              <div className="text-2xl font-bold text-rose-600">{formatINR(simulationData.summary.totalCost)}</div>
            </div>
            <div className={`rounded-xl p-5 border shadow-sm flex flex-col justify-center ${simulationData.summary.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className={`text-sm font-medium mb-1 flex items-center ${simulationData.summary.netProfit >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
                <Wallet className="h-4 w-4 mr-1" /> 5-Yr Net Profit
              </div>
              <div className={`text-2xl font-bold ${simulationData.summary.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                {formatINR(simulationData.summary.netProfit)}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-xs font-medium mb-1">Egg Revenue</div>
              <div className="text-lg font-bold text-amber-600">{formatINR(simulationData.summary.totalEggRev)}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-xs font-medium mb-1">Meat Revenue</div>
              <div className="text-lg font-bold text-emerald-600">{formatINR(simulationData.summary.totalMeatRev)}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 shadow-sm flex flex-col justify-center">
              <div className="text-emerald-800 text-xs font-medium mb-1 flex items-center">
                <Map className="h-3 w-3 mr-1" /> Peak Land Required
              </div>
              <div className="text-lg font-bold text-emerald-700">{simulationData.summary.peakLandRequired} Acres</div>
            </div>
          </div>

          {/* 5-Year Revenue Projection Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center">
                <BarChart4 className="h-5 w-5 text-slate-500 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">5-Year Revenue & Profit Projection</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-medium">Year</th>
                    <th className="p-4 font-medium text-right">Eggs Sold</th>
                    <th className="p-4 font-medium text-right">Egg Rev</th>
                    <th className="p-4 font-medium text-right">Birds Sold (Meat)</th>
                    <th className="p-4 font-medium text-right">Meat Rev</th>
                    <th className="p-4 font-medium text-right text-emerald-700 bg-emerald-50/50">Total Rev</th>
                    <th className="p-4 font-medium text-right text-rose-700 bg-rose-50/50">Total Cost</th>
                    <th className="p-4 font-medium text-right text-blue-700 bg-blue-50/50">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-700">Year {data.year}</td>
                      <td className="p-4 text-right text-slate-600">{data.totalEggs.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                      <td className="p-4 text-right text-slate-600">{formatINR(data.eggRevenue)}</td>
                      <td className="p-4 text-right text-slate-600">{data.totalMeatBirds.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-slate-600">{formatINR(data.meatRevenue)}</td>
                      <td className="p-4 text-right font-bold text-emerald-700 bg-emerald-50/30">{formatINR(data.totalRevenue)}</td>
                      <td className="p-4 text-right font-bold text-rose-600 bg-rose-50/30">{formatINR(data.totalCost)}</td>
                      <td className={`p-4 text-right font-bold ${data.totalProfit >= 0 ? 'text-blue-700 bg-blue-50/30' : 'text-rose-700 bg-rose-50/30'}`}>
                        {formatINR(data.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Farm Demographics Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center">
              <RotateCcw className="h-5 w-5 text-slate-500 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">Farm Population Dynamics</h2>
            </div>
            <div className="p-6 text-sm text-slate-600 mb-2">
              Showing the maximum concurrent birds required during the year, highlighting the peak number of growing chicks and laying hens at any point within that year.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-medium">Timeline</th>
                    <th className="p-4 font-medium text-center">New Batches<br/><span className="text-xs font-normal text-slate-400">(Started this Yr)</span></th>
                    <th className="p-4 font-medium text-center">Avg Flock<br/><span className="text-xs font-normal text-slate-400">(Yearly average)</span></th>
                    <th className="p-4 font-medium text-center bg-slate-100">Peak Total Flock<br/><span className="text-xs font-normal text-slate-400">(Max birds at once)</span></th>
                    <th className="p-4 font-medium text-right">Peak Growing Chicks<br/><span className="text-xs font-normal text-slate-400">(Max 0-{monthsToLaying} mos)</span></th>
                    <th className="p-4 font-medium text-right">Peak Laying Hens<br/><span className="text-xs font-normal text-slate-400">(Max &gt;{monthsToLaying} mos)</span></th>
                    <th className="p-4 font-medium text-right text-amber-600">Avg Eggs/Month<br/><span className="text-xs font-normal text-amber-600/70">(Yearly average)</span></th>
                    <th className="p-4 font-medium text-right bg-slate-50">Year-End Flock<br/><span className="text-xs font-normal text-slate-400">(Dec Snapshot)</span></th>
                    <th className="p-4 font-medium text-right text-emerald-600">Birds Sold<br/><span className="text-xs font-normal text-emerald-600/70">(During Year)</span></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.yearlyData.map((data) => (
                    <tr key={`pop-${data.year}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-700">Year {data.year}</td>
                      <td className="p-4 text-center text-slate-600">{data.newBatchesIntroduced}</td>
                      <td className="p-4 text-center text-slate-600">{data.averageActiveFlock.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-center font-bold text-slate-800 bg-slate-100/50">{data.peakActiveFlock.toLocaleString('en-IN')}</td>
                      
                      <td className="p-4 text-right text-slate-600">
                        <div className="font-medium">{data.peakChicks.toLocaleString('en-IN')} birds</div>
                        <div className="text-xs text-slate-400">Peak: {data.peakGrowingBatches} batch(es)</div>
                      </td>
                      
                      <td className="p-4 text-right text-amber-600">
                        <div className="font-medium">{data.peakHens.toLocaleString('en-IN')} birds</div>
                        <div className="text-xs text-amber-600/60">Peak: {data.peakLayingBatches} batch(es)</div>
                      </td>
                      
                      <td className="p-4 text-right font-medium text-amber-600">
                        {data.averageMonthlyEggs.toLocaleString('en-IN')}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-slate-700 bg-slate-50/50">
                        {data.yearEndTotal.toLocaleString('en-IN')}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-emerald-600">
                        {data.totalMeatBirds.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          

        </div>
      </main>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Monthly Detailed Schedule Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 text-slate-500 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">Monthly Batch Schedule & Phases</h2>
              </div>
            </div>
            <div className="p-6 pb-4 text-sm text-slate-600 border-b border-slate-100 bg-slate-50">
              Detailed 60-month breakdown showing when new day-old chicks are introduced (Brooding phase), their transition into the Growing phase, when they start Laying, and when they are eventually Sold.
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                  <tr className="text-slate-500 text-sm">
                    <th className="p-4 font-medium bg-slate-100">Month</th>
                    <th className="p-4 font-medium text-center bg-slate-100">New Batches<br/><span className="text-xs font-normal text-slate-400">(Day-Old Chicks Added)</span></th>
                    <th className="p-4 font-medium text-right text-indigo-700 bg-slate-100">Brooding Phase<br/><span className="text-xs font-normal text-indigo-400">(Month 1)</span></th>
                    <th className="p-4 font-medium text-right text-blue-700 bg-slate-100">Growing Phase<br/><span className="text-xs font-normal text-blue-400">(Month 2 to {Math.min(monthsToLaying, sellBatchAt)})</span></th>
                    <th className="p-4 font-medium text-right text-amber-700 bg-slate-100">Laying Phase<br/><span className="text-xs font-normal text-amber-500">{sellBatchAt > monthsToLaying ? `(Month ${monthsToLaying + 1} to ${sellBatchAt})` : '(N/A - Sold Before)'}</span></th>
                    <th className="p-4 font-medium text-right text-emerald-700 bg-slate-100">Birds Sold<br/><span className="text-xs font-normal text-emerald-500">(End of Cycle)</span></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.monthlyData.map((data) => (
                    <tr key={`month-${data.month}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-700">Month {data.month} <span className="text-xs text-slate-400 font-normal ml-1">(Y{data.year})</span></td>
                      
                      <td className="p-4 text-center">
                        {data.newBatchesThisMonth > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            +{data.newBatchesThisMonth} Batch ({data.newBirdsThisMonth.toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-indigo-600 bg-indigo-50/20">
                        {data.broodingChicks > 0 ? data.broodingChicks.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-blue-600 bg-blue-50/20">
                        {data.growingChicks > 0 ? data.growingChicks.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-amber-600 bg-amber-50/20">
                        {data.currentHens > 0 ? data.currentHens.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-emerald-600 bg-emerald-50/20">
                        {data.monthlyMeatBirds > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {data.monthlyMeatBirds.toLocaleString('en-IN')} Sold
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">About This Simulator</h2>
        <p className="text-slate-600 max-w-3xl">
          The Free Range Poultry Simulator is designed to help farmers and entrepreneurs model the financial and operational aspects of a poultry business. By adjusting parameters such as breed, egg production, and costs, you can forecast your revenue and understand the lifecycle of your flock over a 5-year period.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Global Header Navigation */}
      <nav className="bg-white shadow border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Bird className="h-6 w-6 text-emerald-600 mr-2" />
                <span className="text-xl font-bold text-emerald-800">AgriSim</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link to="/" className="border-emerald-500 text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Simulator
                </Link>
                <Link to="/about" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area mapping to Routes */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Simulator />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>

      {/* Global Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Bird className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-white">Poultry Farming Simulator</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AgriSim. Planted with care.
          </p>
        </div>
      </footer>
    </div>
  );
}