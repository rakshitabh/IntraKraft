import React from 'react';
import { Layers, ShoppingCart, Sliders, Database, HardDriveDownload, RefreshCw } from 'lucide-react';

/**
 * Enterprise ERP Top Bar
 * Mimics SAP / Oracle Retail ERP header with system status indicators,
 * module switcher, and persistence status.
 */
export default function Header({
  activeTab,
  setActiveTab,
  catalogueCount,
  cartCount,
  ratiosCount,
  onResetAll
}) {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-700 select-none">
      {/* Top micro-bar */}
      <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-200 tracking-wider">Merchandising Suite</span>
          <span className="text-slate-600">|</span>
          <span>Assortment Planning &amp; Size Ratio Configuration</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onResetAll}
            title="Clear all stored catalogue, cart & ratio data"
            className="text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} />
            Reset Data
          </button>
        </div>
      </div>

      {/* Main system header */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            IK
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Retail Merchandising &amp; Grade-Wise Ratio Manager
            </h1>
            <p className="text-xs text-slate-400">
              Assortment Planning &bull; Variant Consolidation &bull; Dynamic Size Ratios
            </p>
          </div>
        </div>

        {/* Enterprise KPI chips */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Catalogue Styles</span>
            <span className="text-sm font-bold text-white font-mono">{catalogueCount}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Cart Styles</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{cartCount}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Configured Ratios</span>
            <span className="text-sm font-bold text-blue-400 font-mono">{ratiosCount}</span>
          </div>
        </div>
      </div>

      {/* Enterprise Tab Navigation */}
      <nav className="px-4 flex space-x-1 border-t border-slate-800 bg-slate-900/90 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'catalogue'
              ? 'border-blue-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Database size={14} />
          <span>1. Catalogue &amp; Products ({catalogueCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'cart'
              ? 'border-blue-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <ShoppingCart size={14} />
          <span>2. Product Cart ({cartCount})</span>
          {cartCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'ratios'
              ? 'border-blue-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Sliders size={14} />
          <span>3. Grade Ratio Management ({ratiosCount})</span>
        </button>
      </nav>
    </header>
  );
}
