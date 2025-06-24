import React, { useState } from "react";
import Papa from "papaparse";
import { supabase } from "../supabaseClient";
import { NavLink } from "react-router-dom";
import { FiCamera, FiBox, FiUpload, FiFile } from "react-icons/fi";

type ProductRow = {
  ean: string;
  name: string;
};

const Importer: React.FC = () => {
  const [csvData, setCsvData] = useState<ProductRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file upload and parse CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus("");
    if (e.target.files && e.target.files[0]) {
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data as ProductRow[]);
        },
        error: (err) => {
          setStatus("Error parsing CSV: " + err.message);
        },
      });
    }
  };

  // Import to Supabase
  const handleImport = async () => {
    if (csvData.length === 0) {
      setStatus("No data to import.");
      return;
    }
    setLoading(true);
    setStatus("");
    // Insert all rows, ignore duplicates
    const { error } = await supabase.from("products").upsert(
      csvData.map((row) => ({
        ean: row.ean,
        name: row.name,
        imported_at: new Date().toISOString(),
        added_by_app: false,
      })),
      { onConflict: "ean" }
    );
    if (error) {
      setStatus("Import error: " + error.message);
    } else {
      setStatus("Import successful!");
      setCsvData([]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 space-y-4">
        {/* Import Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-black mb-1">Import Products</h2>
              <p className="text-sm text-gray-500">Upload a CSV file with product data</p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <FiFile className="w-8 h-8 text-gray-400" />
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Preview Card */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-black mb-1">Preview</h2>
                <p className="text-sm text-gray-500">{csvData.length} products found</p>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EAN</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {csvData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-gray-500">{row.ean}</td>
                        <td className="px-4 py-2 text-black">{row.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                onClick={handleImport}
                disabled={loading}
              >
                <FiUpload className="w-5 h-5" />
                {loading ? "Importing..." : "Import to Database"}
              </button>
              {status && (
                <div
                  className={`text-center text-sm ${
                    status.includes("successful")
                      ? "text-green-600"
                      : status.includes("error")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around py-2">
            <NavLink
              to="/scanner"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                  isActive
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              <FiCamera className="w-6 h-6" />
              <span className="text-xs font-medium">Scanner</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                  isActive
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              <FiBox className="w-6 h-6" />
              <span className="text-xs font-medium">Inventory</span>
            </NavLink>
            <NavLink
              to="/importer"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                  isActive
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              <FiUpload className="w-6 h-6" />
              <span className="text-xs font-medium">Importer</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Importer;