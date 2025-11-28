import { useOutletContext } from 'react-router-dom';
import React, { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const menuData = [
  {
    title: "Model Resources",
    children: ["Add User", "Delete User", "Edit User", "User List"],
  },
  {
    title: "Data Resources",
    children: ["Theme", "Languages", "Logs", "Backup"],
  },
  {
    title: "Data Processing Method Resources",
    children: ["Messages", "Alerts", "Inbox", "History"],
  },
];
const resourceList = [
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
  { title: "Hydrological Model A", desc: "A basin-scale water flow simulation model supporting precipitation-runoff analysis.", type: "Model" },
  { title: "Land Surface Dataset", desc: "High-resolution land surface coverage and classification dataset derived from remote sensing.", type: "Data" },
  { title: "Climate Simulation Tool", desc: "A multi-year climate sequence generator based on regional spatial statistics.", type: "Tool" },
  { title: "Soil Moisture Product", desc: "Soil moisture inversion based on Sentinel-1 backscatter signals.", type: "Product" },
  { title: "Multi-source Observation Fusion", desc: "Fusion of ground stations, satellites, and weather radar measurements.", type: "Service" },
];

const categoryTitles = menuData.map(item => item.title);

interface OutletContextType {
  darkMode: boolean;
}

export default function Resources() {
  const [active, setActive] = useState<{ parent: number | null; child: number | null}>({parent: null, child: null});
  const { darkMode } = useOutletContext<OutletContextType>();
  const textColor = darkMode ? "text-white" : "text-black";
  const invertedColor = darkMode ? "text-black" : "text-white";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(categoryTitles[0]);
  const [inputValue, setInputValue] = useState("");
  const onSearch = () => {
    console.log("选择一级分类：", selected);

    // 也可以获得对应 children，如👇
    const children = menuData.find(d => d.title === selected)?.children ?? [];
    console.log("对应子菜单：", children);
    console.log("搜索关键字：", inputValue);
  };

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(resourceList.length / pageSize);

  // 当前页展示的数据
  const currentData = resourceList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gray-100/20 shadow-ms shadow-white p-6 min-h-[100px]">
        <p className={`font-light ${textColor} leading-relaxed text-lg text-[16px]`}>
          Focus on the integration of diverse and heterogeneous simulation resources in the Yellow River Basin,
          and promote the collaborative convergence and integration of multi-source simulation resources through service-oriented packaging, cross platform deployment and unified data model construction.
        </p>
      </div>
      {/* ===== Main Layout ===== */}
      <div className="flex flex-1  mx-30">
        {/* aside menu */}
        <aside className="w-1/5 p-4 m-10 bg-gray-50 border-r border-gray-200 shadow-ms shadow-white">
          {menuData.map((menu, index) => (
            <div key={index} className='mt-3'>
              {/* First level menu */}
              <button className={`flex gap-2 w-full pl-1 font-sans text-[18px] font-bold text-black ${active.parent === index ? "text-blue-800 bg-blue-200/40 shadow-xl" : "text-black"} text-left mb-2`}
                onClick={() => setActive({parent: index, child: null})}>
                {menu.title}
              </button>
              <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-700 via-blue-900 to-transparent"></div>

              {/* Second level menu */}
              <div className="flex flex-col gap-1 ml-2">
                {menu.children.map((item, i) => {
                  const isActive = active.parent === index && active.child ===i;
                  return (
                    <button key={i} className={`pl-2 font-sans text-[16px] text-left text-black ${isActive ? "bg-blue-200/20 font-semibold shadow-sm rounded-sm" : "text-black"}`}
                      onClick={() => setActive({parent: index, child:i})}>
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>

        {/*  main area => show resources list   */}
        <main className="flex-1 m-10">
          {/* Search Area */}
          <div className='flex items-center w-full pb-3'>
            {/* Left drop-down selection menu */}
            <div className='relative h-10'>
              <button className={'flex items-center h-full gap-1 px-3 rounded-l-sm bg-blue-200 hover:bg-blue-500 border text-sm text-black'}
                onClick={() => setOpen(!open)}>
                {selected}
                <ChevronDown size={16} />
              </button>

              {open && (
                <div className='absolute left-0 mt-1 w-full bg-white border shadow-lg z-50'>
                  {categoryTitles.map((item) => {
                    const isSelected = item === selected;
                    return (
                      <div key={item} onClick={() => { setSelected(item); setOpen(false); }}
                        className={`px-3 py-2 cursor-pointer text-black text-sm hover:bg-gray-100 ${ isSelected ? "bg-blue-200 font-semibold" : "text-black" }`}>
                        {item}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input area */}
            <input type='text' placeholder='Please input search text... ' className='flex-1 h-10 px-3 py-2 border border-l-0 border-r-0 outline-none'
              value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()}>
            </input>

            <button onClick={onSearch} className="h-10 px-3 py-2 bg-blue-400 text-white rounded-r-sm hover:bg-blue-600 flex items-center gap-1 border">
              <Search size={18} />
              Search
            </button>
          </div>

          {/* Resources Area(Card list) */}
          <div className="py-6 min-h-[300px]">

            {/* 卡片网格布局 */}
            <div className="flex flex-col sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentData.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md"> {item.type} </span>
                    <button className="text-blue-600 hover:underline text-sm">View →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Area */}
          <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
            <div>
              <p className={`hidden sm:block text-sm ${textColor}`}>
                Showing <span className='font-medium'>{(currentPage - 1) * pageSize +1}</span> to <span className='font-medium'>{currentPage === totalPages ? resourceList.length : currentPage * pageSize}</span> of{' '}
                <span>{resourceList.length}</span> results
              </p>
            </div>

            <nav aria-label='Pagination' className='isolate inline-flex -space-x-px rounded-md'>
              <button disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${textColor} inset-ring inset-ring-gray-700 focus:z-20 focus:outline-offset-0 transition ${currentPage === 1 ? "cursor-not-allowed" : "hover:bg-gray-200"}`}>
                Previous
              </button>

              {/* Page Numbers */}
              <div className='hidden sm:flex'>
                {(() => {
                  const pages:number[] = [];

                  // Ensure key pages are displayed: first page, current page, last page, etc
                  const add = (p:number) => !pages.includes(p) && p >=1 && p<=totalPages && pages.push(p);

                  add(1);
                  add(currentPage - 1);
                  add(currentPage);
                  add(currentPage + 1);
                  add(totalPages);

                  pages.sort((a,b) => a-b);

                  return pages.map((p, i) => {
                    const isGap = pages[i+1] && pages[i+1] - p > 1;

                    return (
                      <React.Fragment key={p}>
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold inset-ring inset-ring-gray-700 transition ${textColor}
                            ${currentPage === p ? "bg-blue-600 border-blue-600" : "hover:bg-gray-200/40"}`}>
                          {p}
                        </button>
                        {isGap && <span className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold inset-ring inset-ring-gray-700 ${textColor}`}>...</span>}
                      </React.Fragment>
                    );
                  });
                })()
                }
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${textColor} inset-ring inset-ring-gray-700 ${currentPage === totalPages ? "cursor-not-allowed" : "hover:bg-gray-200/40"}`}>
                Next
              </button>
            </nav>
          </div>
        </main>
      </div>
    </div>
  );
}
