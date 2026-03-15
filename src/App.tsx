import React, { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { calculateSummary, generateMonthlyData } from "./calculations";

const initialLayout = [
  { i: "inputs", x: 0, y: 0, w: 4, h: 12, static: true },
  { i: "summary", x: 4, y: 0, w: 8, h: 4 },
  { i: "chart", x: 4, y: 4, w: 8, h: 8 },
];

export default function App() {
  const [layout, setLayout] = useState(
    JSON.parse(localStorage.getItem("dashboardLayout") || "null") || initialLayout
  );

  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
    localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
  };

  const [inputs, setInputs] = useState({
    breed: "kadaknath",
    eggsPerYear: 100,
    layingStartDays: 150,
    targetEggsPerMonth: 5000,
    eggPrice: 15,
    meatPrice: 300,
    bodyWeight: 1.5,
    retirementAgeMonths: 18,
    totalYears: 3,
    chickCost: 50,
    feedCostChick: 10,
    feedCostGrower: 20,
    feedCostLayer: 30,
    mortalityChick: 5,
    mortalityGrower: 2,
    mortalityLayer: 1,
    medicineCost: 5,
    laborCost: 15000,
    electricity: 2000,
    depreciation: 1000,
    femalePercentage: 50,
    malePercentage: 50,
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: name === "breed" ? value : Number(value) || 0,
    }));
  };

  const summary = calculateSummary(inputs);

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      <aside className="w-64 bg-slate-900 text-white p-5 flex-shrink-0">
        <h2 className="text-xl font-bold mb-6">Poultry Dash</h2>
        <nav className="space-y-4 text-sm">
          <a href="#" className="block p-3 bg-blue-600 rounded">Chicken Revenue Analyzer</a>
          <a href="#" className="block p-3 hover:bg-slate-800 rounded">Flock Status</a>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow px-6 py-4 flex-shrink-0 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Chicken Revenue Analyzer</h1>
          <button className="text-sm bg-gray-200 px-3 py-1 rounded" onClick={() => setLayout(initialLayout)}>Reset Layout</button>
        </header>
        <div className="flex-1 overflow-auto p-4 relative">
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={50}
            width={1200}
            onLayoutChange={onLayoutChange}
            draggableHandle=".drag-handle"
          >
            <div key="inputs" className="bg-white p-4 shadow-sm border border-gray-100 rounded-lg flex flex-col h-full overflow-y-auto">
              <div className="drag-handle cursor-move bg-gray-50 px-3 py-2 mb-4 font-semibold text-gray-700 text-sm flex justify-between rounded items-center">
                Simulation Inputs <span>⋮⋮</span>
              </div>
              <div className="space-y-4 pb-8">
                <div><label className="block text-xs font-semibold text-gray-600">Breed</label>
                <select name="breed" value={inputs.breed} onChange={handleInputChange} className="w-full mt-1 border border-gray-200 p-2 text-sm rounded"><option value="kadaknath">Kadaknath</option><option value="natikoli">Nati Koli</option></select></div>
                <div><label className="block text-xs font-semibold text-gray-600">Target Eggs / Month</label>
                <input type="number" name="targetEggsPerMonth" value={inputs.targetEggsPerMonth} onChange={handleInputChange} className="w-full mt-1 border border-gray-200 p-2 text-sm rounded" /></div>
                <div><label className="block text-xs font-semibold text-gray-600">Eggs / Hen / Year</label>
                <input type="number" name="eggsPerYear" value={inputs.eggsPerYear} onChange={handleInputChange} className="w-full mt-1 border border-gray-200 p-2 text-sm rounded" /></div>
                <div><label className="block text-xs font-semibold text-gray-600">Egg Price (₹)</label>
                <input type="number" name="eggPrice" value={inputs.eggPrice} onChange={handleInputChange} className="w-full mt-1 border border-gray-200 p-2 text-sm rounded" /></div>
                <div><label className="block text-xs font-semibold text-gray-600">Meat Price / kg (₹)</label>
                <input type="number" name="meatPrice" value={inputs.meatPrice} onChange={handleInputChange} className="w-full mt-1 border border-gray-200 p-2 text-sm rounded" /></div>
              </div>
            </div>
            <div key="summary" className="bg-white p-4 shadow-sm border border-gray-100 rounded-lg flex flex-col h-full">
              <div className="drag-handle cursor-move bg-gray-50 px-3 py-2 mb-4 font-semibold text-gray-700 text-sm flex justify-between rounded items-center">
                Financial Summary <span>⋮⋮</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded text-center"><p className="text-green-700 text-xs font-bold uppercase">Total Revenue (3Y)</p><p className="text-xl font-black mt-1 text-green-900">₹{summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                <div className="bg-red-50 p-4 rounded text-center"><p className="text-red-700 text-xs font-bold uppercase">Total Costs (3Y)</p><p className="text-xl font-black mt-1 text-red-900">₹{summary.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                <div className="bg-blue-50 p-4 rounded text-center"><p className="text-blue-700 text-xs font-bold uppercase">Net Profit (3Y)</p><p className="text-xl font-black mt-1 text-blue-900">₹{summary.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                <div className="bg-amber-50 p-4 rounded text-center"><p className="text-amber-700 text-xs font-bold uppercase">Monthly Revenue</p><p className="text-xl font-black mt-1 text-amber-900">₹{summary.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
              </div>
            </div>
            <div key="chart" className="bg-white p-4 shadow-sm border border-gray-100 rounded-lg flex flex-col h-full">
               <div className="drag-handle cursor-move bg-gray-50 px-3 py-2 mb-4 font-semibold text-gray-700 text-sm flex justify-between rounded items-center">
                Viral Trends <span>⋮⋮</span>
              </div>
              <div className="flex-1 overflow-auto rounded border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Chicks Added / Month</th>
                      <th className="px-4 py-3">Laying Stock (Birds)</th>
                      <th className="px-4 py-3">Eggs Produced / Month</th>
                      <th className="px-4 py-3">Feed Cost / Month (₹)</th>
                      <th className="px-4 py-3">Total Cost / Month (₹)</th>
                      <th className="px-4 py-3">Revenue / Month (₹)</th>
                      <th className="px-4 py-3">Profit / Month (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateMonthlyData(inputs, 60).map((row) => (
                      <tr key={row.month} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{row.month}</td>
                        <td className="px-4 py-2">{row.chicks}</td>
                        <td className="px-4 py-2">{row.stock}</td>
                        <td className="px-4 py-2">{row.eggs.toLocaleString()}</td>
                        <td className="px-4 py-2">{row.feedCost.toLocaleString()}</td>
                        <td className="px-4 py-2">{row.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-2">{row.revenue.toLocaleString()}</td>
                        <td className={`px-4 py-2 font-medium ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.profit >= 0 ? '+' : ''}{row.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GridLayout>
        </div>
        <footer className="text-center p-3 text-xs text-gray-500 flex-shrink-0 border-t">© 2026 Poultry Manager</footer>
      </div>
    </div>
  );
}
