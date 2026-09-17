import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Upload from './components/Upload';
import ProductTable from './components/ProductTable';
import Cart from './components/Cart';
import RatioConfigurator from './components/RatioConfigurator';

// Local storage keys
const STORAGE_KEYS = {
  CATALOGUE: 'intrakraft_merch_catalogue',
  CART: 'intrakraft_merch_cart',
  RATIOS: 'intrakraft_merch_ratios',
};

/**
 * Main Enterprise Application Container
 * Handles:
 * - Persistent state management (LocalStorage)
 * - Module navigation (Catalogue, Cart, Ratio Configurator)
 * - End-to-end data flow from xlsx upload to ratio formulation
 */
export default function App() {
  // 1. Grouped Catalogue State (Persisted)
  const [catalogue, setCatalogue] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATALOGUE);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load catalogue from localStorage', e);
      return [];
    }
  });

  // 2. Merchandising Cart State (Persisted across refreshes)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      return [];
    }
  });

  // 3. Grade Ratio Management State (Persisted across refreshes)
  const [ratios, setRatios] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATIOS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load ratios from localStorage', e);
      return {};
    }
  });

  // Active module tab
  const [activeTab, setActiveTab] = useState('catalogue');

  // Global Toast / System Alert
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATALOGUE, JSON.stringify(catalogue));
    } catch (e) {
      console.error('Error saving catalogue to localStorage', e);
    }
  }, [catalogue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RATIOS, JSON.stringify(ratios));
    } catch (e) {
      console.error('Error saving ratios to localStorage', e);
    }
  }, [ratios]);

  // STEP 1 & 2 HANDLER: Ingest parsed & grouped catalogue
  const handleCatalogueLoaded = (groupedProducts, rawRows) => {
    setCatalogue(groupedProducts);
    showToast(
      `Successfully loaded ${groupedProducts.length} styles (${rawRows.length} variant rows).`,
      'success'
    );
  };

  // STEP 3 & 4 HANDLER: Add product with selected grade to cart
  const handleAddToCart = (product, grade) => {
    // Check if identical product with identical grade is already in the Cart
    const alreadyExists = cart.some(
      item => item.product.styleCode === product.styleCode && item.grade === grade
    );

    if (alreadyExists) {
      showToast(`${product.styleName} (${product.styleCode}) with Grade ${grade} is already in the Cart`, 'info');
      return;
    }

    const newItem = {
      id: `${product.styleCode}-${grade}`,
      product,
      grade,
      addedAt: new Date().toISOString()
    };

    setCart(prev => [newItem, ...prev]);
    showToast(`Added ${product.styleName} (${product.styleCode}) [Grade ${grade}] to Cart`, 'success');
  };

  // CART HANDLER: Remove single item
  const handleRemoveFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    showToast('Item removed from cart', 'info');
  };

  // CART HANDLER: Clear entire cart
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items in the Merchandising Cart?')) {
      setCart([]);
      showToast('Cart cleared', 'info');
    }
  };

  // STEP 7 HANDLER: Save grade ratio for group
  const handleSaveRatio = (storageKey, gradeRatioMatrix) => {
    setRatios(prev => ({
      ...prev,
      [storageKey]: gradeRatioMatrix
    }));
    showToast(`Saved Grade Ratios for ${storageKey}`, 'success');
  };

  // Delete saved ratio
  const handleDeleteRatio = (storageKey) => {
    if (window.confirm(`Delete ratio configuration for ${storageKey}?`)) {
      setRatios(prev => {
        const copy = { ...prev };
        delete copy[storageKey];
        return copy;
      });
      showToast(`Removed ratio configuration for ${storageKey}`, 'info');
    }
  };

  // Master reset
  const handleResetAll = () => {
    if (window.confirm('Warning: This will clear all uploaded catalogue data, cart items, and configured ratios. Continue?')) {
      localStorage.removeItem(STORAGE_KEYS.CATALOGUE);
      localStorage.removeItem(STORAGE_KEYS.CART);
      localStorage.removeItem(STORAGE_KEYS.RATIOS);
      setCatalogue([]);
      setCart([]);
      setRatios({});
      showToast('All application data reset to initial state', 'info');
    }
  };

  // Total variants across active catalogue
  const totalVariantsCount = catalogue.reduce(
    (sum, p) => sum + (Array.isArray(p.sizes) ? p.sizes.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Enterprise System Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        catalogueCount={catalogue.length}
        cartCount={cart.length}
        ratiosCount={Object.keys(ratios).length}
        onResetAll={handleResetAll}
      />

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded shadow-lg border border-slate-700 flex items-center space-x-2 animate-fade-in">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto space-y-4">
        {/* Module 1: Catalogue Ingestion & Product Table */}
        {activeTab === 'catalogue' && (
          <div className="space-y-4">
            <Upload
              onCatalogueLoaded={handleCatalogueLoaded}
              isLoaded={catalogue.length > 0}
              currentStats={{
                stylesCount: catalogue.length,
                variantsCount: totalVariantsCount
              }}
            />

            <ProductTable
              products={catalogue}
              onAddToCart={handleAddToCart}
              cartItems={cart}
            />
          </div>
        )}

        {/* Module 2: Cart Section */}
        {activeTab === 'cart' && (
          <div>
            <Cart
              cartItems={cart}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onNavigateToRatios={() => setActiveTab('ratios')}
            />
          </div>
        )}

        {/* Module 3: Grade-Wise Ratio Configurator */}
        {activeTab === 'ratios' && (
          <div>
            <RatioConfigurator
              products={catalogue}
              cartItems={cart}
              savedRatios={ratios}
              onSaveRatio={handleSaveRatio}
              onDeleteRatio={handleDeleteRatio}
            />
          </div>
        )}
      </main>

      {/* Enterprise ERP Footer */}
      <footer className="bg-white border-t border-gray-300 py-2 px-4 text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span>IntraKraft Retail Suite &bull; Inventory &amp; Assortment Engine</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Active Catalogue: <strong>{catalogue.length}</strong> styles</span>
          <span>&bull;</span>
          <span>Cart: <strong>{cart.length}</strong> items</span>
          <span>&bull;</span>
          <span>Saved Ratios: <strong>{Object.keys(ratios).length}</strong></span>
        </div>
      </footer>
    </div>
  );
}
