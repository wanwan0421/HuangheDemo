import { useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ChevronDown, Search, Loader2, Mail } from "lucide-react";
import TagRecords, { buildMenuData, type MenuDataItem, type MenuLeafItem } from "../util/record";

// 后端API基础URL
const BACK_URL = import.meta.env.VITE_BACK_URL;

// 定义后端返回的资源类型
interface ResourceItem {
  name: string;
  description: string;
  type: string;
  author: string;
  keywords: string[];
  createdTime: string;
}

// 定义后端API期望的filter参数类型
interface ResourceFilter {
  categoryId: string[]; // 资源分类ID
  keyword: string; // 搜索关键字
}

// 定义用于跟踪四级菜单状态的类型
interface MenuItem {
  parent: number | null; // 一级菜单索引
  child: number | null; // 二级菜单索引
  subChild: number | null; // 三级菜单索引
  subSubChild: number | null; // 四级菜单索引
}

// 帮助函数：检查某个节点是否是当前选中的路径
const isActivePath = (active: MenuItem, level: number, index: number) => {
  if (level === 1) return active.parent === index;
  if (level === 2) return active.parent !== null && active.child === index;
  if (level === 3)
    return (
      active.parent !== null &&
      active.child !== null &&
      active.subChild === index
    );
  if (level === 4)
    return (
      active.parent !== null &&
      active.child !== null &&
      active.subChild !== null &&
      active.subSubChild === index
    );
  return false;
};

// 获取目录数据
const menuData: MenuDataItem[] = buildMenuData(TagRecords); // 构建菜单数据
const categoryTitles = menuData.map((item) => item.title); // 提取一级分类标题

interface OutletContextType {
  darkMode: boolean;
}

export default function Resources() {
  const [active, setActive] = useState<MenuItem>({
    parent: null,
    child: null,
    subChild: null,
    subSubChild: null,
  });
  const [resourceList, setResourceList] = useState<ResourceItem[]>([]); // 存储资源列表
  const [totalResources, setTotalResources] = useState(0); // 存储总资源数
  const [loading, setLoading] = useState(false); // 加载状态

  const { darkMode } = useOutletContext<OutletContextType>(); // 模式状态
  const textColor = darkMode ? "text-white" : "text-black"; // 文字颜色（与模式状态对应）
  const invertedColor = darkMode ? "text-black" : "text-white";
  const [open, setOpen] = useState(false); // 搜索分类下拉框状态
  const [selected, setSelected] = useState(categoryTitles[0]); // 目录分类选中状态
  const [inputValue, setInputValue] = useState(""); // 搜索输入框输入值

  // 处理搜索操作，包括分类以及关键字查询
  const onSearch = () => {
    console.log("选择一级分类：", selected);
    let selectedMenuId: string | null = null;

    if (
      active.parent !== null &&
      active.child !== null &&
      active.subChild !== null &&
      active.subSubChild !== null
    ) {
      // 四级菜单
      const level2 = menuData[active.parent].children[
        active.child
      ] as MenuDataItem;
      const level3 = level2.children[active.subChild] as MenuDataItem;
      const level4 = level3.children[active.subSubChild] as MenuLeafItem;
      selectedMenuId = level4.id || null;
    }

    console.log("选中的最终标签 (用于后端查询):", selectedMenuId);
    console.log("搜索关键字：", inputValue);

    // 调用资源获取函数
    fetchAndSetResources([selectedMenuId || ""], inputValue);
  };

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(resourceList.length / pageSize);

  // 当前页展示的数据
  const currentData = resourceList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 获取模型资源
  const fetchResources = async (filter: ResourceFilter) => {
    const { categoryId, keyword } = filter;

    const queryParams = new URLSearchParams();
    if (categoryId.length > 0) {
      queryParams.append("categoryId", categoryId.join(","));
    }
    if (keyword) {
      queryParams.append("keyword", keyword);
    }
    console.log("fetchResources - queryParams:", queryParams.toString());

    const url = `${BACK_URL}/resource/findModels?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      const result: ResourceItem[] = await response.json();

      return { data: result, total: result.length };
    } catch (error) {
      return { data: [], total: 0 };
    }
  };

  // 执行获取模型资源以及设置状态
  const fetchAndSetResources = async (
    categoryId: string[] | [],
    keyword: string
  ) => {
    setLoading(true);
    setCurrentPage(1); // 重置到第一页

    const { data, total } = await fetchResources({
      categoryId: categoryId,
      keyword: keyword,
    });

    setResourceList(data);
    setTotalResources(total);
    setLoading(false);
  };

  // 处理第四级目录
  const clickForActiveAndFetchResources = (
    parentIndex: number | null,
    childIndex: number | null,
    subChildIndex: number | null,
    subSubChildIndex: number | null,
    node: MenuDataItem | MenuLeafItem
  ) => {
    setActive({
      parent: parentIndex,
      child: childIndex,
      subChild: subChildIndex,
      subSubChild: subSubChildIndex,
    });

    if ("children" in node) {
      console.log("点击了非叶子节点，fetch全部子节点资源", node);
      fetchAndSetResources(node.id, inputValue);
    } else {
      fetchAndSetResources([node.id], inputValue);
    }
  };

  // 第二级和第三级目录的初始状态
  const handleInitialToggle = (data: MenuDataItem[]) => {
    const initialLevel2: { [key: string]: boolean } = {};
    const initialLevel3: { [key: string]: boolean } = {};

    data.forEach((parent, parentIndex) => {
      parent.children.forEach((child, childIndex) => {
        if (typeof child !== "string") {
          const childKey = `${parentIndex}-${childIndex}`;
          initialLevel2[childKey] = true; // 默认展开第二级目录
          const childObj = child as MenuDataItem;
          childObj.children.forEach((_, subChildIndex) => {
            const subChildKey = `${parentIndex}-${childIndex}-${subChildIndex}`;
            initialLevel3[subChildKey] = true; // 默认展开第三级目录
          });
        }
      });
    });

    return { initialLevel2, initialLevel3 };
  };

  const {initialLevel2, initialLevel3} = handleInitialToggle(menuData);
  const [level2Open, setLevel2Open] = useState<{ [key: string]: boolean }>(initialLevel2); // 用于控制第二级目录展开/折叠的状态
  const [level3Open, setLevel3Open] = useState<{ [key: string]: boolean }>(initialLevel3); // 用于控制第三级目录展开/折叠的状态

  // 处理第二级目录展开/折叠
  const handleLevlel2Toggle = (parentIndex: number, childIndex: number) => {
    const key = `${parentIndex}-${childIndex}`;
    setLevel2Open((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  // 处理第三级目录展开/折叠
  const handleLevlel3Toggle = (
    parentIndex: number,
    childIndex: number,
    subChildIndex: number
  ) => {
    const key = `${parentIndex}-${childIndex}-${subChildIndex}`;
    setLevel3Open((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const initialData = async () => {
      return await fetchAndSetResources([], "");
    };

    initialData();

    setActive({
      parent: null,
      child: null,
      subChild: null,
      subSubChild: null,
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-gray-100/20 shadow-ms shadow-white p-6 min-h-[100px]">
        <p
          className={`font-light ${textColor} leading-relaxed text-lg text-[16px]`}
        >
          Focus on the integration of diverse and heterogeneous simulation
          resources in the Yellow River Basin, and promote the collaborative
          convergence and integration of multi-source simulation resources
          through service-oriented packaging, cross platform deployment and
          unified data model construction.
        </p>
      </div>
      {/* ===== Main Layout ===== */}
      <div className="flex flex-1  mx-30">
        {/* aside menu */}
        <aside className="w-1/5 p-4 m-10 bg-gray-50 border-r border-gray-200 shadow-ms shadow-white">
          {menuData.map((menu: MenuDataItem, parentIndex: number) => (
            <div key={parentIndex} className="mt-3">
              {/* First level menu */}
              <button
                className={`flex gap-2 w-full pl-1 font-sans text-[18px] font-bold text-black ${
                  active.parent === parentIndex
                    ? "text-blue-800 bg-blue-200/40 shadow-xl"
                    : "text-black"
                } text-left mb-2`}
                onClick={() =>
                  clickForActiveAndFetchResources(
                    parentIndex,
                    null,
                    null,
                    null,
                    menu
                  )
                }
              >
                {menu.title}
              </button>
              <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-700 via-blue-900 to-transparent"></div>

              {/* Second level menu */}
              <div className="flex flex-col gap-1">
                {menu.children.map((secondLevelChildren, childIndex) => {
                  const isL2Active =
                    isActivePath(active, 2, childIndex) &&
                    active.parent === parentIndex;

                  const key = `${parentIndex}-${childIndex}`;
                  const isL2Open = level2Open[key];

                  if (typeof secondLevelChildren === "string") {
                    // 如果是字符串类型，直接渲染
                    return (
                      <button
                        key={childIndex}
                        className={`w-full ml-2 font-sans text-[16px] text-left text-black ${
                          isL2Active
                            ? "bg-blue-200/20 font-semibold shadow-sm rounded-sm"
                            : "text-black"
                        }`}
                        onClick={() =>
                          setActive({
                            parent: parentIndex,
                            child: childIndex,
                            subChild: null,
                            subSubChild: null,
                          })
                        }
                      >
                        {secondLevelChildren}
                      </button>
                    );
                  } else {
                    {
                      /* Third level menu */
                    }
                    // 如果是对象类型，渲染标题
                    const secondLevelChildrenObj =
                      secondLevelChildren as MenuDataItem;

                    return (
                      <div key={childIndex}>
                        <div
                          className={`flex items-center w-full ${
                            isL2Active && active.subChild === null
                              ? "bg-blue-200/20 shadow-sm rounded-sm"
                              : "text-black"
                          }`}
                        >
                          <ChevronDown
                            size={16}
                            className={`ml-1 cursor-pointer transition-transform duration-200 text-black ${
                              isL2Open ? "rotate-0" : "-rotate-90"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLevlel2Toggle(parentIndex, childIndex);
                            }}
                          />
                          <button
                            className="w-full pl-2 font-sans text-[16px] text-left font-semibold text-black"
                            onClick={() =>
                              clickForActiveAndFetchResources(
                                parentIndex,
                                childIndex,
                                null,
                                null,
                                secondLevelChildrenObj
                              )
                            }
                          >
                            {secondLevelChildren.title}
                          </button>
                        </div>

                        {isL2Open && (
                          <div className="flex flex-col gap-1 mt-1">
                            {secondLevelChildrenObj.children.map(
                              (thirdLevelChildren, subChildIndex) => {
                                const isL3Active =
                                  isActivePath(active, 3, subChildIndex) &&
                                  active.parent === parentIndex &&
                                  active.child === childIndex;

                                const key3 = `${parentIndex}-${childIndex}-${subChildIndex}`;
                                const isL3Open = level3Open[key3];

                                const thirdLevelChildrenObj =
                                  thirdLevelChildren as MenuDataItem; // 目前thirdLevelChildren均为对象类型
                                return (
                                  <div key={subChildIndex}>
                                    <div
                                      className={`flex items-center w-full ${
                                        isL3Active &&
                                        active.subSubChild === null
                                          ? "bg-blue-200/20 font-semibold shadow-sm rounded-sm"
                                          : "text-black"
                                      }`}
                                    >
                                      <ChevronDown
                                        size={16}
                                        className={`ml-1 cursor-pointer transition-transform duration-200 text-black ${
                                          isL3Open ? "rotate-0" : "-rotate-90"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLevlel3Toggle(
                                            parentIndex,
                                            childIndex,
                                            subChildIndex
                                          );
                                        }}
                                      />
                                      <button
                                        className={
                                          "w-full pl-4 font-sans text-[15px] text-left text-black"
                                        }
                                        onClick={() =>
                                          clickForActiveAndFetchResources(
                                            parentIndex,
                                            childIndex,
                                            subChildIndex,
                                            null,
                                            thirdLevelChildrenObj
                                          )
                                        }
                                      >
                                        {thirdLevelChildrenObj.title}
                                      </button>
                                    </div>

                                    {/* Fourth level menu */}
                                    {isL3Open && (
                                      <div className="flex flex-col gap-1 mt-1">
                                        {(
                                          thirdLevelChildrenObj.children as MenuLeafItem[]
                                        ).map(
                                          (
                                            fourthLevelChildren,
                                            subSubChildIndex
                                          ) => {
                                            const isL4Active =
                                              isActivePath(
                                                active,
                                                4,
                                                subSubChildIndex
                                              ) &&
                                              active.parent === parentIndex &&
                                              active.child === childIndex &&
                                              active.subChild === subChildIndex;

                                            return (
                                              <button
                                                key={subSubChildIndex}
                                                className={`w-full pl-12 font-sans text-[14px] text-left text-black ${
                                                  isL4Active
                                                    ? "bg-blue-200/20 font-semibold shadow-sm rounded-sm"
                                                    : "text-black"
                                                }`}
                                                onClick={() =>
                                                  clickForActiveAndFetchResources(
                                                    parentIndex,
                                                    childIndex,
                                                    subChildIndex,
                                                    subSubChildIndex,
                                                    fourthLevelChildren
                                                  )
                                                }
                                              >
                                                {fourthLevelChildren.title}
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </aside>

        {/*  main area => show resources list   */}
        <main className="flex-1 m-10">
          {/* Search Area */}
          <div className="flex items-center w-full pb-3">
            {/* Left drop-down selection menu */}
            <div className="relative h-10">
              <button
                className={
                  "flex items-center h-full gap-1 px-3 rounded-l-sm bg-blue-200 hover:bg-blue-500 border text-sm text-black"
                }
                onClick={() => setOpen(!open)}
              >
                {selected}
                <ChevronDown size={16} />
              </button>

              {open && (
                <div className="absolute left-0 mt-1 w-full bg-white border shadow-lg z-50">
                  {categoryTitles.map((item) => {
                    const isSelected = item === selected;
                    return (
                      <div
                        key={item}
                        onClick={() => {
                          setSelected(item);
                          setOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer text-black text-sm hover:bg-gray-100 ${
                          isSelected
                            ? "bg-blue-200 font-semibold"
                            : "text-black"
                        }`}
                      >
                        {item}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input area */}
            <input
              type="text"
              placeholder="Please input search text... "
              className="flex-1 h-10 px-3 py-2 border border-l-0 border-r-0 outline-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            ></input>

            <button
              onClick={onSearch}
              className="h-10 px-3 py-2 bg-blue-400 text-white rounded-r-sm hover:bg-blue-600 flex items-center gap-1 border"
            >
              <Search size={18} />
              Search
            </button>
          </div>

          {/* Resources Area(Card list) */}
          <div className="py-6 min-h-[300px] relative">
            {/* 正常卡片内容以及没有数据时的提醒 */}
            {currentData.length === 0 && loading === false ? (
              <div className={"text-center py-10 text-xl text-white italic"}>
                No resources found matching your criteria.
              </div>
            ) : (
              <div className="flex flex-col sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 卡片网格布局 */}
                {currentData.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    {/* 顶部内容区域 */}
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-2 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3 h-[50px]">
                        {item.description}
                      </p>
                    </div>

                    {/* 底部标签和操作按钮区域 */}
                    <div className="my-1 flex justify-between items-center">
                      {/* 关键词标签区域 */}
                      <div className="flex flex-wrap gap-1 max-w-[70%]">
                        {item.keywords.slice(0, 5).map((keyword, kIndex) => (
                          <span
                            key={kIndex}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md"
                          >
                            {keyword}
                          </span>
                        ))}
                        {item.keywords.length > 5 && (
                          <span className="text-xs px-2 py-1 text-blue-700">
                            + {item.keywords.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* 操作按钮
                      <button className="text-blue-600 hover:underline text-sm flex-shrink-0">
                        View →
                      </button> */}
                    </div>

                    {/* 作者邮箱和创建时间 */}
                    <div className="mt-2 flex justify-between">
                      <div className="flex items-center gap-1 text-[13px]">
                        <Mail size={18} className="text-orange-500" />
                        <p className="font-medium text-gray-600">
                          {item.author}
                        </p>
                      </div>
                      <p className="text-[13px] text-gray-800 font-semibold">
                        CreatedTime:{" "}
                        <span className="font-medium text-gray-600">
                          {item.createdTime}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 加载中的状态，加载蒙蔽和指示器 */}
            {loading ? (
              currentData.length > 0 ? (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-start justify-center rounded-lg z-10 my-6">
                  <div className="flex items-center gap-3 mt-40">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <div className="text-xl text-blue-500">
                      Loading Resources...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 mt-40">
                  <Loader2 size={48} className="animate-spin text-blue-500" />
                  <div className="text-xl text-blue-500">
                    Loading Resources...
                  </div>
                </div>
              )
            ) : null}
          </div>

          {/* Pagination Area */}
          {loading === false && currentData.length > 0 && (
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className={`hidden sm:block text-sm ${textColor}`}>
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {currentPage === totalPages
                      ? resourceList.length
                      : currentPage * pageSize}
                  </span>{" "}
                  of <span>{resourceList.length}</span> results
                </p>
              </div>

              <nav
                aria-label="Pagination"
                className="isolate inline-flex -space-x-px rounded-md"
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${textColor} border border-gray-700 focus:z-20 focus:outline-offset-0 transition ${
                    currentPage === 1
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-200"
                  }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex">
                  {(() => {
                    const pages: number[] = [];

                    // Ensure key pages are displayed: first page, current page, last page, etc
                    const add = (p: number) =>
                      !pages.includes(p) &&
                      p >= 1 &&
                      p <= totalPages &&
                      pages.push(p);

                    add(1);
                    add(currentPage - 1);
                    add(currentPage);
                    add(currentPage + 1);
                    add(totalPages);

                    pages.sort((a, b) => a - b);

                    return pages.map((p, i) => {
                      const isGap = pages[i + 1] && pages[i + 1] - p > 1;

                      return (
                        <React.Fragment key={p}>
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition ${textColor}
                            ${
                              currentPage === p
                                ? "bg-blue-600 border-blue-600"
                                : "hover:bg-gray-200/40 border border-gray-700"
                            }`}
                          >
                            {p}
                          </button>
                          {isGap && (
                            <span
                              className={`inline-flex items-center px-4 py-2 text-sm font-semibold border border-gray-700 ${textColor}`}
                            >
                              ...
                            </span>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${textColor} border border-gray-700 ${
                    currentPage === totalPages
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-200/40"
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
