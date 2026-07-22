import { useOutletContext } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, Loader2, Mail, Heart } from "lucide-react";
import TagRecords, {
  buildMenuData,
  type MenuDataItem,
  type MenuLeafItem,
} from "../util/record";
import {
  getFavoriteModels,
  toggleFavoriteModel,
  type FavoriteModel,
} from "../lib/userCenter.ts";

const BACK_URL = import.meta.env.VITE_BACK_URL;

interface ResourceItem {
  name: string;
  description: string;
  type: string;
  author: string;
  keywords: string[];
  createdTime: string;
}

interface ResourceFilter {
  categoryId: string[];
  keyword: string;
}

interface MenuItem {
  parent: number | null;
  child: number | null;
  subChild: number | null;
  subSubChild: number | null;
}

const isActivePath = (active: MenuItem, level: number, index: number) => {
  if (level === 1) return active.parent === index;
  if (level === 2) return active.parent !== null && active.child === index;
  if (level === 3) {
    return (
      active.parent !== null &&
      active.child !== null &&
      active.subChild === index
    );
  }
  if (level === 4) {
    return (
      active.parent !== null &&
      active.child !== null &&
      active.subChild !== null &&
      active.subSubChild === index
    );
  }
  return false;
};

const menuData: MenuDataItem[] = buildMenuData(TagRecords);
const categoryTitles = menuData.map((item) => item.title);

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
  const [resourceList, setResourceList] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { darkMode } = useOutletContext<OutletContextType>();
  const textColor = darkMode ? "text-white" : "text-black";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(categoryTitles[0]);
  const [inputValue, setInputValue] = useState("");
  const [activeResourceType, setActiveResourceType] = useState<
    "models" | "methods"
  >("models");
  const [favoriteModelNames, setFavoriteModelNames] = useState<Set<string>>(
    new Set(),
  );

  const refreshFavoriteModels = React.useCallback(async () => {
    const favorites = await getFavoriteModels();
    setFavoriteModelNames(
      new Set(favorites.map((item: FavoriteModel) => item.name)),
    );
  }, []);

  const inferResourceTypeByTopMenu = React.useCallback(
    (title: string): "models" | "methods" => {
      const normalizedTitle = title.toLowerCase();
      if (title.includes("方法") || normalizedTitle.includes("method")) {
        return "methods";
      }
      if (
        title.includes("模型") ||
        title.includes("模拟") ||
        normalizedTitle.includes("model")
      ) {
        return "models";
      }
      return activeResourceType;
    },
    [activeResourceType],
  );

  const onSearch = () => {
    let selectedMenuId: string | null = null;

    if (
      active.parent !== null &&
      active.child !== null &&
      active.subChild !== null &&
      active.subSubChild !== null
    ) {
      const level2 = menuData[active.parent].children[
        active.child
      ] as MenuDataItem;
      const level3 = level2.children[active.subChild] as MenuDataItem;
      const level4 = level3.children[active.subSubChild] as MenuLeafItem;
      selectedMenuId = level4.id || null;
    }

    if (activeResourceType === "methods") {
      fetchAndSetMethods([selectedMenuId || ""], inputValue);
    } else {
      fetchAndSetResources([selectedMenuId || ""], inputValue);
    }
  };

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(
    () => Math.ceil(resourceList.length / pageSize),
    [resourceList.length],
  );

  const currentData = useMemo(
    () =>
      resourceList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, resourceList],
  );

  const fetchResources = React.useCallback(async (filter: ResourceFilter) => {
    const { categoryId, keyword } = filter;
    const queryParams = new URLSearchParams();

    if (categoryId.length > 0) {
      queryParams.append("categoryId", categoryId.join(","));
    }
    if (keyword) {
      queryParams.append("keyword", keyword);
    }

    const url = `${BACK_URL}/resource/findModels?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      const result: ResourceItem[] = await response.json();
      return { data: result, total: result.length };
    } catch {
      return { data: [], total: 0 };
    }
  }, []);

  const fetchAndSetResources = React.useCallback(
    async (categoryId: string[] | [], keyword: string) => {
      setLoading(true);
      setCurrentPage(1);

      const { data } = await fetchResources({
        categoryId,
        keyword,
      });

      setResourceList(data);
      setLoading(false);
    },
    [fetchResources],
  );

  const fetchMethods = React.useCallback(async (filter: ResourceFilter) => {
    const { categoryId, keyword } = filter;
    const queryParams = new URLSearchParams();

    if (categoryId.length > 0) {
      queryParams.append("categoryId", categoryId.join(","));
    }
    if (keyword) {
      queryParams.append("keyword", keyword);
    }

    const url = `${BACK_URL}/resource/findMethods?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      const result: ResourceItem[] = await response.json();
      return { data: result, total: result.length };
    } catch {
      return { data: [], total: 0 };
    }
  }, []);

  const fetchAndSetMethods = React.useCallback(
    async (categoryId: string[] | [], keyword: string) => {
      setLoading(true);
      setCurrentPage(1);

      const { data } = await fetchMethods({
        categoryId,
        keyword,
      });

      setResourceList(data);
      setLoading(false);
    },
    [fetchMethods],
  );

  const clickForActiveAndFetchResources = React.useCallback(
    (
      parentIndex: number | null,
      childIndex: number | null,
      subChildIndex: number | null,
      subSubChildIndex: number | null,
      node: MenuDataItem | MenuLeafItem,
      resourceType?: "models" | "methods",
    ) => {
      setActive({
        parent: parentIndex,
        child: childIndex,
        subChild: subChildIndex,
        subSubChild: subSubChildIndex,
      });

      const currentResourceType = resourceType ?? activeResourceType;
      const fetchFn =
        currentResourceType === "methods"
          ? fetchAndSetMethods
          : fetchAndSetResources;

      if ("children" in node) {
        fetchFn(node.id, inputValue);
      } else {
        fetchFn([node.id], inputValue);
      }
    },
    [activeResourceType, fetchAndSetMethods, fetchAndSetResources, inputValue],
  );

  const handleInitialToggle = (data: MenuDataItem[]) => {
    const initialLevel2: { [key: string]: boolean } = {};
    const initialLevel3: { [key: string]: boolean } = {};

    data.forEach((parent, parentIndex) => {
      parent.children.forEach((child, childIndex) => {
        if (typeof child !== "string") {
          const childKey = `${parentIndex}-${childIndex}`;
          initialLevel2[childKey] = true;
          const childObj = child as MenuDataItem;
          childObj.children.forEach((_, subChildIndex) => {
            const subChildKey = `${parentIndex}-${childIndex}-${subChildIndex}`;
            initialLevel3[subChildKey] = true;
          });
        }
      });
    });

    return { initialLevel2, initialLevel3 };
  };

  const { initialLevel2, initialLevel3 } = useMemo(
    () => handleInitialToggle(menuData),
    [],
  );
  const [level2Open, setLevel2Open] = useState<{ [key: string]: boolean }>(
    () => initialLevel2,
  );
  const [level3Open, setLevel3Open] = useState<{ [key: string]: boolean }>(
    () => initialLevel3,
  );

  const handleLevlel2Toggle = (parentIndex: number, childIndex: number) => {
    const key = `${parentIndex}-${childIndex}`;
    setLevel2Open((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLevlel3Toggle = (
    parentIndex: number,
    childIndex: number,
    subChildIndex: number,
  ) => {
    const key = `${parentIndex}-${childIndex}-${subChildIndex}`;
    setLevel3Open((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const initialData = async () => {
      await fetchAndSetResources([], "");
      await refreshFavoriteModels();
    };

    initialData();

    setActive({
      parent: null,
      child: null,
      subChild: null,
      subSubChild: null,
    });
  }, [fetchAndSetResources, refreshFavoriteModels]);

  const handleToggleFavoriteModel = async (item: ResourceItem) => {
    const favorited = await toggleFavoriteModel({
      name: item.name,
      description: item.description,
      source: "model-library",
    });
    await refreshFavoriteModels();
    alert(
      favorited ? `已收藏模型：${item.name}` : `已取消收藏模型：${item.name}`,
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 mx-30">
        <aside className="w-1/5 p-4 m-10 bg-gray-50 border-r border-gray-200 shadow-ms shadow-white">
          {menuData.map((menu: MenuDataItem, parentIndex: number) => (
            <div key={parentIndex} className="mt-3">
              <button
                className={`flex gap-2 w-full pl-1 font-sans text-[18px] font-bold text-black ${
                  active.parent === parentIndex
                    ? "text-white bg-slate-900 shadow-sm"
                    : "text-black"
                } text-left mb-2`}
                onClick={() => {
                  const nextResourceType = inferResourceTypeByTopMenu(
                    menu.title,
                  );
                  setActiveResourceType(nextResourceType);
                  clickForActiveAndFetchResources(
                    parentIndex,
                    null,
                    null,
                    null,
                    menu,
                    nextResourceType,
                  );
                }}
              >
                {menu.title}
              </button>
              <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-700 via-blue-900 to-transparent"></div>

              <div className="flex flex-col gap-1">
                {menu.children.map((secondLevelChildren, childIndex) => {
                  const isL2Active =
                    isActivePath(active, 2, childIndex) &&
                    active.parent === parentIndex;

                  const key = `${parentIndex}-${childIndex}`;
                  const isL2Open = level2Open[key];

                  if (typeof secondLevelChildren === "string") {
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
                  }

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
                              secondLevelChildrenObj,
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
                                thirdLevelChildren as MenuDataItem;

                              return (
                                <div key={subChildIndex}>
                                  <div
                                    className={`flex items-center w-full ${
                                      isL3Active && active.subSubChild === null
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
                                          subChildIndex,
                                        );
                                      }}
                                    />
                                    <button
                                      className="w-full pl-4 font-sans text-[15px] text-left text-black"
                                      onClick={() =>
                                        clickForActiveAndFetchResources(
                                          parentIndex,
                                          childIndex,
                                          subChildIndex,
                                          null,
                                          thirdLevelChildrenObj,
                                        )
                                      }
                                    >
                                      {thirdLevelChildrenObj.title}
                                    </button>
                                  </div>

                                  {isL3Open && (
                                    <div className="flex flex-col gap-1 mt-1">
                                      {(
                                        thirdLevelChildrenObj.children as MenuLeafItem[]
                                      ).map(
                                        (
                                          fourthLevelChildren,
                                          subSubChildIndex,
                                        ) => {
                                          const isL4Active =
                                            isActivePath(
                                              active,
                                              4,
                                              subSubChildIndex,
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
                                                  fourthLevelChildren,
                                                )
                                              }
                                            >
                                              {fourthLevelChildren.title}
                                            </button>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <main className="flex-1 m-10">
          <div className="flex items-center w-full pb-3">
            <div className="relative h-10">
              <button
                className="flex items-center h-full gap-1 px-3 rounded-l-sm bg-blue-200 hover:bg-blue-500 border text-sm text-black"
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

            <input
              type="text"
              placeholder="请输入搜索内容..."
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
              搜索
            </button>
          </div>

          <div className="py-6 min-h-[300px] relative">
            {currentData.length === 0 && loading === false ? (
              <div className={"text-center py-10 text-xl text-white italic"}>
                暂未找到符合条件的资源。
              </div>
            ) : (
              <div className="flex flex-col sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentData.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="text-lg font-semibold text-black mb-0 leading-6 line-clamp-1">
                          {item.name}
                        </h3>
                        {activeResourceType === "models" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavoriteModel(item);
                            }}
                            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                              favoriteModelNames.has(item.name)
                                ? "border-rose-300 bg-rose-50 text-rose-600"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Heart
                              size={12}
                              className={
                                favoriteModelNames.has(item.name)
                                  ? "fill-rose-500 text-rose-500"
                                  : "text-gray-600"
                              }
                            />
                            {favoriteModelNames.has(item.name)
                              ? "已收藏"
                              : "收藏"}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3 h-[50px]">
                        {item.description}
                      </p>
                    </div>

                    <div className="my-1 flex justify-between items-center">
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
                            + 另外 {item.keywords.length - 5} 个
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <div className="flex items-center gap-1 text-[13px]">
                        <Mail size={18} className="text-orange-500" />
                        <p className="font-medium text-gray-600">
                          {item.author}
                        </p>
                      </div>
                      <p className="text-[13px] text-gray-800 font-semibold">
                        创建时间：{" "}
                        <span className="font-medium text-gray-600">
                          {item.createdTime}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              currentData.length > 0 ? (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-start justify-center rounded-lg z-10 my-6">
                  <div className="flex items-center gap-3 mt-40">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <div className="text-xl text-blue-500">资源加载中...</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 mt-40">
                  <Loader2 size={48} className="animate-spin text-blue-500" />
                  <div className="text-xl text-blue-500">资源加载中...</div>
                </div>
              )
            ) : null}
          </div>

          {loading === false && currentData.length > 0 && (
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className={`hidden sm:block text-sm ${textColor}`}>
                  显示第{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  到{" "}
                  <span className="font-medium">
                    {currentPage === totalPages
                      ? resourceList.length
                      : currentPage * pageSize}
                  </span>{" "}
                  条，共 <span>{resourceList.length}</span> 条结果
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
                  上一页
                </button>

                <div className="hidden sm:flex">
                  {(() => {
                    const pages: number[] = [];

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
                  下一页
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
