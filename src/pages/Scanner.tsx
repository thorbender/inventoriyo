import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../supabaseClient";
import { FiCamera, FiSearch, FiBox, FiX, FiUpload } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { Html5QrcodeSupportedFormats } from "html5-qrcode";

// Enhanced barcode scanner with improved distance scanning

const Scanner: React.FC = () => {
  const [ean, setEan] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [productName, setProductName] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [productFound, setProductFound] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search for product by EAN
  const searchProduct = async (eanToSearch: string) => {
    setLoading(true);
    setStatus("");
    setProductFound(false);
    setProductName("");
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("ean", eanToSearch)
      .single();
    setLoading(false);
    if (data) {
      setProductFound(true);
      setProductName(data.name);
      setStatus("Product found.");
    } else {
      setProductFound(false);
      setStatus("Product not found. Please enter name.");
    }
  };

  // Start the camera and scanner when showScanner becomes true
  useEffect(() => {
    if (showScanner) {
      const startScanner = async () => {
        try {
          // Clear any existing instance
          if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
          }
          // Create new instance
          scannerRef.current = new Html5Qrcode("reader");
          await scannerRef.current.start(
            { facingMode: "environment" },
                          {
                fps: 10,
                qrbox: function(viewfinderWidth, viewfinderHeight) {
                  // Make the scanning box responsive and larger
                  const minEdgePercentage = 0.7;
                  const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                  const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                  return {
                    width: Math.min(qrboxSize, 400),
                    height: Math.min(qrboxSize * 0.4, 160)
                  };
                },
                aspectRatio: 1.777778,
                disableFlip: false,
                supportedScanTypes: [
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.EAN_8,
                  Html5QrcodeSupportedFormats.UPC_A,
                  Html5QrcodeSupportedFormats.UPC_E,
                  Html5QrcodeSupportedFormats.CODE_128
                ]
              },
            (decodedText) => {
              setEan(decodedText);
              setShowScanner(false);
              searchProduct(decodedText);
            },
            (_) => {
              // Optionally handle scan errors
            }
          );
        } catch (err) {
          setStatus("Camera error: " + (err as Error).message);
          setShowScanner(false);
        }
      };
      startScanner();
    }
    
    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        }).catch(() => {
          // Handle any cleanup errors silently
          if (scannerRef.current) {
            scannerRef.current = null;
          }
        });
      }
    };
  }, [showScanner]);

  // Handle manual EAN entry
  const handleEanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEan(e.target.value);
    setProductFound(false);
    setProductName("");
    setStatus("");
  };

  // Add to inventory
  const handleAddToInventory = async () => {
    if (!ean || !quantity) {
      setStatus("Please enter EAN and quantity.");
      return;
    }
    setLoading(true);
    // If product not found, add to products table
    if (!productFound) {
      const { error: prodError } = await supabase.from("products").insert([
        {
          ean,
          name: productName,
          added_by_app: true,
        },
      ]);
      if (prodError) {
        setStatus("Error adding product: " + prodError.message);
        setLoading(false);
        return;
      }
    }
    // Add to inventory
    const { error: invError } = await supabase.from("inventory").insert([
      {
        ean,
        quantity: Number(quantity),
        source: productFound ? "app" : "added_by_app",
      },
    ]);
    if (invError) {
      setStatus("Error adding to inventory: " + invError.message);
    } else {
      setStatus("Added to inventory!");
      setEan("");
      setQuantity("");
      setProductName("");
      setProductFound(false);
    }
    setLoading(false);
  };

  // Fuzzy search for products
  const handleFuzzySearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    // Split query into words
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    // Fetch all products (for demo, you may want to optimize this)
    const { data } = await supabase.from("products").select("*");
    if (!data) {
      setSearchResults([]);
      return;
    }
    // Fuzzy match: all words must be present in any order
    const results = data.filter((product: any) =>
      words.every(word => product.name && product.name.toLowerCase().includes(word))
    );
    setSearchResults(results);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 pb-24 space-y-4 max-w-md mx-auto w-full">
        {/* Scan or Search Card */}
        <div className="bg-white p-8">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-black mb-2">Find Product</h2>
              <p className="text-base text-gray-500">Use your camera to scan barcode or search for product</p>
            </div>
            {showScanner ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full bg-black rounded-2xl overflow-hidden">
                  <div id="reader" className="w-full aspect-video" />
                </div>
                <div className="text-center text-sm text-gray-600 px-4">
                  <p className="mb-2">📱 <strong>Scanning Tips:</strong></p>
                  <p className="mb-1">• Hold phone 6-12 inches from barcode</p>
                  <p className="mb-1">• Ensure good lighting or use device flashlight</p>
                  <p className="mb-3">• Keep barcode centered in the scanning area</p>
                </div>
                <button
                  className="w-full bg-gray-100 text-black px-6 py-4 rounded-3xl font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setShowScanner(false)}
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button
                  className="w-full bg-black text-white px-6 py-4 rounded-3xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowScanner(true)}
                >
                  <FiCamera className="w-5 h-5" />
                  Start Camera
                </button>
                <button
                  className="w-full bg-gray-100 text-black px-6 py-4 rounded-3xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowSearchModal(true)}
                >
                  <FiSearch className="w-5 h-5" />
                  Search Product
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item Details Card */}
        <div className="bg-white p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-black mb-2">Item Details</h2>
              <p className="text-base text-gray-500">Enter product information</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">Barcode (EAN)</label>
                <input
                  className="w-full bg-gray-100 border-0 rounded-3xl px-6 py-4 text-black placeholder-gray-400"
                  type="text"
                  value={ean}
                  onChange={handleEanChange}
                  placeholder="Scan or enter barcode"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">Quantity</label>
                <input
                  className="w-full bg-gray-100 border-0 rounded-3xl px-6 py-4 text-black placeholder-gray-400"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">Product Name</label>
                <input
                  className="w-full bg-gray-100 border-0 rounded-3xl px-6 py-4 text-black placeholder-gray-400"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  disabled={productFound}
                />
              </div>
              <button
                className="w-full bg-black text-white px-6 py-4 rounded-3xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                onClick={handleAddToInventory}
                disabled={loading}
              >
                <FiBox className="w-5 h-5" />
                {loading ? "Adding..." : "Add to Inventory"}
              </button>
              {status && (
                <div
                  className={`text-center text-sm ${
                    status.includes("Added to inventory")
                      ? "text-green-600"
                      : status.includes("not found")
                      ? "text-yellow-600"
                      : status.includes("Error")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-black">Search Product</h2>
                <button 
                  className="text-black hover:text-gray-600 bg-black/10 rounded-xl p-2"
                  onClick={() => setShowSearchModal(false)}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <input
                className="w-full bg-white border border-orange-300 rounded-full px-6 py-4 text-black placeholder-gray-400 mb-4"
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  handleFuzzySearch(e.target.value);
                }}
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchResults.length === 0 && searchQuery && (
                  <div className="text-gray-500 text-center py-2">No products found</div>
                )}
                {searchResults.map(product => (
                  <button
                    key={product.ean}
                    className="w-full text-left px-6 py-4 bg-white hover:bg-gray-50 text-black rounded-3xl"
                    onClick={() => {
                      setEan(product.ean);
                      setProductName(product.name);
                      setProductFound(true);
                      setShowSearchModal(false);
                    }}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">#{product.ean}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Scanner;
