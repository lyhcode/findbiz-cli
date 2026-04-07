# findbiz-cli

台灣商工登記公示資料查詢 CLI，資料來源為經濟部[商工登記公示資料查詢服務](https://findbiz.nat.gov.tw/)。

支援**公司名稱與統一編號雙向查詢**，涵蓋所有資料種類：公司、分公司、商業、工廠、有限合夥。

## 快速使用

不需安裝，直接透過 npx 執行：

```bash
npx github:lyhcode/findbiz-cli search '蘿蔔科技'
```

## 指令

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
| `--json` | 輸出 JSON 格式 |
| `--alive` | 僅顯示登記現況為「核准設立」的結果 |
| `--type <types>` | 篩選資料種類，逗號分隔（公司,分公司,商業,工廠,有限合夥） |

## 作為函式庫使用

```typescript
import { FindBizClient } from 'findbiz-cli';

const client = new FindBizClient();
const result = await client.search('蘿蔔科技');

console.log(result.total);    // 1
console.log(result.results);  // [{ taxId: '90581366', name: '蘿蔔科技股份有限公司', ... }]
```

## License

MIT
