import { Link } from 'react-router-dom';
import { Bird, Tractor } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Welcome to AgriSim</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl mb-8">
          Select a simulator below to model the financial and operational aspects of your agricultural business. Forecast revenue, understand operational lifecycles, and plan your infrastructure over multi-year periods.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/poultry" className="group block bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="bg-emerald-100 dark:bg-emerald-800/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bird className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Poultry Farming</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Simulate free-range poultry, egg production, meat sales, and track financial projections with advanced batch scheduling.
            </p>
          </Link>
          
          <div className="group block bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm opacity-70">
            <div className="bg-slate-200 dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Tractor className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">More Simulators</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Coming soon. We are building more agricultural simulators for different farming types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
