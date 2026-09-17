import React, { useState, useMemo, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertCircle, Save, RotateCcw, Copy, Trash2, Eye, HelpCircle, Code, ShoppingCart, Database } from 'lucide-react';
import { sortSizes, formatRatiosToStandardJson } from '../utils/catalogueParser';

const GRADES = ['A', 'B', 'C', 'D'];

const GROUP_BY_OPTIONS = [
  { id: 'Brick', label: 'Brick' },
  { id: 'Category', label: 'Category' },
  { id: 'Brick + Neck', label: 'Brick + Neck' },
  { id: 'Brick + Sleeve', label: 'Brick + Sleeve' },
];

/**
 * Helper to compute the dynamic group key for a product row based on the selected Group By rule.
 */
function getProductGroupValue(product, groupBy) {
  const sanitize = (val) => (val && String(val).trim() !== '' ? String(val).trim() : 'Unspecified');

  switch (groupBy) {
    case 'Brick':
      return sanitize(product.brick);

    case 'Category':
      return sanitize(product.category);

    case 'Brick + Neck': {
      const b = sanitize(product.brick);
      const n = sanitize(product.neck);
      return `${b}-${n}`;
    }

    case 'Brick + Sleeve': {
      const b = sanitize(product.brick);
      const s = sanitize(product.sleeve);
      return `${b}-${s}`;
    }

    default:
      return sanitize(product.brick);
  }
}

/**
 * STEP 5, 6, 7: Grade-Wise Ratio Configurator Component
 * - Dynamically determines available groups from catalogue or cart
 * - Dynamically extracts exact sizes for selected group (NEVER hardcoded)
 * - Renders dynamic ratio input matrix for Grades A, B, C, D
 * - Persists ratio configs to React state and LocalStorage
 * - Formats & exports standard retail JSON schema
 */
export default function RatioConfigurator({
  products = [],
  cartItems = [],
  savedRatios = {},
  onSaveRatio,
  onDeleteRatio
}) {
  // Toggle whether to configure ratios for items currently in the Cart or the full Catalogue
  const [dataScope, setDataScope] = useState(() => (cartItems.length > 0 ? 'cart' : 'catalogue'));

  // Active products to configure ratios for
  const activeProducts = useMemo(() => {
    if (dataScope === 'cart' && cartItems.length > 0) {
      return cartItems.map(item => item.product);
    }
    return products;
  }, [dataScope, cartItems, products]);

  // Step 5: Selected Group By dimension
  const [selectedGroupBy, setSelectedGroupBy] = useState('Brick');

  // Step 5: Selected Group value within the dimension (e.g. "Trousers" or "Shirts-Full Sleeve")
  const [selectedGroup, setSelectedGroup] = useState('');

  // Step 6: Ratio Form matrix state: { [grade]: { [size]: number } }
  const [gradeRatioMatrix, setGradeRatioMatrix] = useState({
    A: {},
    B: {},
    C: {},
    D: {}
  });

  // Success notification banner state
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(null);

  // Standard JSON Payload modal state
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Dynamic Group extraction based on chosen Group By
  const availableGroups = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];

    const groupSet = new Set();
    for (const p of activeProducts) {
      const val = getProductGroupValue(p, selectedGroupBy);
      if (val) groupSet.add(val);
    }

    return Array.from(groupSet).sort();
  }, [activeProducts, selectedGroupBy]);

  // When Group By changes or products load, auto-select the first group if current is invalid
  useEffect(() => {
    if (availableGroups.length > 0) {
      if (!selectedGroup || !availableGroups.includes(selectedGroup)) {
        setSelectedGroup(availableGroups[0]);
      }
    } else {
      setSelectedGroup('');
    }
  }, [availableGroups, selectedGroupBy]);

  // Find products that belong to the currently selected group
  const productsInSelectedGroup = useMemo(() => {
    if (!selectedGroup || !activeProducts) return [];
    return activeProducts.filter(p => getProductGroupValue(p, selectedGroupBy) === selectedGroup);
  }, [activeProducts, selectedGroupBy, selectedGroup]);

  // Find styles currently in the Cart that belong to this group
  const cartItemsInSelectedGroup = useMemo(() => {
    if (!selectedGroup || !cartItems) return [];
    return cartItems.filter(item => getProductGroupValue(item.product, selectedGroupBy) === selectedGroup);
  }, [cartItems, selectedGroupBy, selectedGroup]);

  // Group cart items by their assigned Grade (A, B, C, D)
  const cartStylesByGrade = useMemo(() => {
    const map = { A: [], B: [], C: [], D: [] };
    cartItemsInSelectedGroup.forEach(item => {
      if (map[item.grade]) {
        map[item.grade].push(item);
      }
    });
    return map;
  }, [cartItemsInSelectedGroup]);

  // STEP 6: DYNAMIC SIZE EXTRACTION (NEVER HARDCODED)
  // Extracts only the sizes present in the styles of the chosen group
  const dynamicSizes = useMemo(() => {
    if (productsInSelectedGroup.length === 0) return [];

    const sizeSet = new Set();
    for (const p of productsInSelectedGroup) {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(sz => sizeSet.add(String(sz).trim()));
      }
    }

    // Sort using canonical retail size order
    return sortSizes(Array.from(sizeSet));
  }, [productsInSelectedGroup]);

  // Construct storage key: e.g. "Brick:Trousers" or "Brick + Neck:T-Shirts-Round Neck"
  const currentStorageKey = useMemo(() => {
    if (!selectedGroupBy || !selectedGroup) return '';
    return `${selectedGroupBy}:${selectedGroup}`;
  }, [selectedGroupBy, selectedGroup]);

  // Sync form matrix when currentStorageKey or dynamicSizes change
  useEffect(() => {
    if (!currentStorageKey || dynamicSizes.length === 0) {
      setGradeRatioMatrix({ A: {}, B: {}, C: {}, D: {} });
      return;
    }

    const existingRatioConfig = savedRatios[currentStorageKey];

    const initialMatrix = { A: {}, B: {}, C: {}, D: {} };

    GRADES.forEach(grade => {
      initialMatrix[grade] = {};
      dynamicSizes.forEach(sz => {
        // If an existing saved ratio exists for this size and grade, preload it; else default to 0
        const savedVal = existingRatioConfig?.[grade]?.[sz];
        initialMatrix[grade][sz] = savedVal !== undefined ? Number(savedVal) : 0;
      });
    });

    setGradeRatioMatrix(initialMatrix);
  }, [currentStorageKey, dynamicSizes, savedRatios]);

  // Handle individual size ratio input change
  const handleRatioInputChange = (grade, size, value) => {
    // Sanitize non-negative integer
    const parsed = parseInt(value, 10);
    const safeValue = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setGradeRatioMatrix(prev => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [size]: safeValue
      }
    }));
  };

  // STEP 7: SAVE RATIOS
  const handleSaveRatioClick = () => {
    if (!currentStorageKey) return;

    // Call parent handler to store in state & LocalStorage
    onSaveRatio(currentStorageKey, gradeRatioMatrix);

    setSaveSuccessNotification({
      key: currentStorageKey,
      timestamp: new Date().toLocaleTimeString(),
      grades: Object.keys(gradeRatioMatrix)
    });

    // Auto dismiss notification after 4 seconds
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 4000);
  };

  // Quick action: Zero out current matrix
  const handleResetForm = () => {
    const zeroMatrix = { A: {}, B: {}, C: {}, D: {} };
    GRADES.forEach(grade => {
      zeroMatrix[grade] = {};
      dynamicSizes.forEach(sz => {
        zeroMatrix[grade][sz] = 0;
      });
    });
    setGradeRatioMatrix(zeroMatrix);
  };

  // Quick action: Fill Grade A with 1s and copy to all
  const handleFillSample = () => {
    const filledMatrix = { A: {}, B: {}, C: {}, D: {} };
    GRADES.forEach((grade, gIdx) => {
      filledMatrix[grade] = {};
      dynamicSizes.forEach((sz, sIdx) => {
        // Sample realistic distribution: Grade A higher, D lower
        if (grade === 'A') filledMatrix[grade][sz] = (sIdx % 3 === 1 ? 2 : 1);
        else if (grade === 'B') filledMatrix[grade][sz] = (sIdx % 2 === 0 ? 2 : 1);
        else if (grade === 'C') filledMatrix[grade][sz] = (sIdx === 0 ? 1 : (sIdx === 1 ? 2 : 0));
        else filledMatrix[grade][sz] = 0;
      });
    });
    setGradeRatioMatrix(filledMatrix);
  };

  // Calculate grade total units
  const getGradeTotal = (grade) => {
    const gradeObj = gradeRatioMatrix[grade] || {};
    return Object.values(gradeObj).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  // Format ratio string: e.g. "1 : 2 : 1 : 1"
  const getGradeRatioString = (grade) => {
    if (dynamicSizes.length === 0) return '—';
    return dynamicSizes.map(sz => gradeRatioMatrix[grade]?.[sz] ?? 0).join(' : ');
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded p-8 text-center text-gray-500">
        <Sliders size={36} className="mx-auto text-gray-400 mb-2 stroke-[1.5]" />
        <h3 className="text-sm font-semibold text-gray-700">Catalogue Required for Ratio Configuration</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Please upload a catalogue or load the sample dataset first. Groups and sizes are dynamically extracted from catalogue rows.
        </p>
      </div>
    );
  }

  const isCurrentGroupSaved = Boolean(savedRatios[currentStorageKey]);

  return (
    <div className="space-y-4">
      {/* Success Notification Alert */}
      {saveSuccessNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded shadow-sm flex items-start justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Ratio Configuration Saved Successfully!</span>
              <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                Group: <span className="font-bold">{saveSuccessNotification.key}</span> &bull; Updated at {saveSuccessNotification.timestamp}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccessNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Ratio Configuration Box */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        {/* Step 5 & 6 Header & Selectors */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Sliders size={16} className="text-gray-700" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Grade-Wise Ratio Configuration Matrix
                </h2>
              </div>

              {/* Data Scope Selector: Cart vs Catalogue */}
              <div className="inline-flex rounded border border-gray-300 p-0.5 bg-gray-100 text-xs">
                <button
                  type="button"
                  onClick={() => setDataScope('cart')}
                  className={`px-2.5 py-0.5 rounded font-medium flex items-center space-x-1 transition-colors ${
                    dataScope === 'cart'
                      ? 'bg-white text-blue-700 font-bold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Source groups and sizes from products currently in Cart"
                >
                  <ShoppingCart size={12} />
                  <span>Cart Items ({cartItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDataScope('catalogue')}
                  className={`px-2.5 py-0.5 rounded font-medium flex items-center space-x-1 transition-colors ${
                    dataScope === 'catalogue'
                      ? 'bg-white text-blue-700 font-bold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Source groups and sizes from all uploaded catalogue styles"
                >
                  <Database size={12} />
                  <span>Catalogue ({products.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Action Utilities */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFillSample}
                className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Fill with standard sample ratios"
              >
                Auto-Fill Sample
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Set all values to 0"
              >
                Clear Matrix
              </button>
            </div>
          </div>

          {/* Step 5: Group By & Group Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-200">
            {/* 1. Group By Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                1. Select Group By Dimension
              </label>
              <select
                value={selectedGroupBy}
                onChange={(e) => setSelectedGroupBy(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {GROUP_BY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Rule: Groups will be dynamically generated based on this dimension.
              </span>
            </div>

            {/* 2. Group Selector Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                2. Select Group ({availableGroups.length} available)
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableGroups.length === 0 ? (
                  <option value="">No groups available</option>
                ) : (
                  availableGroups.map(grp => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))
                )}
              </select>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Active group: <strong className="text-gray-700">{selectedGroup || 'None'}</strong>
              </span>
            </div>

            {/* 3. Group Summary Context Card */}
            <div className="bg-white border border-gray-200 rounded p-2 text-xs flex flex-col justify-center">
              <div className="flex items-center justify-between text-gray-600">
                <span>Associated Styles:</span>
                <span className="font-mono font-bold text-gray-900">{productsInSelectedGroup.length}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <ShoppingCart size={11} className="text-blue-600" />
                  <span>Cart Styles in Group:</span>
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {cartItemsInSelectedGroup.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600 mt-1">
                <span>Dynamic Sizes:</span>
                <span className="font-mono font-bold text-gray-800">{dynamicSizes.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: Ratio Form Matrix */}
        <div className="p-4">
          {dynamicSizes.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">
              No size variants found for the selected group &quot;{selectedGroup}&quot;.
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-1.5 text-gray-700">
                  <span className="font-semibold">Dynamic Sizes Extracted:</span>
                  <div className="flex flex-wrap gap-1">
                    {dynamicSizes.map(sz => (
                      <span
                        key={sz}
                        className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono text-[11px] font-bold text-gray-800"
                      >
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 italic">
                  * All size input boxes are generated dynamically from catalogue rows.
                </div>
              </div>

              {/* Dynamic Matrix Table */}
              <div className="border border-gray-300 rounded overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-300 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-gray-200 w-24 font-bold">Grade</th>
                      {dynamicSizes.map(sz => (
                        <th
                          key={sz}
                          className="py-2.5 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-800 min-w-[70px]"
                        >
                          Size {sz}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 border-r border-gray-200 text-center font-bold w-24">Total Units</th>
                      <th className="py-2.5 px-3 text-center font-bold w-36">Ratio String</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {GRADES.map((grade, gIdx) => {
                      const gradeColors = {
                        A: 'bg-emerald-50/40 text-emerald-900 border-emerald-300 font-bold',
                        B: 'bg-blue-50/40 text-blue-900 border-blue-300 font-bold',
                        C: 'bg-amber-50/40 text-amber-900 border-amber-300 font-bold',
                        D: 'bg-rose-50/40 text-rose-900 border-rose-300 font-bold'
                      };

                      const totalUnits = getGradeTotal(grade);
                      const ratioStr = getGradeRatioString(grade);

                      return (
                        <tr
                          key={grade}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            gIdx % 2 === 1 ? 'bg-gray-50/20' : 'bg-white'
                          }`}
                        >
                          {/* Grade Label */}
                          <td className="py-2.5 px-3 border-r border-gray-200 font-bold whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded border text-xs ${gradeColors[grade]}`}
                              >
                                GRADE {grade}
                              </span>
                              {cartStylesByGrade[grade]?.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                  <ShoppingCart size={10} />
                                  <span>{cartStylesByGrade[grade].length} Cart Style{cartStylesByGrade[grade].length > 1 ? 's' : ''}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">0 in Cart</span>
                              )}
                            </div>
                          </td>

                          {/* Dynamic Size Inputs */}
                          {dynamicSizes.map(sz => {
                            const val = gradeRatioMatrix[grade]?.[sz] ?? 0;
                            return (
                              <td
                                key={sz}
                                className="py-2 px-2 border-r border-gray-200 text-center"
                              >
                                <div className="flex items-center justify-center space-x-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    value={val}
                                    onChange={(e) =>
                                      handleRatioInputChange(grade, sz, e.target.value)
                                    }
                                    className="w-14 text-center py-1 px-1 bg-white border border-gray-300 rounded font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    aria-label={`Grade ${grade} size ${sz} ratio`}
                                  />
                                </div>
                              </td>
                            );
                          })}

                          {/* Row Total Units */}
                          <td className="py-2 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-800 whitespace-nowrap">
                            {totalUnits}
                          </td>

                          {/* Ratio String */}
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-600 whitespace-nowrap bg-gray-50/50">
                            {ratioStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cart ↔ Ratio Alignment Table */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                  <div className="flex items-center space-x-1.5">
                    <ShoppingCart size={14} className="text-gray-700" />
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Cart Assortment Impact &bull; Size Ratio Breakdown ({cartItemsInSelectedGroup.length} Styles in this Group)
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Ratio curves above define the pre-pack size breakdown for these cart items
                  </span>
                </div>

                {cartItemsInSelectedGroup.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-3 text-center text-xs text-gray-500">
                    No products currently in the Cart belong to this group (<span className="font-mono font-bold text-gray-700">{selectedGroup}</span>).
                    You can still configure ratios for this group, or add matching styles from the Catalogue.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-800">
                      <thead className="bg-gray-100 text-gray-700 border-b border-gray-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 border-r w-28">Style Code</th>
                          <th className="py-2 px-3 border-r">Product Name</th>
                          <th className="py-2 px-3 border-r w-24 text-center">Cart Grade</th>
                          <th className="py-2 px-3 border-r">Pack Ratio Curve (from matrix)</th>
                          <th className="py-2 px-3 text-center w-28">Pack Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cartItemsInSelectedGroup.map(item => {
                          const gradeRatio = gradeRatioMatrix[item.grade] || {};
                          const ratioCurve = dynamicSizes
                            .map(sz => `${sz}: ${gradeRatio[sz] ?? 0}`)
                            .join(' | ');
                          const totalUnits = getGradeTotal(item.grade);
                          return (
                            <tr key={item.id} className="hover:bg-blue-50/30">
                              <td className="py-2 px-3 border-r font-mono font-semibold text-gray-900">
                                {item.product.styleCode}
                              </td>
                              <td className="py-2 px-3 border-r font-medium text-gray-900">
                                {item.product.styleName}
                              </td>
                              <td className="py-2 px-3 border-r text-center whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded font-bold font-mono border text-[11px] bg-blue-50 border-blue-200 text-blue-800">
                                  Grade {item.grade}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-r font-mono text-[11px]">
                                {totalUnits > 0 ? (
                                  <span className="text-gray-800 font-medium">{ratioCurve}</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold italic">
                                    No ratio entered yet (0:0:0)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold whitespace-nowrap">
                                {totalUnits > 0 ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {totalUnits} units/pack
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 7: [Set Ratio] Button & State Indicator */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Group Key:</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-mono font-bold border border-gray-200">
                    {currentStorageKey}
                  </code>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveRatioClick}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors shadow-sm"
                  >
                    <Save size={14} />
                    <span>[Set Ratio]</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registry of All Saved Ratios */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Saved Ratios Registry
            </span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 font-mono text-xs font-bold rounded-full">
              {Object.keys(savedRatios).length} Configured
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="View formatted JSON payload matching the enterprise retail schema"
            >
              <Code size={13} />
              <span>View Standard JSON Payload</span>
            </button>
            <span className="text-[11px] text-gray-500">
              Grade-wise configuration active
            </span>
          </div>
        </div>

        {Object.keys(savedRatios).length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-xs">
            No ratios configured yet. Select a Group above and click <strong>[Set Ratio]</strong> to save grade-wise proportions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead className="bg-gray-100 text-gray-700 border-b border-gray-300 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-gray-200 w-48">Group Key</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Grade A Ratio</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Grade B Ratio</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Grade C Ratio</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Grade D Ratio</th>
                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(savedRatios).map(([key, gradesConfig], idx) => {
                  const [dim, grp] = key.split(':');

                  const formatCompactRatio = (gradeObj) => {
                    if (!gradeObj || Object.keys(gradeObj).length === 0) return <span className="text-gray-400">Empty</span>;
                    return (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(gradeObj).map(([sz, val]) => (
                          <span
                            key={sz}
                            className={`px-1 py-0.2 rounded border text-[10px] font-mono ${
                              val > 0
                                ? 'bg-gray-100 border-gray-300 text-gray-900 font-bold'
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                            }`}
                          >
                            {sz}:{val}
                          </span>
                        ))}
                      </div>
                    );
                  };

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-gray-50 transition-colors ${
                        idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-3 border-r border-gray-200 font-mono font-bold text-blue-900 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (dim && grp) {
                              setSelectedGroupBy(dim);
                              setSelectedGroup(grp);
                            }
                          }}
                          className="hover:underline text-left"
                          title="Click to load this group into the editor"
                        >
                          {key}
                        </button>
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200">{formatCompactRatio(gradesConfig.A)}</td>
                      <td className="py-2 px-3 border-r border-gray-200">{formatCompactRatio(gradesConfig.B)}</td>
                      <td className="py-2 px-3 border-r border-gray-200">{formatCompactRatio(gradesConfig.C)}</td>
                      <td className="py-2 px-3 border-r border-gray-200">{formatCompactRatio(gradesConfig.D)}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteRatio(key)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete saved ratio"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standard JSON Payload Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code size={16} className="text-gray-700" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Standard Retail Ratio JSON Payload
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-800 font-bold text-base leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Schema: <code>title</code>, <code>attribute_data[]</code>, <code>size[]</code>, <code>grade</code></span>
                <button
                  type="button"
                  onClick={() => {
                    const jsonStr = JSON.stringify(formatRatiosToStandardJson(savedRatios), null, 2);
                    navigator.clipboard.writeText(jsonStr);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Copy size={12} />
                  <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto max-h-[55vh]">
                {JSON.stringify(formatRatiosToStandardJson(savedRatios), null, 2)}
              </pre>
            </div>

            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
