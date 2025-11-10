import { useState } from "react";
import { Building2, ChevronDown, Settings } from "lucide-react";

const Sidebar = () => {
  const [openFloor1, setOpenFloor1] = useState(true);
  const [openFloor2, setOpenFloor2] = useState(true);

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 font-semibold text-lg border-b border-slate-700">
        Đặt phòng họp
      </div>

      {/* Select location */}
      <div className="p-4 border-b border-slate-700">
        <select className="w-full bg-slate-700 text-white p-2 rounded">
          <option>Văn phòng Đà Nẵng</option>
          <option>Văn phòng Hà Nội</option>
        </select>
      </div>

      {/* All rooms */}
      <div className="p-3 text-sm text-gray-300 font-medium border-b border-slate-700">
        Tất cả các phòng
      </div>

      {/* Floor 1 */}
      <div className="flex flex-col px-4 py-2">
        <button
          onClick={() => setOpenFloor1(!openFloor1)}
          className="flex justify-between items-center w-full text-left"
        >
          <span className="flex items-center gap-2">
            <Building2 size={16} />
            Tầng 1
          </span>
          <ChevronDown
            size={16}
            className={`transform transition ${openFloor1 ? "rotate-180" : ""}`}
          />
        </button>
        {openFloor1 && (
          <ul className="ml-6 mt-2 text-gray-400 text-sm">
            <li className="hover:text-white cursor-pointer py-1">Phòng họp A</li>
            <li className="hover:text-white cursor-pointer py-1">Phòng họp B</li>
          </ul>
        )}
      </div>

      {/* Floor 2 */}
      <div className="flex flex-col px-4 py-2">
        <button
          onClick={() => setOpenFloor2(!openFloor2)}
          className="flex justify-between items-center w-full text-left"
        >
          <span className="flex items-center gap-2">
            <Building2 size={16} />
            Tầng 2
          </span>
          <ChevronDown
            size={16}
            className={`transform transition ${openFloor2 ? "rotate-180" : ""}`}
          />
        </button>
        {openFloor2 && (
          <ul className="ml-6 mt-2 text-gray-400 text-sm">
            <li className="hover:text-white cursor-pointer py-1">Phòng họp C</li>
            <li className="hover:text-white cursor-pointer py-1">Phòng họp D</li>
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-700">
        <Settings size={18} />
        <span>Thiết lập quản lý</span>
      </div>
    </div>
  );
};

export default Sidebar;
