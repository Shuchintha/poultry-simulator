import { useState, useEffect, useMemo } from 'react';
import { 
  Egg, 
  Info,
  IndianRupee, 
  CalendarDays, 
  Settings, 
  TrendingUp,
  TrendingDown,
  RotateCcw,
  BarChart4,
  Map,
  Wallet,
  Wrench,
  Tractor,
  Leaf,
  TableProperties, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight,
  LineChart as LineChartIcon,
  
  
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  Line, AreaChart, Area, ComposedChart 
} from 'recharts';


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

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function PoultrySimulator() {
  // Sidebar Toggle States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // View Toggle States
  const [viewPopulation, setViewPopulation] = useState<'table' | 'chart'>('table');
  const [viewFinancials, setViewFinancials] = useState<'table' | 'chart'>('table');
  const [viewInfra, setViewInfra] = useState<'table' | 'chart'>('table');
  const [viewSchedule, setViewSchedule] = useState<'table' | 'chart'>('table');

  // Section Dropdown States
  const [openSections, setOpenSections] = useState({
    population: true,
    financial: true,
    infra: true,
    schedule: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Farm Settings - Now driven by Target Egg Sales
  const [targetMonthlyEggs, setTargetMonthlyEggs] = useState(10000);
  
  // Business Expansion Settings
  const [isExpansionEnabled, setIsExpansionEnabled] = useState(false);
  const [expansionInterval, setExpansionInterval] = useState(6);
  const [includeBsfHydroponics, setIncludeBsfHydroponics] = useState(true);

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
      const p = BREED_PRESETS[selectedBreed as keyof typeof BREED_PRESETS];
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
    let batches: { id: string; age: number; size: number }[] = [];
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

        // Apply 20% reduction to feed/maintenance cost if using BSF & Hydroponics
        const effectiveMonthlyCostPerBird = includeBsfHydroponics ? monthlyCostPerBird * 0.8 : monthlyCostPerBird;

        // Add monthly feed and maintenance cost for this batch
        monthlyCost += batch.size * effectiveMonthlyCostPerBird;

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
      
      const peakActiveFlock = Math.max(...yearMonths.map(m => m.totalActiveFlock));
      const peakChicks = Math.max(...yearMonths.map(m => m.currentChicks));
      const peakHens = Math.max(...yearMonths.map(m => m.currentHens));
      const averageMonthlyEggs = Math.round(yearMonths.reduce((sum, d) => sum + d.monthlyEggs, 0) / 12);
      const newBatchesIntroduced = yearMonths.reduce((sum, d) => sum + d.newBatchesThisMonth, 0);
      const maxMonthlyNewChicks = Math.max(...yearMonths.map(m => m.newBirdsThisMonth));

      // Space / Land Requirements (Sq. Ft)
      const freeRangeSqFt = peakActiveFlock * 10; // 10 sqft per bird for range
      const shedSqFt = peakActiveFlock * 2; // 2 sqft per bird for shelter
      const incubationSqFt = maxMonthlyNewChicks > 0 ? 150 + Math.ceil(maxMonthlyNewChicks / 1000) * 10 : 0;
      const eggHandlingSqFt = averageMonthlyEggs > 0 ? 100 + Math.ceil(averageMonthlyEggs / 1000) * 10 : 0;
      
      // Instruments and Equipment
      const feeders = Math.ceil(peakActiveFlock / 30); // 1 per 30 birds
      const waterers = Math.ceil(peakActiveFlock / 30);
      const eggCrates = Math.ceil(averageMonthlyEggs / 30); // 30 eggs per crate
      const incubators = Math.ceil(maxMonthlyNewChicks / 1000); // Ex: 1000 eggs/chicks per incubator
      const hatchers = Math.ceil(maxMonthlyNewChicks / 1000); // 1000 eggs/chicks per hatcher
      const generators = peakActiveFlock > 0 ? (peakActiveFlock > 5000 ? 2 : 1) : 0;

      // BSF & Hydroponics Requirements
      const bsfSqFt = Math.ceil(peakActiveFlock * 0.5); // 0.5 sqft per bird
      const hydroSqFt = Math.ceil(peakActiveFlock * 0.2); // 0.2 sqft per bird
      const bsfBins = Math.ceil(peakActiveFlock / 200); // 1 bin per 200 birds waste
      const hydroRacks = Math.ceil(peakActiveFlock / 500); // 1 rack per 500 birds fodder

      return {
        year,
        newBatchesIntroduced,
        averageActiveFlock: Math.round(yearMonths.reduce((sum, m) => sum + m.totalActiveFlock, 0) / 12),
        yearEndTotal: yearMonths[11].totalActiveFlock,
        peakActiveFlock,
        peakChicks,
        peakHens,
        peakGrowingBatches: Math.max(...yearMonths.map(m => m.growingBatchesCount)),
        peakLayingBatches: Math.max(...yearMonths.map(m => m.layingBatchesCount)),
        totalEggs: yearMonths.reduce((sum, d) => sum + d.monthlyEggs, 0),
        averageMonthlyEggs,
        totalMeatBirds: yearMonths.reduce((sum, d) => sum + d.monthlyMeatBirds, 0),
        eggRevenue: yearMonths.reduce((sum, d) => sum + d.eggRevenue, 0),
        meatRevenue: yearMonths.reduce((sum, d) => sum + d.meatRevenue, 0),
        totalRevenue: yearMonths.reduce((sum, d) => sum + d.totalRevenue, 0),
        totalCost: yearMonths.reduce((sum, d) => sum + d.monthlyCost, 0),
        totalProfit: yearMonths.reduce((sum, d) => sum + d.netProfit, 0),
        infra: {
          freeRangeSqFt,
          shedSqFt,
          incubationSqFt,
          eggHandlingSqFt,
          feeders,
          waterers,
          eggCrates,
          incubators,
          hatchers,
          generators,
          bsfSqFt,
          hydroSqFt,
          bsfBins,
          hydroRacks
        }
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
        avgYearlyRevenue: (total5YearEggRev + total5YearMeatRev) / 5,
        avgYearlyProfit: ((total5YearEggRev + total5YearMeatRev) - total5YearCost) / 5,
        totalEggRev: total5YearEggRev,
        totalMeatRev: total5YearMeatRev,
        peakLandRequired: (maxFlockAcross5Years / 10000).toFixed(2)
      } 
    };
  }, [batchSize, batchFrequency, eggsPerYear, monthsToLaying, pricePerEgg, pricePerKg, avgWeight, sellBatchAt, costPerChick, monthlyCostPerBird, isExpansionEnabled, expansionInterval, includeBsfHydroponics]);

  return (
    <div className="pb-12">
      

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Inputs */}
        {isLeftSidebarOpen && (
        <div className="lg:col-span-3 space-y-6 transition-all duration-300 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Farm Parameters</h2>
              </div>
              <button 
                onClick={() => setIsLeftSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Breed Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Select Breed</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                >
                  {Object.keys(BREED_PRESETS).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Cycle Settings & Expansion */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {isMeatOnly ? "Initial Monthly Meat Bird Target" : "Initial Monthly Egg Target"}
                  </label>
                  <input type="number" step="100" value={targetMonthlyEggs} onChange={e => setTargetMonthlyEggs(Number(e.target.value))} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50" />
                  
                  {/* Expansion Checkbox */}
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="expansion"
                      checked={isExpansionEnabled}
                      onChange={(e) => setIsExpansionEnabled(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-slate-300 rounded"
                    />
                    <label htmlFor="expansion" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Auto-Expand Business
                    </label>
                  </div>
                  
                  {/* Expansion Dropdown (Conditional) */}
                  {isExpansionEnabled && (
                    <div className="mt-3 ml-6 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Add Farm Capacity Every:</label>
                      <select
                        value={expansionInterval}
                        onChange={(e) => setExpansionInterval(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value={6}>6 Months (Aggressive Growth)</option>
                        <option value={12}>12 Months (Steady Growth)</option>
                      </select>
                    </div>
                  )}

                  {/* BSF & Hydroponics Checkbox */}
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      id="bsf"
                      checked={includeBsfHydroponics}
                      onChange={(e) => setIncludeBsfHydroponics(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-slate-300 rounded"
                    />
                    <label htmlFor="bsf" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Include BSF & Hydroponics Calculations
                    </label>
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Replacement Cycle (Auto)</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Base: Every {batchFrequency} Mos</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight">
                    {isMeatOnly ? (
                      <>To achieve <b>{batchSize.toLocaleString('en-IN')} meat birds/month</b> initially, you need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>.</>
                    ) : (
                      <>To achieve ~<b>{actualMonthlyEggsPerBatch.toLocaleString('en-IN')} eggs/month</b> initially, you need a batch size of <b>{batchSize.toLocaleString('en-IN')} birds</b> introduced every <b>{batchFrequency} months</b>.</>
                    )}
                    
                    {isExpansionEnabled ? (
                      <span className="block mt-2 font-semibold text-emerald-800 dark:text-emerald-300">
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
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center"><Egg className="h-4 w-4 mr-1 text-amber-500" /> Production</h3>
                
                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <span>Eggs Per Year (Per Hen)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{eggsPerYear}</span>
                  </label>
                  <input type="range" min="0" max="320" value={eggsPerYear} onChange={e => {setEggsPerYear(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full accent-emerald-600" />
                </div>
                
                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <span>Months to Laying (Chick Phase)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{monthsToLaying} Mos</span>
                  </label>
                  <input type="range" min="4" max="9" value={monthsToLaying} onChange={e => {setMonthsToLaying(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full accent-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sell Batch At (Age in Months)</label>
                  <select value={sellBatchAt} onChange={e => {setSellBatchAt(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50">
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
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-emerald-600 dark:text-emerald-400" /> Economics & Costs</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Price per Egg (₹)</label>
                    <input type="number" value={pricePerEgg} onChange={e => {setPricePerEgg(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Price per Kg (₹)</label>
                    <input type="number" value={pricePerKg} onChange={e => {setPricePerKg(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Chick Cost (₹/bird)</label>
                    <input type="number" value={costPerChick} onChange={e => {setCostPerChick(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2 bg-rose-50/50 dark:bg-rose-900/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Feed/Upkeep (₹/mo)</label>
                    <input type="number" value={monthlyCostPerBird} onChange={e => {setMonthlyCostPerBird(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 rounded-lg p-2 bg-rose-50/50 dark:bg-rose-900/20" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Average Weight at Sale (Kg)</label>
                  <input type="number" step="0.1" value={avgWeight} onChange={e => {setAvgWeight(Number(e.target.value)); setSelectedBreed('Custom')}} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50" />
                </div>
              </div>

            </div>
          </div>
        </div>
        )}

        {/* Center Content - Tables */}
        <div className={`space-y-6 transition-all duration-300 ${!isLeftSidebarOpen && !isRightSidebarOpen ? 'lg:col-span-12' : (!isLeftSidebarOpen || !isRightSidebarOpen) ? 'lg:col-span-9' : 'lg:col-span-6'}`}>
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {!isLeftSidebarOpen ? (
              <button 
                onClick={() => setIsLeftSidebarOpen(true)}
                className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <PanelLeft className="h-5 w-5 mr-2" /> Open Parameters
              </button>
            ) : <div />}
            
            {!isRightSidebarOpen ? (
              <button 
                onClick={() => setIsRightSidebarOpen(true)}
                className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Open Analytics <PanelRight className="h-5 w-5 ml-2" />
              </button>
            ) : <div />}
          </div>
          
          {/* Farm Demographics Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`bg-slate-100 dark:bg-slate-700 px-6 py-4 flex items-center justify-between transition-colors ${openSections.population ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center">
                <button 
                  onClick={() => toggleSection('population')}
                  className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <RotateCcw className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mr-2">Farm Population Dynamics</h2>
                  {openSections.population ? <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" /> : <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />}
                </button>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 w-[300px] p-3 bg-slate-800 dark:bg-slate-700 text-slate-50 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-[100] pointer-events-none">
                    Showing the maximum concurrent birds required during the year, highlighting the peak number of growing chicks and laying hens at any point within that year.
                    <div className="absolute -top-1 left-1.5 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
                <button 
                  onClick={() => setViewPopulation('table')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewPopulation === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <TableProperties className="h-4 w-4 mr-1.5" /> Table
                </button>
                <button 
                  onClick={() => setViewPopulation('chart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewPopulation === 'chart' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <LineChartIcon className="h-4 w-4 mr-1.5" /> Chart
                </button>
              </div>
            </div>
            
            {openSections.population && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-200">
             {viewPopulation === 'table' ? (
              <>
                <div className="overflow-x-auto pt-4">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
                        <th className="p-4 font-medium">Timeline</th>
                    <th className="p-4 font-medium text-center">New Batches<br/><span className="text-xs font-normal text-slate-400">(Started this Yr)</span></th>
                    <th className="p-4 font-medium text-center">Avg Flock<br/><span className="text-xs font-normal text-slate-400">(Yearly average)</span></th>
                    <th className="p-4 font-medium text-center bg-slate-100 dark:bg-slate-700">Peak Total Flock<br/><span className="text-xs font-normal text-slate-400">(Max birds at once)</span></th>
                    <th className="p-4 font-medium text-right">Peak Growing Chicks<br/><span className="text-xs font-normal text-slate-400">(Max 0-{monthsToLaying} mos)</span></th>
                    <th className="p-4 font-medium text-right">Peak Laying Hens<br/><span className="text-xs font-normal text-slate-400">(Max &gt;{monthsToLaying} mos)</span></th>
                    <th className="p-4 font-medium text-right text-amber-600 dark:text-amber-400">Avg Eggs/Month<br/><span className="text-xs font-normal text-amber-600 dark:text-amber-400/70">(Yearly average)</span></th>
                    <th className="p-4 font-medium text-right bg-slate-50 dark:bg-slate-900">Year-End Flock<br/><span className="text-xs font-normal text-slate-400">(Dec Snapshot)</span></th>
                    <th className="p-4 font-medium text-right text-emerald-600 dark:text-emerald-400">Birds Sold<br/><span className="text-xs font-normal text-emerald-600 dark:text-emerald-400/70">(During Year)</span></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.yearlyData.map((data) => (
                    <tr key={`pop-${data.year}`} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">Year {data.year}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{data.newBatchesIntroduced}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{data.averageActiveFlock.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/50">{data.peakActiveFlock.toLocaleString('en-IN')}</td>
                      
                      <td className="p-4 text-right text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{data.peakChicks.toLocaleString('en-IN')} birds</div>
                        <div className="text-xs text-slate-400">Peak: {data.peakGrowingBatches} batch(es)</div>
                      </td>
                      
                      <td className="p-4 text-right text-amber-600 dark:text-amber-400">
                        <div className="font-medium">{data.peakHens.toLocaleString('en-IN')} birds</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400/60">Peak: {data.peakLayingBatches} batch(es)</div>
                      </td>
                      
                      <td className="p-4 text-right font-medium text-amber-600 dark:text-amber-400">
                        {data.averageMonthlyEggs.toLocaleString('en-IN')}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50">
                        {data.yearEndTotal.toLocaleString('en-IN')}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {data.totalMeatBirds.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
          ) : (
            <div className="p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationData.yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} />
                  <YAxis yAxisId="left" />
                  <RechartsTooltip formatter={(value: any) => value.toLocaleString('en-IN')} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="peakActiveFlock" name="Peak Total Flock" fill="#f1f5f9" stroke="#94a3b8" />
                  <Bar yAxisId="left" dataKey="peakChicks" name="Peak Growing Chicks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar yAxisId="left" dataKey="peakHens" name="Peak Laying Hens" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="averageActiveFlock" name="Average Flock" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
             </div>
            )}
          </div>

          {/* 5-Year Revenue Projection Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`bg-slate-100 dark:bg-slate-700 px-6 py-4 flex items-center justify-between transition-colors ${openSections.financial ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
              <button 
                onClick={() => toggleSection('financial')}
                className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
              >
                <BarChart4 className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mr-2">5-Year Revenue & Profit Projection</h2>
                {openSections.financial ? <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
              </button>
              <div className="flex items-center bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
                <button 
                  onClick={() => setViewFinancials('table')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewFinancials === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <TableProperties className="h-4 w-4 mr-1.5" /> Table
                </button>
                <button 
                  onClick={() => setViewFinancials('chart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewFinancials === 'chart' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <LineChartIcon className="h-4 w-4 mr-1.5" /> Chart
                </button>
              </div>
            </div>

            {openSections.financial && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-200">
             {viewFinancials === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-medium">Year</th>
                    <th className="p-4 font-medium text-right">Eggs Sold</th>
                    <th className="p-4 font-medium text-right">Egg Rev</th>
                    <th className="p-4 font-medium text-right">Birds Sold (Meat)</th>
                    <th className="p-4 font-medium text-right">Meat Rev</th>
                    <th className="p-4 font-medium text-right text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Total Rev</th>
                    <th className="p-4 font-medium text-right text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20">Total Cost</th>
                    <th className="p-4 font-medium text-right text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">Year {data.year}</td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-300">{data.totalEggs.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatINR(data.eggRevenue)}</td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-300">{data.totalMeatBirds.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatINR(data.meatRevenue)}</td>
                      <td className="p-4 text-right font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10">{formatINR(data.totalRevenue)}</td>
                      <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10">{formatINR(data.totalCost)}</td>
                      <td className={`p-4 text-right font-bold ${data.totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10'}`}>
                        {formatINR(data.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="p-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simulationData.yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} />
                    <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} width={80} />
                    <RechartsTooltip formatter={(value: any) => formatINR(value)} labelFormatter={(label) => `Year ${label}`} />
                    <Legend />
                    <Bar dataKey="totalRevenue" name="Total Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalCost" name="Total Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="totalProfit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
             </div>
            )}
          </div>

          

          {/* Infrastructure & Equipment Planner */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`bg-slate-100 dark:bg-slate-700 px-6 py-4 flex items-center justify-between transition-colors ${openSections.infra ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center">
                <button 
                  onClick={() => toggleSection('infra')}
                  className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <Wrench className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mr-2">Infrastructure & Equipment Planner</h2>
                  {openSections.infra ? <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" /> : <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />}
                </button>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 w-[350px] p-3 bg-slate-800 dark:bg-slate-700 text-slate-50 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-[100] pointer-events-none">
                    Estimated requirements based on the predicted bird population and flock activity for each year. Land and equipment must scale with growth.
                    <div className="absolute -top-1 left-1.5 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
                <button 
                  onClick={() => setViewInfra('table')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewInfra === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <TableProperties className="h-4 w-4 mr-1.5" /> Table
                </button>
                <button 
                  onClick={() => setViewInfra('chart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewInfra === 'chart' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <LineChartIcon className="h-4 w-4 mr-1.5" /> Chart
                </button>
              </div>
            </div>
            
            {openSections.infra && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-200">
             {viewInfra === 'table' ? (
              <>
                {/* Desktop View: Data Table */}
                <div className="hidden md:block overflow-x-auto pb-4">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-medium sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[1px_0_0_0_#e2e8f0]">Requirement</th>
                    <th className="p-4 font-medium text-center">Year 1</th>
                    <th className="p-4 font-medium text-center">Year 2</th>
                    <th className="p-4 font-medium text-center">Year 3</th>
                    <th className="p-4 font-medium text-center">Year 4</th>
                    <th className="p-4 font-medium text-center">Year 5</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Space & Land */}
                  <tr className="bg-emerald-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-semibold text-emerald-800 dark:text-emerald-400 sticky left-0 bg-emerald-50 dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0] z-10">
                      <div className="flex items-center"><Map className="h-4 w-4 mr-1" /> Space & Land Areas (Sq.Ft.)</div>
                    </td>
                    <td colSpan={5} className="bg-emerald-50 dark:bg-slate-800"></td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Free Range Area</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.freeRangeSqFt.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Bird Shelter (Shed)</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.shedSqFt.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Incubation / Brooding Rm</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.incubationSqFt.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Egg Handling & Storage</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.eggHandlingSqFt.toLocaleString('en-IN')}</td>)}
                  </tr>
                  
                  {/* Machinery & Hardware */}
                  <tr className="bg-indigo-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-semibold text-indigo-800 dark:text-indigo-400 sticky left-0 bg-indigo-50 dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0] z-10">
                      <div className="flex items-center"><Tractor className="h-4 w-4 mr-1" /> Instruments & Hardware</div>
                    </td>
                    <td colSpan={5} className="bg-indigo-50 dark:bg-slate-800"></td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Incubators (1k cap.)</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.incubators}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Hatchers (1k cap.)</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.hatchers}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Feeders</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.feeders.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Waterers</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.waterers.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Egg Crates (30 cap.)</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.eggCrates.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Backup Generators</td>
                    {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.generators}</td>)}
                  </tr>

                  {/* Optional: BSF & Hydroponics */}
                  {includeBsfHydroponics && (
                    <>
                      <tr className="bg-amber-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3 font-semibold text-amber-800 dark:text-amber-500 sticky left-0 bg-amber-50 dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0] z-10">
                          <div className="flex items-center"><Leaf className="h-4 w-4 mr-1" /> BSF Larvae & Hydroponics</div>
                        </td>
                        <td colSpan={5} className="bg-amber-50 dark:bg-slate-800"></td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                        <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">BSF Space Req. (Sq.Ft.)</td>
                        {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.bsfSqFt.toLocaleString('en-IN')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                        <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">BSF Bins/Setups</td>
                        {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.bsfBins.toLocaleString('en-IN')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                        <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Hydroponics Space Req. (Sq.Ft.)</td>
                        {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.hydroSqFt.toLocaleString('en-IN')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50">
                        <td className="p-4 pl-8 text-slate-700 dark:text-slate-200 font-medium sticky left-0 bg-white dark:bg-slate-800 shadow-[1px_0_0_0_#e2e8f0]">Hydroponics Racks</td>
                        {simulationData.yearlyData.map(d => <td key={d.year} className="p-4 text-center">{d.infra.hydroRacks.toLocaleString('en-IN')}</td>)}
                      </tr>
                    </>
                  )}

                </tbody>
              </table>
            </div>

            {/* Mobile View: Responsive Cards Layout */}
            <div className="block md:hidden px-4 pb-6 space-y-8">
              {/* Category: Space & Land Areas */}
              <div className="space-y-4">
                <h3 className="flex items-center text-sm font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                  <Map className="h-4 w-4 mr-2" /> Space & Land Areas (Sq.Ft.)
                </h3>
                {[
                  { label: "Free Range Area", key: "freeRangeSqFt" },
                  { label: "Bird Shelter (Shed)", key: "shedSqFt" },
                  { label: "Incubation / Brooding Rm", key: "incubationSqFt" },
                  { label: "Egg Handling & Storage", key: "eggHandlingSqFt" },
                ].map((item) => (
                  <div key={item.key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.label}</h4>
                    </div>
                    <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700 text-center">
                      {simulationData.yearlyData.map((d) => (
                        <div key={d.year} className="py-3 px-1 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Y{d.year}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {(d.infra as any)[item.key].toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Category: Machinery & Hardware */}
              <div className="space-y-4">
                <h3 className="flex items-center text-sm font-semibold text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-indigo-100 dark:border-slate-700">
                  <Tractor className="h-4 w-4 mr-2" /> Instruments & Hardware
                </h3>
                {[
                  { label: "Incubators (1k cap.)", key: "incubators" },
                  { label: "Hatchers (1k cap.)", key: "hatchers" },
                  { label: "Feeders", key: "feeders" },
                  { label: "Waterers", key: "waterers" },
                  { label: "Egg Crates (30 cap.)", key: "eggCrates" },
                  { label: "Backup Generators", key: "generators" },
                ].map((item) => (
                  <div key={item.key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.label}</h4>
                    </div>
                    <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700 text-center">
                      {simulationData.yearlyData.map((d) => (
                        <div key={d.year} className="py-3 px-1 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Y{d.year}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {(d.infra as any)[item.key].toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Category: BSF & Hydroponics */}
              {includeBsfHydroponics && (
                <div className="space-y-4">
                  <h3 className="flex items-center text-sm font-semibold text-amber-800 dark:text-amber-500 bg-amber-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-amber-100 dark:border-slate-700">
                    <Leaf className="h-4 w-4 mr-2" /> BSF Larvae & Hydroponics
                  </h3>
                  {[
                    { label: "BSF Space Req. (Sq.Ft.)", key: "bsfSqFt" },
                    { label: "BSF Bins/Setups", key: "bsfBins" },
                    { label: "Hydroponics Space Req. (Sq.Ft.)", key: "hydroSqFt" },
                    { label: "Hydroponics Racks", key: "hydroRacks" },
                  ].map((item) => (
                    <div key={item.key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.label}</h4>
                      </div>
                      <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700 text-center">
                        {simulationData.yearlyData.map((d) => (
                          <div key={d.year} className="py-3 px-1 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Y{d.year}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {(d.infra as any)[item.key].toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            ) : (
              <div className="p-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulationData.yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} />
                    <YAxis yAxisId="left" tickFormatter={(val) => `${(val / 1000).toFixed(1)}k sqft`} width={80} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="infra.freeRangeSqFt" name="Free Range Space" fill="#10b981" stackId="a" />
                    <Bar yAxisId="left" dataKey="infra.shedSqFt" name="Shed Space" fill="#f59e0b" stackId="a" />
                    <Bar yAxisId="left" dataKey="infra.incubationSqFt" name="Incubation Room" fill="#6366f1" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
             </div>
            )}
          </div>

          {/* Monthly Detailed Schedule Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-full">
            <div className={`bg-slate-100 dark:bg-slate-700 px-6 py-4 flex items-center justify-between transition-colors ${openSections.schedule ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center">
                <button 
                  onClick={() => toggleSection('schedule')}
                  className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <CalendarDays className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mr-2">Monthly Batch Schedule & Phases</h2>
                  {openSections.schedule ? <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" /> : <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />}
                </button>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 w-[350px] p-3 bg-slate-800 dark:bg-slate-700 text-slate-50 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-[100] pointer-events-none min-w-[250px]">
                    Detailed 60-month breakdown showing when new day-old chicks are introduced (Brooding phase), their transition into the Growing phase, when they start Laying, and when they are eventually Sold.
                    <div className="absolute -top-1 left-1.5 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
                <button 
                  onClick={() => setViewSchedule('table')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewSchedule === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <TableProperties className="h-4 w-4 mr-1.5" /> Table
                </button>
                <button 
                  onClick={() => setViewSchedule('chart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewSchedule === 'chart' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                >
                  <LineChartIcon className="h-4 w-4 mr-1.5" /> Chart
                </button>
              </div>
            </div>
            
            {openSections.schedule && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-200">
             {viewSchedule === 'table' ? (
              <>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative border-t border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                  <tr className="text-slate-500 dark:text-slate-400 text-sm">
                    <th className="p-4 font-medium bg-slate-100 dark:bg-slate-700">Month</th>
                    <th className="p-4 font-medium text-center bg-slate-100 dark:bg-slate-700">New Batches<br/><span className="text-xs font-normal text-slate-400">(Day-Old Chicks Added)</span></th>
                    <th className="p-4 font-medium text-right text-indigo-700 dark:text-indigo-400 bg-slate-100 dark:bg-slate-700">Brooding Phase<br/><span className="text-xs font-normal text-indigo-400">(Month 1)</span></th>
                    <th className="p-4 font-medium text-right text-blue-700 dark:text-blue-400 bg-slate-100 dark:bg-slate-700">Growing Phase<br/><span className="text-xs font-normal text-blue-400">(Month 2 to {Math.min(monthsToLaying, sellBatchAt)})</span></th>
                    <th className="p-4 font-medium text-right text-amber-700 dark:text-amber-400 bg-slate-100 dark:bg-slate-700">Laying Phase<br/><span className="text-xs font-normal text-amber-500">{sellBatchAt > monthsToLaying ? `(Month ${monthsToLaying + 1} to ${sellBatchAt})` : '(N/A - Sold Before)'}</span></th>
                    <th className="p-4 font-medium text-right text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-700">Birds Sold<br/><span className="text-xs font-normal text-emerald-500">(End of Cycle)</span></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {simulationData.monthlyData.map((data) => (
                    <tr key={`month-${data.month}`} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">Month {data.month} <span className="text-xs text-slate-400 font-normal ml-1">(Y{data.year})</span></td>
                      
                      <td className="p-4 text-center bg-blue-50/20 dark:bg-blue-900/10">
                        {data.newBatchesThisMonth > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            +{data.newBatchesThisMonth} Batch ({data.newBirdsThisMonth.toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-indigo-600 bg-indigo-20">
                        {data.broodingChicks > 0 ? data.broodingChicks.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-900/10">
                        {data.growingChicks > 0 ? data.growingChicks.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-900/10">
                        {data.currentHens > 0 ? data.currentHens.toLocaleString('en-IN') : '-'}
                      </td>
                      
                      <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10">
                        {data.monthlyMeatBirds > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {data.monthlyMeatBirds.toLocaleString('en-IN')} Sold
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
            ) : (
              <div className="p-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationData.monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={(val) => `M${val}`} />
                    <YAxis />
                    <RechartsTooltip labelFormatter={(label) => `Month ${label}`} />
                    <Legend />
                    <Area type="monotone" dataKey="broodingChicks" name="Brooding Phase" stackId="1" stroke="#4f46e5" fill="#c7d2fe" />
                    <Area type="monotone" dataKey="growingChicks" name="Growing Phase" stackId="1" stroke="#2563eb" fill="#bfdbfe" />
                    <Area type="monotone" dataKey="currentHens" name="Laying Phase" stackId="1" stroke="#d97706" fill="#fde68a" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
             </div>
            )}
          </div>

        </div>

        {/* Right Content - Stats Section */}
        {isRightSidebarOpen && (
        <div className="lg:col-span-3 space-y-6 transition-all duration-300">
          <div className="flex flex-col gap-4">
            
            {/* Header for Right Sidebar with Close Button */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                Financial Summary
              </h2>
              <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title="Close sidebar"
              >
                <PanelRightClose className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-5 border border-blue-200 dark:border-blue-800 shadow-sm flex flex-col justify-center">
              <div className="text-blue-800 dark:text-blue-300 text-sm font-medium mb-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" /> Avg Yearly Revenue
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatINR(simulationData.summary.avgYearlyRevenue)}</div>
            </div>

            <div className={`rounded-xl p-5 border shadow-sm flex flex-col justify-center ${simulationData.summary.avgYearlyProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
              <div className={`text-sm font-medium mb-1 flex items-center ${simulationData.summary.avgYearlyProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                <Wallet className="h-4 w-4 mr-1" /> Avg Yearly Profit
              </div>
              <div className={`text-2xl font-bold ${simulationData.summary.avgYearlyProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {formatINR(simulationData.summary.avgYearlyProfit)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center mt-2">
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" /> Total 5-Yr Revenue
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatINR(simulationData.summary.totalRevenue)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-rose-500" /> Total 5-Yr Cost
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatINR(simulationData.summary.totalCost)}</div>
            </div>
            
            <div className={`rounded-xl p-5 border shadow-sm flex flex-col justify-center ${simulationData.summary.netProfit >= 0 ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
              <div className={`text-sm font-medium mb-1 flex items-center ${simulationData.summary.netProfit >= 0 ? 'text-slate-700 dark:text-slate-200' : 'text-rose-800'}`}>
                <Wallet className="h-4 w-4 mr-1" /> 5-Yr Net Profit
              </div>
              <div className={`text-2xl font-bold ${simulationData.summary.netProfit >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-700 dark:text-rose-400'}`}>
                {formatINR(simulationData.summary.netProfit)}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Egg Revenue</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(simulationData.summary.totalEggRev)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Meat Revenue</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(simulationData.summary.totalMeatRev)}</div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm flex flex-col justify-center">
              <div className="text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-1 flex items-center">
                <Map className="h-3 w-3 mr-1" /> Peak Land Required
              </div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{simulationData.summary.peakLandRequired} Acres</div>
            </div>
          </div>
        </div>
        )}

      </main>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
      </div>
    </div>
  );
}

