import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { applyStealth, randomDelay, rotateUA } from './stealth.js';
import type {
  BusinessItem,
  DataType,
  Director,
  FindBizDetail,
  FindBizOptions,
  FindBizResponse,
  FindBizResult,
  Manager,
  SearchMode,
} from './types.js';

const BASE_URL = 'https://findbiz.nat.gov.tw';
const INIT_PATH = '/fts/query/QueryBar/queryInit.do';
const LIST_PATH = '/fts/query/QueryList/queryList.do';

const TYPE_MAP: Record<DataType, string> = {
  '公司': 'cmpyType',
  '分公司': 'brCmpyType',
  '商業': 'busmType',
  '工廠': 'factType',
  '有限合夥': 'lmtdType',
};

const ALL_TYPES: DataType[] = ['公司', '分公司', '商業', '工廠', '有限合夥'];

const MODE_MAP: Record<SearchMode, string> = {
  name: 'D',
  address: 'A',
  representative: 'N',
  director: 'DSM',
  english: 'CNF',
};

export class FindBizClient {
  private client: AxiosInstance;
  private initialized = false;

  constructor() {
    const jar = new CookieJar();
    this.client = wrapper(
      axios.create({
        baseURL: BASE_URL,
        timeout: 30_000,
        jar,
        maxRedirects: 5,
        validateStatus: (s) => s < 400,
      }),
    );
    applyStealth(this.client);
  }

  /** 建立 session（首次自動呼叫） */
  private async initSession(): Promise<void> {
    if (this.initialized) return;
    await this.client.get(INIT_PATH, {
      headers: { Referer: BASE_URL + '/' },
    });
    this.initialized = true;
  }

  /** 查詢商工登記資料 */
  async search(query: string, options?: FindBizOptions): Promise<FindBizResponse> {
    await this.initSession();
    await randomDelay();
    rotateUA(this.client);

    const types = options?.types ?? ALL_TYPES;
    const isAlive =
      options?.status === 'alive' ? 'true' : options?.status === 'other' ? 'false' : 'all';

    // 組裝 form data
    const params = new URLSearchParams();
    params.append('qryCond', query);
    for (const t of types) {
      params.append('qryType', TYPE_MAP[t]);
      params.append(TYPE_MAP[t], 'true');
    }
    params.append('isAlive', isAlive);
    params.append('infoType', MODE_MAP[options?.mode ?? 'name']);

    const { data: html } = await this.client.post<string>(LIST_PATH, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: BASE_URL + INIT_PATH,
      },
    });

    return this.parseResults(query, html);
  }

  /** 以統一編號查詢詳細資料（自動搜尋 → 取得詳細頁面） */
  async detail(taxId: string): Promise<FindBizDetail | null> {
    const response = await this.search(taxId);
    const result = response.results.find((r) => r.taxId === taxId && r.detailUrl);
    if (!result?.detailUrl) return null;
    return this.fetchDetail(result.detailUrl, result.dataType);
  }

  /** 以詳細頁面路徑取得詳細資料 */
  async fetchDetail(detailPath: string, dataType: DataType): Promise<FindBizDetail> {
    await randomDelay();
    rotateUA(this.client);

    const { data: html } = await this.client.get<string>(detailPath, {
      headers: {
        Referer: BASE_URL + LIST_PATH,
      },
    });

    return this.parseDetail(html, dataType);
  }

  private parseResults(query: string, html: string): FindBizResponse {
    const $ = cheerio.load(html);

    const results: FindBizResult[] = [];

    $('#eslist-table tbody tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 7) return;

      const dataType = cells.eq(0).text().trim() as DataType;
      const authority = cells.eq(1).text().trim();
      const taxId = cells.eq(2).text().trim();
      const name = cells.eq(3).text().trim();
      const status = cells.eq(4).text().trim();
      const establishDate = cells.eq(5).text().trim();
      const changeDate = cells.eq(6).text().trim();

      // 擷取詳細頁面連結
      const detailAnchor = $(tr).find('a.hover');
      const detailUrl = detailAnchor.attr('href')?.replace(/\n/g, '').trim() || undefined;

      results.push({ dataType, authority, taxId, name, status, establishDate, changeDate, detailUrl });
    });

    // 解析總筆數
    const totalText = $('#lblBottomTotal').parent().text();
    const totalMatch = totalText.match(/共\s*(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : results.length;

    return { query, total, results };
  }

  private parseDetail(html: string, dataType: DataType): FindBizDetail {
    const $ = cheerio.load(html);

    // 從主要資料表格擷取 label → value 對應
    const fields = new Map<string, string>();
    $('table.table-striped').first().find('tr').each((_i, tr) => {
      const labelTd = $(tr).find('td.txt_td');
      if (labelTd.length === 0) return;
      const label = labelTd.text().trim();
      // 取得值欄位（label 的下一個 td 兄弟）
      const valueTd = labelTd.next('td');
      if (valueTd.length === 0) return;
      // 清理值：移除訂閱按鈕、外部連結說明等雜訊
      const clone = valueTd.clone();
      clone.find('#linkSubscr, #linkETax, #linkGoogleSearch, .googleLinkMouseOut, .modal, .btn-subscr').remove();
      clone.find('a[href*="etax"], a[href*="google"], a[href*="gcis"]').remove();
      let value = clone.text().trim().replace(/\s+/g, ' ');
      // 移除「電子地圖」及同地址資訊
      value = value.replace(/\s*電子地圖.*$/, '');
      value = value.replace(/\s*同地址登記現況.*$/, '');
      // 移除國際貿易署廠商查詢的 modal 殘留文字
      value = value.replace(/\s*\(出進口廠商英文名稱.*$/, '');
      value = value.replace(/\s*「國際貿易署.*$/, '');
      // 移除「已了解，開始查詢」「關閉」等按鈕文字
      value = value.replace(/\s*(已了解，開始查詢|關閉)\s*/g, '');
      value = value.trim();
      fields.set(label, value);
    });

    const detail: FindBizDetail = {
      dataType,
      taxId: fields.get('統一編號') || fields.get('商業統一編號') || '',
      status: fields.get('登記現況') || '',
      name: fields.get('公司名稱') || fields.get('商業名稱') || '',
    };

    // 公司欄位
    if (fields.has('章程所訂外文公司名稱')) detail.englishName = fields.get('章程所訂外文公司名稱');
    if (fields.has('資本總額(元)')) detail.capital = fields.get('資本總額(元)');
    if (fields.has('實收資本額(元)')) detail.paidInCapital = fields.get('實收資本額(元)');
    if (fields.has('每股金額(元)')) detail.parValue = fields.get('每股金額(元)');
    if (fields.has('已發行股份總數(股)')) detail.sharesIssued = fields.get('已發行股份總數(股)');
    if (fields.has('代表人姓名')) detail.representative = fields.get('代表人姓名');
    if (fields.has('公司所在地')) detail.address = fields.get('公司所在地');
    if (fields.has('登記機關')) detail.authority = fields.get('登記機關');
    if (fields.has('核准設立日期')) detail.establishDate = fields.get('核准設立日期');
    if (fields.has('最後核准變更日期')) detail.changeDate = fields.get('最後核准變更日期');

    // 商業欄位
    if (fields.has('資本額(元)')) detail.capital = fields.get('資本額(元)');
    if (fields.has('負責人姓名')) {
      // 商業的負責人欄位可能含出資額，取姓名部分
      const raw = fields.get('負責人姓名')!;
      detail.representative = raw.replace(/\s*出資額.*$/, '').trim();
    }
    if (fields.has('地址')) detail.address = fields.get('地址');
    if (fields.has('最近異動日期')) detail.changeDate = fields.get('最近異動日期');
    if (fields.has('組織類型')) detail.organizationType = fields.get('組織類型');

    // 所營事業 / 營業項目
    const bizText = fields.get('所營事業資料') || fields.get('營業項目') || '';
    if (bizText) {
      detail.businessItems = this.parseBusinessItems(bizText);
    }

    // 董監事資料（公司）
    if (dataType === '公司') {
      detail.directors = this.parseDirectors($);
      detail.managers = this.parseManagers($);
    }

    return detail;
  }

  private parseBusinessItems(text: string): BusinessItem[] {
    const items: BusinessItem[] = [];
    // 格式: "CC01110 電腦及其週邊設備製造業 F113050 資訊軟體批發業 ..."
    // 或: "1 I103060 管理顧問業 2 I199990 ..."（商業帶序號）
    const pattern = /([A-Z]{1,2}\d{5,6})\s+([^\s]+(?:\s+[^\s]+)*?)(?=\s+(?:\d+\s+)?[A-Z]{1,2}\d{5,6}\s|$)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      items.push({ code: match[1], name: match[2].trim() });
    }
    return items;
  }

  private parseDirectors($: cheerio.CheerioAPI): Director[] {
    const directors: Director[] = [];
    const table = $('#tabShareHolderContent table.table-striped');
    if (table.length === 0) return directors;

    table.find('tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 4) return;
      const seq = cells.eq(0).text().trim();
      if (!seq || seq.startsWith('依您的查詢')) return;
      directors.push({
        seq,
        title: cells.eq(1).text().trim(),
        name: cells.eq(2).text().trim(),
        representedEntity: cells.eq(3).text().trim(),
        shares: cells.length >= 5 ? cells.eq(4).text().trim() : '',
      });
    });
    return directors;
  }

  private parseManagers($: cheerio.CheerioAPI): Manager[] {
    const managers: Manager[] = [];
    const table = $('#tabMgrContent table.table-striped');
    if (table.length === 0) return managers;

    table.find('tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 3) return;
      const seq = cells.eq(0).text().trim();
      if (!seq || seq.startsWith('依您的查詢')) return;
      managers.push({
        seq,
        name: cells.eq(1).text().trim(),
        startDate: cells.eq(2).text().trim(),
      });
    });
    return managers;
  }
}
