import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Bird, Sun, Moon } from 'lucide-react';

import Home from './pages/Home';
import About from './pages/About';
import PoultrySimulator from './simulators/PoultrySimulator';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`flex flex-col min-h-screen font-sans ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Global Header Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-3">
                  <Bird className="h-8 w-8 text-emerald-500" />
                  <h1 className="text-2xl font-bold tracking-tight">AgriSim</h1>
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-slate-300 text-sm font-medium">
                  Home
                </Link>
                <Link to="/poultry" className="border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Poultry
                </Link>
                <Link to="/about" className="border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
            {/* Dark Mode Toggle */}
            <div className="flex items-center ml-auto">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area mapping to Routes */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/poultry" element={<PoultrySimulator />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>

      {/* Global Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 text-slate-300 mt-auto">
        <div className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Bird className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-white">AgriSim Tools</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AgriSim. Planted with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
