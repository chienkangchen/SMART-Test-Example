/**
 * FHIR Questionnaire 檢視器 - 主應用程式腳本
 * 
 * 功能說明：
 * - 使用 SMART on FHIR OAuth2 連線到 FHIR 伺服器
 * - 從伺服器取得所有 Questionnaire 資源
 * - 顯示問卷列表，支援點選查看詳細內容
 * - 完整顯示問卷的結構、題目和答案選項
 * - 提供 JSON 原始資料檢視功能
 */

// ============================================
// 常數和全域變數
// ============================================

// FHIR 伺服器基礎 URL
const FHIR_SERVER_URL = "https://thas.mohw.gov.tw/v/r4/fhir";

// 全域狀態變數
let client = null;                    // FHIR 客戶端實例
let questionnaireData = null;         // 當前選中的問卷資料
let currentViewMode = 'list';         // 目前檢視模式：'list' 或 'detail'
let allQuestionnaires = [];           // 所有問卷列表（用於篩選）
let filteredQuestionnaires = [];      // 篩選後的問卷列表
let currentFilters = {                // 當前篩選條件
    status: 'active',                 // 預設篩選為 'active' 狀態
    search: ''                        // 搜尋關鍵字
};

// ============================================
// 全域變數 - Response 相關
// ============================================

let allResponses = [];                // 所有 QuestionnaireResponse
let allObservations = {};             // Observation 按 Response ID 分類
let patientInfo = null;               // 患者信息
let currentResponseId = null;         // 當前選中的 Response ID



/**
 * 當 SMART on FHIR 客戶端初始化完成時執行
 */
FHIR.oauth2.ready().then(function(fhirClient) {
    console.log("SMART on FHIR 客戶端已連線:", fhirClient);
    client = fhirClient;
    
    // 存儲 OAuth2 資訊供調試用
    document.getElementById("oauth2read").innerText = JSON.stringify(fhirClient, null, 4);

    // 載入問卷列表
    loadQuestionnaireList(fhirClient);
    
    // 初始化 Response 查看
    initializeResponseView();
    
    // 初始化顯示列表檢視
    showListView();

}).catch(function(error) {
    console.error("SMART on FHIR 初始化失敗:", error);
    displayError("questionnaire-list-content", "SMART on FHIR 連線失敗", error);
});

// ============================================
// 問卷列表相關函式
// ============================================

/**
 * 從 FHIR 伺服器載入所有 Questionnaire 資源
 * @param {Object} fhirClient - FHIR 客戶端實例
 */
function loadQuestionnaireList(fhirClient) {
    // 向 FHIR 伺服器請求所有 Questionnaire，限制結果數為 100
    fhirClient.request(FHIR_SERVER_URL + "/Questionnaire?_count=100")
        .then(function(data) {
            console.log("問卷列表已獲取:", data);
            
            if (data.entry && data.entry.length > 0) {
                displayQuestionnaireList(data.entry);
            } else {
                displayNoQuestionnaires();
            }
        })
        .catch(function(error) {
            console.error("載入問卷列表失敗:", error);
            displayError("questionnaire-list-content", "載入問卷列表時發生錯誤", error);
        });
}

/**
 * 在頁面上顯示問卷列表
 * @param {Array} entries - FHIR Bundle 中的 entry 陣列
 */
function displayQuestionnaireList(entries) {
    // 篩選出所有 Questionnaire 類型的資源
    allQuestionnaires = entries
        .map(entry => entry.resource)
        .filter(q => q.resourceType === "Questionnaire");

    // 初始化篩選結果
    applyFilters();
    
    // 如果回應列表已經載入，重新渲染以顯示完整的問卷標題
    if (allResponses.length > 0) {
        renderResponseList();
    }
}

/**
 * 應用當前的所有篩選條件
 */
function applyFilters() {
    // 複製所有問卷陣列
    filteredQuestionnaires = [...allQuestionnaires];

    // 應用狀態篩選
    if (currentFilters.status) {
        filteredQuestionnaires = filteredQuestionnaires.filter(q => q.status === currentFilters.status);
    }

    // 應用搜尋篩選
    if (currentFilters.search.trim()) {
        const searchLower = currentFilters.search.toLowerCase();
        filteredQuestionnaires = filteredQuestionnaires.filter(q => {
            const title = (q.title || q.name || "").toLowerCase();
            const id = (q.id || "").toLowerCase();
            const description = (q.description || "").toLowerCase();
            return title.includes(searchLower) || id.includes(searchLower) || description.includes(searchLower);
        });
    }

    // 排序：先按狀態（active 在前），再按日期（最新在前）
    filteredQuestionnaires.sort((a, b) => {
        // 首先按狀態排序（使用中 active 優先）
        const statusOrder = { 'active': 0, 'draft': 1 };
        const statusA = statusOrder[a.status] || 2;
        const statusB = statusOrder[b.status] || 2;
        
        if (statusA !== statusB) {
            return statusA - statusB;
        }
        
        // 同狀態下按日期排序（最新在前）
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    // 顯示篩選結果
    renderQuestionnaireList();
    
    // 更新篩選按鈕的狀態
    updateFilterButtons();
}

/**
 * 渲染問卷列表到 DOM
 */
function renderQuestionnaireList() {
    const container = document.getElementById("questionnaire-list-content");

    if (filteredQuestionnaires.length === 0) {
        displayNoQuestionnaires();
        return;
    }

    // 為每個問卷生成列表項目 HTML
    const listHtml = filteredQuestionnaires.map(q => {
        const version = q.version || "1.0";
        const updateDate = q.date 
            ? new Date(q.date).toLocaleDateString('zh-TW', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            : "未知";
        
        return `
            <div class="questionnaire-card" onclick="loadQuestionnaireDetail('${q.id}')">
                <div class="questionnaire-card-content">
                    <div class="questionnaire-card-title">${q.title || q.name || "未命名問卷"}</div>
                    <div class="questionnaire-card-id">ID: ${q.id}</div>
                    ${q.description ? `<div class="questionnaire-card-desc">${q.description}</div>` : ''}
                </div>
                <div class="questionnaire-card-meta">
                    <span title="版本"><i class="fas fa-code-branch"></i> v${version}</span>
                    <span title="最後更新"><i class="fas fa-calendar-alt"></i> ${updateDate}</span>
                    <span><i class="fas fa-flag"></i> ${getStatusText(q.status)}</span>
                    <span><i class="fas fa-question"></i> ${(q.item && q.item.length) || 0}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="questionnaire-list">${listHtml}</div>`;
}

/**
 * 更新篩選按鈕的選中狀態
 */
function updateFilterButtons() {
    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        const status = btn.getAttribute('data-status');
        if (status === currentFilters.status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * 按狀態篩選
 * @param {string} status - 狀態值 ('draft', 'active' 或 null 清除篩選)
 */
function filterByStatus(status) {
    if (currentFilters.status === status) {
        // 如果點擊相同按鈕，清除篩選
        currentFilters.status = null;
    } else {
        currentFilters.status = status;
    }
    applyFilters();
}

/**
 * 根據搜尋文字篩選
 * @param {string} searchText - 搜尋文字
 */
function filterBySearch(searchText) {
    currentFilters.search = searchText;
    applyFilters();
}

/**
 * 重設所有篩選條件
 */
function resetFilters() {
    currentFilters.status = null;
    currentFilters.search = '';
    document.getElementById('search-input').value = '';
    applyFilters();
}

/**
 * 當伺服器上沒有問卷時顯示訊息
 */
function displayNoQuestionnaires() {
    const container = document.getElementById("questionnaire-list-content");
    container.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
            <h3>沒有找到問卷</h3>
            <p>此 FHIR 伺服器上沒有任何 Questionnaire 資源。</p>
        </div>
    `;
}

// ============================================
// 問卷詳細檢視相關函式
// ============================================

/**
 * 從 FHIR 伺服器載入特定的 Questionnaire 詳細資料
 * @param {string} questionnaireId - Questionnaire 的 ID
 */
function loadQuestionnaireDetail(questionnaireId) {
    // 向 FHIR 伺服器請求特定的 Questionnaire
    client.request(FHIR_SERVER_URL + "/Questionnaire/" + questionnaireId)
        .then(function(data) {
            console.log("問卷詳細資料已獲取:", data);
            questionnaireData = data;
            
            // 顯示問卷資訊和題目
            displayQuestionnaireInfo(data);
            displayQuestions(data);
            updateJsonViewer(data);
            
            // 切換到詳細檢視
            showDetailView();
        })
        .catch(function(error) {
            console.error("載入問卷失敗:", error);
            displayError("questionnaire-info-content", "載入問卷資料時發生錯誤", error);
        });
}

/**
 * 在頁面上顯示問卷的基本資訊
 * @param {Object} questionnaire - Questionnaire FHIR 資源
 */
function displayQuestionnaireInfo(questionnaire) {
    const container = document.getElementById("questionnaire-info-content");
    const title = questionnaire.title || questionnaire.name || "未命名問卷";
    const id = questionnaire.id || "未知";
    const status = questionnaire.status || "unknown";
    const version = questionnaire.version || "N/A";
    const publisher = questionnaire.publisher || "未知";
    const date = questionnaire.date 
        ? new Date(questionnaire.date).toLocaleDateString('zh-TW') 
        : "未知";
    const description = questionnaire.description || "無描述";

    container.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="label"><i class="fas fa-heading"></i> 標題</div>
                <div class="value">${title}</div>
            </div>
            <div class="info-item">
                <div class="label"><i class="fas fa-id-badge"></i> ID</div>
                <div class="value">${id}</div>
            </div>
            <div class="info-item">
                <div class="label"><i class="fas fa-flag"></i> 狀態</div>
                <div class="value"><span class="status-badge ${getStatusClass(status)}">${getStatusText(status)}</span></div>
            </div>
            <div class="info-item">
                <div class="label"><i class="fas fa-code-branch"></i> 版本</div>
                <div class="value">${version}</div>
            </div>
            <div class="info-item">
                <div class="label"><i class="fas fa-building"></i> 發佈者</div>
                <div class="value">${publisher}</div>
            </div>
            <div class="info-item">
                <div class="label"><i class="fas fa-calendar"></i> 日期</div>
                <div class="value">${date}</div>
            </div>
        </div>
        ${description !== "無描述" ? `
            <div class="info-item" style="margin-top: 15px; grid-column: 1 / -1;">
                <div class="label"><i class="fas fa-align-left"></i> 描述</div>
                <div class="value">${description}</div>
            </div>
        ` : ''}
    `;
}

/**
 * 在頁面上顯示問卷的所有題目
 * @param {Object} questionnaire - Questionnaire FHIR 資源
 */
function displayQuestions(questionnaire) {
    const container = document.getElementById("questions-content");
    
    // 檢查問卷是否有題目
    if (!questionnaire.item || questionnaire.item.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                此問卷沒有題目
            </div>
        `;
        return;
    }

    // 遞迴渲染題目項目
    const questionsHtml = renderQuestionItems(questionnaire.item);
    container.innerHTML = questionsHtml;
}

/**
 * 遞迴渲染問卷題目項目（支援巢狀結構）
 * @param {Array} items - 題目項目陣列
 * @param {number} level - 巢狀層級（預設 0）
 * @returns {string} 生成的 HTML 字串
 */
function renderQuestionItems(items, level = 0) {
    return items.map((item, index) => {
        const linkId = item.linkId || `question-${index}`;
        const text = item.text || "無題目文字";
        let type = item.type || "unknown";
        let displayType = type;
        
        // 如果是可重複的 choice 類型，改為複選
        let isMultiChoice = false;
        if (item.repeats && type === 'choice') {
            displayType = 'multi-choice';
            isMultiChoice = true;
        }
        
        // 必填標籤
        const required = item.required 
            ? '<span class="question-required"><i class="fas fa-asterisk"></i> 必填</span>' 
            : '';
        
        // 可重複標籤（複選時不顯示）
        const repeats = (item.repeats && !isMultiChoice)
            ? '<span class="question-required" style="background: #fff3e0; color: #f57c00;"><i class="fas fa-repeat"></i> 可重複</span>' 
            : '';
        
        // 渲染答案選項
        let answerOptionsHtml = '';
        if (item.answerOption && item.answerOption.length > 0) {
            const options = item.answerOption.map(option => {
                let optionText = '';
                
                // 從不同的選項值類型提取文字
                if (option.valueCoding) {
                    optionText = option.valueCoding.display || option.valueCoding.code || '';
                } else if (option.valueString) {
                    optionText = option.valueString;
                } else if (option.valueInteger !== undefined) {
                    optionText = option.valueInteger.toString();
                } else if (option.valueDate) {
                    optionText = option.valueDate;
                }
                
                return `<div class="answer-option"><i class="fas fa-check-circle"></i> ${optionText}</div>`;
            }).join('');
            
            answerOptionsHtml = `<div class="answer-options"><strong>選項：</strong>${options}</div>`;
        }

        // 處理巢狀題目
        let nestedHtml = '';
        if (item.item && item.item.length > 0) {
            nestedHtml = `<div class="nested-items">${renderQuestionItems(item.item, level + 1)}</div>`;
        }

        // 組合成完整的題目卡片 HTML
        return `
            <div class="question-item">
                <div class="question-link-id"><i class="fas fa-link"></i> ${linkId}</div>
                <div class="question-text">${text}</div>
                <div>
                    <span class="question-type">${getTypeText(displayType)}</span>
                    ${required}
                    ${repeats}
                </div>
                ${answerOptionsHtml}
                ${nestedHtml}
            </div>
        `;
    }).join('');
}

// ============================================
// 檢視模式切換相關函式
// ============================================

/**
 * 切換到列表檢視模式
 */
function showListView() {
    currentViewMode = 'list';
    document.getElementById("list-section").style.display = "block";
    document.getElementById("response-section").style.display = "none";
    document.getElementById("back-button").classList.remove("show");
    
    // 隱藏詳細檢視元素
    document.querySelectorAll(".questionnaire-info, .question-section, .toggle-json, .json-viewer").forEach(el => {
        el.style.display = "none";
    });
    
    // 更新導航按鈕
    updateNavButtons();
}

/**
 * 切換到詳細檢視模式
 */
function showDetailView() {
    currentViewMode = 'detail';
    document.getElementById("list-section").style.display = "none";
    document.getElementById("response-section").style.display = "none";
    document.getElementById("back-button").classList.add("show");
    
    // 顯示詳細檢視元素
    document.querySelectorAll(".questionnaire-info, .question-section").forEach(el => {
        el.style.display = "block";
    });
    document.querySelector(".toggle-json").style.display = "block";
    
    // 更新導航按鈕
    updateNavButtons();
}

// ============================================
// JSON 檢視器相關函式
// ============================================

/**
 * 更新 JSON 檢視器的內容
 * @param {Object} data - 要顯示的 FHIR 資源
 */
function updateJsonViewer(data) {
    const jsonViewer = document.getElementById("json-viewer");
    jsonViewer.textContent = JSON.stringify(data, null, 2);
}

/**
 * 切換 JSON 檢視器的顯示/隱藏狀態
 */
function toggleJson() {
    const jsonViewer = document.getElementById("json-viewer");
    if (jsonViewer.style.display === "none") {
        jsonViewer.style.display = "block";
    } else {
        jsonViewer.style.display = "none";
    }
}

// ============================================
// 錯誤處理相關函式
// ============================================

/**
 * 在指定的容器中顯示錯誤訊息
 * @param {string} containerId - 容器元素的 ID
 * @param {string} message - 主要錯誤訊息
 * @param {Object} error - 錯誤物件
 */
function displayError(containerId, message, error) {
    const container = document.getElementById(containerId);
    const errorDetail = error.message || error.stack || JSON.stringify(error);
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>${message}</strong><br>
            <span style="font-size: 0.9rem;">${errorDetail}</span>
        </div>
    `;
}

// ============================================
// 輔助函式 - 資料轉換
// ============================================

/**
 * 根據狀態值返回對應的 CSS 類名
 * @param {string} status - Questionnaire 的 status 欄位值
 * @returns {string} CSS 類名
 */
function getStatusClass(status) {
    const statusMap = {
        'active': 'status-active',
        'draft': 'status-draft'
    };
    return statusMap[status] || 'status-draft';
}

/**
 * 根據狀態值返回中文描述
 * @param {string} status - Questionnaire 的 status 欄位值
 * @returns {string} 中文狀態描述
 */
function getStatusText(status) {
    const statusMap = {
        'draft': '草稿',
        'active': '使用中',
        'retired': '已退役',
        'unknown': '未知'
    };
    return statusMap[status] || status;
}

/**
 * 根據題目類型返回中文描述
 * @param {string} type - 題目的 type 欄位值
 * @returns {string} 中文類型描述
 */
function getTypeText(type) {
    const typeMap = {
        'group': '群組',
        'display': '顯示',
        'boolean': '是非題',
        'decimal': '小數',
        'integer': '整數',
        'date': '日期',
        'dateTime': '日期時間',
        'time': '時間',
        'string': '文字',
        'text': '長文字',
        'url': '網址',
        'choice': '單選',
        'multi-choice': '複選',
        'open-choice': '開放式單選',
        'attachment': '附件',
        'reference': '參考',
        'quantity': '數量'
    };
    return typeMap[type] || type;
}
// ============================================
// QuestionnaireResponse 相關函式
// ============================================

/**
 * 初始化 Response 查看功能
 */
function initializeResponseView() {
    console.log("初始化 Response 查看...");
    
    // 檢查是否有患者上下文
    if (client && client.patient) {
        console.log("患者 ID:", client.patient.id);
        loadPatientInfo();
        loadPatientResponses();
    } else {
        console.warn("未找到患者上下文");
        displayNoPatientInfo();
    }
}

/**
 * 加載患者信息
 */
function loadPatientInfo() {
    const patientId = client.patient.id;
    
    client.request(FHIR_SERVER_URL + "/Patient/" + patientId)
        .then(function(data) {
            console.log("患者信息已獲取:", data);
            patientInfo = data;
            renderPatientInfo(data);
        })
        .catch(function(error) {
            console.error("加載患者信息失敗:", error);
            displayError("patient-info-content", "無法加載患者信息", error);
        });
}

/**
 * 渲染患者信息
 * @param {Object} patient - Patient FHIR 資源
 */
function renderPatientInfo(patient) {
    const container = document.getElementById("patient-info-content");
    
    // 提取患者名稱
    let patientName = "未知";
    if (patient.name && patient.name.length > 0) {
        const nameObj = patient.name[0];
        const given = nameObj.given ? nameObj.given.join(' ') : '';
        const family = nameObj.family || '';
        patientName = (family + given).trim() || "未知";
    }
    
    // 提取性別
    const gender = patient.gender || "未知";
    const genderText = {
        'male': '男性',
        'female': '女性',
        'other': '其他',
        'unknown': '未知'
    }[gender] || gender;
    
    // 提取出生日期
    const birthDate = patient.birthDate || "未知";
    
    // 提取電話號碼
    let contact = "未知";
    if (patient.telecom && patient.telecom.length > 0) {
        const phone = patient.telecom.find(t => t.system === 'phone');
        if (phone) contact = phone.value;
    }
    
    // 提取地址
    let address = "未知";
    if (patient.address && patient.address.length > 0) {
        const addr = patient.address[0];
        address = (addr.line ? addr.line.join(', ') + ' ' : '') + 
                  (addr.city || '') + (addr.state || '') + (addr.postalCode || '');
        if (!address.trim()) address = "未知";
    }
    
    container.innerHTML = `
        <div class="patient-info-grid">
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-user"></i> 姓名</div>
                <div class="value">${patientName}</div>
            </div>
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-id-card"></i> 患者 ID</div>
                <div class="value">${patient.id}</div>
            </div>
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-cake-candles"></i> 出生日期</div>
                <div class="value">${birthDate}</div>
            </div>
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-venus-mars"></i> 性別</div>
                <div class="value">${genderText}</div>
            </div>
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-phone"></i> 聯絡方式</div>
                <div class="value">${contact}</div>
            </div>
            <div class="patient-info-item">
                <div class="label"><i class="fas fa-map-marker-alt"></i> 地址</div>
                <div class="value">${address}</div>
            </div>
        </div>
    `;
}

/**
 * 加載患者的所有 QuestionnaireResponse
 */
function loadPatientResponses() {
    const patientId = client.patient.id;
    
    // 查詢該患者的所有 QuestionnaireResponse，按最近填寫日期排序
    client.request(FHIR_SERVER_URL + "/QuestionnaireResponse?patient=" + patientId + "&_sort=-authored&_count=100")
        .then(function(data) {
            console.log("QuestionnaireResponse 列表已獲取:", data);
            
            if (data.entry && data.entry.length > 0) {
                // 提取所有 Response
                allResponses = data.entry.map(entry => entry.resource);
                console.log("找到 " + allResponses.length + " 個 QuestionnaireResponse");
                
                // 為每個 Response 加載相關的 Observation
                loadAllRelatedObservations();
                
                // 渲染列表
                renderResponseList();
            } else {
                renderNoResponses();
            }
        })
        .catch(function(error) {
            console.error("加載 QuestionnaireResponse 失敗:", error);
            displayError("response-list-content", "無法加載問卷回應", error);
        });
}

/**
 * 加載所有 Response 的相關 Observation
 */
function loadAllRelatedObservations() {
    // 為每個 Response 查詢相關的 Observation
    allResponses.forEach(response => {
        loadRelatedObservations(response.id);
    });
}

/**
 * 為特定 QuestionnaireResponse 加載相關的 Observation
 * @param {string} responseId - QuestionnaireResponse 的 ID
 */
function loadRelatedObservations(responseId) {
    const patientId = client.patient.id;
    
    // 查詢派生自此 Response 的 Observation
    const query = FHIR_SERVER_URL + "/Observation?derived-from=QuestionnaireResponse/" + responseId + "&patient=" + patientId + "&_count=100";
    
    client.request(query)
        .then(function(data) {
            console.log("Observation for response " + responseId + ":", data);
            
            if (data.entry && data.entry.length > 0) {
                allObservations[responseId] = data.entry.map(entry => entry.resource);
            } else {
                allObservations[responseId] = [];
            }
        })
        .catch(function(error) {
            console.warn("加載 Observation 失敗:", error);
            allObservations[responseId] = [];
        });
}

/**
 * 渲染 QuestionnaireResponse 列表
 */
function renderResponseList() {
    const container = document.getElementById("response-list-content");
    
    if (allResponses.length === 0) {
        renderNoResponses();
        return;
    }
    
    // 按 authored 日期排序（最新在前）
    const sortedResponses = [...allResponses].sort((a, b) => {
        const dateA = a.authored ? new Date(a.authored).getTime() : 0;
        const dateB = b.authored ? new Date(b.authored).getTime() : 0;
        return dateB - dateA;
    });
    
    const responseListHtml = sortedResponses.map(response => {
        const questionnaireRef = response.questionnaire || "";
        const questionnaireName = extractQuestionnaireName(response);
        const authoredDate = response.authored 
            ? new Date(response.authored).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : "未知";
        
        // 獲取相關的 Observation 分數
        const observations = allObservations[response.id] || [];
        let scoreHtml = '';
        if (observations.length > 0) {
            const obs = observations[0]; // 通常只有一個主要分數
            if (obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                scoreHtml = `<div class="response-score">${obs.valueQuantity.value}</div>`;
            }
        }
        
        const status = response.status || "unknown";
        
        return `
            <div class="response-card" onclick="showResponseDetail('${response.id}')">
                <div class="response-card-content">
                    <div class="response-card-title">${questionnaireName}</div>
                    <div class="response-card-date">
                        <i class="fas fa-calendar-alt"></i> ${authoredDate}
                    </div>
                </div>
                ${scoreHtml}
                <div class="response-status">
                    <span class="status-badge ${getStatusClass(status)}">${getStatusText(status)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="response-list">${responseListHtml}</div>`;
}

/**
 * 提取 Questionnaire 名稱
 * @param {Object} response - QuestionnaireResponse 資源
 * @returns {string} Questionnaire 名稱
 */
function extractQuestionnaireName(response) {
    const questionnaire = response.questionnaire || "";
    
    // 從 questionnaire 欄位提取 ID
    // questionnaire 可能是相對引用 (Questionnaire/{id}) 或完整 canonical URL
    if (questionnaire) {
        // 移除 canonical URL 中的版本號 (format: ...Questionnaire/{id}|{version})
        let cleanRef = questionnaire.split('|')[0];
        
        // 提取最後的 ID 部分
        const qId = cleanRef.split('/').pop();
        
        // 用提取的 ID 從問卷列表中查找對應的 Questionnaire
        const foundQ = allQuestionnaires.find(q => q.id === qId);
        if (foundQ) {
            return foundQ.title || foundQ.name || qId;
        }
        
        // 如果找不到，返回 ID
        return qId || "未知問卷";
    }
    
    return "未知問卷";
}

/**
 * 顯示 Response 詳情
 * @param {string} responseId - QuestionnaireResponse 的 ID
 */
function showResponseDetail(responseId) {
    currentResponseId = responseId;
    renderResponseDetail(responseId);
    document.getElementById("response-list-content").parentElement.style.display = "none";
    document.getElementById("response-detail-section").style.display = "block";
}

/**
 * 隱藏 Response 詳情，返回列表
 */
function hideResponseDetail() {
    currentResponseId = null;
    document.getElementById("response-list-content").parentElement.style.display = "block";
    document.getElementById("response-detail-section").style.display = "none";
}

/**
 * 渲染 QuestionnaireResponse 詳情
 * @param {string} responseId - QuestionnaireResponse 的 ID
 */
function renderResponseDetail(responseId) {
    const response = allResponses.find(r => r.id === responseId);
    if (!response) {
        displayError("response-detail-content", "找不到回應", new Error("Response not found"));
        return;
    }
    
    const container = document.getElementById("response-detail-content");
    
    const questionnaireName = extractQuestionnaireName(response);
    const authoredDate = response.authored 
        ? new Date(response.authored).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "未知";
    
    const status = response.status || "unknown";
    
    // 渲染答案項目
    let answersHtml = '';
    if (response.item && response.item.length > 0) {
        answersHtml = renderResponseItems(response.item);
    } else {
        answersHtml = '<div style="padding: 20px; text-align: center; color: #666;">沒有答案記錄</div>';
    }
    
    // 渲染相關的 Observation
    let observationHtml = '';
    const observations = allObservations[responseId] || [];
    if (observations.length > 0) {
        observationHtml = renderObservationDetails(observations);
    } else {
        observationHtml = '<div style="padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center; color: #999;">無相關觀察記錄</div>';
    }
    
    container.innerHTML = `
        <div class="response-header">
            <h2><i class="fas fa-file-alt"></i> ${questionnaireName}</h2>
            <div class="response-meta">
                <div class="meta-item">
                    <span class="meta-label">填寫日期：</span>
                    <span class="meta-value">${authoredDate}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">狀態：</span>
                    <span class="status-badge ${getStatusClass(status)}">${getStatusText(status)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Response ID：</span>
                    <span class="meta-value" style="font-family: monospace; font-size: 0.9rem;">${responseId}</span>
                </div>
            </div>
        </div>
        
        <div class="response-section-container">
            <h3><i class="fas fa-question-circle"></i> 答案</h3>
            <div class="response-answers">
                ${answersHtml}
            </div>
        </div>
        
        <div class="response-section-container">
            <h3><i class="fas fa-chart-line"></i> 相關觀察結果</h3>
            <div class="response-observations">
                ${observationHtml}
            </div>
        </div>
    `;
    
    // 更新 JSON 查看器
    updateResponseJsonViewer(response, observations);
}

/**
 * 遞迴渲染 QuestionnaireResponse 的答案項目
 * @param {Array} items - Response 的 item 陣列
 * @returns {string} 生成的 HTML 字串
 */
function renderResponseItems(items) {
    return items.map((item, index) => {
        const linkId = item.linkId || `item-${index}`;
        const text = item.text || "無題目文字";
        
        // 渲染答案
        let answerHtml = '';
        if (item.answer && item.answer.length > 0) {
            const answers = item.answer.map(answer => {
                let answerText = '';
                
                if (answer.valueString) {
                    answerText = answer.valueString;
                } else if (answer.valueInteger !== undefined) {
                    answerText = answer.valueInteger.toString();
                } else if (answer.valueBoolean !== undefined) {
                    answerText = answer.valueBoolean ? '是' : '否';
                } else if (answer.valueDate) {
                    answerText = answer.valueDate;
                } else if (answer.valueDateTime) {
                    answerText = new Date(answer.valueDateTime).toLocaleString('zh-TW');
                } else if (answer.valueCoding) {
                    answerText = answer.valueCoding.display || answer.valueCoding.code || '未知';
                    // 如果同時有 valueDecimal，添加到顯示中
                    if (answer.extension?.valueDecimal !== undefined) {
                        answerText += ` (${answer.extension.valueDecimal})`;
                    }
                } else if (answer.valueDecimal !== undefined) {
                    answerText = answer.valueDecimal.toString();
                } else if (answer.valueQuantity) {
                    answerText = (answer.valueQuantity.value || '') + ' ' + (answer.valueQuantity.unit || '');
                } else {
                    answerText = JSON.stringify(answer).substring(0, 100);
                }
                
                return `<div class="response-answer-value"><i class="fas fa-check"></i> ${answerText}</div>`;
            }).join('');
            
            answerHtml = `<div class="response-answers-container">${answers}</div>`;
        } else {
            answerHtml = '<div class="response-no-answer">未回答</div>';
        }
        
        // 處理巢狀項目
        let nestedHtml = '';
        if (item.item && item.item.length > 0) {
            nestedHtml = `<div class="nested-response-items">${renderResponseItems(item.item)}</div>`;
        }
        
        return `
            <div class="response-item">
                <div class="response-item-header">
                    <div class="response-item-linkid">${linkId}</div>
                    <div class="response-item-text">${text}</div>
                </div>
                ${answerHtml}
                ${nestedHtml}
            </div>
        `;
    }).join('');
}

/**
 * 渲染 Observation 詳情
 * @param {Array} observations - Observation 資源陣列
 * @returns {string} 生成的 HTML 字串
 */
function renderObservationDetails(observations) {
    return observations.map(obs => {
        const code = obs.code ? (obs.code.text || obs.code.coding?.[0]?.display || '未知') : '未知';
        const value = obs.valueQuantity ? 
                      `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ''}`.trim() : 
                      '無值';
        const effectiveDate = obs.effectiveDateTime 
            ? new Date(obs.effectiveDateTime).toLocaleString('zh-TW')
            : '未知';
        const method = obs.method ? obs.method.text : '未知方法';
        
        // 渲染備註
        let noteHtml = '';
        if (obs.note && obs.note.length > 0) {
            const notes = obs.note.map(note => 
                `<div class="observation-note">${note.text}</div>`
            ).join('');
            noteHtml = `<div class="observation-notes">${notes}</div>`;
        }
        
        return `
            <div class="observation-card">
                <div class="observation-header">
                    <div class="observation-code">${code}</div>
                    <div class="observation-value">${value}</div>
                </div>
                <div class="observation-details">
                    <div class="observation-detail-item">
                        <span class="detail-label">測量時間：</span>
                        <span class="detail-value">${effectiveDate}</span>
                    </div>
                    <div class="observation-detail-item">
                        <span class="detail-label">測量方法：</span>
                        <span class="detail-value">${method}</span>
                    </div>
                </div>
                ${noteHtml}
            </div>
        `;
    }).join('');
}

/**
 * 切換到 Response 查看視圖
 */
function displayResponseView() {
    currentViewMode = 'response';
    
    // 隱藏其他視圖
    document.getElementById("list-section").style.display = "none";
    document.querySelectorAll(".questionnaire-info, .question-section, .toggle-json, .json-viewer").forEach(el => {
        el.style.display = "none";
    });
    
    // 顯示 Response 視圖
    document.getElementById("response-section").style.display = "block";
    document.getElementById("response-detail-section").style.display = "none";
    document.getElementById("response-list-content").parentElement.style.display = "block";
    document.getElementById("back-button").classList.remove("show");
    
    // 更新導航按鈕
    updateNavButtons();
}

/**
 * 更新導航按鈕的狀態
 */
function updateNavButtons() {
    document.getElementById("nav-questionnaire").classList.remove("active");
    document.getElementById("nav-response").classList.remove("active");
    
    if (currentViewMode === 'list') {
        document.getElementById("nav-questionnaire").classList.add("active");
    } else if (currentViewMode === 'response') {
        document.getElementById("nav-response").classList.add("active");
    }
}

/**
 * 顯示沒有患者信息的消息
 */
function displayNoPatientInfo() {
    const container = document.getElementById("patient-info-content");
    container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #666;">
            <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
            <h3>未找到患者信息</h3>
            <p>此應用需要患者上下文才能查看問卷回應。</p>
        </div>
    `;
}

/**
 * 顯示沒有 Response 的消息
 */
function renderNoResponses() {
    const container = document.getElementById("response-list-content");
    container.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
            <h3>沒有問卷回應</h3>
            <p>該患者尚未填寫任何問卷。</p>
        </div>
    `;
}

/**
 * 更新 Response JSON 查看器的內容
 * @param {Object} response - QuestionnaireResponse FHIR 資源
 * @param {Array} observations - 相關的 Observation 資源陣列
 */
function updateResponseJsonViewer(response, observations) {
    const jsonViewer = document.getElementById("response-json-viewer");
    const data = {
        QuestionnaireResponse: response,
        RelatedObservations: observations || []
    };
    jsonViewer.textContent = JSON.stringify(data, null, 2);
}

/**
 * 切換 Response JSON 查看器的顯示/隱藏狀態
 */
function toggleResponseJson() {
    const jsonViewer = document.getElementById("response-json-viewer");
    if (jsonViewer.style.display === "none") {
        jsonViewer.style.display = "block";
    } else {
        jsonViewer.style.display = "none";
    }
}