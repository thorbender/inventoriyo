import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Scanner from "./pages/Scanner";
import Inventory from "./pages/Inventory";
import Importer from "./pages/Importer";
import { FiBarChart2 } from "react-icons/fi";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex flex-col items-center gap-2 px-6 py-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-black">Inventoriyo</h1>
            <p className="text-sm text-gray-500">Inventory Management</p>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/scanner" />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/importer" element={<Importer />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);