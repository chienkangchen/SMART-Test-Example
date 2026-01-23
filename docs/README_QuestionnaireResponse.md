# QuestionnaireResponse 查看功能說明文檔

## 概述

本文檔說明了在 SMART on FHIR 應用中新增的 QuestionnaireResponse（問卷回應）查看功能。這個功能允許患者查看他們之前填寫的所有問卷回應，以及與這些回應相關的觀察結果（Observation）。

## 新增功能特性

### 1. **患者信息展示**
- 顯示患者的基本信息（姓名、ID、出生日期、性別、聯絡方式、地址）
- 以綠色卡片形式展示，視覺上與問卷列表區分
- 響應式設計，在不同設備上自動調整佈局

### 2. **問卷回應列表**
- 顯示該患者填寫的所有 QuestionnaireResponse
- 按填寫日期逆序排列（最新的在前面）
- 每個回應顯示：
  - 問卷名稱
  - 填寫日期和時間
  - 相關觀察的得分（如果存在）
  - 回應狀態

### 3. **詳細回應查看**
- 點擊列表項查看詳細信息，包括：
  - 患者簡要信息
  - 問卷名稱和填寫時間
  - 所有問題和患者的答案
  - 支持嵌套問題的顯示
  - 相關的 Observation 結果（得分、測量方法、備註等）

### 4. **觀察結果（Observation）展示**
- 顯示派生自 QuestionnaireResponse 的 Observation 數據
- 包括：
  - 觀察指標名稱
  - 數值和單位（如得分）
  - 測量時間
  - 測量方法
  - 詳細備註和臨床指導

### 5. **導航系統**
- 頂部導航按鈕在「問卷」和「我的回應」視圖之間切換
- 返回按鈕方便用戶在不同視圖間移動

## 技術實現細節

### 新增 HTML 元素 (index.html)

```html
<!-- Navigation Buttons -->
<div class="nav-buttons">
    <button class="nav-btn" id="nav-questionnaire" onclick="showListView()">
        <i class="fas fa-list"></i><span>問卷</span>
    </button>
    <button class="nav-btn" id="nav-response" onclick="displayResponseView()">
        <i class="fas fa-check-square"></i><span>我的回應</span>
    </button>
</div>

<!-- QuestionnaireResponse Section -->
<div id="response-section">
    <!-- 患者信息 -->
    <div class="patient-info-card">
        <h2><i class="fas fa-user-circle"></i> 患者信息</h2>
        <div id="patient-info-content">...</div>
    </div>
    
    <!-- 回應列表 -->
    <div class="response-list-section">
        <h2><i class="fas fa-list-check"></i> 問卷回應</h2>
        <div id="response-list-content">...</div>
    </div>
    
    <!-- 回應詳情 -->
    <div id="response-detail-section">
        <div class="response-detail-container">
            <button class="back-to-response-btn" onclick="hideResponseDetail()">
                <i class="fas fa-arrow-left"></i> 返回回應列表
            </button>
            <div id="response-detail-content">...</div>
        </div>
    </div>
</div>
```

### 新增 JavaScript 函數 (app.js)

#### 初始化函數

**`initializeResponseView()`**
- 初始化 Response 查看功能
- 檢查患者上下文是否存在
- 如果存在，加載患者信息和所有回應

#### 數據加載函數

**`loadPatientInfo()`**
- 從 FHIR 服務器獲取患者資源
- 提取患者的基本信息

**`loadPatientResponses()`**
- 查詢該患者的所有 QuestionnaireResponse
- 查詢條件：`/QuestionnaireResponse?patient=${patientId}&_sort=-authored&_count=100`
- 為每個回應加載相關的 Observation

**`loadRelatedObservations(responseId)`**
- 查詢派生自特定 Response 的 Observation
- 查詢條件：`/Observation?derived-from=QuestionnaireResponse/${responseId}&patient=${patientId}`
- 結果存儲在全局變量 `allObservations` 中

#### 渲染函數

**`renderPatientInfo(patient)`**
- 將患者信息渲染為網格佈局
- 自動提取和格式化患者數據

**`renderResponseList()`**
- 將所有 QuestionnaireResponse 渲染為卡片列表
- 支持點擊查看詳情

**`renderResponseDetail(responseId)`**
- 渲染特定 Response 的詳細信息
- 包括答案和相關 Observation

**`renderResponseItems(items)`**
- 遞迴渲染 Response 中的問題和答案
- 支持嵌套結構

**`renderObservationDetails(observations)`**
- 將 Observation 數據渲染為詳細卡片

#### 視圖控制函數

**`displayResponseView()`**
- 切換到 Response 視圖
- 隱藏問卷視圖
- 更新導航按鈕狀態

**`showResponseDetail(responseId)`**
- 顯示特定 Response 的詳情
- 隱藏列表視圖

**`hideResponseDetail()`**
- 返回到 Response 列表視圖

**`updateNavButtons()`**
- 更新導航按鈕的 active 狀態

#### 輔助函數

**`extractQuestionnaireName(response)`**
- 從 Response 中提取 Questionnaire 名稱
- 在已加載的問卷列表中查找

### 新增 CSS 樣式 (style.css)

#### 導航相關
- `.nav-buttons` - 導航按鈕容器
- `.nav-btn` - 導航按鈕樣式
- `.nav-btn.active` - 活動按鈕樣式

#### 患者信息相關
- `.patient-info-card` - 患者信息卡片（綠色背景）
- `.patient-info-grid` - 患者信息網格佈局
- `.patient-info-item` - 患者信息項目

#### Response 列表相關
- `.response-list-section` - 列表區域容器
- `.response-list` - 列表容器
- `.response-card` - 單個回應卡片
- `.response-card-title` - 卡片標題
- `.response-card-date` - 卡片日期
- `.response-score` - 得分顯示
- `.response-status` - 狀態徽章

#### Response 詳情相關
- `.response-detail-container` - 詳情容器
- `.response-header` - 詳情頁頭（橙色背景）
- `.response-section-container` - 區域容器
- `.response-item` - 回應項目
- `.response-answer-value` - 答案值（綠色背景）
- `.response-no-answer` - 未回答標記

#### Observation 相關
- `.observation-card` - Observation 卡片
- `.observation-header` - Observation 頭部
- `.observation-value` - Observation 值
- `.observation-details` - 詳細信息網格
- `.observation-notes` - 備註區域（橙色背景）

#### 響應式設計
- 平板 (768px 以下)：調整卡片佈局
- 手機 (480px 以下)：隱藏文字標籤，調整按鈕大小
- 大屏幕 (1200px+)：增加信息網格列數

## 全局變量

```javascript
let allResponses = [];           // 所有 QuestionnaireResponse 資源
let allObservations = {};        // Observation 按 Response ID 分類
let patientInfo = null;          // 患者信息
let currentResponseId = null;    // 當前選中的 Response ID
let currentViewMode = 'list';    // 當前視圖模式：'list', 'detail', 或 'response'
```

## FHIR 服務器查詢

本應用使用以下 FHIR 查詢：

```
FHIR 服務器: https://thas.mohw.gov.tw/v/r4/fhir

患者信息:
GET /Patient/{patientId}

問卷回應列表:
GET /QuestionnaireResponse?patient={patientId}&_sort=-authored&_count=100

相關觀察:
GET /Observation?derived-from=QuestionnaireResponse/{responseId}&patient={patientId}&_count=100
```

## 使用流程

### 對於患者用戶：

1. **查看可用問卷**
   - 在「問卷」視圖查看所有可用的問卷

2. **查看回應歷史**
   - 點擊導航中的「我的回應」按鈕
   - 查看患者信息和之前填寫的所有問卷回應

3. **查看詳細回應**
   - 點擊列表中的任何回應卡片
   - 查看完整的答案和相關的觀察結果

4. **返回列表**
   - 點擊「返回回應列表」按鈕返回

### 系統行為：

1. 應用初始化時，自動檢測患者上下文
2. 如果存在患者 ID，自動加載患者信息和所有回應
3. 每個回應的相關 Observation 會自動加載
4. 用戶可以在問卷和回應視圖之間自由切換

## 錯誤處理

應用包含以下錯誤處理：

- **未找到患者信息**：顯示「未找到患者信息」消息
- **沒有 QuestionnaireResponse**：顯示「沒有問卷回應」消息
- **無相關 Observation**：顯示「無相關觀察記錄」
- **加載失敗**：顯示詳細的錯誤消息

## 調試技巧

1. **控制台日誌**：應用在加載各項資源時會輸出詳細的控制台日誌
   - 患者 ID：`console.log("患者 ID:", client.patient.id)`
   - Response 列表：`console.log("找到 X 個 QuestionnaireResponse")`
   - Observation：`console.log("Observation for response", data)`

2. **OAuth2 信息**：調試信息存儲在 `#oauth2read` 元素中（隱藏但可在開發者工具中查看）

3. **API 查詢診斷**：檢查浏览器開發者工具的「Network」標籤查看實際的 FHIR API 調用

## 兼容性

- 支持所有現代瀏覽器（Chrome, Firefox, Safari, Edge）
- 完全響應式設計，支持手機、平板和桌面
- 依賴 FHIR R4 標準

## 注意事項

1. **患者上下文**：此功能必須在 SMART on FHIR OAuth2 流程中有有效的患者上下文才能工作
2. **權限**：需要服務器上的適當權限來讀取 Patient, QuestionnaireResponse 和 Observation 資源
3. **分頁**：查詢使用 `_count=100`，超過 100 個資源需要實現分頁
4. **性能**：大量 Observation 查詢可能需要優化（可考慮批量查詢）

## 未來改進方向

1. 添加 Observation 的圖表可視化（趨勢圖表）
2. 實現 QuestionnaireResponse 的搜索和篩選
3. 添加導出功能（PDF/CSV）
4. 實現分頁支持超過 100 個回應
5. 添加 Observation 值的範圍判斷（正常/異常）

## 支持

如有任何問題或建議，請參考應用的控制台日誌進行診斷。
