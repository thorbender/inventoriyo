import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Papa from "papaparse";
import { NavLink } from "react-router-dom";
import { FiCamera, FiBox, FiUpload, FiSearch } from "react-icons/fi";

type InventoryItem = {
  id: string;
  ean: string;
  quantity: number;
  timestamp: string;
  source: string;
  product_name?: string;
  added_by_app?: boolean;
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch inventory and join with product info
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get inventory
      const { data: invData, error: invError } = await supabase
        .from("inventory")
        .select("*")
        .order("timestamp", { ascending: false });
      if (invError) {
        setLoading(false);
        return;
      }
      // Get products
      const { data: prodData } = await supabase.from("products").select("*");
// Join product info
const joined = invData.map((item: any) => {
  const prod = (prodData ?? []).find((p: any) => p.ean === item.ean);
  return {
    ...item,
    product_name: prod?.name || "",
    added_by_app: prod?.added_by_app || false,
  };
});
      setInventory(joined);
      setFiltered(joined);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter inventory
  useEffect(() => {
    let result = [...inventory];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.ean.includes(s) ||
          (item.product_name && item.product_name.toLowerCase().includes(s))
      );
    }
    if (dateFrom) {
      result = result.filter(
        (item) => new Date(item.timestamp) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      result = result.filter(
        (item) => new Date(item.timestamp) <= new Date(dateTo)
      );
    }
    setFiltered(result);
  }, [search, dateFrom, dateTo, inventory]);

  // Calculate totals
  const totalItems = filtered.length;
  const totalQuantity = filtered.reduce((sum, item) => sum + item.quantity, 0);

  // Export CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      filtered.map((item) => ({
        EAN: item.ean,
        Name: item.product_name,
        Quantity: item.quantity,
        Timestamp: item.timestamp,
        Source: item.source,
        "Added by App": item.added_by_app ? "Yes" : "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-black mb-1">Inventory Summary</h2>
              <p className="text-sm text-gray-500">Overview of your items</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Total Items</div>
                <div className="text-xl font-semibold text-black">{totalItems}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Total Quantity</div>
                <div className="text-xl font-semibold text-black">{totalQuantity}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-black mb-1">Search & Filter</h2>
              <p className="text-sm text-gray-500">Find specific items</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-gray-400"
                  type="text"
                  placeholder="Search by barcode or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-400"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-400"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                onClick={handleExportCSV}
              >
                Export Results
              </button>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              Loading inventory...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              No items found
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex flex-col items-start gap-2">
                  <div className="font-mono text-sm text-gray-500">#{item.ean}</div>
                  {item.product_name && (
                    <div className="font-medium text-black">{item.product_name}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  <div className="bg-gray-100 text-black px-3 py-1 rounded-full text-sm font-medium">
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

export default Inventory;