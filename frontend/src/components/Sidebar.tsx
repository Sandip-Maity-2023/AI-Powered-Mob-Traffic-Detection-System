import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Car,
  ShieldAlert,
  Users,
  Trash2,
  Video,
  Megaphone,
  Map,
  BellRing,
  FileSpreadsheet,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Radio,
  Cpu,
  MapPin,
  Camera
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard, color: 'text-cyan-400' },
    { id: 'traffic', label: 'Traffic Intelligence', icon: Car, color: 'text-sky-400' },
    { id: 'damage', label: 'Infrastructure Health', icon: ShieldAlert, color: 'text-orange-400' },
    { id: 'crowd', label: 'Crowd Vision', icon: Users, color: 'text-purple-400' },
    { id: 'cctv', label: 'Tactical Camera AI', icon: Camera, color: 'text-indigo-400' },
    { id: 'incidents', label: 'Incident Center', icon: Megaphone, color: 'text-red-400' },
    { id: 'tracking', label: 'Location Tracking', icon: MapPin, color: 'text-emerald-400' },
    { id: 'heatmaps', label: 'Heatmap Analytics', icon: Map, color: 'text-yellow-400' },
    { id: 'alerts', label: 'Alerts & Alarm Center', icon: BellRing, color: 'text-pink-400' },
    { id: 'ai-engine', label: 'AI Engine Status', icon: Cpu, color: 'text-fuchsia-400' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileSpreadsheet, color: 'text-teal-400' },
    { id: 'settings', label: 'System Settings', icon: Sliders, color: 'text-slate-400' },
  ] as const;

  return (
    <aside
      className={`relative flex flex-col border-r border-white/5 bg-[#0a0a0e] backdrop-blur-md transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-72'
      } z-30 h-screen`}
      id="command-sidebar"
    >
      {/* Brand & Terminal Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col select-none"
            >
              <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                SentraCity@360
              </span>
              <span className="text-[10px] font-mono text-cyan-500/75 tracking-widest flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping inline-block" />
                SYSTEM NOMINAL
              </span>
            </motion.div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 transition-colors bg-white/5"
          title={collapsed ? "Expand Side Deck" : "Collapse Side Deck"}
          id="sidebar-toggle-btn"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Options List */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all duration-300 ${
                isActive
                  ? 'bg-white/10 border border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
              id={`sidebar-tab-${item.id}`}
            >
              {/* Highlight bar for active button */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-sm bg-gradient-to-b from-cyan-455 to-cyan-500" />
              )}

              <IconComponent
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!collapsed && (
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              )}

              {/* Glowing microdot on hovered or active tabs */}
              {!collapsed && isActive && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Operational Station Footer */}
      <div className="p-4 border-t border-white/5 text-center font-mono">
        <div className="flex items-center justify-center gap-2">
          <Radio className="h-4 w-4 text-green-400 animate-pulse" />
          {!collapsed ? (
            <span className="text-[10px] text-slate-500 tracking-wider">
              AUTO-SYNC: <span className="text-green-400">ONLINE</span>
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
          )}
        </div>
      </div>
    </aside>
  );
}
