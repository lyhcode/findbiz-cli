/** 資料種類 */
export type DataType = '公司' | '分公司' | '商業' | '工廠' | '有限合夥';

/** 單筆查詢結果 */
export interface FindBizResult {
  /** 資料種類 */
  dataType: DataType;
  /** 登記機關 */
  authority: string;
  /** 統一編號或工廠登記編號 */
  taxId: string;
  /** 登記名稱 */
  name: string;
  /** 登記現況 */
  status: string;
  /** 核准設立日期（民國年 YYYMMDD） */
  establishDate: string;
  /** 核准變更日期（民國年 YYYMMDD） */
  changeDate: string;
  /** 詳細資料頁面路徑 */
  detailUrl?: string;
}

/** 營業項目 */
export interface BusinessItem {
  /** 代碼 */
  code: string;
  /** 名稱 */
  name: string;
}

/** 董監事資料 */
export interface Director {
  /** 序號 */
  seq: string;
  /** 職稱 */
  title: string;
  /** 姓名 */
  name: string;
  /** 所代表法人 */
  representedEntity: string;
  /** 持有股份數(股) */
  shares: string;
}

/** 經理人資料 */
export interface Manager {
  /** 序號 */
  seq: string;
  /** 姓名 */
  name: string;
  /** 到職日期 */
  startDate: string;
}

/** 公司/商業詳細資料 */
export interface FindBizDetail {
  /** 資料種類 */
  dataType: DataType;
  /** 統一編號 */
  taxId: string;
  /** 登記現況 */
  status: string;
  /** 名稱 */
  name: string;
  /** 外文名稱 */
  englishName?: string;
  /** 資本總額(元) */
  capital?: string;
  /** 實收資本額(元) */
  paidInCapital?: string;
  /** 每股金額(元) */
  parValue?: string;
  /** 已發行股份總數(股) */
  sharesIssued?: string;
  /** 代表人/負責人姓名 */
  representative?: string;
  /** 所在地 */
  address?: string;
  /** 登記機關 */
  authority?: string;
  /** 核准設立日期 */
  establishDate?: string;
  /** 最後核准變更日期 */
  changeDate?: string;
  /** 組織類型（商業） */
  organizationType?: string;
  /** 所營事業資料 */
  businessItems?: BusinessItem[];
  /** 董監事資料（公司） */
  directors?: Director[];
  /** 經理人資料（公司） */
  managers?: Manager[];
}

/** 查詢回應 */
export interface FindBizResponse {
  /** 查詢關鍵字 */
  query: string;
  /** 總筆數 */
  total: number;
  /** 結果列表 */
  results: FindBizResult[];
}

/** 搜尋模式 */
export type SearchMode =
  | 'name'     // 名稱或統一編號 (D, 預設)
  | 'address'  // 地址 (A)
  | 'representative'  // 公司代表人 (N)
  | 'director' // 公司董事或監察人或經理人 (DSM)
  | 'english'  // 章程所訂外文公司名稱 (CNF)
  ;

/** 查詢選項 */
export interface FindBizOptions {
  /** 資料種類篩選，預設全選 */
  types?: DataType[];
  /** 登記現況：'alive' 核准設立 | 'other' 其他 | 'all' 全部，預設 'all' */
  status?: 'alive' | 'other' | 'all';
  /** 搜尋模式，預設 'name' */
  mode?: SearchMode;
}
