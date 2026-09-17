import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Check, Filter, ArrowUpDown, Tag, Layers } from 'lucide-react';

const GRADES = ['A', 'B', 'C', 'D'];

/**
 * STEP 3: Display Grouped Products Table
 * - Enterprise data grid displaying consolidated products
 * - Dynamic size tags
 * - Grade selector dropdown (A, B, C, D)
 * - [Add To Cart] action
 */
export default function ProductTable({ products, onAddToCart, cartItems }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrickFilter, setSelectedBrickFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  // Local state to track selected grade for each row (keyed by styleCode)
  const [rowGrades, setRowGrades] = useState({});
  // Track recently clicked "Add to Cart" for momentary visual feedback
  const [recentAddedCode, setRecentAddedCode] = useState(null);

  // Extract unique filters
  const uniqueBricks = useMemo(() => {
    return ['ALL', ...new Set(products.map(p => p.brick).filter(Boolean))].sort();
  }, [products]);

  const uniqueCategories = useMemo(() => {
    return ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))].sort();
  }, [products]);

  // Handle grade change for a row
  const handleGradeChange = (styleCode, grade) => {
    setRowGrades(prev => ({
      ...prev,
      [styleCode]: grade
    }));
  };

  // Get current grade for a style (defaults to 'A')
  const getProductGrade = (styleCode) => {
    return rowGrades[styleCode] || 'A';
  };

  // Filtered dataset
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.styleCode.toLowerCase().includes(q) ||
        p.styleName.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.brick.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchesBrick = selectedBrickFilter === 'ALL' || p.brick === selectedBrickFilter;
      const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;

      return matchesSearch && matchesBrick && matchesCategory;
    });
  }, [products, searchQuery, selectedBrickFilter, selectedCategoryFilter]);

  const handleAddToCartClick = (product) => {
    const grade = getProductGrade(product.styleCode);
    onAddToCart(product, grade);

    // Show temporary check indicator on button
    setRecentAddedCode(`${product.styleCode}-${grade}`);
    setTimeout(() => {
      setRecentAddedCode(null);
    }, 1200);
  };

  // Check how many times this style is in the cart
  const getCartCountForProduct = (styleCode) => {
    return cartItems.filter(item => item.product.styleCode === styleCode).length;
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded p-8 text-center text-gray-500">
        <Layers size={36} className="mx-auto text-gray-400 mb-2 stroke-[1.5]" />
        <h3 className="text-sm font-semibold text-gray-700">No Catalogue Data Loaded</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Upload an Excel catalogue (.xlsx) above or click "Load Sample Dataset" to populate products and sizes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded shadow-sm">
      {/* Table Toolbar */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Product Catalogue
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 font-mono rounded-full">
            {filteredProducts.length} of {products.length} Styles
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by code, name, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-56 placeholder-gray-400"
            />
          </div>

          {/* Brick filter */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 text-[11px]">Brick:</span>
            <select
              value={selectedBrickFilter}
              onChange={(e) => setSelectedBrickFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {uniqueBricks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 text-[11px]">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-800">
          <thead className="bg-gray-100/90 text-gray-700 font-semibold border-b border-gray-300 uppercase text-[11px] tracking-wider select-none">
            <tr>
              <th className="py-2.5 px-3 border-r border-gray-200 w-28">Style Code</th>
              <th className="py-2.5 px-3 border-r border-gray-200">Product Name</th>
              <th className="py-2.5 px-3 border-r border-gray-200 w-28">Brand</th>
              <th className="py-2.5 px-3 border-r border-gray-200 w-28">Brick</th>
              <th className="py-2.5 px-3 border-r border-gray-200 w-28">Category</th>
              <th className="py-2.5 px-3 border-r border-gray-200">Sizes (Dynamic Variants)</th>
              <th className="py-2.5 px-3 border-r border-gray-200 w-28 text-center">Grade</th>
              <th className="py-2.5 px-3 text-center w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No styles match the selected search &amp; filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, idx) => {
                const currentGrade = getProductGrade(product.styleCode);
                const isRecentlyAdded = recentAddedCode === `${product.styleCode}-${currentGrade}`;
                const inCartCount = getCartCountForProduct(product.styleCode);

                return (
                  <tr
                    key={product.styleCode}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Style Code */}
                    <td className="py-2 px-3 border-r border-gray-200 font-mono font-medium text-gray-900 whitespace-nowrap">
                      {product.styleCode}
                    </td>

                    {/* Product Name */}
                    <td className="py-2 px-3 border-r border-gray-200 font-medium text-gray-900">
                      <div className="flex items-center justify-between">
                        <span>{product.styleName}</span>
                        {inCartCount > 0 && (
                          <span
                            className="ml-2 text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-mono"
                            title={`This product has ${inCartCount} entry in the Cart`}
                          >
                            In Cart ({inCartCount})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">
                        {product.neck && product.neck !== 'None' && product.neck !== 'Regular' && (
                          <span>Neck: {product.neck}</span>
                        )}
                        {product.sleeve && product.sleeve !== 'None' && product.sleeve !== 'Regular' && (
                          <span>Sleeve: {product.sleeve}</span>
                        )}
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-2 px-3 border-r border-gray-200 text-gray-700 whitespace-nowrap">
                      {product.brandName}
                    </td>

                    {/* Brick */}
                    <td className="py-2 px-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-200 rounded text-[11px]">
                        {product.brick}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-2 px-3 border-r border-gray-200 whitespace-nowrap text-gray-700">
                      {product.category}
                    </td>

                    {/* Sizes as Tags */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <div className="flex flex-wrap gap-1 items-center">
                        {product.sizes && product.sizes.length > 0 ? (
                          product.sizes.map(sz => (
                            <span
                              key={sz}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-300 rounded text-[11px] font-mono font-medium"
                            >
                              {sz}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No sizes defined</span>
                        )}
                      </div>
                    </td>

                    {/* Grade Dropdown */}
                    <td className="py-2 px-3 border-r border-gray-200 text-center whitespace-nowrap">
                      <select
                        value={currentGrade}
                        onChange={(e) => handleGradeChange(product.styleCode, e.target.value)}
                        className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
                      >
                        {GRADES.map(g => (
                          <option key={g} value={g}>
                            Grade {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Action Button */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {cartItems.some(
                        item => item.product.styleCode === product.styleCode && item.grade === currentGrade
                      ) ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded shadow-sm">
                          <Check size={12} />
                          <span>In Cart (Gr. {currentGrade})</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCartClick(product)}
                          className={`inline-flex items-center justify-center space-x-1 px-3 py-1 text-xs font-medium rounded transition-all shadow-sm ${
                            isRecentlyAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isRecentlyAdded ? (
                            <>
                              <Check size={13} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={13} />
                              <span>Add To Cart</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between items-center">
        <span>Rows are grouped by <strong>Style_Code</strong>; each row consolidates its variant sizes.</span>
        <span>Displaying {filteredProducts.length} records</span>
      </div>
    </div>
  );
}
