# QuestionnaireResponse 功能 - 技術參考指南

## 函數參考

### 初始化和加載函數

#### `initializeResponseView()`
**功能**：初始化 Response 查看功能
**調用時機**：應用啟動時（SMART on FHIR 連線後）
**邏輯**：
1. 檢查 `client.patient` 是否存在
2. 如果存在，調用 `loadPatientInfo()` 和 `loadPatientResponses()`
3. 如果不存在，調用 `displayNoPatientInfo()`

**代碼位置**：app.js 第 950-965 行

```javascript
function initializeResponseView() {
    console.log("初始化 Response 查看...");
    if (client && client.patient) {
        console.log("患者 ID:", client.patient.id);
        loadPatientInfo();
        loadPatientResponses();
    } else {
        console.warn("未找到患者上下文");
        displayNoPatientInfo();
    }
}
```

#### `loadPatientInfo()`
**功能**：從 FHIR 服務器加載患者資源
**API 調用**：`GET /Patient/{patientId}`
**返回值**：Patient FHIR 資源（存儲在 `patientInfo` 全局變數）
**後續操作**：調用 `renderPatientInfo()`

**代碼位置**：app.js 第 967-982 行

#### `loadPatientResponses()`
**功能**：加載該患者的所有 QuestionnaireResponse
**API 調用**：
```
GET /QuestionnaireResponse?patient={patientId}&_sort=-authored&_count=100
```
**返回值**：Bundle 資源，entry 陣列存儲在 `allResponses`
**後續操作**：
1. 調用 `loadAllRelatedObservations()`
2. 調用 `renderResponseList()`

**代碼位置**：app.js 第 1023-1048 行

#### `loadAllRelatedObservations()`
**功能**：為所有 Response 加載相關 Observation
**邏輯**：
```javascript
allResponses.forEach(response => {
    loadRelatedObservations(response.id);
});
```
**代碼位置**：app.js 第 1050-1055 層

#### `loadRelatedObservations(responseId)`
**功能**：為特定 Response 加載相關 Observation
**API 調用**：
```
GET /Observation?derived-from=QuestionnaireResponse/{responseId}&patient={patientId}&_count=100
```
**返回值**：結果存儲在 `allObservations[responseId]` 中
**特點**：錯誤不中斷流程，返回空陣列

**代碼位置**：app.js 第 1057-1076 層

---

### 渲染函數

#### `renderPatientInfo(patient)`
**功能**：將患者信息渲染為卡片網格
**輸入**：Patient FHIR 資源物件
**輸出**：HTML 字串，寫入 `#patient-info-content`
**提取字段**：
- 姓名（`patient.name[0]`）
- ID（`patient.id`）
- 出生日期（`patient.birthDate`）
- 性別（`patient.gender`）
- 電話（`patient.telecom`）
- 地址（`patient.address`）

**布局**：
- 桌面：3 列網格
- 平板：1-2 列
- 手機：1 列

**代碼位置**：app.js 第 984-1021 層

#### `renderResponseList()`
**功能**：渲染 QuestionnaireResponse 列表為卡片視圖
**輸入**：無（使用全局變數 `allResponses` 和 `allObservations`）
**輸出**：HTML 字串，寫入 `#response-list-content`
**排序**：按 `authored` 日期降序（最新在前）

**卡片內容**：
```
[問卷名稱]
[日期時間] [得分（如果有）] [狀態]
```

**點擊事件**：調用 `showResponseDetail(responseId)`

**代碼位置**：app.js 第 1177-1227 層

#### `renderResponseDetail(responseId)`
**功能**：渲染 Response 的完整詳情
**輸入**：ResponseId 字串
**輸出**：HTML 字串，寫入 `#response-detail-content`

**顯示內容**：
1. **頭部**（橙色背景）
   - 問卷名稱
   - 填寫日期
   - 狀態
   - Response ID

2. **答案部分**
   - 問題標題
   - 患者答案

3. **觀察結果部分**
   - Observation 數據
   - 如無則顯示 "無相關觀察記錄"

**代碼位置**：app.js 第 1249-1308 層

#### `renderResponseItems(items)`
**功能**：遞迴渲染 Response 中的問題和答案
**輸入**：Response 中的 `item` 陣列
**輸出**：HTML 字串
**遞迴支持**：無限深度嵌套

**答案值類型支持**：
- `valueString` - 文字
- `valueInteger` - 整數
- `valueBoolean` - 是/否
- `valueDate` - 日期
- `valueDateTime` - 日期時間（自動轉換為本地時間）
- `valueCoding` - 編碼（顯示 display）
- `valueDecimal` - 小數
- `valueQuantity` - 數量

**樣式**：
- 答案有值：綠色背景 (#e8f5e9)
- 無答案：灰色背景 (#f5f5f5)
- 嵌套項：左邊框 + 縮進

**代碼位置**：app.js 第 1310-1376 層

#### `renderObservationDetails(observations)`
**功能**：渲染 Observation 詳細信息
**輸入**：Observation 資源陣列
**輸出**：HTML 字串

**顯示內容**：
```
[觀察指標名稱]          [數值+單位]
測量時間：[日期時間]
測量方法：[方法文字]
[備註（如有）]
```

**備註樣式**：橙色背景，支持多行（white-space: pre-wrap）

**代碼位置**：app.js 第 1378-1425 層

---

### 視圖控制函數

#### `displayResponseView()`
**功能**：切換到 Response 視圖
**行為**：
1. 設置 `currentViewMode = 'response'`
2. 隱藏：list-section, questionnaire-info, question-section, toggle-json, json-viewer
3. 顯示：response-section, response-list-content
4. 隱藏：response-detail-section
5. 顯示：back-button
6. 調用 `updateNavButtons()`

**代碼位置**：app.js 第 1427-1447 層

#### `showResponseDetail(responseId)`
**功能**：顯示特定 Response 的詳情
**行為**：
1. 設置 `currentResponseId = responseId`
2. 調用 `renderResponseDetail(responseId)`
3. 隱藏：response-list-content 的父元素（response-list-section）
4. 顯示：response-detail-section

**代碼位置**：app.js 第 1241-1247 層

#### `hideResponseDetail()`
**功能**：隱藏詳情，返回列表
**行為**：
1. 清除 `currentResponseId`
2. 顯示：response-list-content 的父元素
3. 隱藏：response-detail-section

**代碼位置**：app.js 第 1229-1237 層

#### `showListView()` (修改)
**修改**：添加 Response 視圖隱藏
**新邏輯**：
```javascript
document.getElementById("response-section").style.display = "none";
updateNavButtons(); // 新增
```

#### `showDetailView()` (修改)
**修改**：添加 Response 視圖隱藏和導航更新
**新邏輯**：
```javascript
document.getElementById("response-section").style.display = "none";
updateNavButtons(); // 新增
```

#### `updateNavButtons()`
**功能**：更新導航按鈕的 active 狀態
**邏輯**：
```javascript
if (currentViewMode === 'list') {
    nav-questionnaire.active
} else if (currentViewMode === 'response') {
    nav-response.active
}
```

**代碼位置**：app.js 第 1449-1459 層

---

### 輔助和錯誤處理函數

#### `extractQuestionnaireName(response)`
**功能**：從 Response 中提取 Questionnaire 名稱
**邏輯**：
1. 從 `response.questionnaire` 中提取 ID
2. 在 `allQuestionnaires` 中查找
3. 返回 title 或 name
4. 如無，返回 ID

**代碼位置**：app.js 第 1229-1240 層

#### `displayNoPatientInfo()`
**功能**：顯示未找到患者的消息
**觸發**：初始化時無患者上下文
**消息**："此應用需要患者上下文才能查看問卷回應"

**代碼位置**：app.js 第 1461-1476 層

#### `renderNoResponses()`
**功能**：顯示沒有 Response 的消息
**觸發**：加載 Response 時無結果
**消息**："該患者尚未填寫任何問卷"

**代碼位置**：app.js 第 1478-1491 層

---

## 全局變數

| 變數名 | 類型 | 初始值 | 說明 |
|---------|------|--------|------|
| `allResponses` | Array | [] | 所有 QuestionnaireResponse 資源 |
| `allObservations` | Object | {} | Observation 按 Response ID 分類：`{responseId: [obs...]}` |
| `patientInfo` | Object | null | 當前患者的 Patient 資源 |
| `currentResponseId` | String | null | 當前查看的 Response ID |
| `currentViewMode` | String | 'list' | 當前視圖模式（'list', 'detail', 'response'） |

---

## CSS 選擇器參考

### 導航相關
| 選擇器 | 用途 | 重要樣式 |
|--------|------|--------|
| `.nav-buttons` | 導航容器 | display: flex; gap: 10px; |
| `.nav-btn` | 導航按鈕 | border: 2px solid #2196F3; padding: 10px 20px; |
| `.nav-btn.active` | 活動按鈕 | background: #2196F3; color: white; |

### 患者信息
| 選擇器 | 用途 | 重要樣式 |
|--------|------|--------|
| `.patient-info-card` | 患者卡片 | background: linear-gradient(#4CAF50, #388E3C); color: white; |
| `.patient-info-grid` | 網格容器 | display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); |
| `.patient-info-item` | 單項 | background: rgba(255, 255, 255, 0.1); padding: 15px; |

### Response 列表
| 選擇器 | 用途 | 重要樣式 |
|--------|------|--------|
| `.response-list-section` | 列表區域 | border-left: 5px solid #FF9800; |
| `.response-card` | 卡片 | display: flex; border-left: 4px solid #FF9800; cursor: pointer; |
| `.response-card:hover` | 懸停 | transform: translateX(5px); box-shadow: 0 4px 12px rgba(...); |
| `.response-score` | 得分 | color: #FF9800; font-size: 1.8rem; font-weight: 700; |

### Response 詳情
| 選擇器 | 用途 | 重要樣式 |
|--------|------|--------|
| `.response-header` | 頭部 | background: linear-gradient(#FF9800, #F57C00); color: white; |
| `.response-item` | 問題項目 | border-left: 3px solid #9C27B0; |
| `.response-answer-value` | 答案值 | background: #e8f5e9; color: #2e7d32; |

### Observation
| 選擇器 | 用途 | 重要樣式 |
|--------|------|--------|
| `.observation-card` | Observation 卡片 | border-left: 4px solid #2196F3; |
| `.observation-value` | Observation 值 | color: #2196F3; font-size: 1.5rem; font-weight: 700; |
| `.observation-notes` | 備註區域 | background: #fff3e0; border-left: 3px solid #FF9800; |

---

## HTML 結構參考

### Response Section 層級結構
```html
<div id="response-section">
  ├─ <div class="patient-info-card">
  │   ├─ <h2>患者信息</h2>
  │   └─ <div id="patient-info-content">
  │       └─ <div class="patient-info-grid">
  │           └─ <div class="patient-info-item">
  │
  ├─ <div class="response-list-section">
  │   ├─ <h2>問卷回應</h2>
  │   └─ <div id="response-list-content">
  │       └─ <div class="response-list">
  │           └─ <div class="response-card" onclick="showResponseDetail(...)">
  │
  └─ <div id="response-detail-section" style="display: none;">
      └─ <div class="response-detail-container">
          ├─ <button class="back-to-response-btn">
          └─ <div id="response-detail-content">
              ├─ <div class="response-header">
              └─ <div class="response-section-container">
                  ├─ <div class="response-answers">
                  │   └─ <div class="response-item">
                  └─ <div class="response-observations">
                      └─ <div class="observation-card">
```

---

## 事件流程圖

### 應用啟動流程
```
頁面加載
  ↓
FHIR.oauth2.ready()
  ↓
loadQuestionnaireList()
↓
initializeResponseView()
  ├─ 檢查 client.patient
  ├─ loadPatientInfo() → renderPatientInfo()
  └─ loadPatientResponses()
       └─ loadAllRelatedObservations()
            └─ 為每個 Response: loadRelatedObservations()
       └─ renderResponseList()
  ↓
showListView() - 顯示問卷列表
```

### 用戶點擊「我的回應」流程
```
用戶點擊 nav-response 按鈕
  ↓
displayResponseView()
  ├─ currentViewMode = 'response'
  ├─ 隱藏所有其他視圖
  ├─ 顯示 response-section
  └─ updateNavButtons() - 高亮 nav-response
  ↓
顯示患者信息卡片和 Response 列表
```

### 用戶點擊某個 Response 流程
```
用戶點擊 response-card
  ↓
showResponseDetail(responseId)
  ├─ currentResponseId = responseId
  ├─ renderResponseDetail(responseId)
  │   ├─ renderResponseItems() - 渲染答案
  │   └─ renderObservationDetails() - 渲染觀察
  ├─ 隱藏 response-list-section
  └─ 顯示 response-detail-section
  ↓
顯示完整的 Response 詳情和相關 Observation
```

---

## 性能考慮

### 優化已實現
1. **並行加載**：loadPatientInfo() 和 loadPatientResponses() 同時執行
2. **延遲渲染**：只在需要時渲染詳情
3. **緩存**：加載後的數據存儲在全局變數中

### 潛在優化
1. **批量 Observation 查詢**：目前為每個 Response 單獨查詢，可考慮批量
2. **分頁**：超過 100 個資源需要實現分頁邏輯
3. **搜索/過濾**：可添加 Response 的搜索功能

---

## 調試技巧

### 開發者工具

1. **檢查患者 ID**
   ```javascript
   console.log(client.patient.id)
   ```

2. **檢查加載的 Response**
   ```javascript
   console.log(allResponses)
   console.log(allObservations)
   ```

3. **追蹤 API 調用**
   - 開發者工具 → Network 標籤
   - 過濾 "QuestionnaireResponse" 和 "Observation"

4. **查看元素狀態**
   ```javascript
   document.getElementById("response-section").style.display // "block" or "none"
   ```

5. **測試渲染函數**
   ```javascript
   renderResponseList() // 重新渲染列表
   ```

---

## 常用查詢命令

### 獲取患者的所有 Response
```javascript
client.request("/QuestionnaireResponse?patient=<patientId>&_count=100")
```

### 獲取特定 Response 的 Observation
```javascript
client.request("/Observation?derived-from=QuestionnaireResponse/<responseId>&patient=<patientId>")
```

### 獲取特定的 Response
```javascript
client.request("/QuestionnaireResponse/<responseId>")
```

---

此技術參考文檔涵蓋了 QuestionnaireResponse 功能的所有關鍵方面。
