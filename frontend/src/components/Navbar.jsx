import { NavLink } from "react-router-dom";
import { Home, Map, PlusCircle, BarChart3 } from "lucide-react";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-700 text-white"
        : "text-blue-100 hover:bg-blue-700/60"
    }`;

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-800 font-bold text-sm">CP</span>
          </div>
          <span className="font-bold text-xl tracking-tight">CivicPulse</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/" end className={linkClass}>
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            <Map size={16} />
            <span className="hidden sm:inline">Map</span>
          </NavLink>
          <NavLink to="/report" className={linkClass}>
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Report Issue</span>
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
