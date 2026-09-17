import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';
import { parseExcelWorkbook, groupProductsByStyleCode, downloadSampleExcelCatalogue, getSampleCatalogueRows } from '../utils/catalogueParser';

/**
 * STEP 1: Excel Catalogue Upload Component
 * - Reads .xlsx / .xls file using the xlsx package
 * - Parses first sheet into JSON rows
 * - Triggers Step 2 grouping by Style_Code
 * - Provides error handling and sample template generation
 */
export default function Upload({ onCatalogueLoaded, isLoaded, currentStats }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Handles raw file processing
  const processSelectedFile = async (file) => {
    if (!file) return;

    setErrorMessage(null);
    setUploadSuccessInfo(null);

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setErrorMessage('Invalid file format. Please select an Excel workbook (.xlsx or .xls).');
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      // STEP 1: Parse first sheet with xlsx
      const rawRows = parseExcelWorkbook(buffer);

      // STEP 2: Group variant rows by Style_Code
      const groupedProducts = groupProductsByStyleCode(rawRows);

      setUploadSuccessInfo({
        fileName: file.name,
        fileSizeKb: (file.size / 1024).toFixed(1),
        rawVariantRows: rawRows.length,
        groupedStylesCount: groupedProducts.length,
      });

      // Pass parsed catalogue up to parent state
      onCatalogueLoaded(groupedProducts, rawRows);
    } catch (err) {
      console.error('Catalogue parse error:', err);
      setErrorMessage(err.message || 'An error occurred while parsing the Excel file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Instant demo data loader
  const handleLoadDemoCatalogue = () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const sampleRows = getSampleCatalogueRows();
      // Emulate excel normalize & grouping
      const sampleBuffer = sampleRows.map(r => ({
        styleCode: r.Style_Code,
        styleName: r.Style_Name,
        brandName: r.Brand,
        brick: r.Brick,
        category: r.Category,
        neck: r.Neck,
        sleeve: r.Sleeve,
        size: r.Size
      }));
      const grouped = groupProductsByStyleCode(sampleBuffer);

      setUploadSuccessInfo({
        fileName: 'Sample_Retail_Catalogue.xlsx',
        fileSizeKb: '14.2',
        rawVariantRows: sampleRows.length,
        groupedStylesCount: grouped.length,
      });

      onCatalogueLoaded(grouped, sampleBuffer);
    } catch (err) {
      setErrorMessage('Failed to load sample catalogue: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded shadow-sm mb-4">
      {/* Enterprise Card Header */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="text-gray-700" size={16} />
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Catalogue Ingestion &bull; Excel Import (.xlsx)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={downloadSampleExcelCatalogue}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Download real .xlsx sample template"
          >
            <Download size={13} className="text-gray-500" />
            <span>Download Sample .xlsx</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoCatalogue}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            title="Quickly populate with pre-built retail test dataset"
          >
            <CheckCircle2 size={13} className="text-blue-600" />
            <span>Load Sample Dataset</span>
          </button>
        </div>
      </div>

      {/* Upload Body */}
      <div className="p-4">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2 text-xs text-red-700">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <span className="font-semibold">Import Error:</span> {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Success / Status Banner */}
        {uploadSuccessInfo && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold">Workbook Ingested:</span>{' '}
                <span className="font-mono">{uploadSuccessInfo.fileName}</span> ({uploadSuccessInfo.fileSizeKb} KB) &bull;{' '}
                <span className="font-semibold">{uploadSuccessInfo.rawVariantRows}</span> variant rows mapped into{' '}
                <span className="font-semibold">{uploadSuccessInfo.groupedStylesCount}</span> unique style products.
              </div>
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : isLoaded
              ? 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/60'
              : 'border-gray-300 bg-gray-50/40 hover:bg-gray-100'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 shadow-sm">
              <UploadCloud size={20} className={isProcessing ? 'animate-bounce text-blue-600' : ''} />
            </div>

            <div className="text-xs">
              <span className="font-semibold text-blue-700 hover:underline">
                Click to browse
              </span>{' '}
              or drag and drop your retail catalogue spreadsheet (.xlsx)
            </div>

            <p className="text-[11px] text-gray-500 max-w-xl">
              Expected columns: <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Style_Code</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Size</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Style_Name</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Brand</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Brick</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Category</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Neck</code>,{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">Sleeve</code>.
            </p>
          </div>
        </div>

        {/* Technical specifications bar */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
          <div className="flex items-center space-x-1">
            <Info size={12} className="text-gray-400" />
            <span>Rule: Multiple rows sharing the same <strong>Style_Code</strong> are grouped into a single multi-size product.</span>
          </div>
          {currentStats && (
            <div className="text-gray-600 font-mono">
              Active Styles: <strong>{currentStats.stylesCount}</strong> | Total Size Variants: <strong>{currentStats.variantsCount}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
