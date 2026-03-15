import React, { useState, useEffect, useMemo } from 'react';
import { 
  Egg, 
  Bird, 
  IndianRupee, 
  CalendarDays, 
  Settings, 
  TrendingUp,
  Scale,
  RotateCcw,
  BarChart4
} from 'lucide-react';

const BREED_PRESETS = {
  'Custom': {
    eggsPerYear: 200, monthsToLaying: 5, pricePerEgg: 8, pricePerKg: 250, avgWeight: 2, sellBatchAt: 18
  },
  'Kadaknath': {
    eggsPerYear: 120, monthsToLaying: 6, pricePerEgg: 30, pricePerKg: 350, avgWeight: 1.2, sellBatchAt: 18
  },
  'Nati Koli (Karnataka)': {
    eggsPerYear: 70, monthsToLaying: 7, pricePerEgg: 15, pricePerKg: 400, avgWeight: 1.4, sellBatchAt: 18
  },
  'Giriraj': {
    eggsPerYear: 150, monthsToLaying: 6, pricePerEgg: 10, pricePerKg: 200, avgWeight: 3.0, sellBatchAt: 18
  },
  'Vanaraja': {
    eggsPerYear: 110, monthsToLaying: 6, pricePerEgg: 8, pricePerKg: 180, avgWeight: 2.5, sellBatchAt: 18
  },
  'Kuroiler': {
    eggsPerYear: 180, monthsToLaying: 5, pricePerEgg: 10, pricePerKg: 250, avgWeight: 2.8, sellBatchAt: 18
  },
  'Gramapriya': {
    eggsPerYear: 210, monthsToLaying: 5, pricePerEgg: 7, pricePerKg: 160, avgWeight: 1.8, sellBatchAt: 18
  },
  'Commercial Layer (BV-300)': {
    eggsPerYear: 320, monthsToLaying: 5, pricePerEgg: 6, pricePerKg: 100, avgWeight: 1.5, sellBatchAt: 18
  },
  'Commercial Broiler': {
    eggsPerYear: 0, monthsToLaying: 6, pricePerEgg: 0, pricePerKg: 120, avgWeight: 2.2, sellBatchAt: 2
  }
};

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function App() {
  // Farm Settings - Now driven by Target Egg Sales
  const [targetMonthlyEggs, setTargetMonthlyEggs] = useState(10000);

  // Breed specific settings
  const [selectedBreed, setSelectedBreed] = useState('Kadaknath');
  const [eggsPerYear, setEggsPerYear] = useState(BREED_PRESETS['Kadaknath'].eggsPerYear);
  const [monthsToLaying, setMonthsToLaying] = useState(BREED_PRESETS['Kadaknath'].monthsToLaying);
  const [pricePerEgg, setPricePerEgg] = useState(BREED_PRESETS['Kadaknath'].pricePerEgg);
  const [pricePerKg, setPricePerKg] = useState(BREED_PRESETS['Kadaknath'].pricePerKg);
  const [avgWeight, setAvgWeight] = useState(BREED_PRESETS['Kadaknath'].avgWeight);
  const [sellBatchAt, setSellBatchAt] = useState(BREED_PRESETS['Kadaknath'].sellBatchAt); // 12, 18, 24

  // AUTO-CALCULATED CYCLE METRICS
  const isMeatOnly = eggsPerYear === 0;

  // Calculate required batch size to hit the monthly egg target
  const eggsPerMonthPerBird = eggsPerYear / 12;
  const batchSize = isMeatOnly ? targetMonthlyEggs : Math.ceil(targetMonthlyEggs / eggsPerMonthPerBird);
  
  // Frequency ensures a new batch starts laying exactly when the old one is sold
  const batchFrequency = Math.max(1, sellBatchAt - monthsToLaying); 
  const requiredBatches = Math.ceil(sellBatchAt / batchFrequency);
  const totalPeakCapacity = requiredBatches * batchSize;
  
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
    }
  }, [selectedBreed]);

  // Simulation Logic
  const simulationData = useMemo(() => {
    let batches = [];
    let monthlyData = [];
    let total5YearEggRev = 0;
    let total5YearMeatRev = 0;
    
    // Simulate 60 months (5 years)
    for (let month = 1; month <= 60; month++) {
      // 1. Introduce new batch based on auto-calculated frequency
      if ((month - 1) % batchFrequency === 0) {
        batches.push({ id: month, age: 0, size: batchSize });
      }

      let monthlyEggs = 0;
      let monthlyMeatBirds = 0;
      let currentChicks = 0; // Age <= monthsToLaying
      let currentHens = 0;   // Age > monthsToLaying && Age <= sellBatchAt
      let growingBatchesCount = 0;
      let layingBatchesCount = 0;

      // 2. Age batches and calculate production
      batches.forEach(batch => {
        batch.age += 1;

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
            currentChicks += batch.size;
            growingBatchesCount++;
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

      total5YearEggRev += eggRevenue;
      total5YearMeatRev += meatRevenue;

      monthlyData.push({
        month,
        year: Math.ceil(month / 12),
        currentChicks,
        currentHens,
        growingBatchesCount,
        layingBatchesCount,
        activeBatches: batches.length,
        totalActiveFlock: currentChicks + currentHens,
        monthlyEggs,
        monthlyMeatBirds,
        eggRevenue,
        meatRevenue,
        totalRevenue
      });
    }

    // 5. Aggregate into Yearly Data for tables
    const yearlyData = Array.from({length: 5}, (_, i) => {
      const year = i + 1;
      const yearMonths = monthlyData.filter(d => d.year === year);
      
      return {
        year,
        newBatchesIntroduced: yearMonths.filter(m => (m.month - 1) % batchFrequency === 0).length,
        averageActiveFlock: Math.round(yearMonths.reduce((sum, m) => sum + m.totalActiveFlock, 0) / 12),
        yearEndTotal: yearMonths[11].totalActiveFlock,
        peakActiveFlock: Math.max(...yearMonths.map(m => m.totalActiveFlock)),
        peakChicks: Math.max(...yearMonths.map(m => m.currentChicks)),
        peakHens: Math.max(...yearMonths.map(m => m.currentHens)),
        peakGrowingBatches: Math.max(...yearMonths.map(m => m.growingBatchesCount)),
        peakLayingBatches: Math.max(...yearMonths.map(m => m.layingBatchesCount)),
        totalEggs: yearMonths.reduce((sum, d) => sum + d.monthlyEggs, 0),
        totalMeatBirds: yearMonths.reduce((sum, d) => sum + d.monthlyMeatBirds, 0),
        eggRevenue: yearMonths.reduce((sum, d) => sum + d.eggRevenue, 0),
        meatRevenue: yearMonths.reduce((sum, d) => sum + d.meatRevenue, 0),
        totalRevenue: yearMonths.reduce((sum, d) => sum + d.totalRevenue, 0),
      }
    });

    return { 
      monthlyData, 
      yearlyData, 
      summary: {
        totalRevenue: total5YearEggRev + total5YearMeatRev,
        totalEggRev: total5YearEggRev,
        totalMeatRev: total5YearMeatRev
      } 
    };
  }, [batchSize, batchFrequency, eggsPerYear, monthsToLaying, pricePerEgg, pricePerKg, avgWeight, sellBatchAt]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
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

              {/* Cycle Settings */}
              <div className="pt-2 border-t border-slate-100">
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {isMeatOnly ? "Target Monthly Meat Bird Sales" : "Target Monthly Egg Sales"}
                  </label>
                  <input type="number" step="100" value={targetMonthlyEggs} onChange={e => setTargetMonthlyEggs(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-emerald-800">Replacement Cycle (Auto)</span>
                    <span className="text-sm font-bold text-emerald-700">Every {batchFrequency} Mos</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    {isMeatOnly ? (
                      <>To achieve <b>{batchSize.toLocaleString('en-IN')} meat birds/month</b>, you will need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>. You will maintain up to <b>{requiredBatches} concurrent batch(es)</b> on the farm at peak, requiring a total farm capacity of <b>{totalPeakCapacity.toLocaleString('en-IN')} birds</b>.</>
                    ) : (
                      <>To achieve ~<b>{actualMonthlyEggsPerBatch.toLocaleString('en-IN')} eggs/month</b>, you will need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>. You will maintain up to <b>{requiredBatches} concurrent batch(es)</b> on the farm at peak, requiring a total farm capacity of <b>{totalPeakCapacity.toLocaleString('en-IN')} birds</b>.</>
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
                <h3 className="text-sm font-semibold text-slate-800 flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-emerald-600" /> Economics</h3>
                
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-sm font-medium mb-1">Total 5-Year Revenue</div>
              <div className="text-3xl font-bold text-slate-800">{formatINR(simulationData.summary.totalRevenue)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-sm font-medium mb-1">Egg Revenue (5 Yrs)</div>
              <div className="text-2xl font-bold text-amber-600">{formatINR(simulationData.summary.totalEggRev)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 text-sm font-medium mb-1">Meat Revenue (5 Yrs)</div>
              <div className="text-2xl font-bold text-emerald-600">{formatINR(simulationData.summary.totalMeatRev)}</div>
            </div>
          </div>

          {/* 5-Year Revenue Projection Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center">
                <BarChart4 className="h-5 w-5 text-slate-500 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">5-Year Revenue Projection</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-medium">Year</th>
                    <th className="p-4 font-medium text-right">Eggs Sold</th>
                    <th className="p-4 font-medium text-right">Egg Rev</th>
                    <th className="p-4 font-medium text-right">Birds Sold (Meat)</th>
                    <th className="p-4 font-medium text-right">Meat Rev</th>
                    <th className="p-4 font-medium text-right text-emerald-700 bg-emerald-50/50">Total Revenue</th>
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
    </div>
  );
}