# Retail Merchandising: Catalogue Upload, Product Cart & Grade-Wise Ratio Management

An enterprise retail merchandising and assortment planning application built with **React**, **Vite**, **Tailwind CSS**, and **SheetJS (`xlsx`)**. Designed with a high-density, functional SAP / Oracle Retail ERP interface for apparel inventory planners.

---

## 1. Setup & Run Instructions

### Prerequisites
- **Node.js**: v18.0.0 or later (Node v20+ recommended)
- **npm**: v9.0.0 or later

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/rakshitabh/IntraKraft.git
   cd IntraKraft
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```

### Running Locally (Development Mode)
Start the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173/
```

### Production Build
To create a production-ready bundle and preview it:
```bash
npm run build
npm run preview
```

---

## 2. Approach Used for Grade-Wise Ratio Management

In apparel retail merchandising, inventory procurement follows a structured two-step process: **Assortment Selection** (Cart) and **Size Breakdown Optimization** (Ratios).

### A. The Commercial Meaning of Store "Grades"
Retail store networks are classified into tiers or **Grades** (`A`, `B`, `C`, `D`):
- **Grade A**: High-traffic metro and flagship stores with large square footage and highest sales velocity.
- **Grade B**: Standard high-street retail stores.
- **Grade C**: Tier-2 / regional stores with smaller shelf space and lower footfall.
- **Grade D**: Outlet / clearance centers.

### B. What is a "Size Ratio" vs. Cart Items?
A common misconception is that ratio numbers represent total unit quantities. In retail manufacturing:
- **The Cart** defines **WHICH styles to buy** and assigns their **store grade** (e.g. *Style 133739801 is designated for Grade A stores*).
- **The Ratio Matrix** defines the **proportional packaging curve (pre-pack ratio)** for each carton or bundle.
- **Example**: A Grade A ratio of `S:1, M:2, L:2, XL:1` has a pack size of 6 units ($1 + 2 + 2 + 1 = 6$). If a buyer orders 100 packs (600 units) of this style, the factory packages:
  - Small: $100 \times 1 = 100$ units
  - Medium: $100 \times 2 = 200$ units
  - Large: $100 \times 2 = 200$ units
  - Extra Large: $100 \times 1 = 100$ units

### C. Dynamic Size Extraction (Never Hardcoded)
Different merchandise bricks use completely different sizing dimensions:
- **Trousers**: Waist numbers (`28`, `30`, `32`, `34`, `36`)
- **T-Shirts**: Alpha sizes (`S`, `M`, `L`, `XL`, `XXL`)
- **Kids Apparel**: Age brackets (`4-5Y`, `5-6Y`, `7-8Y`, `9-10Y`, `11-12Y`, `13-14Y`)
- **Formal Shirts**: Collar sizes (`38`, `40`, `42`, `44`)

The ratio engine dynamically inspects the products belonging to the selected group (e.g., `Brick: Dresses` or `Brick + Neck: T-shirts-Round Neck`) and generates input boxes **only for the exact sizes discovered in those styles**.

### D. Group By Multi-Level Dimensions
Ratios can be configured at multiple attribute levels dynamically generated from the catalogue:
- `Brick` (e.g., *Dresses*, *Trousers*, *T-shirts*)
- `Category` (e.g., *Top Wear*, *Bottom Wear*, *Kids Wear*)
- `Brick + Neck` (e.g., *T-shirts-Round Neck*, *T-shirts-V Neck*)
- `Brick + Sleeve` (e.g., *Shirts-Full Sleeve*, *Shirts-Half Sleeve*)

### E. Strong Cart ↔ Ratio Visual Alignment
The Ratio Configuration module provides:
1. **Cart Assortment Context**: Displays how many styles currently in the Cart belong to the active group.
2. **Grade Row Badges**: Flags which Grade rows in the matrix have active styles in the Cart.
3. **Cart Assortment Pack Ratio Breakdown Table**: A live table beneath the matrix showing each cart item, its assigned grade, and the active size ratio curve applied to it.

### F. Standard Enterprise JSON Payload
Saved ratios can be previewed or copied in the industry-standard retail schema:
```json
[
  {
    "title": "Dresses",
    "attribute_data": [
      { "key": "Brick", "value": "Dresses" }
    ],
    "size": [
      { "size": "4-5Y", "value": 1 },
      { "size": "5-6Y", "value": 2 },
      { "size": "7-8Y", "value": 2 },
      { "size": "9-10Y", "value": 1 }
    ],
    "grade": "A"
  }
]
```

---

## 3. Key Functional Highlights

1. **Excel Spreadsheet Ingestion**:
   - Parses `.xlsx` workbooks via `xlsx` (SheetJS).
   - Normalizes common header variations (`Style_Code`, `Vendor_Article_Number`, `Standard_Size`, `Size`).
   - Includes a **"Download Sample .xlsx"** utility and **"Load Sample Dataset"** for instant demonstration.
2. **Variant Consolidation**:
   - Groups individual size rows sharing the same `Style_Code` into a unified multi-size product record.
   - Sorter ensures canonical sizing order (`XXS` to `5XL`, or numeric waists).
3. **Deduplicated Merchandising Cart**:
   - Per-row grade assignment (`A`, `B`, `C`, `D`).
   - Prevents identical duplicate entries of `(StyleCode, Grade)`.
4. **Pure Client-Side State**:
   - No backend or external database required; zero telemetry or tracking.
