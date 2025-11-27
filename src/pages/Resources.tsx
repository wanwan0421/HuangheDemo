import { useOutletContext } from 'react-router-dom';
import { useState } from "react";
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


  return (
    <div className="min-h-screen flex flex-col">

      {/* ===== Main Layout ===== */}
      <div className="flex flex-1">

        {/* aside menu */}
        <aside className="w-1/5 p-4 m-10 rounded-2xl bg-gray-100/20 border-r border-gray-200 shadow-md shadow-white">
          {menuData.map((menu, index) => (
            <div key={index} className="mb-5">
              {/* First level menu */}
              <button className={`flex gap-2 w-full pl-1 font-sans text-[18px] font-bold ${active.parent === index ? "text-blue-800 bg-blue-200/40 shadow-xl" : textColor} text-left mb-2`}
                onClick={() => setActive({parent: index, child: null})}>
                {menu.title}
              </button>

              {/* Second level menu */}
              <div className="flex flex-col gap-1 ml-2">
                {menu.children.map((item, i) => {
                  const isActive = active.parent === index && active.child ===i;
                  return (
                    <button key={i} className={`pl-2 font-sans text-[16px] text-left text-black ${isActive ? "bg-blue-200/20 font-semibold shadow-sm rounded-sm" : `${textColor}`}`}
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

          {/* 内容区域 */}
          <div className="bg-white rounded-xl shadow p-6 min-h-[300px]">
            Content
          </div>
        </main>
      </div>
    </div>
  );
}
