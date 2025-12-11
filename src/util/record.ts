// 定义标签树中每个节点的类型
export interface TagNode {
    _id: string;
    childrenId: string;
    nameCn: string;
    nameEn: string;
    t: string;
    parentId: string | null;
    children?: TagNode[];
}

// 定义顶层数据的类型
export type TagRecords = TagNode[];

// 定义资源记录的类型
const records: TagRecords = [
    {
        _id: "9f7816be-c6e3-44b6-addf-98251e3d2e19",
        childrenId: "[ \"6b2c8632-964a-4a65-a6c5-c360b2b515f0\", \"77e7482c-1844-4bc3-ae37-cb09b61572da\", \"396cc739-ef33-4332-8d5d-9a67c89567c7\" ]",
        nameCn: "面向应用的分类",
        nameEn: "Application-focused categories",
        t: "toolsTagTree.applicationFocusedCategories",
        parentId: null,
        children: [
            {
                _id: "6b2c8632-964a-4a65-a6c5-c360b2b515f0",
                childrenId: "[ \"a24cba2b-9ce1-44de-ac68-8ec36a535d0e\", \"75aee2b7-b39a-4cd0-9223-3b7ce755e457\", \"1bf4f381-6bd8-4716-91ab-5a56e51bd2f9\", \"8f4d4fca-4d09-49b4-b6f7-5021bc57d0e5\", \"d33a1ebe-b2f5-4ed3-9c76-78cfb61c23ee\", \"d3ba6e0b-78ec-4fe8-9985-4d5708f28e3e\" ]",
                nameCn: "自然视角",
                nameEn: "Natural-perspective",
                t: "toolsTagTree.naturalPerspective",
                parentId: "9f7816be-c6e3-44b6-addf-98251e3d2e19",
                children: [
                    {
                        _id: "a24cba2b-9ce1-44de-ac68-8ec36a535d0e",
                        childrenId: "[ ]",
                        nameCn: "陆地圈",
                        nameEn: "Land regions",
                        t: "toolsTagTree.landRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    },
                    {
                        _id: "75aee2b7-b39a-4cd0-9223-3b7ce755e457",
                        childrenId: "[ ]",
                        nameCn: "海洋圈",
                        nameEn: "Ocean regions",
                        t: "toolsTagTree.oceanRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    },
                    {
                        _id: "1bf4f381-6bd8-4716-91ab-5a56e51bd2f9",
                        childrenId: "[ ]",
                        nameCn: "冰冻圈",
                        nameEn: "Frozen regions",
                        t: "toolsTagTree.frozenRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    },
                    {
                        _id: "8f4d4fca-4d09-49b4-b6f7-5021bc57d0e5",
                        childrenId: "[ ]",
                        nameCn: "大气圈",
                        nameEn: "Atmospheric regions",
                        t: "toolsTagTree.atmosphericRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    },
                    {
                        _id: "d33a1ebe-b2f5-4ed3-9c76-78cfb61c23ee",
                        childrenId: "[ ]",
                        nameCn: "太空-地球",
                        nameEn: "Space-earth regions",
                        t: "toolsTagTree.spaceEarthRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    },
                    {
                        _id: "d3ba6e0b-78ec-4fe8-9985-4d5708f28e3e",
                        childrenId: "[ ]",
                        nameCn: "固体地球",
                        nameEn: "Solid-earth regions",
                        t: "toolsTagTree.solidEarthRegions",
                        parentId: "6b2c8632-964a-4a65-a6c5-c360b2b515f0"
                    }
                ]
            },
            {
                _id: "77e7482c-1844-4bc3-ae37-cb09b61572da",
                childrenId: "[ \"808e74a4-41c6-4558-a850-4daec1f199df\", \"40534cf8-039a-4a0a-8db9-7c9bff484190\", \"cf9cd106-b873-4a8a-9336-dd72398fc769\" ]",
                nameCn: "人文视角",
                nameEn: "Human-perspective",
                t: "toolsTagTree.humanPerspective",
                parentId: "9f7816be-c6e3-44b6-addf-98251e3d2e19",
                children: [
                    {
                        _id: "808e74a4-41c6-4558-a850-4daec1f199df",
                        childrenId: "[ ]",
                        nameCn: "发展活动",
                        nameEn: "Development activities",
                        t: "toolsTagTree.developmentActivities",
                        parentId: "77e7482c-1844-4bc3-ae37-cb09b61572da"
                    },
                    {
                        _id: "40534cf8-039a-4a0a-8db9-7c9bff484190",
                        childrenId: "[ ]",
                        nameCn: "社会活动",
                        nameEn: "Social activities",
                        t: "toolsTagTree.socialActivities",
                        parentId: "77e7482c-1844-4bc3-ae37-cb09b61572da"
                    },
                    {
                        _id: "cf9cd106-b873-4a8a-9336-dd72398fc769",
                        childrenId: "[ ]",
                        nameCn: "经济活动",
                        nameEn: "Economic activities",
                        t: "toolsTagTree.economicActivities",
                        parentId: "77e7482c-1844-4bc3-ae37-cb09b61572da"
                    }
                ]
            },
            {
                _id: "396cc739-ef33-4332-8d5d-9a67c89567c7",
                childrenId: "[ \"14130969-fda6-41ea-aa32-0af43104840b\", \"e56c1254-70b8-4ff4-b461-b8fa3039944e\" ]",
                nameCn: "综合视角",
                nameEn: "Integrated-perspective",
                t: "toolsTagTree.integratedPerspective",
                parentId: "9f7816be-c6e3-44b6-addf-98251e3d2e19",
                children: [
                    {
                        _id: "14130969-fda6-41ea-aa32-0af43104840b",
                        childrenId: "[ ]",
                        nameCn: "全球尺度",
                        nameEn: "Global scale",
                        t: "toolsTagTree.globalScale",
                        parentId: "396cc739-ef33-4332-8d5d-9a67c89567c7"
                    },
                    {
                        _id: "e56c1254-70b8-4ff4-b461-b8fa3039944e",
                        childrenId: "[ ]",
                        nameCn: "区域尺度",
                        nameEn: "Regional scale",
                        t: "toolsTagTree.regionalScale",
                        parentId: "396cc739-ef33-4332-8d5d-9a67c89567c7"
                    }
                ]
            }
        ]
    },
    {
        _id: "5f74872a-196c-4889-a7b8-9c9b04e30718",
        childrenId: "[ \"4785308f-b2ef-4193-a74b-b9fe025cbc5e\", \"746887cf-d490-4080-9754-1dc389986cf2\" ]",
        nameCn: "面向方法的分类",
        nameEn: "Method-focused categories",
        t: "toolsTagTree.methodFocusedCategories",
        parentId: null,
        children: [
            {
                _id: "4785308f-b2ef-4193-a74b-b9fe025cbc5e",
                childrenId: "[ \"afa99af9-4224-4fac-a81f-47a7fb663dba\", \"f20411a5-2f55-4ee9-9590-c2ec826b8bd5\", \"1c876281-a032-4575-8eba-f1a8fb4560d8\", \"c6fcc899-8ca4-4269-a21e-a39d38c034a6\" ]",
                nameCn: "数据视角",
                nameEn: "Data-perspective",
                t: "toolsTagTree.dataPerspective",
                parentId: "5f74872a-196c-4889-a7b8-9c9b04e30718",
                children: [
                    {
                        _id: "afa99af9-4224-4fac-a81f-47a7fb663dba",
                        childrenId: "[ ]",
                        nameCn: "地理信息分析",
                        nameEn: "Geoinformation analysis",
                        t: "toolsTagTree.geoinformationAnalysis",
                        parentId: "4785308f-b2ef-4193-a74b-b9fe025cbc5e"
                    },
                    {
                        _id: "f20411a5-2f55-4ee9-9590-c2ec826b8bd5",
                        childrenId: "[ ]",
                        nameCn: "遥感分析",
                        nameEn: "Remote sensing analysis",
                        t: "toolsTagTree.remoteSensingAnalysis",
                        parentId: "4785308f-b2ef-4193-a74b-b9fe025cbc5e"
                    },
                    {
                        _id: "1c876281-a032-4575-8eba-f1a8fb4560d8",
                        childrenId: "[ ]",
                        nameCn: "地统计分析",
                        nameEn: "Geostatistical analysis",
                        t: "toolsTagTree.geostatisticalAnalysis",
                        parentId: "4785308f-b2ef-4193-a74b-b9fe025cbc5e"
                    },
                    {
                        _id: "c6fcc899-8ca4-4269-a21e-a39d38c034a6",
                        childrenId: "[ ]",
                        nameCn: "智能计算分析",
                        nameEn: "Intelligent computation analysis",
                        t: "toolsTagTree.intelligentComputationAnalysis",
                        parentId: "4785308f-b2ef-4193-a74b-b9fe025cbc5e"
                    }
                ]
            },
            {
                _id: "746887cf-d490-4080-9754-1dc389986cf2",
                childrenId: "[ \"1d564d0f-51c6-40ca-bd75-3f9489ccf1d6\", \"63266a14-d7f9-44cb-8204-c877eaddcaa1\", \"6d1efa2c-830d-4546-b759-c66806c4facc\", \"6952d5b2-cb0f-4ba7-96fd-5761dd566344\" ]",
                nameCn: "过程视角",
                nameEn: "Process-perspective",
                t: "toolsTagTree.processPerspective",
                parentId: "5f74872a-196c-4889-a7b8-9c9b04e30718",
                children: [
                    {
                        _id: "1d564d0f-51c6-40ca-bd75-3f9489ccf1d6",
                        childrenId: "[ ]",
                        nameCn: "物理过程计算",
                        nameEn: "Physical process calculation",
                        t: "toolsTagTree.physicalProcessCalculation",
                        parentId: "746887cf-d490-4080-9754-1dc389986cf2"
                    },
                    {
                        _id: "63266a14-d7f9-44cb-8204-c877eaddcaa1",
                        childrenId: "[ ]",
                        nameCn: "化学过程计算",
                        nameEn: "Chemical process calculation",
                        t: "toolsTagTree.chemicalProcessCalculation",
                        parentId: "746887cf-d490-4080-9754-1dc389986cf2"
                    },
                    {
                        _id: "6d1efa2c-830d-4546-b759-c66806c4facc",
                        childrenId: "[ ]",
                        nameCn: "生物过程计算",
                        nameEn: "Biological process calculation",
                        t: "toolsTagTree.biologicalProcessCalculation",
                        parentId: "746887cf-d490-4080-9754-1dc389986cf2"
                    },
                    {
                        _id: "6952d5b2-cb0f-4ba7-96fd-5761dd566344",
                        childrenId: "[ ]",
                        nameCn: "人类活动计算",
                        nameEn: "Human-activity calculation",
                        t: "toolsTagTree.humanActivityCalculation",
                        parentId: "746887cf-d490-4080-9754-1dc389986cf2"
                    }
                ]
            }
        ]
    }
]
export default records;

// 定义页节点结构
export interface MenuLeafItem {
    id: string; // 存储用于查询的normalTags
    title: string; // 存储用于显示的nameEn
}

// 定义MenuData结构
export interface MenuDataItem {
  title: string;
  children: (MenuLeafItem | MenuDataItem)[]; // 子节点可以是MenuLeafItem或MenuDataItem
}

// 转换为四级嵌套结构
export function buildMenuData(records: TagRecords): MenuDataItem[] {
    const modelResouceChildren = records.map(secondLevelChild => {
        // 第二级目录
        const secondLevelChildren: MenuDataItem = {
            title: secondLevelChild.nameEn,
            children: []
        };

        if (secondLevelChild.children) {
            // 第三级目录
            secondLevelChild.children.forEach(thirdLevelChild => {
                const thirdLevelChildren: MenuDataItem = {
                    title: thirdLevelChild.nameEn,
                    children: []
                };

                if (thirdLevelChild.children) {
                    // 第四级目录
                    thirdLevelChildren.children = thirdLevelChild.children.map(fourthLevelChild => ({
                        id: fourthLevelChild._id,
                        title: fourthLevelChild.nameEn
                    })) 
                };

                secondLevelChildren.children.push(thirdLevelChildren);
            });
        };

        return secondLevelChildren;
    });

    return [
        {
            title: "Model Resources",
            children: modelResouceChildren
        },
        {
            title: "Method Resources",
            children: []
        },
        {
            title: "Data Resources",
            children: []
        }
    ]
}