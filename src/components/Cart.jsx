import React from 'react';
import { ShoppingCart, Trash2, ArrowRight, Package, AlertCircle } from 'lucide-react';

/**
 * STEP 4: Merchandising Cart Component
 * Displays selected products with assigned Grades.
 * Persists in Local Storage across browser refreshes.
 *
 * Each item in cartItems:
 * {
 *   id: string (unique cart identifier: styleCode-grade or uuid),
 *   product: Object (consolidated product),
 *   grade: 'A' | 'B' | 'C' | 'D',
 *   addedAt: timestamp
 * }
 */
export default function Cart({ cartItems, onRemoveFromCart, onClearCart, onNavigateToRatios }) {
  // Compute summary stats
  const gradeBreakdown = cartItems.reduce((acc, item) => {
    acc[item.grade] = (acc[item.grade] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-300 rounded shadow-sm">
      {/* Cart Header */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShoppingCart size={16} className="text-gray-700" />
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Merchandising Product Cart
          </h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-xs font-bold rounded-full">
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {cartItems.length > 0 && (
          <div className="flex items-center space-x-2">
            {/* Grade summary badges */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-gray-600 mr-2">
              {['A', 'B', 'C', 'D'].map(g => (
                <span
                  key={g}
                  className={`px-1.5 py-0.5 rounded border text-[11px] font-mono ${
                    gradeBreakdown[g]
                      ? 'bg-white border-gray-300 text-gray-800 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {g}: {gradeBreakdown[g] || 0}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={onClearCart}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear Cart</span>
            </button>

            {onNavigateToRatios && (
              <button
                type="button"
                onClick={onNavigateToRatios}
                className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                <span>Configure Ratios</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cart Content Table */}
      {cartItems.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">Your Cart Is Empty</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Select products from the Catalogue table, choose a Grade (A, B, C, or D), and click &quot;Add To Cart&quot;.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-800">
            <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-300 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 border-r border-gray-200 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Product Name</th>
                <th className="py-2.5 px-3 border-r border-gray-200 w-32">Style Code</th>
                <th className="py-2.5 px-3 border-r border-gray-200 w-24 text-center">Grade</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Sizes</th>
                <th className="py-2.5 px-3 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cartItems.map((item, index) => {
                const p = item.product;
                const gradeBadgeColors = {
                  A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  B: 'bg-blue-100 text-blue-800 border-blue-300',
                  C: 'bg-amber-100 text-amber-800 border-amber-300',
                  D: 'bg-rose-100 text-rose-800 border-rose-300'
                };

                return (
                  <tr
                    key={item.id || `${p.styleCode}-${item.grade}-${index}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 border-r border-gray-200 text-center font-mono text-gray-500">
                      {index + 1}
                    </td>

                    {/* Product Name */}
                    <td className="py-2 px-3 border-r border-gray-200 font-medium text-gray-900">
                      <div>{p.styleName}</div>
                      <div className="text-[10px] text-gray-500 flex gap-2 mt-0.5">
                        <span>Brand: {p.brandName}</span>
                        <span>&bull;</span>
                        <span>Brick: {p.brick}</span>
                        <span>&bull;</span>
                        <span>Category: {p.category}</span>
                      </div>
                    </td>

                    {/* Style Code */}
                    <td className="py-2 px-3 border-r border-gray-200 font-mono font-medium text-gray-900 whitespace-nowrap">
                      {p.styleCode}
                    </td>

                    {/* Grade */}
                    <td className="py-2 px-3 border-r border-gray-200 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded font-bold font-mono border text-xs ${
                          gradeBadgeColors[item.grade] || 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        Grade {item.grade}
                      </span>
                    </td>

                    {/* Sizes */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {p.sizes && p.sizes.length > 0 ? (
                          p.sizes.map(sz => (
                            <span
                              key={sz}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-300 rounded text-[11px] font-mono"
                            >
                              {sz}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">N/A</span>
                        )}
                      </div>
                    </td>

                    {/* Remove Action */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors"
                        title="Remove from Cart"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cart Summary Bar */}
      {cartItems.length > 0 && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} className="text-blue-600" />
            <span>
              Review selected items and assigned grades before configuring size ratios.
            </span>
          </div>
          <div className="font-semibold text-gray-800 font-mono">
            Total Cart Lines: {cartItems.length}
          </div>
        </div>
      )}
    </div>
  );
}
