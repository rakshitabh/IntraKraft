# IntraKraft Assignment
## Catalogue Upload, Product Cart & Grade-wise Ratio Management

An enterprise retail merchandising and assortment planning application designed for retail inventory planners. Built with a high-density, functional SAP / Oracle Retail ERP design aesthetic, the application provides an end-to-end client-side workflow for spreadsheet ingestion, variant consolidation, assortment curation, and dynamic grade-wise size pack ratio configuration.

---

## Project Overview

In fashion and apparel merchandising, vendor catalogues are distributed as flat tabular spreadsheets where each row corresponds to an individual SKU / size variant. Merchandising planners, however, make purchasing decisions at the master product (Style) level, determine store-tier allocations (Grades A, B, C, D), and define proportional size distribution curves (Ratios) for warehouse pre-packs.

This application provides a zero-backend, high-performance web interface that allows retail planners to:
1. Upload and parse Excel catalogues (`.xlsx` / `.xls`) directly in the browser.
2. Automatically consolidate isolated size variant rows into unified, multi-size product entities.
3. Review products in an ERP-styled data table, assign store Grades, and curate a Merchandising Cart without duplicates.
4. Dynamically configure grade-differentiated size ratios at multiple merchandise hierarchy levels (Brick, Category, Brick + Neck, Brick + Sleeve).
5. Preview and export the resulting configurations in industry-standard retail JSON schemas.

---

## Features

- **Enterprise Data Ingestion (`Upload.jsx`)**:
  - Drag-and-drop and file-picker support for Excel files (`.xlsx`, `.xls`).
  - SheetJS-powered parsing of the first worksheet with zero server roundtrips.
  - Robust header normalization handling real-world variations (`Style_Code`, `Vendor_Article_Number`, `Standard_Size`, `Size`, etc.).
  - Built-in "Download Sample .xlsx" generator and "Load Sample Dataset" for instant testing.

- **Automated Variant Consolidation**:
  - Automatically identifies and consolidates multiple variant rows sharing the same `Style_Code`.
  - Canonical apparel size sorting (`XXS` to `5XL`, numeric waist sizes `28`–`44`, and kids age brackets `4-5Y`–`13-14Y`).

- **Interactive Product Catalogue Grid (`ProductTable.jsx`)**:
  - Compact table view with instantaneous multi-attribute search (code, name, brand, brick).
  - Visual size variant tags for rapid breadth inspection.
  - Per-row Grade selector (`A`, `B`, `C`, `D`) and contextual `Add To Cart` action with live duplicate detection.

- **Curated Merchandising Cart (`Cart.jsx`)**:
  - Tabular summary of selected procurement assortment lines.
  - Displays assigned Grade badges, style codes, product names, and available sizes.
  - Enforces item deduplication and provides individual removal as well as full cart clearance.

- **Dynamic Grade-Wise Ratio Configurator (`RatioConfigurator.jsx`)**:
  - Multi-level grouping selector (`Brick`, `Category`, `Brick + Neck`, `Brick + Sleeve`).
  - **100% Dynamic Size Discovery**: Sizes are never hardcoded; input columns are derived dynamically from the styles within the selected group.
  - Matrix configuration for Grades A, B, C, and D with live unit sum counters and ratio string previews (`1 : 2 : 1 : 1`).
  - **Cart ↔ Ratio Live Alignment**: Shows which styles in the cart belong to the active group, their assigned grades, and the exact ratio curve applied to each.
  - Saved Ratios Registry with edit, delete, and standard retail JSON export with 1-click clipboard copy.

- **Enterprise Aesthetic & Usability**:
  - Clean white canvas, light gray borders, compact typography, and subtle functional color indicators.
  - Strict absence of glassmorphism, marketing heroes, floating cards, or non-essential animations.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Framework** | React 19 (Vite 8) | High-performance component architecture and fast HMR |
| **Styling** | Tailwind CSS 3.4 & PostCSS | Enterprise ERP layout, compact tables, and custom scrollbars |
| **Excel Parser** | SheetJS (`xlsx` v0.18.5) | Client-side workbook binary reading and JSON conversion |
| **Icons** | Lucide React | Clean, functional enterprise UI iconography |
| **State Management** | React Hooks (`useState`, `useMemo`, `useEffect`) | Zero-backend client-side state handling |

---

## Setup & Run Instructions

### Prerequisites
- **Node.js**: `v18.0.0` or later (tested on `v20.x` and `v24.x`)
- **npm**: `v9.0.0` or later

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/rakshitabh/IntraKraft.git
   cd IntraKraft
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Run Application
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173/
```

### Production Build
To create an optimized production bundle and preview it locally:
```bash
npm run build
npm run preview
```

---

## Grade-wise Ratio Approach

In apparel merchandising, setting size ratios is the bridge between **what styles are selected** and **how inventory is pre-packed for store distribution**.

### Product Selection & Cart
The master catalogue contains all candidate styles available from vendors. The merchandise planner evaluates the catalogue and selects a subset of styles into the **Cart**. The Cart represents the approved procurement commitment for the season. Duplicate entries for the exact same `(StyleCode, Grade)` are prevented.

### Grade Assignment
Retail store networks are clustered into **Grades** based on footfall, floor area, and sales velocity:
- **Grade A**: Top-tier metro / flagship stores with high inventory capacity.
- **Grade B**: Standard high-street locations.
- **Grade C**: Tier-2 / regional stores with limited shelf space.
- **Grade D**: Outlet / clearance centers.

The planner assigns a Grade to each product directly in the catalogue table prior to adding it to the Cart. This tags the item with the target store tier.

### Ratio Configuration
A **Ratio** is **not** an absolute production quantity; it is the **proportional pre-pack curve** per carton or manufacturing bundle:
- If Grade A has ratio `S:1, M:2, L:2, XL:1`, each pre-pack carton contains 6 units.
- Ordering 100 cartons of a Grade A style automatically generates:
  - 100 Small, 200 Medium, 200 Large, 100 Extra Large.
- The Ratio Configurator provides a unified matrix for Grades A, B, C, and D, with real-time total pack unit calculations and ratio string summaries.

### Dynamic Size Handling
Sizes are **never hardcoded**. Different merchandise lines have fundamentally different sizing schemes:
- **Trousers**: Numeric waist sizes (`28`, `30`, `32`, `34`, `36`)
- **T-Shirts**: Alpha sizes (`S`, `M`, `L`, `XL`, `XXL`)
- **Kids Wear**: Age brackets (`4-5Y`, `5-6Y`, `7-8Y`, `9-10Y`, `11-12Y`, `13-14Y`)
- **Shirts**: Collar sizes (`38`, `40`, `42`, `44`)

When a user selects a group (e.g. `Brick = Dresses`), the system extracts the unique union of sizes present in all styles within that group, orders them canonically, and renders corresponding input columns.

### Ratio Levels
Ratios can be set at multiple granularities across the merchandise hierarchy:
1. **Brick**: Broad product types (e.g., *Trousers*, *Shirts*, *Dresses*, *Trackpants*).
2. **Category**: Departmental divisions (e.g., *Top Wear*, *Bottom Wear*, *Kids Wear*).
3. **Brick + Neck**: Styled neckline sub-groups (e.g., *T-shirts-Round Neck*, *T-shirts-V Neck*).
4. **Brick + Sleeve**: Sleeve length sub-groups (e.g., *Shirts-Full Sleeve*, *Shirts-Half Sleeve*).

---

## Project Structure

```
IntraKraft/
├── index.html                     # Application entry HTML with ERP typography
├── package.json                   # Project dependencies and npm scripts
├── vite.config.js                 # Vite build & development server configuration
├── tailwind.config.js             # Tailwind CSS theme extension
├── postcss.config.js              # PostCSS plugins (Tailwind, Autoprefixer)
├── README.md                      # Project documentation and setup guide
└── src/
    ├── main.jsx                   # React application mount point
    ├── index.css                  # Global styles, Tailwind directives & table styling
    ├── App.jsx                    # Root layout, tab navigation, notification system
    ├── components/
    │   ├── Header.jsx             # Top bar with KPI chips and tab switcher
    │   ├── Upload.jsx             # Step 1: Excel workbook dropzone & sample generator
    │   ├── ProductTable.jsx       # Step 2 & 3: Consolidated product grid & grade selector
    │   ├── Cart.jsx               # Step 4: Merchandising Cart with deduplication
    │   └── RatioConfigurator.jsx  # Step 5, 6, 7: Dynamic Group By, Ratio Matrix & Cart Linkage
    └── utils/
        └── catalogueParser.js     # SheetJS workbook parser, normalizer & canonical size sorter
```

---

## Assumptions Made

1. **Workbook Structure**: It is assumed that the primary product data resides on the first worksheet of the uploaded `.xlsx` / `.xls` workbook.
2. **Catalogue Schema**: The file is expected to contain columns identifying the style (`Style_Code`, `Vendor_Article_Number`, etc.) and the variant size (`Size`, `Standard_Size`, etc.). Other attributes (`Style_Name`, `Brand`, `Brick`, `Category`, `Neck`, `Sleeve`) are extracted when available or assigned clean fallbacks.
3. **Client-Side Execution**: In accordance with project requirements, no backend server or database is utilized; all operations run in-memory within React state.
4. **Grade Scope**: Grades are standardized to the four enterprise retail tiers: `A`, `B`, `C`, and `D`.
5. **Ratio Application**: A ratio represents a relative packaging proportion per carton/pack. The product selection in the Cart defines which styles are procured, while the ratio determines how orders for those styles are split into sizes.

---

## Author

**Rakshita Bhat**  
*Email*: [rakshitalbhat07@gmail.com](mailto:rakshitalbhat07@gmail.com)  
*GitHub*: [@rakshitabh](https://github.com/rakshitabh)
