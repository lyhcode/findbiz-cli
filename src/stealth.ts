import type { AxiosInstance } from 'axios';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

const ACCEPT_LANGUAGES = [
  'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'zh-TW,zh;q=0.9,en;q=0.8',
  'zh-TW,zh-Hant;q=0.9,en-US;q=0.8,en;q=0.7',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 隨機延遲 (ms) */
export function randomDelay(min = 800, max = 2500): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 為 axios instance 套用 stealth headers */
export function applyStealth(client: AxiosInstance): void {
  const ua = pick(USER_AGENTS);

  client.defaults.headers.common['User-Agent'] = ua;
  client.defaults.headers.common['Accept'] =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  client.defaults.headers.common['Accept-Language'] = pick(ACCEPT_LANGUAGES);
  client.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br';
  client.defaults.headers.common['Cache-Control'] = 'no-cache';
  client.defaults.headers.common['Pragma'] = 'no-cache';
  client.defaults.headers.common['Sec-Fetch-Dest'] = 'document';
  client.defaults.headers.common['Sec-Fetch-Mode'] = 'navigate';
  client.defaults.headers.common['Sec-Fetch-Site'] = 'same-origin';
  client.defaults.headers.common['Sec-Fetch-User'] = '?1';
  client.defaults.headers.common['Upgrade-Insecure-Requests'] = '1';
}

/** 每次請求前旋轉 User-Agent */
export function rotateUA(client: AxiosInstance): void {
  client.defaults.headers.common['User-Agent'] = pick(USER_AGENTS);
}
