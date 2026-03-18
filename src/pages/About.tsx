export default function About() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">About AgriSim</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl">
          AgriSim is designed to help farmers and entrepreneurs model the financial and operational aspects of agricultural businesses. By adjusting parameters such as breeds, production, and costs, you can forecast your revenue and understand the lifecycle of your farm over multi-year periods.
        </p>
      </div>
    </div>
  );
}
