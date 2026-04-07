import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { applyStealth, randomDelay, rotateUA } from './stealth.js';
import type { DataType, FindBizOptions, FindBizResponse, FindBizResult } from './types.js';

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
    params.append('infoType', 'D');

    const { data: html } = await this.client.post<string>(LIST_PATH, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: BASE_URL + INIT_PATH,
      },
    });

    return this.parseResults(query, html);
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

      results.push({ dataType, authority, taxId, name, status, establishDate, changeDate });
    });

    // 解析總筆數
    const totalText = $('#lblBottomTotal').parent().text();
    const totalMatch = totalText.match(/共\s*(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : results.length;

    return { query, total, results };
  }
}
