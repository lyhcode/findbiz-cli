---
name: findbiz
description: 查詢台灣商工登記公示資料（公司、分公司、商業、工廠、有限合夥）。當使用者提到統一編號、統編、營業登記、公司查詢、商業登記、工廠登記、查公司名稱、查統編，或需要驗證公司是否存在、補齊統編資料時，都應觸發此 skill。即使使用者只是說「查一下這家公司」、「幫我查統編」、「這家公司還在嗎」也應觸發。
tools: Bash
---

# findbiz — 台灣商工登記查詢

透過 `npx github:lyhcode/findbiz-cli` 查詢經濟部商工登記公示資料，支援公司名稱與統一編號雙向查詢。

## 使用方式

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
