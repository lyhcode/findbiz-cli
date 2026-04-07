# findbiz-cli

台灣商工登記公示資料查詢 CLI，資料來源為經濟部[商工登記公示資料查詢服務](https://findbiz.nat.gov.tw/)。

支援**公司名稱、統一編號、地址**多維度查詢，涵蓋所有資料種類：公司、分公司、商業、工廠、有限合夥。

## 快速使用

不需安裝，直接透過 npx 執行：

```bash
npx github:lyhcode/findbiz-cli search '蘿蔔科技'
```

## 指令

### `detail` — 詳細資料查詢

以統一編號查詢完整公司資料，包含資本額、代表人、地址、營業項目、董監事等。

```bash
findbiz detail 54891351
findbiz detail 54891351 --json          # JSON 格式輸出
```

### `address` — 地址查詢

以地址查詢登記於該地址的所有公司與商業。

```bash
findbiz address '臺中市西區和龍里臺灣大道二段２號１６樓之２'
findbiz addr '臺中市西區' --alive --json  # alias + 篩選
findbiz addr '臺北市信義區' --all         # 取得所有分頁結果
```

### `rep` — 代表人查詢

以代表人姓名查詢其名下公司與商業。

```bash
findbiz rep '王小明'
findbiz rep '王小明' --alive --type 公司 --json
findbiz rep '王小明' --all               # 取得所有分頁結果
```

### `search` — 通用搜尋

以名稱或統一編號搜尋，表格格式輸出。

```bash
findbiz search '蘿蔔科技'
findbiz search 90581366
findbiz search '茂順' --alive          # 僅顯示核准設立
findbiz search '茂順' --type 公司,商業  # 篩選資料種類
findbiz search '茂順' --json           # JSON 格式輸出
```

### `name` — 名稱查統編

以公司名稱查詢統一編號，精簡輸出。

```bash
findbiz name '水映工作坊'
findbiz name '蘿蔔科技' --json
```

### `taxid` — 統編查名稱

以統一編號查詢公司詳細資訊。

```bash
findbiz taxid 47892474
findbiz taxid 90581366 --json
```

## 選項

| 選項 | 說明 |
|------|------|
| `--json` | 輸出 JSON 格式（所有指令皆支援） |
| `--alive` | 僅顯示登記現況為「核准設立」的結果（search, name, address, rep） |
| `--type <types>` | 篩選資料種類，逗號分隔：公司,分公司,商業,工廠,有限合夥（search, address, rep） |
| `--page <n>` | 指定頁碼（search, address, rep） |
| `--all` | 取得所有分頁結果（search, address, rep） |

## Claude Code Agent Skill

透過 [skills](https://github.com/vercel-labs/skills) 安裝 agent skill，安裝後 Claude Code 會在你提到「查統編」、「查公司」、「營業登記」等關鍵字時自動觸發查詢。

```bash
# 安裝 skill
npx skills add lyhcode/findbiz-cli

# 安裝到全域（所有專案共用）
npx skills add lyhcode/findbiz-cli -g
```

## 作為函式庫使用

```typescript
import { FindBizClient } from 'findbiz-cli';

const client = new FindBizClient();
// 搜尋
const result = await client.search('蘿蔔科技');
console.log(result.total);    // 1
console.log(result.results);  // [{ taxId: '90581366', name: '蘿蔔科技股份有限公司', ... }]

// 地址查詢
const byAddr = await client.search('臺中市西區...', { mode: 'address' });
console.log(byAddr.results); // 登記於該地址的所有公司

// 查詢詳細資料
const detail = await client.detail('90581366');
console.log(detail?.name);           // '蘿蔔科技股份有限公司'
console.log(detail?.representative); // '王小明'
console.log(detail?.businessItems);  // [{ code: 'I301010', name: '資訊軟體服務業' }, ...]
```

## License

MIT
