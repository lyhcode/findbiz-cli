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

/** 查詢選項 */
export interface FindBizOptions {
  /** 資料種類篩選，預設全選 */
  types?: DataType[];
  /** 登記現況：'alive' 核准設立 | 'other' 其他 | 'all' 全部，預設 'all' */
  status?: 'alive' | 'other' | 'all';
}
