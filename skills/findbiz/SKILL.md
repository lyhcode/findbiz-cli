---
name: findbiz
description: 查詢台灣商工登記公示資料（公司、分公司、商業、工廠、有限合夥）。當使用者提到統一編號、統編、營業登記、公司查詢、商業登記、工廠登記、查公司名稱、查統編、查地址有哪些公司、同地址公司，或需要驗證公司是否存在、補齊統編資料時，都應觸發此 skill。即使使用者只是說「查一下這家公司」、「幫我查統編」、「這家公司還在嗎」、「這個地址有哪些公司」也應觸發。
tools: Bash
---

# findbiz — 台灣商工登記查詢

透過 `npx github:lyhcode/findbiz-cli` 查詢經濟部商工登記公示資料，支援公司名稱、統一編號、地址多維度查詢。

## 使用方式

### 以統編查詳細資料（推薦）

```bash
npx -y github:lyhcode/findbiz-cli detail 12345678 --json
```

### 以地址查詢

```bash
npx -y github:lyhcode/findbiz-cli address '臺中市西區和龍里臺灣大道二段２號１６樓之２' --json
npx -y github:lyhcode/findbiz-cli address '臺北市信義區' --alive --json  # 僅核准設立
npx -y github:lyhcode/findbiz-cli address '臺北市信義區' --all --json   # 取得所有分頁
```

### 以代表人查詢

```bash
npx -y github:lyhcode/findbiz-cli rep '王小明' --json
npx -y github:lyhcode/findbiz-cli rep '王小明' --alive --type 公司 --json
npx -y github:lyhcode/findbiz-cli rep '王小明' --all --json  # 取得所有分頁
```

### 以名稱查統編

```bash
npx -y github:lyhcode/findbiz-cli name '公司名稱' --json
```

### 以統編查名稱

```bash
npx -y github:lyhcode/findbiz-cli taxid 12345678 --json
```

### 通用搜尋

```bash
npx -y github:lyhcode/findbiz-cli search '關鍵字' --json
npx -y github:lyhcode/findbiz-cli search '關鍵字' --alive --json  # 僅核准設立
```

## 輸出格式

一律使用 `--json` 取得結構化資料方便後續處理。

**detail 指令回傳（完整詳細資料）：**
```json
{
  "dataType": "公司",
  "taxId": "90581366",
  "status": "核准設立",
  "name": "蘿蔔科技股份有限公司",
  "englishName": "TURNIP CO., LTD.",
  "capital": "1,000,000",
  "paidInCapital": "1,000,000",
  "representative": "王小明",
  "address": "臺中市西區...",
  "authority": "臺中市政府",
  "establishDate": "111年01月11日",
  "changeDate": "114年08月14日",
  "businessItems": [{ "code": "I301010", "name": "資訊軟體服務業" }],
  "directors": [{ "seq": "0001", "title": "董事長", "name": "王小明", "representedEntity": "", "shares": "100,000" }],
  "managers": []
}
```

**name 指令回傳：**
```json
[{ "taxId": "90581366", "name": "蘿蔔科技股份有限公司", "dataType": "公司", "status": "核准設立" }]
```

**taxid 指令回傳：**
```json
[{ "taxId": "90581366", "name": "蘿蔔科技股份有限公司", "dataType": "公司", "status": "核准設立", "authority": "臺中市政府", "establishDate": "2022-01-11", "changeDate": "2025-08-14" }]
```

## 涵蓋資料種類

公司、分公司、商業、工廠、有限合夥（預設全選）。

可用 `--type` 篩選，例如 `--type 公司,商業`。

## 注意事項

- 資料來源為 findbiz.nat.gov.tw，為政府公開資料
- 工具內建 stealth 機制（UA 輪換、隨機延遲），每次查詢約需 1-3 秒
- 若需批次查詢多家公司，請逐筆執行，不要並行
