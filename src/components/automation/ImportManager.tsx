import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../common/Button';

export default function ImportManager() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'zip') {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Please select a CSV or ZIP file');
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('updateExisting', 'false');
      formData.append('createSnapshot', 'true');

      const response = await fetch('http://localhost:3001/api/import/editor', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          setFile(null);
          setResult(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 5000);
      }
    } catch (error) {
      setResult({
        success: false,
        errors: [{ message: 'Failed to import file. Please check your connection.' }],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'zip') {
        setFile(droppedFile);
        setResult(null);
      } else {
        alert('Please drop a CSV or ZIP file');
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Import Campaigns</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload CSV or ZIP files exported from Google Ads Editor
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${file
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.zip"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        {file ? (
          <div>
            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {file.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {(file.size / 1024).toFixed(2)} KB
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import File
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop your file here
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse
            </p>
            <label htmlFor="file-upload">
              <Button as="span" className="cursor-pointer">
                Select File
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Supports CSV and ZIP files from Google Ads Editor
            </p>
          </div>
        )}
      </div>

      {/* Import Result */}
      {result && (
        <div
          className={`
            mt-6 rounded-lg border-2 p-6
            ${result.success
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}

            <div className="flex-1">
              <h3
                className={`
                  text-lg font-semibold mb-2
                  ${result.success ? 'text-green-900' : 'text-red-900'}
                `}
              >
                {result.success ? 'Import Successful!' : 'Import Failed'}
              </h3>

              {result.success && result.stats && (
                <div className="space-y-2 text-sm text-green-800">
                  {result.stats.campaignsCreated > 0 && (
                    <p>✓ Created {result.stats.campaignsCreated} campaign(s)</p>
                  )}
                  {result.stats.campaignsUpdated > 0 && (
                    <p>✓ Updated {result.stats.campaignsUpdated} campaign(s)</p>
                  )}
                  {result.stats.adGroupsCreated > 0 && (
                    <p>✓ Created {result.stats.adGroupsCreated} ad group(s)</p>
                  )}
                  {result.stats.adsCreated > 0 && (
                    <p>✓ Created {result.stats.adsCreated} ad(s)</p>
                  )}
                  {result.stats.keywordsCreated > 0 && (
                    <p>✓ Created {result.stats.keywordsCreated} keyword(s)</p>
                  )}
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-1 text-sm text-red-800 mt-2">
                  {result.errors.map((error: any, index: number) => (
                    <p key={index}>• {error.message}</p>
                  ))}
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">Warnings:</p>
                  <div className="space-y-1 text-sm text-green-700">
                    {result.warnings.map((warning: any, index: number) => (
                      <p key={index}>• {warning.message}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          📝 How to Export from Google Ads Editor
        </h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Open Google Ads Editor</li>
          <li>Select the campaigns you want to export</li>
          <li>Go to <strong>File → Export → Export to CSV</strong></li>
          <li>Save the file (CSV or ZIP format)</li>
          <li>Upload it here to import into the system</li>
        </ol>
        <p className="text-xs text-blue-700 mt-3">
          💡 The system will automatically create a snapshot before importing, so you can roll back if needed.
        </p>
      </div>
    </div>
  );
}
