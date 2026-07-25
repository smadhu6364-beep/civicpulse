import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import MapView from "./components/MapView";
import IssueForm from "./components/IssueForm";
import Dashboard from "./components/Dashboard";
import IssueDetail from "./components/IssueDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/report" element={<IssueForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
