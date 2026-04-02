import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import Modal from "./common/Modal";

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  onExport: () => Promise<void>;
  isImporting: boolean;
  isExporting: boolean;
}

export default function ImportExportModal({
  open,
  onClose,
  onImport,
  onExport,
  isImporting,
  isExporting
}: ImportExportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (newFile: File) => {
    if (newFile.type === "text/csv" || newFile.name.endsWith(".csv")) {
      setFile(newFile);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    await onImport(file);
    setFile(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import / Export Products" maxWidth="max-w-xl">
      <div className="space-y-8">
        {/* Export Section */}
        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-blue-900 mb-1">Export Catalog</h3>
              <p className="text-xs text-blue-600/80 mb-4 pr-12">
                Download your entire product catalog as a standardized CSV file. 
                Perfect for making bulk edits in Excel before re-importing.
              </p>
            </div>
            <div className="p-3 bg-blue-100/50 rounded-xl">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-blue-700 text-sm font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Download CSV Backup"}
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">or update catalog</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Import Section */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Import from CSV</h3>
            <p className="text-xs text-gray-500">
              Drag and drop a CSV file to bulk create or update existing products (matched by SKU).
            </p>
          </div>

          <form
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50/20" : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <FileSpreadsheet className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-sm font-bold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-4 text-xs font-bold text-red-500 hover:text-red-600"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => inputRef.current?.click()}>Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-2">CSV formatted files only</p>
              </div>
            )}
          </form>

          {file && (
            <div className="mt-6">
              <div className="mb-4 flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>Ensure your CSV has columns like <span className="font-mono bg-amber-100 px-1 rounded">sku</span>, <span className="font-mono bg-amber-100 px-1 rounded">name</span>, and <span className="font-mono bg-amber-100 px-1 rounded">selling_price</span>. Existing SKUs will be updated.</p>
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 focus:ring-4 focus:ring-slate-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? "Processing Import..." : "Confirm & Import Catalog"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
