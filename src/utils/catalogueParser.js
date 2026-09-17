import * as XLSX from 'xlsx';

/**
 * Normalizes Excel row keys to standard camelCase properties.
 * Handles common variations in retail merchandising spreadsheets.
 */
function normalizeRowKeys(rawRow) {
  const normalized = {};
  for (const [key, value] of Object.entries(rawRow)) {
    if (!key) continue;
    const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    normalized[cleanKey] = value !== undefined && value !== null ? String(value).trim() : '';
  }

  // Map to standardized properties
  const styleCode =
    normalized['stylecode'] ||
    normalized['styleid'] ||
    normalized['vendorarticlenumber'] ||
    normalized['articlenumber'] ||
    normalized['itemcode'] ||
    normalized['style'] ||
    '';

  const styleName =
    normalized['stylename'] ||
    normalized['productname'] ||
    normalized['name'] ||
    normalized['description'] ||
    normalized['itemname'] ||
    (styleCode ? `Style ${styleCode}` : 'Unnamed Product');

  const brandName =
    normalized['brandname'] ||
    normalized['brand'] ||
    normalized['branddesc'] ||
    'Generic Brand';

  const brick =
    normalized['brick'] ||
    normalized['brickname'] ||
    normalized['subcategory'] ||
    normalized['producttype'] ||
    'General Apparel';

  const category =
    normalized['category'] ||
    normalized['categoryname'] ||
    normalized['department'] ||
    'Apparel';

  const neck =
    normalized['neck'] ||
    normalized['neckline'] ||
    normalized['necktype'] ||
    'Regular';

  const sleeve =
    normalized['sleeve'] ||
    normalized['sleevetype'] ||
    normalized['sleevelength'] ||
    'Regular';

  const size =
    normalized['size'] ||
    normalized['standardsize'] ||
    normalized['stdsize'] ||
    normalized['variantsize'] ||
    normalized['sizes'] ||
    normalized['sizecode'] ||
    normalized['sizename'] ||
    normalized['variant'] ||
    '';

  const grade =
    normalized['grade'] ||
    normalized['productgrade'] ||
    'A';

  return {
    styleCode,
    styleName,
    brandName,
    brick,
    category,
    neck,
    sleeve,
    size,
    grade
  };
}

/**
 * Standard apparel size order for canonical sorting in retail tables.
 */
const CANONICAL_SIZE_ORDER = [
  'XXS', '2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL',
  '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
  '0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '13-14Y'
];

/**
 * Sorts an array of sizes canonically or numerically.
 */
export function sortSizes(sizes) {
  return [...new Set(sizes)].sort((a, b) => {
    const normA = String(a).trim().toUpperCase();
    const normB = String(b).trim().toUpperCase();

    const indexA = CANONICAL_SIZE_ORDER.indexOf(normA);
    const indexB = CANONICAL_SIZE_ORDER.indexOf(normB);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Check if numeric
    const numA = parseFloat(normA);
    const numB = parseFloat(normB);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

    return normA.localeCompare(normB);
  });
}

/**
 * STEP 1: Parse Excel file (.xlsx or .xls) using the xlsx library.
 * Reads first worksheet and converts rows to array of normalized row objects.
 *
 * @param {ArrayBuffer|Uint8Array} fileBuffer
 * @returns {Array<Object>} raw normalized rows
 */
export function parseExcelWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error(`Unable to read sheet "${firstSheetName}".`);
  }

  // Convert sheet to JSON array
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (!rawData || rawData.length === 0) {
    throw new Error('The first worksheet appears to be empty or contains no data rows.');
  }

  // Normalize rows
  const normalizedRows = rawData
    .map(normalizeRowKeys)
    .filter(row => row.styleCode && row.size);

  if (normalizedRows.length === 0) {
    throw new Error(
      'No valid product variant rows found. Please ensure your Excel file contains "Style_Code" (or Style Code) and "Size" columns.'
    );
  }

  return normalizedRows;
}

/**
 * STEP 2: Group flat variant rows by Style_Code.
 * Aggregates all sizes into an array and combines style metadata.
 *
 * @param {Array<Object>} rows Normalized flat variant rows
 * @returns {Array<Object>} Array of grouped products
 */
export function groupProductsByStyleCode(rows) {
  const groupedMap = new Map();

  for (const row of rows) {
    const code = String(row.styleCode).trim();
    if (!code) continue;

    if (!groupedMap.has(code)) {
      groupedMap.set(code, {
        styleCode: code,
        styleName: row.styleName || `Style ${code}`,
        brandName: row.brandName || 'Brand',
        brick: row.brick || 'General',
        category: row.category || 'Apparel',
        neck: row.neck || 'Regular',
        sleeve: row.sleeve || 'Regular',
        sizes: []
      });
    }

    const product = groupedMap.get(code);

    // Keep richer descriptions if later rows provide them
    if (row.styleName && (!product.styleName || product.styleName.startsWith('Style '))) {
      product.styleName = row.styleName;
    }
    if (row.brandName && (!product.brandName || product.brandName === 'Generic Brand')) {
      product.brandName = row.brandName;
    }
    if (row.brick && product.brick === 'General') {
      product.brick = row.brick;
    }
    if (row.category && product.category === 'Apparel') {
      product.category = row.category;
    }
    if (row.neck && product.neck === 'Regular') {
      product.neck = row.neck;
    }
    if (row.sleeve && product.sleeve === 'Regular') {
      product.sleeve = row.sleeve;
    }

    if (row.size) {
      product.sizes.push(String(row.size).trim());
    }
  }

  // Canonical sort of sizes for each grouped product
  const groupedList = Array.from(groupedMap.values()).map(product => ({
    ...product,
    sizes: sortSizes(product.sizes)
  }));

  return groupedList;
}

/**
 * Generates sample realistic retail apparel rows for demonstration & testing.
 * Demonstrates:
 * - Brick: Shirts, Trousers, T-Shirts, Trackpants, Dresses
 * - Category: Top Wear, Bottom Wear
 * - Neck: Round Neck, V Neck, Polo, Mandarin Collar
 * - Sleeve: Full Sleeve, Half Sleeve, Sleeveless
 * - Mixed size systems: Alpha (S, M, L, XL), Waist (28, 30, 32, 34), Kids (4-5Y, 5-6Y)
 */
export function getSampleCatalogueRows() {
  return [
    // T-Shirts: Brick=T-Shirts, Category=Top Wear, Neck=Round Neck, Sleeve=Half Sleeve
    { Style_Code: '133739801', Style_Name: 'Essential Crew Tee', Brand: 'Allen Solly', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: 'S' },
    { Style_Code: '133739801', Style_Name: 'Essential Crew Tee', Brand: 'Allen Solly', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: 'M' },
    { Style_Code: '133739801', Style_Name: 'Essential Crew Tee', Brand: 'Allen Solly', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: 'L' },
    { Style_Code: '133739801', Style_Name: 'Essential Crew Tee', Brand: 'Allen Solly', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: 'XL' },

    // T-Shirts: Brick=T-Shirts, Category=Top Wear, Neck=V Neck, Sleeve=Half Sleeve
    { Style_Code: '133739802', Style_Name: 'Athletic V-Neck Tee', Brand: 'Puma', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Half Sleeve', Size: 'S' },
    { Style_Code: '133739802', Style_Name: 'Athletic V-Neck Tee', Brand: 'Puma', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Half Sleeve', Size: 'M' },
    { Style_Code: '133739802', Style_Name: 'Athletic V-Neck Tee', Brand: 'Puma', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Half Sleeve', Size: 'L' },
    { Style_Code: '133739802', Style_Name: 'Athletic V-Neck Tee', Brand: 'Puma', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Half Sleeve', Size: 'XL' },
    { Style_Code: '133739802', Style_Name: 'Athletic V-Neck Tee', Brand: 'Puma', Brick: 'T-Shirts', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Half Sleeve', Size: 'XXL' },

    // Shirts: Brick=Shirts, Category=Top Wear, Neck=Spread Collar, Sleeve=Full Sleeve
    { Style_Code: '204918201', Style_Name: 'Oxford Formal Shirt', Brand: 'Louis Philippe', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Spread Collar', Sleeve: 'Full Sleeve', Size: '38' },
    { Style_Code: '204918201', Style_Name: 'Oxford Formal Shirt', Brand: 'Louis Philippe', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Spread Collar', Sleeve: 'Full Sleeve', Size: '40' },
    { Style_Code: '204918201', Style_Name: 'Oxford Formal Shirt', Brand: 'Louis Philippe', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Spread Collar', Sleeve: 'Full Sleeve', Size: '42' },
    { Style_Code: '204918201', Style_Name: 'Oxford Formal Shirt', Brand: 'Louis Philippe', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Spread Collar', Sleeve: 'Full Sleeve', Size: '44' },

    // Shirts: Brick=Shirts, Category=Top Wear, Neck=Mandarin Collar, Sleeve=Half Sleeve
    { Style_Code: '204918202', Style_Name: 'Linen Casual Shirt', Brand: 'Van Heusen', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Mandarin Collar', Sleeve: 'Half Sleeve', Size: 'S' },
    { Style_Code: '204918202', Style_Name: 'Linen Casual Shirt', Brand: 'Van Heusen', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Mandarin Collar', Sleeve: 'Half Sleeve', Size: 'M' },
    { Style_Code: '204918202', Style_Name: 'Linen Casual Shirt', Brand: 'Van Heusen', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Mandarin Collar', Sleeve: 'Half Sleeve', Size: 'L' },
    { Style_Code: '204918202', Style_Name: 'Linen Casual Shirt', Brand: 'Van Heusen', Brick: 'Shirts', Category: 'Top Wear', Neck: 'Mandarin Collar', Sleeve: 'Half Sleeve', Size: 'XL' },

    // Trousers: Brick=Trousers, Category=Bottom Wear, Neck=NA, Sleeve=NA (numeric waist)
    { Style_Code: '319028301', Style_Name: 'Slim Fit Chinos', Brand: 'Dockers', Brick: 'Trousers', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: '28' },
    { Style_Code: '319028301', Style_Name: 'Slim Fit Chinos', Brand: 'Dockers', Brick: 'Trousers', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: '30' },
    { Style_Code: '319028301', Style_Name: 'Slim Fit Chinos', Brand: 'Dockers', Brick: 'Trousers', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: '32' },
    { Style_Code: '319028301', Style_Name: 'Slim Fit Chinos', Brand: 'Dockers', Brick: 'Trousers', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: '34' },
    { Style_Code: '319028301', Style_Name: 'Slim Fit Chinos', Brand: 'Dockers', Brick: 'Trousers', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: '36' },

    // Trackpants: Brick=Trackpants, Category=Bottom Wear, Neck=None, Sleeve=None
    { Style_Code: '319028302', Style_Name: 'Performance Joggers', Brand: 'Nike', Brick: 'Trackpants', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: 'S' },
    { Style_Code: '319028302', Style_Name: 'Performance Joggers', Brand: 'Nike', Brick: 'Trackpants', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: 'M' },
    { Style_Code: '319028302', Style_Name: 'Performance Joggers', Brand: 'Nike', Brick: 'Trackpants', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: 'L' },
    { Style_Code: '319028302', Style_Name: 'Performance Joggers', Brand: 'Nike', Brick: 'Trackpants', Category: 'Bottom Wear', Neck: 'None', Sleeve: 'None', Size: 'XL' },

    // Dresses: Brick=Dresses, Category=Top Wear, Neck=V Neck, Sleeve=Sleeveless
    { Style_Code: '488219401', Style_Name: 'Floral Summer Dress', Brand: 'Zara', Brick: 'Dresses', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Sleeveless', Size: 'XS' },
    { Style_Code: '488219401', Style_Name: 'Floral Summer Dress', Brand: 'Zara', Brick: 'Dresses', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Sleeveless', Size: 'S' },
    { Style_Code: '488219401', Style_Name: 'Floral Summer Dress', Brand: 'Zara', Brick: 'Dresses', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Sleeveless', Size: 'M' },
    { Style_Code: '488219401', Style_Name: 'Floral Summer Dress', Brand: 'Zara', Brick: 'Dresses', Category: 'Top Wear', Neck: 'V Neck', Sleeve: 'Sleeveless', Size: 'L' },
    // Kids Dresses: Brick=Dresses, Category=Kids Wear, Sizes: 4-5Y, 5-6Y, 7-8Y, 9-10Y, 11-12Y, 13-14Y
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '4-5Y' },
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '5-6Y' },
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '7-8Y' },
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '9-10Y' },
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '11-12Y' },
    { Style_Code: '588390001', Style_Name: 'Girls Party Dress', Brand: 'H&M Kids', Brick: 'Dresses', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Short Sleeve', Size: '13-14Y' },

    // Kids Jeans and Jeggings: Brick=Jeans and Jeggings, Category=Kids Wear
    { Style_Code: '588390002', Style_Name: 'Stretch Denim Jeggings', Brand: 'GAP Kids', Brick: 'Jeans and Jeggings', Category: 'Kids Wear', Neck: 'None', Sleeve: 'None', Size: '5-6Y' },
    { Style_Code: '588390002', Style_Name: 'Stretch Denim Jeggings', Brand: 'GAP Kids', Brick: 'Jeans and Jeggings', Category: 'Kids Wear', Neck: 'None', Sleeve: 'None', Size: '7-8Y' },
    { Style_Code: '588390002', Style_Name: 'Stretch Denim Jeggings', Brand: 'GAP Kids', Brick: 'Jeans and Jeggings', Category: 'Kids Wear', Neck: 'None', Sleeve: 'None', Size: '9-10Y' },
    { Style_Code: '588390002', Style_Name: 'Stretch Denim Jeggings', Brand: 'GAP Kids', Brick: 'Jeans and Jeggings', Category: 'Kids Wear', Neck: 'None', Sleeve: 'None', Size: '11-12Y' },
    { Style_Code: '588390002', Style_Name: 'Stretch Denim Jeggings', Brand: 'GAP Kids', Brick: 'Jeans and Jeggings', Category: 'Kids Wear', Neck: 'None', Sleeve: 'None', Size: '13-14Y' },

    // Kids T-shirts: Brick=T-shirts, Category=Kids Wear
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '4-5Y' },
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '5-6Y' },
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '7-8Y' },
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '9-10Y' },
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '11-12Y' },
    { Style_Code: '588390003', Style_Name: 'Graphic Print Tee', Brand: 'Zara Kids', Brick: 'T-shirts', Category: 'Kids Wear', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Size: '13-14Y' },
  ];
}

/**
 * Creates and triggers download of a real .xlsx sample catalogue file.
 */
export function downloadSampleExcelCatalogue() {
  const sampleRows = getSampleCatalogueRows();
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogue_Data');

  // Trigger browser download
  XLSX.writeFile(workbook, 'Retail_Apparel_Catalogue_Sample.xlsx');
}

/**
 * Converts internal saved ratio map into the standard retail schema array format:
 * [
 *   {
 *     "title": "Dresses",
 *     "attribute_data": [{ "key": "Brick", "value": "Dresses" }],
 *     "size": [
 *       { "size": "4-5Y", "value": 0 },
 *       ...
 *     ],
 *     "grade": "A"
 *   }
 * ]
 */
export function formatRatiosToStandardJson(savedRatios) {
  const result = [];

  for (const [key, gradeConfig] of Object.entries(savedRatios)) {
    const [dimension, groupValue] = key.split(':');
    if (!dimension || !groupValue) continue;

    const attributeData = [];
    if (dimension === 'Brick') {
      attributeData.push({ key: 'Brick', value: groupValue });
    } else if (dimension === 'Category') {
      attributeData.push({ key: 'Category', value: groupValue });
    } else if (dimension === 'Brick + Neck') {
      const parts = groupValue.split('-');
      attributeData.push({ key: 'Brick', value: parts[0] || groupValue });
      attributeData.push({ key: 'Neck', value: parts[1] || 'Regular' });
    } else if (dimension === 'Brick + Sleeve') {
      const parts = groupValue.split('-');
      attributeData.push({ key: 'Brick', value: parts[0] || groupValue });
      attributeData.push({ key: 'Sleeve', value: parts[1] || 'Regular' });
    } else {
      attributeData.push({ key: dimension, value: groupValue });
    }

    // Sort grades A, B, C, D
    const sortedGrades = Object.keys(gradeConfig).sort();

    for (const grade of sortedGrades) {
      const sizesMap = gradeConfig[grade] || {};
      const sortedSizeKeys = sortSizes(Object.keys(sizesMap));

      const sizeList = sortedSizeKeys.map(sizeName => ({
        size: sizeName,
        value: Number(sizesMap[sizeName]) || 0
      }));

      result.push({
        title: groupValue,
        attribute_data: attributeData,
        size: sizeList,
        grade
      });
    }
  }

  return result;
}
