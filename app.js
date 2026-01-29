/*
 * SMART on FHIR 病人資源關聯圖
 * - 取得指定病人的相關資源
 * - 以關聯圖呈現 Patient 與資源間的關係
 */

const RESOURCE_TYPES = [
    // Clinical (临床)
    "AllergyIntolerance",
    "CarePlan",
    "CareTeam",
    "ClinicalImpression",
    "Condition",
    "DetectedIssue",
    "FamilyMemberHistory",
    "Goal",
    "Procedure",
    "RiskAssessment",
    
    // Diagnostics (诊断)
    "BodyStructure",
    "DiagnosticReport",
    "ImagingStudy",
    "Media",
    "Observation",
    "Specimen",
    
    // Medications (药物)
    "Immunization",
    "MedicationAdministration",
    "MedicationDispense",
    "MedicationRequest",
    "MedicationStatement",
    
    // Workflow (工作流)
    "Appointment",
    "AppointmentResponse",
    "DeviceRequest",
    "NutritionOrder",
    "ServiceRequest",
    "Task",
    "VisionPrescription",
    
    // Financial (财务)
    "Account",
    "ChargeItem",
    "Claim",
    "ClaimResponse",
    "Coverage",
    "CoverageEligibilityRequest",
    "CoverageEligibilityResponse",
    "EnrollmentRequest",
    "EnrollmentResponse",
    "ExplanationOfBenefit",
    "Invoice",
    "PaymentNotice",
    "PaymentReconciliation",
    
    // Administrative (行政)
    "Encounter",
    "EpisodeOfCare",
    "Flag",
    
    // Documents (文档)
    "Composition",
    "DocumentManifest",
    "DocumentReference",
    "QuestionnaireResponse",
    
    // Others (其他)
    "Communication",
    "CommunicationRequest",
    "DeviceUseStatement",
    "SupplyDelivery",
    "SupplyRequest"
];

const RESOURCE_LABELS = {
    // Core
    Patient: "病人",
    Practitioner: "執業人員",
    Organization: "組織",
    
    // Clinical
    AllergyIntolerance: "過敏",
    CarePlan: "照護計畫",
    CareTeam: "照護團隊",
    ClinicalImpression: "臨床印象",
    Condition: "診斷/問題",
    DetectedIssue: "檢測問題",
    FamilyMemberHistory: "家族史",
    Goal: "照護目標",
    Procedure: "處置/手術",
    RiskAssessment: "風險評估",
    
    // Diagnostics
    BodyStructure: "身體結構",
    DiagnosticReport: "診斷報告",
    ImagingStudy: "影像檢查",
    Media: "媒體",
    Observation: "觀察結果",
    Specimen: "檢體",
    
    // Medications
    Immunization: "疫苗接種",
    MedicationAdministration: "給藥記錄",
    MedicationDispense: "配藥記錄",
    MedicationRequest: "用藥處方",
    MedicationStatement: "用藥聲明",
    
    // Workflow
    Appointment: "預約",
    AppointmentResponse: "預約回應",
    DeviceRequest: "設備申請",
    NutritionOrder: "營養醫囑",
    ServiceRequest: "醫令/檢查",
    Task: "任務",
    VisionPrescription: "視力處方",
    
    // Financial
    Account: "帳戶",
    ChargeItem: "收費項目",
    Claim: "醫療申報",
    ClaimResponse: "申報回應",
    Coverage: "保險範圍",
    CoverageEligibilityRequest: "資格查詢",
    CoverageEligibilityResponse: "資格回應",
    EnrollmentRequest: "投保申請",
    EnrollmentResponse: "投保回應",
    ExplanationOfBenefit: "給付說明",
    Invoice: "帳單",
    PaymentNotice: "付款通知",
    PaymentReconciliation: "付款對帳",
    
    // Administrative
    Encounter: "就醫紀錄",
    EpisodeOfCare: "照護事件",
    Flag: "標記",
    
    // Documents
    Composition: "文件組成",
    DocumentManifest: "文件清單",
    DocumentReference: "文件",
    QuestionnaireResponse: "問卷回應",
    
    // Others
    Communication: "溝通記錄",
    CommunicationRequest: "溝通請求",
    DeviceUseStatement: "設備使用",
    SupplyDelivery: "物資交付",
    SupplyRequest: "物資申請"
};

const TYPE_COLORS = {
    Patient: "#1d4ed8",
    
    // Clinical
    AllergyIntolerance: "#e11d48",
    CarePlan: "#3b82f6",
    CareTeam: "#0ea5e9",
    ClinicalImpression: "#8b5cf6",
    Condition: "#ef4444",
    DetectedIssue: "#dc2626",
    FamilyMemberHistory: "#f472b6",
    Goal: "#06b6d4",
    Procedure: "#a855f7",
    RiskAssessment: "#c026d3",
    
    // Diagnostics
    BodyStructure: "#84cc16",
    DiagnosticReport: "#f59e0b",
    ImagingStudy: "#10b981",
    Media: "#14b8a6",
    Observation: "#14b8a6",
    Specimen: "#059669",
    
    // Medications
    Immunization: "#22c55e",
    MedicationAdministration: "#fb923c",
    MedicationDispense: "#fdba74",
    MedicationRequest: "#f97316",
    MedicationStatement: "#ea580c",
    
    // Workflow
    Appointment: "#2563eb",
    AppointmentResponse: "#3b82f6",
    DeviceRequest: "#7c3aed",
    NutritionOrder: "#65a30d",
    ServiceRequest: "#8b5cf6",
    Task: "#6366f1",
    VisionPrescription: "#4f46e5",
    
    // Financial
    Account: "#0891b2",
    ChargeItem: "#0e7490",
    Claim: "#ec4899",
    ClaimResponse: "#db2777",
    Coverage: "#06b6d4",
    CoverageEligibilityRequest: "#0284c7",
    CoverageEligibilityResponse: "#0369a1",
    EnrollmentRequest: "#7dd3fc",
    EnrollmentResponse: "#38bdf8",
    ExplanationOfBenefit: "#f472b6",
    Invoice: "#fbbf24",
    PaymentNotice: "#fcd34d",
    PaymentReconciliation: "#fde047",
    
    // Administrative
    Encounter: "#0ea5e9",
    EpisodeOfCare: "#0284c7",
    Flag: "#f59e0b",
    
    // Documents
    Composition: "#64748b",
    DocumentManifest: "#475569",
    DocumentReference: "#64748b",
    QuestionnaireResponse: "#6366f1",
    
    // Others
    Communication: "#a78bfa",
    CommunicationRequest: "#8b5cf6",
    DeviceUseStatement: "#818cf8",
    SupplyDelivery: "#4ade80",
    SupplyRequest: "#22c55e",
    
    Unknown: "#94a3b8"
};

let client = null;
let patientResource = null;
let resourcesByType = {};
let network = null;
let nodes = null;
let edges = null;
let nodeMeta = new Map();
let resourceMap = new Map();
let selectedNodeId = null; // 追蹤目前選中的節點

const graphContainer = document.getElementById("graph");
const graphLoading = document.getElementById("graph-loading");
const patientCard = document.getElementById("patient-card");
const statsCard = document.getElementById("stats-card");
const filterList = document.getElementById("filter-list");
const detailCard = document.getElementById("detail-card");
const errorBanner = document.getElementById("error-banner");
const reloadBtn = document.getElementById("reload-btn");
const fitBtn = document.getElementById("fit-btn");
const nodeSearch = document.getElementById("node-search");

// 常用的 Resource 類型（默認顯示）
const COMMON_RESOURCES = new Set([
    "Patient", "Observation", "Condition", "Procedure", 
    "Encounter", "MedicationStatement", "Immunization",
    "DiagnosticReport", "AllergyIntolerance", "Medication",
    "Claim", "ExplanationOfBenefit", "CarePlan", "Goal"
]);

reloadBtn.addEventListener("click", () => initializeApp(true));
fitBtn.addEventListener("click", () => network && network.fit({ animation: true }));
nodeSearch.addEventListener("keyup", handleSearch);

// 資源篩選收合功能
const filterCollapseHeader = document.querySelector(".collapsible-header");
const filterCollapseIcon = document.getElementById("filter-collapse-icon");
const filterListContent = document.getElementById("filter-list");

if (filterCollapseHeader && filterCollapseIcon && filterListContent) {
    filterCollapseHeader.addEventListener("click", () => {
        filterListContent.classList.toggle("collapsed");
        filterCollapseIcon.classList.toggle("collapsed");
    });
}

if (typeof FHIR !== "undefined" && FHIR.oauth2) {
    FHIR.oauth2.ready()
        .then((fhirClient) => {
            client = fhirClient;
            initializeApp(false);
        })
        .catch((error) => {
            console.error("SMART on FHIR 初始化失敗:", error);
            showError("SMART on FHIR 連線失敗", { message: "請點擊「載入範例」查看測試資料" });
        });
} else {
    console.warn("非 SMART on FHIR 環境");
    showError("非 SMART 環境", { message: "請點擊「載入範例」查看測試資料" });
}

async function initializeApp(forceReload) {
    if (!client) {
        return;
    }

    if (forceReload) {
        resetUI();
    }

    setGraphLoading(true);

    try {
        if (typeof vis === "undefined") {
            throw new Error("找不到 vis-network 圖形套件，請確認網路可連線或 CDN 未被阻擋。");
        }

        const patientId = client.patient && client.patient.id ? client.patient.id : null;
        if (!patientId) {
            throw new Error("找不到病人識別資訊，請確認 launch context。");
        }

        patientResource = await requestAll(`Patient/${patientId}`);
        renderPatientCard(patientResource);

        // 優先使用 $everything 方式
        const success = await loadResourcesWithEverything(patientId);
        
        if (!success) {
            await loadResourcesIndividually(patientId);
        }

        renderStats();
        renderFilters();
        buildGraph();
    } catch (error) {
        showError("載入資料時發生錯誤", error);
    } finally {
        setGraphLoading(false);
    }
}

async function loadResourcesWithEverything(patientId) {
    try {
        console.time("$everything 查詢耗時");
        
        // 使用 _count 參數控制每頁數量，允許分頁
        let allResources = [];
        let nextUrl = `Patient/${patientId}/$everything?_count=500`;
        let pageCount = 0;
        let totalEntriesReceived = 0;

        // 處理分頁
        while (nextUrl && pageCount < 10) { // 最多 10 頁，避免無限循環
            pageCount++;
            
            try {
                // 增加超時時間到 60 秒，用於大量資源
                const options = { pageLimit: 0, flat: true, timeout: 60000 };
                const response = await client.request(nextUrl, options);
                
                let pageEntries = [];
                
                // flat: true 會直接返回資源數組，而不是 Bundle 結構
                if (Array.isArray(response)) {
                    pageEntries = response;
                } else if (response && response.entry && Array.isArray(response.entry)) {
                    pageEntries = response.entry;
                } else {
                    console.warn(`第 ${pageCount} 頁返回未知結構:`, response);
                }

                if (pageEntries.length > 0) {
                    allResources = allResources.concat(pageEntries);
                    totalEntriesReceived += pageEntries.length;
                }

                // 檢查是否有下一頁
                nextUrl = null;
                if (response && response.link) {
                    const nextLink = response.link.find((link) => link.relation === "next");
                    if (nextLink && nextLink.url) {
                        nextUrl = nextLink.url;
                    }
                }
            } catch (pageError) {
                console.error(`第 ${pageCount} 頁查詢失敗:`, pageError.message);
                // 如果單頁查詢失敗但已有部分結果，繼續使用
                if (allResources.length > 0) {
                    console.warn(`已取得 ${allResources.length} 項資源，停止分頁`);
                    break;
                }
                throw pageError;
            }
        }
        
        if (allResources.length === 0) {
            console.warn("$everything 返回空結果");
            return false;
        }

        // 初始化所有資源類型
        resourcesByType = {};
        RESOURCE_TYPES.forEach((type) => {
            resourcesByType[type] = [];
        });

        // 解析資源：flat: true 返回的直接是資源對象，無需再從 entry.resource 提取
        allResources.forEach((item, index) => {
            let resource = null;
            
            // 格式1：flat: true 時返回的直接是資源對象
            if (item.resourceType) {
                resource = item;
            }
            // 格式2：未使用 flat 時，可能是 entry.resource
            else if (item.resource && item.resource.resourceType) {
                resource = item.resource;
            }
            
            if (resource && resource.resourceType) {
                const type = resource.resourceType;
                if (!resourcesByType[type]) {
                    resourcesByType[type] = [];
                }
                resourcesByType[type].push(resource);
            } else {
                if (index === 0) {
                    console.warn("無法解析第一個資源:", item);
                }
            }
        });

        const summary = Object.entries(resourcesByType)
            .filter(([, items]) => items.length > 0)
            .map(([type, items]) => `${type}: ${items.length}`)
            .join(", ");
        
        return true;
    } catch (error) {
        console.error("$everything 查詢失敗:", error.message, error);
        return false;
    }
}

async function loadResourcesIndividually(patientId) {
    resourcesByType = {};
    const failures = [];
    
    console.time("逐個查詢耗時");
    
    // 減少查詢數量：改用 100 而非 1000
    const resourcePromises = RESOURCE_TYPES.map(async (type) => {
        try {
            const result = await fetchResourcesForType(type, patientId);
            resourcesByType[type] = result;
        } catch (error) {
            resourcesByType[type] = [];
            failures.push({ type, error: error.message });
        }
    });

    await Promise.all(resourcePromises);
    console.timeEnd("逐個查詢耗時");

    if (failures.length) {
        const failureList = failures.map((item) => `${item.type}(${item.error})`).join(", ");
        showError("部分資源無法載入，已略過", { message: failureList });
    }
}

function resetUI() {
    errorBanner.style.display = "none";
    patientCard.innerHTML = "<div class=\"loading\">載入病人資料中...</div>";
    statsCard.innerHTML = "<div class=\"loading\">統計載入中...</div>";
    filterList.innerHTML = "";
    detailCard.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-hand-pointer"></i>
            點選節點查看詳細資訊
        </div>
    `;
}

function setGraphLoading(isLoading) {
    graphLoading.style.display = isLoading ? "flex" : "none";
}

function showError(message, error) {
    errorBanner.style.display = "block";
    const errorText = error && error.message ? error.message : "未知錯誤";
    errorBanner.innerHTML = `
        <strong>${message}</strong>
        <div>${errorText}</div>
    `;
}

async function requestAll(url) {
    const result = await client.request(url, { pageLimit: 0, flat: true });
    if (Array.isArray(result)) {
        return result;
    }
    if (result && result.resourceType) {
        return result;
    }
    if (result && result.entry) {
        return result.entry.map((entry) => entry.resource).filter(Boolean);
    }
    return [];
}

async function fetchResourcesForType(type, patientId) {
    const queries = buildSearchCandidates(type, patientId);
    let results = [];

    for (const query of queries) {
        try {
            const response = await requestAll(`${type}?${query}`);
            if (Array.isArray(response) && response.length) {
                results = mergeResources(results, response);
            }
        } catch (error) {
            continue;
        }
    }

    return results;
}

function buildSearchCandidates(type, patientId) {
    const paramSets = {
        Encounter: ["patient"],
        Condition: ["patient", "subject"],
        Observation: ["patient", "subject"],
        MedicationRequest: ["patient", "subject"],
        Procedure: ["patient", "subject"],
        Immunization: ["patient"],
        AllergyIntolerance: ["patient"],
        DiagnosticReport: ["patient", "subject"],
        CarePlan: ["patient", "subject"],
        ServiceRequest: ["patient", "subject"],
        QuestionnaireResponse: ["patient", "subject"],
        DocumentReference: ["patient", "subject"],
        ImagingStudy: ["patient"],
        Claim: ["patient"],
        ExplanationOfBenefit: ["patient"],
        Coverage: ["patient", "beneficiary"]
    };

    const params = paramSets[type] || ["patient", "subject"];
    const queries = [];

    params.forEach((param) => {
        queries.push(`${param}=${patientId}`);
        if (param === "patient" || param === "subject" || param === "beneficiary") {
            queries.push(`${param}=Patient/${patientId}`);
        }
    });

    return queries.map((query) => `${query}&_count=1000`);
}

function mergeResources(current, incoming) {
    const map = new Map(current.map((item) => [`${item.resourceType}/${item.id}`, item]));
    incoming.forEach((item) => {
        if (item && item.resourceType && item.id) {
            map.set(`${item.resourceType}/${item.id}`, item);
        }
    });
    return Array.from(map.values());
}

function renderPatientCard(patient) {
    if (!patient || !patient.id) {
        patientCard.innerHTML = "<div class=\"empty-state\">找不到病人資料</div>";
        return;
    }

    const name = formatHumanName(patient.name && patient.name[0]);
    const gender = patient.gender ? patient.gender : "未知";
    const genderIcon = gender === "male" ? "fa-mars" : gender === "female" ? "fa-venus" : "fa-circle-question";
    const birthDate = patient.birthDate ? patient.birthDate : "未知";
    
    // 計算年齡
    let age = "未知";
    if (birthDate !== "未知") {
        const today = new Date();
        const birth = new Date(birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
    }

    patientCard.innerHTML = `
        <div class="patient-header">
            <div class="patient-avatar">
                <i class="fas ${genderIcon}"></i>
            </div>
            <div class="patient-title">
                <div class="patient-name">${name}</div>
            </div>
        </div>
        <div class="patient-info">
            <div class="info-row">性別: <span class="info-value">${gender}</span></div>
            <div class="info-row">生日: <span class="info-value">${birthDate}</span></div>
            <div class="info-row">年齡: <span class="info-value">${age} 歲</span></div>
        </div>
    `;
}

function renderStats() {
    const totalResources = RESOURCE_TYPES.reduce((sum, type) => sum + (resourcesByType[type] || []).length, 0);

    const statsHtml = RESOURCE_TYPES.map((type) => {
        const count = (resourcesByType[type] || []).length;
        return `
            <div class="stat-item" style="border-color: ${TYPE_COLORS[type] || TYPE_COLORS.Unknown};">
                <div class="stat-count">${count}</div>
                <div class="stat-label">${RESOURCE_LABELS[type] || type} <span class="stat-type">${type}</span></div>
            </div>
        `;
    }).join("");

    statsCard.innerHTML = `
        <div class="stat-item stat-total">
            <div class="stat-count">${totalResources}</div>
            <div class="stat-label">總資源數</div>
        </div>
        ${statsHtml}
    `;
}

function renderFilters() {
    filterList.innerHTML = RESOURCE_TYPES.map((type) => {
        const count = (resourcesByType[type] || []).length;
        const isCommon = COMMON_RESOURCES.has(type);
        const isChecked = isCommon ? "checked" : ""; // 常用的預設勾選，不常用的預設不勾選
        return `
            <label class="filter-item">
                <input type="checkbox" data-type="${type}" ${isChecked} />
                <span class="filter-color" style="background: ${TYPE_COLORS[type] || TYPE_COLORS.Unknown}"></span>
                <span class="filter-text">${RESOURCE_LABELS[type] || type} <span class="filter-type">${type}</span></span>
            </label>
        `;
    }).join("");

    filterList.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
        checkbox.addEventListener("change", updateVisibility);
    });
    
    // 初始化時應用篩選
    updateVisibility();
}

/**
 * 當節點被選中時，更新篩選器以只顯示該節點及其連接節點的資源類型
 * @param {string} nodeId - 選中的節點ID
 * @param {Set} connectedNodeIds - 與該節點相連的所有節點ID
 */
function updateFiltersForNode(nodeId, connectedNodeIds) {
    if (!filterList) {
        return;
    }
    
    // 收集連接節點中的所有資源類型
    const relatedResourceTypes = new Set();
    
    connectedNodeIds.forEach((id) => {
        // 從節點ID中提取資源類型（格式: "ResourceType/id"）
        const resourceType = id.split("/")[0];
        if (resourceType) {
            relatedResourceTypes.add(resourceType);
        }
    });
    
    // 添加病人資源類型
    relatedResourceTypes.add("Patient");
    
    // 清空篩選列表
    filterList.innerHTML = "";
    
    // 只顯示相關的資源類型
    relatedResourceTypes.forEach((type) => {
        const label = document.createElement("label");
        label.className = "filter-item";
        label.innerHTML = `
            <input type="checkbox" data-type="${type}" checked />
            <span class="filter-color" style="background: ${TYPE_COLORS[type] || TYPE_COLORS.Unknown}"></span>
            <span class="filter-text">${RESOURCE_LABELS[type] || type} <span class="filter-type">${type}</span></span>
        `;
        label.querySelector("input[type=checkbox]").addEventListener("change", updateVisibilityForSelectedNode);
        filterList.appendChild(label);
    });
}

/**
 * 恢復完整的篩選器（取消節點篩選狀態）
 */
function restoreFullFilters() {
    // 重新呼叫 renderFilters() 以恢復完整的篩選面板
    renderFilters();
}

/**
 * 當節點被選中時，更新該節點對應的篩選可見性
 * 只影響已選中節點相關的資源可見性，不會改變節點隱藏狀態
 */
function updateVisibilityForSelectedNode() {
    if (!selectedNodeId || !nodes || !edges) {
        return;
    }
    
    // 獲取當前選中的資源類型
    const selectedTypes = new Set();
    filterList.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
        if (checkbox.checked) {
            selectedTypes.add(checkbox.dataset.type);
        }
    });
    
    // 找出與選中節點相連的節點
    const connectedNodeIds = new Set([selectedNodeId]);
    edges.forEach((edge) => {
        if (edge.from === selectedNodeId) {
            connectedNodeIds.add(edge.to);
        }
        if (edge.to === selectedNodeId) {
            connectedNodeIds.add(edge.from);
        }
    });
    
    // 在連接的節點中隱藏未勾選的資源類型
    connectedNodeIds.forEach((nodeId) => {
        const meta = nodeMeta.get(nodeId);
        const group = meta && meta.group ? meta.group : "Unknown";
        const shouldShow = selectedTypes.has(group);
        
        const node = nodes.get(nodeId);
        if (node) {
            nodes.update({ id: nodeId, hidden: !shouldShow });
        }
    });
    
    // 更新邊的可見性
    edges.forEach((edge) => {
        const fromNode = nodes.get(edge.from);
        const toNode = nodes.get(edge.to);
        const hidden = (fromNode && fromNode.hidden) || (toNode && toNode.hidden);
        edges.update({ id: edge.id, hidden });
    });
}

let expandedNodes = new Set();

function buildGraph() {
    if (!graphContainer) {
        return;
    }

    nodeMeta = new Map();
    resourceMap = new Map();
    expandedNodes = new Set();

    nodes = new vis.DataSet();
    edges = new vis.DataSet();

    const patientNodeId = `Patient/${patientResource.id}`;
    
    // 只添加病人和直接關聯的資源
    addNode(patientNodeId, patientResource, "Patient", "病人");
    expandedNodes.add(patientNodeId); // 標記 Patient 為已展開，避免重複處理
    nodes.update({
        id: patientNodeId,
        shape: "star",
        size: 28,
        font: { color: "#ffffff", size: 16 }
    });
    expandedNodes.add(patientNodeId);

    // 添加病人的直接關聯資源（第一層）
    RESOURCE_TYPES.forEach((type) => {
        const resources = resourcesByType[type] || [];
        resources.forEach((resource) => {
            const nodeId = `${resource.resourceType}/${resource.id}`;
            addNode(nodeId, resource, resource.resourceType, getResourceDisplay(resource));
            addEdge(patientNodeId, nodeId, "subject");
        });
    });

    const options = {
        layout: {
            improvedLayout: false
        },
        physics: {
            enabled: true,
            stabilization: {
                enabled: true,
                iterations: 50,
                fit: true,
                updateInterval: 10,
                onlyDynamicEdges: false
            },
            barnesHut: {
                gravitationalConstant: -25000,
                springLength: 50,
                springConstant: 0.15,
                damping: 0.6,
                avoidOverlap: 0.4
            },
            maxVelocity: 50,
            minVelocity: 0.75,
            solver: "barnesHut",
            timestep: 0.35,
            adaptiveTimestep: true
        },
        nodes: {
            shape: "dot",
            size: 18,
            font: {
                color: "#e2e8f0",
                face: "Segoe UI",
                multi: true,
                size: 14
            },
            borderWidth: 2
        },
        edges: {
            arrows: {
                to: { enabled: true, scaleFactor: 0.6 }
            },
            color: "#94a3b8",
            smooth: {
                type: "dynamic"
            }
        },
        groups: buildGroupStyles()
    };

    network = new vis.Network(graphContainer, { nodes, edges }, options);

    // 監聽穩定化完成事件，自動停用物理引擎
    network.on("stabilizationIterationsDone", () => {
        network.setOptions({ physics: false });
    });

    network.once("afterDrawing", () => {
        network.fit({ animation: true });
    });

    if (nodes.length <= 1) {
        showError("目前沒有可視的關聯資源", { message: "只載入到 Patient 資料。" });
    }

    network.on("selectNode", (params) => {
        const nodeId = params.nodes && params.nodes[0];
        if (nodeId) {
            selectedNodeId = nodeId; // 記錄選中的節點
            
            // 先展開節點的 references（如果還未展開）
            if (!expandedNodes.has(nodeId)) {
                expandNode(nodeId);
            }
            
            // 找出与该节点直接相连的所有节点
            const connectedNodeIds = new Set([nodeId]);
            edges.forEach((edge) => {
                if (edge.from === nodeId) {
                    connectedNodeIds.add(edge.to);
                }
                if (edge.to === nodeId) {
                    connectedNodeIds.add(edge.from);
                }
            });
            
            // 隐藏所有非关联的节点
            nodes.forEach((node) => {
                const hidden = !connectedNodeIds.has(node.id);
                nodes.update({ id: node.id, hidden });
            });
            
            // 隐藏所有邊
            edges.forEach((edge) => {
                edges.update({ id: edge.id, hidden: true });
            });
            
            // 只顯示與該節點相關的邊
            edges.forEach((edge) => {
                if (edge.from === nodeId || edge.to === nodeId) {
                    edges.update({ id: edge.id, hidden: false });
                }
            });
            
            // 更新篩選器以只顯示該節點相關的資源類型
            updateFiltersForNode(nodeId, connectedNodeIds);
            
            renderDetail(nodeId, connectedNodeIds).catch((err) => {
                console.error("renderDetail 失敗:", err);
            });
        }
    });

    network.on("deselectNode", () => {
        selectedNodeId = null; // 清除選中節點的記錄
        
        // 顯示所有節點和邊
        nodes.forEach((node) => {
            nodes.update({ id: node.id, hidden: false });
        });
        edges.forEach((edge) => {
            edges.update({ id: edge.id, hidden: false });
        });
        
        // 恢復完整的篩選器
        restoreFullFilters();
        
        detailCard.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hand-pointer"></i>
                點選節點查看詳細資訊
            </div>
        `;
    });

    updateVisibility();
}

function renderFallbackGraph(message) {
    graphContainer.innerHTML = "";
    graphContainer.style.display = "block";

    const header = document.createElement("div");
    header.className = "fallback-title";
    header.textContent = message;
    graphContainer.appendChild(header);

    const list = document.createElement("div");
    list.className = "fallback-list";

    const items = [];
    if (patientResource && patientResource.id) {
        items.push({
            type: "Patient",
            id: patientResource.id,
            label: formatHumanName(patientResource.name?.[0])
        });
    }

    RESOURCE_TYPES.forEach((type) => {
        (resourcesByType[type] || []).forEach((resource) => {
            items.push({
                type,
                id: resource.id,
                label: getResourceDisplay(resource)
            });
        });
    });

    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "fallback-card";
        const chineseLabel = RESOURCE_LABELS[item.type] || item.type;
        card.innerHTML = `
            <div class="fallback-type" style="color: ${TYPE_COLORS[item.type] || TYPE_COLORS.Unknown};">${chineseLabel}</div>
            <div class="fallback-label">${item.label || "(無標題)"}</div>
            <div class="fallback-id">${item.id || "-"}</div>
        `;
        list.appendChild(card);
    });

    graphContainer.appendChild(list);
}

function buildGroupStyles() {
    const groups = {
        Patient: {
            color: {
                background: TYPE_COLORS.Patient,
                border: "#1e3a8a",
                highlight: {
                    background: "#fbbf24",
                    border: "#f59e0b"
                }
            },
            font: {
                color: "#ffffff",
                size: 14,
                highlight: {
                    color: "#1f2937"
                }
            }
        }
    };

    RESOURCE_TYPES.forEach((type) => {
        groups[type] = {
            color: {
                background: TYPE_COLORS[type] || TYPE_COLORS.Unknown,
                border: "#ffffff",
                highlight: {
                    background: "#fbbf24",
                    border: "#f59e0b"
                }
            },
            font: {
                color: "#ffffff",
                size: 14,
                highlight: {
                    color: "#1f2937"
                }
            }
        };
    });

    groups.Unknown = {
        color: {
            background: TYPE_COLORS.Unknown,
            border: "#ffffff",
            highlight: {
                background: "#fbbf24",
                border: "#f59e0b"
            }
        },
        font: {
            color: "#ffffff",
            size: 14,
            highlight: {
                color: "#1f2937"
            }
        }
    };

    return groups;
}

function addNode(nodeId, resource, group, displayText, distance = 1) {
    if (nodeMeta.has(nodeId)) {
        return;
    }

    // 使用中文標籤作為節點的第一行
    const chineseLabel = RESOURCE_LABELS[group] || group;
    const label = `${chineseLabel}\n${displayText || nodeId}`;
    try {
        nodes.add({
            id: nodeId,
            label,
            group: group || "Unknown"
        });
    } catch (err) {
        console.error("nodes.add 失敗:", err);
        throw err;
    }

    nodeMeta.set(nodeId, { group, distance });
    if (resource && resource.resourceType) {
        resourceMap.set(nodeId, resource);
    }
}

function addEdge(from, to, label) {
    const edgeId = `${from}--${label}-->${to}`;
    if (edges.get(edgeId)) {
        return;
    }

    edges.add({
        id: edgeId,
        from,
        to,
        label,
        font: { align: "middle", size: 10 }
    });
}

function expandNode(nodeId) {
    if (expandedNodes.has(nodeId)) {
        return false; // 已經展開過
    }
    
    expandedNodes.add(nodeId);
    
    // 從 resourceMap 中查找該節點的資源
    const resource = resourceMap.get(nodeId);
    
    if (resource) {
        // 1. 收集並添加該資源引用的資源（正向引用）
        collectAndAddReferences(nodeId, resource);
    }
    
    // 2. 查找所有引用該節點的資源（反向引用）
    const referencingResources = findReferencingResources(nodeId);
    referencingResources.forEach(([srcNodeId, srcResource]) => {
        if (!expandedNodes.has(srcNodeId)) {
            expandedNodes.add(srcNodeId);
            collectAndAddReferences(srcNodeId, srcResource);
        }
    });
    
    // 根據節點數量決定是否使用物理模擬
    const nodeCount = nodes.length;
    if (nodeCount > 100) {
        // 節點太多時禁用物理模擬，直接使用靜態布局
        if (network) {
            network.setOptions({ physics: false });
            network.redraw();
        }
    } else {
        // 節點較少時臨時啟用物理引擎進行短暫穩定化
        if (network) {
            network.setOptions({ physics: true });
            network.stabilize({ iterations: 15 });
            
            // 穩定化完成後再次停用物理引擎
            setTimeout(() => {
                network.setOptions({ physics: false });
            }, 400); // 減少等待時間到400毫秒
        }
    }
    return true;
}

function findReferencingResources(targetNodeId) {
    const results = [];
    
    // 遍歷所有已載入的資源
    RESOURCE_TYPES.forEach((type) => {
        const resources = resourcesByType[type] || [];
        resources.forEach((resource) => {
            const nodeId = `${resource.resourceType}/${resource.id}`;
            
            // 檢查該資源是否引用目標節點
            if (resourceReferences(resource, targetNodeId)) {
                results.push([nodeId, resource]);
            }
        });
    });
    
    return results;
}

function resourceReferences(resource, targetNodeId) {
    const references = new Set();
    
    const walk = (value) => {
        if (!value) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }
        if (typeof value === "object") {
            if (value.reference && typeof value.reference === "string") {
                const normalized = normalizeReference(value.reference);
                if (normalized) {
                    references.add(normalized);
                }
            }
            Object.values(value).forEach(walk);
        }
    };
    
    walk(resource);
    return references.has(targetNodeId);
}

function collectAndAddReferences(sourceNodeId, resource) {
    const references = new Set();

    const walk = (value) => {
        if (!value) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }
        if (typeof value === "object") {
            if (value.reference && typeof value.reference === "string") {
                references.add(value.reference);
            }
            Object.values(value).forEach(walk);
        }
    };

    walk(resource);

    references.forEach((ref) => {
        const normalized = normalizeReference(ref);
        if (!normalized) {
            return;
        }
        const [type, id] = normalized.split("/");
        const label = id ? id : normalized;
        addNode(normalized, null, type || "Unknown", label, 2);
        addEdge(sourceNodeId, normalized, "ref");
    });
}

function normalizeReference(reference) {
    if (!reference || reference.startsWith("#")) {
        return null;
    }

    if (reference.startsWith("urn:uuid:")) {
        return reference.replace("urn:uuid:", "");
    }

    if (reference.includes("/")) {
        const parts = reference.split("/").filter(Boolean);
        if (reference.startsWith("http")) {
            const lastTwo = parts.slice(-2);
            return lastTwo.join("/");
        }
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }

    return reference;
}

function getResourceDisplay(resource) {
    if (!resource) {
        return "";
    }

    return resource.id || resource.resourceType;
}

function getCodingDisplay(coding) {
    if (!coding || !coding.length) {
        return "";
    }
    return coding[0].display || coding[0].code || "";
}

function updateVisibility() {
    // 安全检查：确保必要的 DOM 和数据结构存在
    if (!filterList || !nodes || !edges) {
        return;
    }
    
    const selectedTypes = new Set();
    filterList.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
        if (checkbox.checked) {
            selectedTypes.add(checkbox.dataset.type);
        }
    });

    nodes.forEach((node) => {
        if (node.id.startsWith("Patient/")) {
            nodes.update({ id: node.id, hidden: false });
            return;
        }
        const meta = nodeMeta.get(node.id);
        const group = meta && meta.group ? meta.group : "Unknown";
        const shouldShow = selectedTypes.has(group) || group === "Unknown";
        nodes.update({ id: node.id, hidden: !shouldShow });
    });

    edges.forEach((edge) => {
        const fromNode = nodes.get(edge.from);
        const toNode = nodes.get(edge.to);
        const hidden = (fromNode && fromNode.hidden) || (toNode && toNode.hidden);
        edges.update({ id: edge.id, hidden });
    });
}

function handleSearch(event) {
    if (!network || !nodes) {
        return;
    }
    if (event.key === "Enter") {
        const term = nodeSearch.value.trim().toLowerCase();
        if (!term) {
            network.unselectAll();
            return;
        }
        const matches = nodes.get({
            filter: (item) => item.label && item.label.toLowerCase().includes(term) && !item.hidden
        });
        if (matches.length) {
            network.selectNodes(matches.map((item) => item.id));
            network.focus(matches[0].id, { scale: 1.2, animation: true });
        }
    }
}

async function renderDetail(nodeId, connectedNodeIds) {
    let resource = resourceMap.get(nodeId);

    if (resource && resource.resourceType === "Patient") {
        const chineseLabel = RESOURCE_LABELS["Patient"] || "Patient";
        detailCard.innerHTML = `
            <h3>${chineseLabel}</h3>
            <pre>${escapeHtml(JSON.stringify(resource, null, 2))}</pre>
        `;
        return;
    }

    if (!resource) {
        // 在節點上標記加載狀態
        if (nodes && nodes.get(nodeId)) {
            nodes.update({ 
                id: nodeId, 
                borderWidth: 3,
                color: {
                    border: '#fbbf24',
                    background: nodes.get(nodeId).color?.background || '#94a3b8'
                }
            });
        }
        
        // 嘗試從 FHIR 伺服器加載引用資源
        detailCard.innerHTML = `
            <h3>${nodeId}</h3>
            <div class="loading-container">
                <div class="spinner-wrapper">
                    <i class="fas fa-spinner spinner-icon"></i>
                    <div class="spinner-text">LOADING...</div>
                </div>
                <p class="loading-message">正在加載引用資源...</p>
            </div>
        `;
        
        try {
            // 解析節點 ID（例如 "Observation/OBS-001"）
            const [resType, resId] = nodeId.split("/");
            if (resType && resId && client) {
                const loadedResource = await requestAll(`${resType}/${resId}`);
                if (loadedResource) {
                    // 將加載的資源存入 resourceMap
                    resource = Array.isArray(loadedResource) ? loadedResource[0] : loadedResource;
                    if (resource && resource.resourceType) {
                        resourceMap.set(nodeId, resource);
                        
                        // 移除節點的加載標記
                        if (nodes && nodes.get(nodeId)) {
                            const originalNode = nodes.get(nodeId);
                            nodes.update({ 
                                id: nodeId, 
                                borderWidth: 2,
                                color: {
                                    border: '#ffffff',
                                    background: originalNode.color?.background || '#94a3b8'
                                }
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`加載引用資源失敗 (${nodeId}):`, error.message);
            // 加載失敗時移除加載標記
            if (nodes && nodes.get(nodeId)) {
                const originalNode = nodes.get(nodeId);
                nodes.update({ 
                    id: nodeId, 
                    borderWidth: 2,
                    color: {
                        border: '#ef4444',
                        background: originalNode.color?.background || '#94a3b8'
                    }
                });
            }
        }
        
        // 如果仍無法加載，顯示錯誤訊息
        if (!resource) {
            detailCard.innerHTML = `
                <h3>${nodeId}</h3>
                <div class="empty-state">無法加載此引用資源的詳細資料。</div>
            `;
            return;
        }
    }

    const chineseLabel = RESOURCE_LABELS[resource.resourceType] || resource.resourceType;
    const title = `${chineseLabel}`;
    const summary = buildResourceSummary(resource);
    
    // 構建關聯資源列表（分組顯示）
    let relatedHtml = "";
    if (connectedNodeIds && connectedNodeIds.size > 1) {
        relatedHtml = buildGroupedRelatedResources(nodeId, connectedNodeIds);
    }

    detailCard.innerHTML = `
        <h3>${title}</h3>
        <div class="detail-summary">${summary}</div>
        ${relatedHtml}
        <h4>JSON 詳情</h4>
        <pre>${escapeHtml(JSON.stringify(resource, null, 2))}</pre>
    `;
    
    // 為資源卡片添加點擊事件
    detailCard.querySelectorAll('.resource-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            // 如果點擊的是展開/收合按鈕，不執行跳轉
            if (e.target.closest('.resource-group-header')) {
                return;
            }
            
            const targetNodeId = card.getAttribute('data-node-id');
            if (targetNodeId && network) {
                // 移除所有 active 狀態
                detailCard.querySelectorAll('.resource-card').forEach(el => el.classList.remove('active'));
                // 添加當前項目的 active 狀態
                card.classList.add('active');
                
                // 直接聚焦到節點，但不觸發選中效果
                network.focus(targetNodeId, { scale: 1.2, animation: true });
                
                // 如果節點尚未展開，展開它
                if (!expandedNodes.has(targetNodeId)) {
                    expandNode(targetNodeId);
                }
                
                // 手動更新詳情面板（不觸發圖形選中）
                const connectedNodeIds = new Set([targetNodeId]);
                edges.forEach((edge) => {
                    if (edge.from === targetNodeId) connectedNodeIds.add(edge.to);
                    if (edge.to === targetNodeId) connectedNodeIds.add(edge.from);
                });
                
                // 只更新邊的可見性，不觸發節點選中
                edges.forEach((edge) => {
                    const shouldShow = connectedNodeIds.has(edge.from) || connectedNodeIds.has(edge.to);
                    edges.update({
                        id: edge.id,
                        hidden: !shouldShow
                    });
                });
                
                nodes.forEach((node) => {
                    nodes.update({
                        id: node.id,
                        hidden: !connectedNodeIds.has(node.id)
                    });
                });
                
                renderDetail(targetNodeId, connectedNodeIds).catch((err) => {
                    console.error("renderDetail 失敗:", err);
                });
            }
        });
    });
    
    // 初始化資源分組的展開狀態（預設全部展開）
    detailCard.querySelectorAll('.resource-group-content').forEach((content) => {
        content.style.maxHeight = content.scrollHeight + 'px';
    });
                    console.error("renderDetail 失敗:", err);
                });
            }
        });
    });
}

function buildResourceSummary(resource) {
    const rows = [];
    const resourceType = resource.resourceType;
    
    // 基本資訊：ID
    rows.push(`<div class="summary-row"><span>ID</span><span>${resource.id || "-"}</span></div>`);

    // 根據不同資源類型顯示特定資訊
    switch (resourceType) {
        case "Observation":
            buildObservationSummary(resource, rows);
            break;
        case "Condition":
            buildConditionSummary(resource, rows);
            break;
        case "Procedure":
            buildProcedureSummary(resource, rows);
            break;
        case "Encounter":
            buildEncounterSummary(resource, rows);
            break;
        case "MedicationStatement":
        case "MedicationRequest":
            buildMedicationSummary(resource, rows);
            break;
        case "DiagnosticReport":
            buildDiagnosticReportSummary(resource, rows);
            break;
        case "Immunization":
            buildImmunizationSummary(resource, rows);
            break;
        case "AllergyIntolerance":
            buildAllergySummary(resource, rows);
            break;
        default:
            buildGenericSummary(resource, rows);
            break;
    }

    return rows.join("");
}

// 建構分組的關聯資源顯示
function buildGroupedRelatedResources(currentNodeId, connectedNodeIds) {
    // 按資源類型分組
    const groupedResources = {};
    const resourceIcons = {
        "Observation": "🔬",
        "Condition": "🏥",
        "Procedure": "⚕️",
        "MedicationStatement": "💊",
        "MedicationRequest": "💊",
        "Patient": "👤",
        "Practitioner": "👨‍⚕️",
        "Organization": "🏢",
        "Encounter": "📋",
        "DiagnosticReport": "📊",
        "Immunization": "💉",
        "AllergyIntolerance": "⚠️",
        "Claim": "💰",
        "ExplanationOfBenefit": "📄"
    };
    
    connectedNodeIds.forEach((id) => {
        if (id !== currentNodeId) {
            const [resType, resId] = id.split("/");
            const resource = resourceMap.get(id);
            
            if (!groupedResources[resType]) {
                groupedResources[resType] = [];
            }
            
            groupedResources[resType].push({
                id,
                resId,
                resource
            });
        }
    });
    
    // 建構 HTML
    const groups = [];
    Object.keys(groupedResources).sort().forEach((resType) => {
        const items = groupedResources[resType];
        const chineseLabel = RESOURCE_LABELS[resType] || resType;
        const icon = resourceIcons[resType] || "📎";
        const color = TYPE_COLORS[resType] || TYPE_COLORS.Unknown;
        
        // 建構該類型的資源卡片
        const resourceCards = items.map((item) => {
            return buildResourceCard(item.resource, item.resId, item.id, resType, color);
        }).join("");
        
        groups.push(`
            <div class="resource-group">
                <div class="resource-group-header" onclick="toggleResourceGroup(this)">
                    <span class="group-icon">${icon}</span>
                    <span class="group-title">${chineseLabel}</span>
                    <span class="group-count">(${items.length} 項)</span>
                    <i class="fas fa-chevron-down group-toggle"></i>
                </div>
                <div class="resource-group-content">
                    ${resourceCards}
                </div>
            </div>
        `);
    });
    
    return `
        <div class="related-section-new">
            <h4><i class="fas fa-link"></i> 關聯資源詳情</h4>
            <div class="resource-groups">
                ${groups.join("")}
            </div>
        </div>
    `;
}

// 建構單個資源卡片
function buildResourceCard(resource, resId, nodeId, resType, color) {
    if (!resource) {
        // 未載入的資源，只顯示 ID
        return `
            <div class="resource-card" data-node-id="${nodeId}">
                <div class="resource-card-header">
                    <span class="resource-card-title" style="color: ${color};">${resId || nodeId}</span>
                </div>
                <div class="resource-card-body">
                    <div class="resource-field">未載入詳細資料</div>
                </div>
            </div>
        `;
    }
    
    // 根據資源類型建構簡要資訊
    const fields = buildResourceCardFields(resource);
    const title = getResourceCardTitle(resource);
    
    return `
        <div class="resource-card" data-node-id="${nodeId}">
            <div class="resource-card-header">
                <span class="resource-card-title" style="color: ${color};">${title}</span>
                <span class="resource-card-id">#${resource.id}</span>
            </div>
            <div class="resource-card-body">
                ${fields}
            </div>
        </div>
    `;
}

// 取得資源卡片標題
function getResourceCardTitle(resource) {
    const resType = resource.resourceType;
    
    switch (resType) {
        case "Observation":
            return resource.code?.text || getCodingDisplay(resource.code?.coding) || "觀察結果";
        case "Condition":
            return resource.code?.text || getCodingDisplay(resource.code?.coding) || "診斷";
        case "Procedure":
            return resource.code?.text || getCodingDisplay(resource.code?.coding) || "處置";
        case "MedicationStatement":
        case "MedicationRequest":
            return resource.medicationCodeableConcept?.text || getCodingDisplay(resource.medicationCodeableConcept?.coding) || "藥物";
        case "Encounter":
            return resource.type?.[0]?.text || getCodingDisplay(resource.type?.[0]?.coding) || "就醫";
        case "Patient":
            return formatHumanName(resource.name?.[0]) || "病人";
        case "DiagnosticReport":
            return resource.code?.text || getCodingDisplay(resource.code?.coding) || "診斷報告";
        case "Immunization":
            return resource.vaccineCode?.text || getCodingDisplay(resource.vaccineCode?.coding) || "疫苗";
        case "AllergyIntolerance":
            return resource.code?.text || getCodingDisplay(resource.code?.coding) || "過敏";
        default:
            return resource.id || resType;
    }
}

// 建構資源卡片欄位
function buildResourceCardFields(resource) {
    const fields = [];
    const resType = resource.resourceType;
    
    switch (resType) {
        case "Observation":
            if (resource.valueQuantity) {
                fields.push(`<div class="resource-field"><span>測量值:</span> <strong>${resource.valueQuantity.value} ${resource.valueQuantity.unit || ""}</strong></div>`);
            } else if (resource.valueString) {
                fields.push(`<div class="resource-field"><span>測量值:</span> <strong>${resource.valueString}</strong></div>`);
            }
            if (resource.effectiveDateTime) {
                fields.push(`<div class="resource-field"><span>時間:</span> ${formatDate(resource.effectiveDateTime)}</div>`);
            }
            break;
            
        case "Condition":
            if (resource.clinicalStatus) {
                const status = resource.clinicalStatus.coding?.[0]?.display || resource.clinicalStatus.coding?.[0]?.code;
                fields.push(`<div class="resource-field"><span>狀態:</span> ${status}</div>`);
            }
            if (resource.severity) {
                fields.push(`<div class="resource-field"><span>嚴重程度:</span> ${resource.severity.text || getCodingDisplay(resource.severity.coding)}</div>`);
            }
            if (resource.onsetDateTime) {
                fields.push(`<div class="resource-field"><span>發病:</span> ${formatDate(resource.onsetDateTime)}</div>`);
            }
            break;
            
        case "Procedure":
            if (resource.status) {
                fields.push(`<div class="resource-field"><span>狀態:</span> ${resource.status}</div>`);
            }
            if (resource.performedDateTime) {
                fields.push(`<div class="resource-field"><span>執行:</span> ${formatDate(resource.performedDateTime)}</div>`);
            }
            break;
            
        case "MedicationStatement":
        case "MedicationRequest":
            if (resource.dosage?.[0]?.text) {
                fields.push(`<div class="resource-field"><span>劑量:</span> ${resource.dosage[0].text}</div>`);
            }
            if (resource.effectivePeriod) {
                const start = formatDate(resource.effectivePeriod.start);
                const end = formatDate(resource.effectivePeriod.end);
                fields.push(`<div class="resource-field"><span>期間:</span> ${start} ~ ${end}</div>`);
            }
            break;
            
        case "Encounter":
            if (resource.status) {
                fields.push(`<div class="resource-field"><span>狀態:</span> ${resource.status}</div>`);
            }
            if (resource.period) {
                const start = formatDate(resource.period.start);
                fields.push(`<div class="resource-field"><span>時間:</span> ${start}</div>`);
            }
            if (resource.class) {
                fields.push(`<div class="resource-field"><span>分類:</span> ${resource.class.display || resource.class.code}</div>`);
            }
            break;
            
        case "Patient":
            if (resource.gender) {
                const genderMap = { male: "男", female: "女", other: "其他", unknown: "未知" };
                fields.push(`<div class="resource-field"><span>性別:</span> ${genderMap[resource.gender] || resource.gender}</div>`);
            }
            if (resource.birthDate) {
                fields.push(`<div class="resource-field"><span>出生:</span> ${resource.birthDate}</div>`);
            }
            break;
            
        default:
            if (resource.status) {
                fields.push(`<div class="resource-field"><span>狀態:</span> ${resource.status}</div>`);
            }
            break;
    }
    
    return fields.length > 0 ? fields.join("") : '<div class="resource-field">無額外資訊</div>';
}

// 切換資源分組的展開/收合
function toggleResourceGroup(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.group-toggle');
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    }
}

// Observation 專用摘要
function buildObservationSummary(resource, rows) {
    // 檢查項目名稱
    if (resource.code) {
        const codeName = resource.code.text || getCodingDisplay(resource.code.coding) || "-";
        rows.push(`<div class="summary-row"><span>檢查項目</span><span>${codeName}</span></div>`);
    }
    
    // 分類
    if (resource.category && resource.category.length > 0) {
        const category = resource.category[0].coding?.[0]?.display || 
                        resource.category[0].text || "-";
        rows.push(`<div class="summary-row"><span>分類</span><span>${category}</span></div>`);
    }
    
    // 測量值
    if (resource.valueQuantity) {
        const value = `${resource.valueQuantity.value || ""} ${resource.valueQuantity.unit || ""}`.trim();
        rows.push(`<div class="summary-row"><span>測量值</span><span>${value}</span></div>`);
    } else if (resource.valueString) {
        rows.push(`<div class="summary-row"><span>測量值</span><span>${resource.valueString}</span></div>`);
    } else if (resource.valueCodeableConcept) {
        const value = resource.valueCodeableConcept.text || 
                     getCodingDisplay(resource.valueCodeableConcept.coding) || "-";
        rows.push(`<div class="summary-row"><span>測量值</span><span>${value}</span></div>`);
    }
    
    // 參考範圍
    if (resource.referenceRange && resource.referenceRange.length > 0) {
        const range = resource.referenceRange[0];
        const low = range.low?.value || "";
        const high = range.high?.value || "";
        const unit = range.low?.unit || range.high?.unit || "";
        if (low || high) {
            rows.push(`<div class="summary-row"><span>參考範圍</span><span>${low}-${high} ${unit}</span></div>`);
        }
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 檢查時間
    if (resource.effectiveDateTime) {
        rows.push(`<div class="summary-row"><span>檢查時間</span><span>${formatDate(resource.effectiveDateTime)}</span></div>`);
    } else if (resource.effectivePeriod) {
        const start = formatDate(resource.effectivePeriod.start);
        const end = formatDate(resource.effectivePeriod.end);
        rows.push(`<div class="summary-row"><span>檢查時間</span><span>${start} ~ ${end}</span></div>`);
    }
}

// Condition 專用摘要
function buildConditionSummary(resource, rows) {
    // 診斷名稱
    if (resource.code) {
        const conditionName = resource.code.text || getCodingDisplay(resource.code.coding) || "-";
        rows.push(`<div class="summary-row"><span>診斷名稱</span><span>${conditionName}</span></div>`);
    }
    
    // 臨床狀態
    if (resource.clinicalStatus) {
        const status = resource.clinicalStatus.coding?.[0]?.display || 
                      resource.clinicalStatus.coding?.[0]?.code || "-";
        rows.push(`<div class="summary-row"><span>臨床狀態</span><span>${status}</span></div>`);
    }
    
    // 驗證狀態
    if (resource.verificationStatus) {
        const status = resource.verificationStatus.coding?.[0]?.display || 
                      resource.verificationStatus.coding?.[0]?.code || "-";
        rows.push(`<div class="summary-row"><span>驗證狀態</span><span>${status}</span></div>`);
    }
    
    // 嚴重程度
    if (resource.severity) {
        const severity = resource.severity.text || getCodingDisplay(resource.severity.coding) || "-";
        rows.push(`<div class="summary-row"><span>嚴重程度</span><span>${severity}</span></div>`);
    }
    
    // 發病日期
    if (resource.onsetDateTime) {
        rows.push(`<div class="summary-row"><span>發病日期</span><span>${formatDate(resource.onsetDateTime)}</span></div>`);
    } else if (resource.onsetPeriod) {
        const start = formatDate(resource.onsetPeriod.start);
        rows.push(`<div class="summary-row"><span>發病日期</span><span>${start}</span></div>`);
    }
    
    // 記錄日期
    if (resource.recordedDate) {
        rows.push(`<div class="summary-row"><span>記錄日期</span><span>${formatDate(resource.recordedDate)}</span></div>`);
    }
}

// Procedure 專用摘要
function buildProcedureSummary(resource, rows) {
    // 處置名稱
    if (resource.code) {
        const procedureName = resource.code.text || getCodingDisplay(resource.code.coding) || "-";
        rows.push(`<div class="summary-row"><span>處置名稱</span><span>${procedureName}</span></div>`);
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 執行時間
    if (resource.performedDateTime) {
        rows.push(`<div class="summary-row"><span>執行時間</span><span>${formatDate(resource.performedDateTime)}</span></div>`);
    } else if (resource.performedPeriod) {
        const start = formatDate(resource.performedPeriod.start);
        const end = formatDate(resource.performedPeriod.end);
        rows.push(`<div class="summary-row"><span>執行時間</span><span>${start} ~ ${end}</span></div>`);
    }
    
    // 類別
    if (resource.category) {
        const category = resource.category.text || getCodingDisplay(resource.category.coding) || "-";
        rows.push(`<div class="summary-row"><span>類別</span><span>${category}</span></div>`);
    }
}

// Encounter 專用摘要
function buildEncounterSummary(resource, rows) {
    // 就醫類型
    if (resource.type && resource.type.length > 0) {
        const encounterType = resource.type[0].text || getCodingDisplay(resource.type[0].coding) || "-";
        rows.push(`<div class="summary-row"><span>就醫類型</span><span>${encounterType}</span></div>`);
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 就醫時間
    if (resource.period) {
        const start = formatDate(resource.period.start);
        const end = formatDate(resource.period.end);
        if (start && end) {
            rows.push(`<div class="summary-row"><span>就醫時間</span><span>${start} ~ ${end}</span></div>`);
        } else if (start) {
            rows.push(`<div class="summary-row"><span>開始時間</span><span>${start}</span></div>`);
        }
    }
    
    // 就醫分類
    if (resource.class) {
        const classDisplay = resource.class.display || resource.class.code || "-";
        rows.push(`<div class="summary-row"><span>就醫分類</span><span>${classDisplay}</span></div>`);
    }
}

// 藥物相關摘要
function buildMedicationSummary(resource, rows) {
    // 藥品名稱
    if (resource.medicationCodeableConcept) {
        const medName = resource.medicationCodeableConcept.text || 
                       getCodingDisplay(resource.medicationCodeableConcept.coding) || "-";
        rows.push(`<div class="summary-row"><span>藥品名稱</span><span>${medName}</span></div>`);
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 劑量
    if (resource.dosage && resource.dosage.length > 0) {
        const dosage = resource.dosage[0].text || "-";
        rows.push(`<div class="summary-row"><span>劑量說明</span><span>${dosage}</span></div>`);
    }
    
    // 開立日期
    if (resource.authoredOn) {
        rows.push(`<div class="summary-row"><span>開立日期</span><span>${formatDate(resource.authoredOn)}</span></div>`);
    }
    
    // 有效期間
    if (resource.effectivePeriod) {
        const start = formatDate(resource.effectivePeriod.start);
        const end = formatDate(resource.effectivePeriod.end);
        rows.push(`<div class="summary-row"><span>用藥期間</span><span>${start} ~ ${end}</span></div>`);
    }
}

// DiagnosticReport 專用摘要
function buildDiagnosticReportSummary(resource, rows) {
    // 報告名稱
    if (resource.code) {
        const reportName = resource.code.text || getCodingDisplay(resource.code.coding) || "-";
        rows.push(`<div class="summary-row"><span>報告名稱</span><span>${reportName}</span></div>`);
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 分類
    if (resource.category && resource.category.length > 0) {
        const category = resource.category[0].text || getCodingDisplay(resource.category[0].coding) || "-";
        rows.push(`<div class="summary-row"><span>分類</span><span>${category}</span></div>`);
    }
    
    // 報告日期
    if (resource.effectiveDateTime) {
        rows.push(`<div class="summary-row"><span>報告日期</span><span>${formatDate(resource.effectiveDateTime)}</span></div>`);
    }
    
    // 發布日期
    if (resource.issued) {
        rows.push(`<div class="summary-row"><span>發布日期</span><span>${formatDate(resource.issued)}</span></div>`);
    }
    
    // 結論
    if (resource.conclusion) {
        rows.push(`<div class="summary-row"><span>結論</span><span>${resource.conclusion}</span></div>`);
    }
}

// Immunization 專用摘要
function buildImmunizationSummary(resource, rows) {
    // 疫苗名稱
    if (resource.vaccineCode) {
        const vaccineName = resource.vaccineCode.text || getCodingDisplay(resource.vaccineCode.coding) || "-";
        rows.push(`<div class="summary-row"><span>疫苗名稱</span><span>${vaccineName}</span></div>`);
    }
    
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }
    
    // 接種日期
    if (resource.occurrenceDateTime) {
        rows.push(`<div class="summary-row"><span>接種日期</span><span>${formatDate(resource.occurrenceDateTime)}</span></div>`);
    }
    
    // 劑次
    if (resource.doseQuantity) {
        const dose = `${resource.doseQuantity.value || ""} ${resource.doseQuantity.unit || ""}`.trim();
        rows.push(`<div class="summary-row"><span>劑量</span><span>${dose}</span></div>`);
    }
}

// AllergyIntolerance 專用摘要
function buildAllergySummary(resource, rows) {
    // 過敏原
    if (resource.code) {
        const allergen = resource.code.text || getCodingDisplay(resource.code.coding) || "-";
        rows.push(`<div class="summary-row"><span>過敏原</span><span>${allergen}</span></div>`);
    }
    
    // 臨床狀態
    if (resource.clinicalStatus) {
        const status = resource.clinicalStatus.coding?.[0]?.display || 
                      resource.clinicalStatus.coding?.[0]?.code || "-";
        rows.push(`<div class="summary-row"><span>臨床狀態</span><span>${status}</span></div>`);
    }
    
    // 類型
    if (resource.type) {
        rows.push(`<div class="summary-row"><span>類型</span><span>${resource.type}</span></div>`);
    }
    
    // 嚴重程度
    if (resource.criticality) {
        rows.push(`<div class="summary-row"><span>嚴重程度</span><span>${resource.criticality}</span></div>`);
    }
    
    // 記錄日期
    if (resource.recordedDate) {
        rows.push(`<div class="summary-row"><span>記錄日期</span><span>${formatDate(resource.recordedDate)}</span></div>`);
    }
}

// 通用摘要（其他資源類型）
function buildGenericSummary(resource, rows) {
    // 狀態
    if (resource.status) {
        rows.push(`<div class="summary-row"><span>狀態</span><span>${resource.status}</span></div>`);
    }

    // 代碼
    if (resource.code) {
        rows.push(`<div class="summary-row"><span>代碼</span><span>${resource.code.text || getCodingDisplay(resource.code.coding) || "-"}</span></div>`);
    }

    // 日期
    if (resource.effectiveDateTime) {
        rows.push(`<div class="summary-row"><span>日期</span><span>${formatDate(resource.effectiveDateTime)}</span></div>`);
    }

    if (resource.authoredOn) {
        rows.push(`<div class="summary-row"><span>日期</span><span>${formatDate(resource.authoredOn)}</span></div>`);
    }

    if (resource.issued) {
        rows.push(`<div class="summary-row"><span>發布</span><span>${formatDate(resource.issued)}</span></div>`);
    }

    if (resource.subject && resource.subject.reference) {
        rows.push(`<div class="summary-row"><span>Subject</span><span>${resource.subject.reference}</span></div>`);
    }
}

// 日期格式化輔助函數
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function formatHumanName(name) {
    if (!name) {
        return "未知";
    }
    if (name.text) {
        return name.text;
    }
    const given = name.given ? name.given.join(" ") : "";
    const family = name.family || "";
    return `${family}${given ? " " + given : ""}`.trim() || "未知";
}

function escapeHtml(value) {
    if (!value) {
        return "";
    }
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function safeBuildGraph() {
    try {
        if (typeof vis === "undefined") {
            console.error("vis 未定義");
            renderFallbackGraph("未載入 vis-network，改用靜態清單顯示。");
            return;
        }
        buildGraph();
    } catch (error) {
        console.error("buildGraph 執行錯誤:", error);
        showError("關聯圖渲染失敗", error);
        renderFallbackGraph("關聯圖渲染失敗，改用靜態清單顯示。");
    }
}