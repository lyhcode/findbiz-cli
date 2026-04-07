#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { Command } from 'commander';
import { FindBizClient } from './client.js';
import type { DataType, FindBizResult } from './types.js';

const VERSION = '0.1.0';

/** 民國年 YYYMMDD → 西元 YYYY-MM-DD */
function rocToDate(roc: string): string {
  if (!roc || roc.length < 7) return roc || '';
  const year = parseInt(roc.slice(0, -4), 10) + 1911;
  const month = roc.slice(-4, -2);
  const day = roc.slice(-2);
  return `${year}-${month}-${day}`;
}

function printTable(results: FindBizResult[]) {
  if (results.length === 0) {
    console.log('查無資料');
    return;
  }

  // 計算欄位寬度
  const headers = ['種類', '統一編號', '登記名稱', '登記現況', '設立日期', '變更日期', '登記機關'];
  const rows = results.map((r) => [
    r.dataType,
    r.taxId,
    r.name,
    r.status,
    rocToDate(r.establishDate),
    rocToDate(r.changeDate),
    r.authority,
  ]);

  // 印出
  const widths = headers.map((h, i) => {
    const dataMax = rows.reduce((max, row) => Math.max(max, displayWidth(row[i])), 0);
    return Math.max(displayWidth(h), dataMax);
  });

  const sep = widths.map((w) => '─'.repeat(w)).join('──');
  console.log(formatRow(headers, widths));
  console.log(sep);
  for (const row of rows) {
    console.log(formatRow(row, widths));
  }
}

/** 計算字串顯示寬度（CJK 字元算 2） */
function displayWidth(str: string): number {
  let w = 0;
  for (const ch of str) {
    w += ch.charCodeAt(0) > 0xff ? 2 : 1;
  }
  return w;
}

function padEnd(str: string, width: number): string {
  return str + ' '.repeat(Math.max(0, width - displayWidth(str)));
}

function formatRow(cells: string[], widths: number[]): string {
  return cells.map((c, i) => padEnd(c, widths[i])).join('  ');
}

const program = new Command();

program
  .name('findbiz')
  .description('台灣商工登記公示資料查詢 (findbiz.nat.gov.tw)')
  .version(VERSION);

program
  .command('search <query>')
  .alias('s')
  .description('以公司名稱或統一編號查詢')
  .option('--json', '輸出 JSON 格式')
  .option('--alive', '僅顯示核准設立')
  .option('--type <types>', '資料種類（逗號分隔：公司,分公司,商業,工廠,有限合夥）')
  .action(async (query: string, opts: { json?: boolean; alive?: boolean; type?: string }) => {
    try {
      const client = new FindBizClient();

      const types = opts.type
        ? (opts.type.split(',').map((t) => t.trim()) as DataType[])
        : undefined;

      const response = await client.search(query, {
        types,
        status: opts.alive ? 'alive' : 'all',
      });

      if (opts.json) {
        const output = {
          ...response,
          results: response.results.map((r) => ({
            ...r,
            establishDate: rocToDate(r.establishDate),
            changeDate: rocToDate(r.changeDate),
          })),
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(`查詢「${response.query}」共 ${response.total} 筆\n`);
        printTable(response.results);
      }
    } catch (error) {
      console.error(`✗ 查詢失敗: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('name <query>')
  .alias('n')
  .description('以公司名稱查詢統一編號')
  .option('--json', '輸出 JSON 格式')
  .option('--alive', '僅顯示核准設立')
  .action(async (query: string, opts: { json?: boolean; alive?: boolean }) => {
    try {
      const client = new FindBizClient();
      const response = await client.search(query, {
        status: opts.alive ? 'alive' : 'all',
      });

      if (opts.json) {
        const output = response.results.map((r) => ({
          taxId: r.taxId,
          name: r.name,
          dataType: r.dataType,
          status: r.status,
        }));
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(`查詢「${query}」共 ${response.total} 筆\n`);
        for (const r of response.results) {
          console.log(`  ${r.taxId}  ${r.name}  [${r.dataType}] ${r.status}`);
        }
      }
    } catch (error) {
      console.error(`✗ 查詢失敗: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('taxid <taxId>')
  .alias('t')
  .description('以統一編號查詢公司名稱')
  .option('--json', '輸出 JSON 格式')
  .action(async (taxId: string, opts: { json?: boolean }) => {
    try {
      if (!/^\d{8}$/.test(taxId)) {
        console.error('✗ 統一編號格式錯誤：需為 8 位數字');
        process.exit(1);
      }

      const client = new FindBizClient();
      const response = await client.search(taxId);

      if (opts.json) {
        const output = response.results.map((r) => ({
          taxId: r.taxId,
          name: r.name,
          dataType: r.dataType,
          status: r.status,
          authority: r.authority,
          establishDate: rocToDate(r.establishDate),
          changeDate: rocToDate(r.changeDate),
        }));
        console.log(JSON.stringify(output, null, 2));
      } else if (response.results.length === 0) {
        console.log(`✗ 查無統一編號 ${taxId}`);
      } else {
        for (const r of response.results) {
          console.log(`✓ ${r.taxId}  ${r.name}`);
          console.log(`  種類: ${r.dataType}  現況: ${r.status}`);
          console.log(`  機關: ${r.authority}`);
          console.log(`  設立: ${rocToDate(r.establishDate)}  變更: ${rocToDate(r.changeDate)}`);
        }
      }
    } catch (error) {
      console.error(`✗ 查詢失敗: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// install-skill
program
  .command('install-skill')
  .description('安裝 Claude Code agent skill')
  .option('--user', '安裝到 user scope (~/.claude/skills/)')
  .option('--project [path]', '安裝到 project scope (.claude/skills/)')
  .action((opts: { user?: boolean; project?: boolean | string }) => {
    // 找到 skills/findbiz 來源目錄（相容 ESM 和 CJS）
    const scriptPath = realpathSync(process.argv[1]);
    const currentDir = dirname(scriptPath);
    const candidates = [
      resolve(currentDir, '..', 'skills', 'findbiz'),
      resolve(currentDir, '..', '..', 'skills', 'findbiz'),
    ];
    const src = candidates.find((p) => existsSync(p));

    if (!src) {
      console.error('✗ 找不到 skill 檔案，請確認套件完整性');
      process.exit(1);
    }

    const isUser = opts.user || !opts.project;

    let dest: string;
    if (isUser) {
      dest = join(homedir(), '.claude', 'skills', 'findbiz');
    } else {
      const projectRoot = typeof opts.project === 'string' ? opts.project : process.cwd();
      dest = join(projectRoot, '.claude', 'skills', 'findbiz');
    }

    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true, force: true });

    const scope = isUser ? 'user' : 'project';
    console.log(`✓ Skill 已安裝至 ${scope} scope`);
    console.log(`  ${dest}/SKILL.md`);
  });

program.parse();
