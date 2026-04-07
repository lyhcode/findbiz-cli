---
name: findbiz
description: 查詢台灣商工登記公示資料（公司、分公司、商業、工廠、有限合夥）。當使用者提到統一編號、統編、營業登記、公司查詢、商業登記、工廠登記、查公司名稱、查統編、查地址有哪些公司、同地址公司、代表人、負責人、查某人名下的公司、老闆是誰、查董事、資本額、營業項目，或需要驗證公司是否存在、補齊統編資料時，都應觸發此 skill。即使使用者只是說「查一下這家公司」、「幫我查統編」、「這家公司還在嗎」、「這個地址有哪些公司」、「他名下有哪些公司」也應觸發。
tools: Bash
---

# findbiz — 台灣商工登記查詢

透過 `npx github:lyhcode/findbiz-cli` 查詢經濟部商工登記公示資料，支援公司名稱、統一編號、地址、代表人多維度查詢。

## 指令選擇指引

根據使用者需求選擇最合適的指令：

| 使用者需求 | 指令 | 範例 |
|-----------|------|------|
| 查公司完整資料（資本額、地址、董監事、營業項目） | `detail` | `detail 54891351` |
| 查某地址登記了哪些公司 | `address` | `address '臺中市西區...'` |
| 查某人名下的公司（代表人/負責人） | `rep` | `rep '王小明'` |
| 用名稱找統編 | `name` | `name '蘿蔔科技'` |
| 用統編找名稱 | `taxid` | `taxid 90581366` |
| 通用搜尋（名稱或統編） | `search` | `search '茂順'` |

## 使用方式

所有指令皆透過 `npx -y github:lyhcode/findbiz-cli` 執行，一律加 `--json` 取得結構化資料。

### detail — 以統編查完整詳細資料（推薦）

```bash
npx -y github:lyhcode/findbiz-cli detail 12345678 --json
```

### address — 以地址查詢

```bash
npx -y github:lyhcode/findbiz-cli address '臺中市西區臺灣大道二段2號16樓之2' --json
npx -y github:lyhcode/findbiz-cli address '臺北市信義區' --alive --json        # 僅核准設立
npx -y github:lyhcode/findbiz-cli address '臺北市信義區' --all --json          # 所有分頁
npx -y github:lyhcode/findbiz-cli address '臺北市信義區' --alive --type 公司 --all --json
```

### rep — 以代表人姓名查詢

```bash
npx -y github:lyhcode/findbiz-cli rep '王小明' --json
npx -y github:lyhcode/findbiz-cli rep '王小明' --alive --type 公司 --json      # 篩選
npx -y github:lyhcode/findbiz-cli rep '王小明' --all --json                    # 所有分頁
```

### name — 以名稱查統編

```bash
npx -y github:lyhcode/findbiz-cli name '公司名稱' --json
```

### taxid — 以統編查名稱

```bash
npx -y github:lyhcode/findbiz-cli taxid 12345678 --json
```

### search — 通用搜尋

```bash
npx -y github:lyhcode/findbiz-cli search '關鍵字' --json
npx -y github:lyhcode/findbiz-cli search '關鍵字' --alive --type 公司,商業 --json
npx -y github:lyhcode/findbiz-cli search '關鍵字' --all --json                # 所有分頁
npx -y github:lyhcode/findbiz-cli search '關鍵字' --page 2 --json             # 指定頁碼
```

## 共用選項

| 選項 | 說明 | 適用指令 |
|------|------|---------|
| `--json` | 輸出 JSON 格式 | 全部 |
| `--alive` | 僅顯示核准設立 | search, name, address, rep |
| `--type <types>` | 篩選資料種類，逗號分隔：公司,分公司,商業,工廠,有限合夥 | search, address, rep |
| `--page <n>` | 指定頁碼（每頁 20 筆） | search, address, rep |
| `--all` | 取得所有分頁結果（超過 20 筆時使用） | search, address, rep |

## 輸出格式

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

**列表指令回傳（search, address, rep, name, taxid）：**
```json
{
  "query": "搜尋關鍵字",
  "total": 28,
  "currentPage": 1,
  "totalPages": 2,
  "results": [
    { "dataType": "公司", "authority": "臺中市政府", "taxId": "90581366", "name": "蘿蔔科技股份有限公司", "status": "核准設立", "establishDate": "2022-01-11", "changeDate": "2025-08-14" }
  ]
}
```

若 `totalPages > 1` 且未加 `--all`，代表還有更多結果未顯示。

## 涵蓋資料種類

公司、分公司、商業、工廠、有限合夥（預設全選）。可用 `--type` 篩選。

## 注意事項

- 資料來源為 findbiz.nat.gov.tw，為政府公開資料
- 工具內建 stealth 機制（UA 輪換、隨機延遲），每次查詢約需 1-3 秒
- 若需批次查詢多家公司，請逐筆執行，不要並行
- 地址查詢時，含/不含「里」名可能得到不同結果，建議不帶里名搜尋以涵蓋較完整
- 代表人為常見姓名時結果可能很多，建議搭配 `--type` 和 `--alive` 篩選
