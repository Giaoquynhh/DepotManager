import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ----- Types -----
interface FlatSlotRow {
  yard_name: string;
  block_code: string;
  slot_code: string;
  status?: string;
  tier_capacity?: number;
  near_gate?: number;
  avoid_main?: number;
  is_odd?: boolean;
  row_label?: string | null;
  row_index?: number | null;
  col_index?: number | null;
}

interface NestedLayout {
  name: string; // yard name
  blocks: Array<{
    code: string; // block code
    slots: Array<{
      code: string; // slot code
      status?: string;
      tier_capacity?: number;
      near_gate?: number;
      avoid_main?: number;
      is_odd?: boolean;
      row_label?: string | null;
      row_index?: number | null;
      col_index?: number | null;
    }>;
  }>;
}

// ----- Helpers -----
function usage(exit = false) {
  const msg = `\nYard Layout Import CLI\n\nUsage:\n  ts-node modules/yard/tools/importLayout.ts --file <path> [--format json|csv] [--dry-run] [--preserve-status] [--tier-capacity-default 5]\n\nInput formats:\n- JSON (nested):\n  [\n    {\n      "name": "Depot A",\n      "blocks": [\n        {\n          "code": "B1",\n          "slots": [\n            { "code": "B1-01", "tier_capacity": 5, "near_gate": 10, "avoid_main": 0, "is_odd": false }\n          ]\n        }\n      ]\n    }\n  ]\n\n- JSON (flat):\n  [\n    {\n      "yard_name": "Depot A", "block_code": "B1", "slot_code": "B1-01",\n      "tier_capacity": 5, "near_gate": 10, "avoid_main": 0, "is_odd": false\n    }\n  ]\n\n- CSV (header required):\n  yard_name,block_code,slot_code,status,tier_capacity,near_gate,avoid_main,is_odd,row_label,row_index,col_index\n`;
  console.log(msg);
  if (exit) process.exit(1);
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function inferFormat(file: string): 'json' | 'csv' | undefined {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.csv') return 'csv';
  return undefined;
}

function toBool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return undefined;
}

// Very simple CSV line parser (no embedded commas/quotes handling). Suitable for our layout fields.
function parseCsvLine(line: string): string[] {
  return line.split(',').map((s) => s.trim());
}

function normalizeStatus(s?: string): string | undefined {
  if (!s) return undefined;
  const u = s.trim().toUpperCase();
  // Allow only supported values, ignore others
  const allowed = new Set(['EMPTY', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE', 'EXPORT']);
  return allowed.has(u) ? u : undefined;
}

async function readJson(file: string): Promise<FlatSlotRow[]> {
  const raw = await fs.promises.readFile(file, 'utf8');
  const data = JSON.parse(raw);
  const rows: FlatSlotRow[] = [];

  if (Array.isArray(data)) {
    if (data.length > 0 && 'yard_name' in data[0]) {
      // flat
      for (const r of data as any[]) {
        if (!r.yard_name || !r.block_code || !r.slot_code) continue;
        rows.push({
          yard_name: String(r.yard_name),
          block_code: String(r.block_code),
          slot_code: String(r.slot_code),
          status: normalizeStatus(r.status),
          tier_capacity: r.tier_capacity != null ? Number(r.tier_capacity) : undefined,
          near_gate: r.near_gate != null ? Number(r.near_gate) : undefined,
          avoid_main: r.avoid_main != null ? Number(r.avoid_main) : undefined,
          is_odd: toBool(r.is_odd),
          row_label: r.row_label ?? null,
          row_index: r.row_index != null ? Number(r.row_index) : null,
          col_index: r.col_index != null ? Number(r.col_index) : null,
        });
      }
    } else if (data.length > 0 && 'name' in data[0]) {
      // nested
      for (const y of data as NestedLayout[]) {
        for (const b of (y.blocks || [])) {
          for (const s of (b.slots || [])) {
            rows.push({
              yard_name: y.name,
              block_code: b.code,
              slot_code: s.code,
              status: normalizeStatus(s.status),
              tier_capacity: s.tier_capacity != null ? Number(s.tier_capacity) : undefined,
              near_gate: s.near_gate != null ? Number(s.near_gate) : undefined,
              avoid_main: s.avoid_main != null ? Number(s.avoid_main) : undefined,
              is_odd: toBool(s.is_odd),
              row_label: s.row_label ?? null,
              row_index: s.row_index != null ? Number(s.row_index) : null,
              col_index: s.col_index != null ? Number(s.col_index) : null,
            });
          }
        }
      }
    }
  }

  return rows;
}

async function readCsv(file: string): Promise<FlatSlotRow[]> {
  const stream = fs.createReadStream(file, 'utf8');
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let header: string[] | null = null;
  const rows: FlatSlotRow[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (!header) {
      header = cols.map((h) => h.toLowerCase());
      continue;
    }
    const rec: any = {};
    for (let i = 0; i < header.length; i++) {
      rec[header[i]] = cols[i];
    }
    if (!rec.yard_name || !rec.block_code || !rec.slot_code) continue;
    rows.push({
      yard_name: String(rec.yard_name),
      block_code: String(rec.block_code),
      slot_code: String(rec.slot_code),
      status: normalizeStatus(rec.status),
      tier_capacity: rec.tier_capacity != null && rec.tier_capacity !== '' ? Number(rec.tier_capacity) : undefined,
      near_gate: rec.near_gate != null && rec.near_gate !== '' ? Number(rec.near_gate) : undefined,
      avoid_main: rec.avoid_main != null && rec.avoid_main !== '' ? Number(rec.avoid_main) : undefined,
      is_odd: toBool(rec.is_odd),
      row_label: rec.row_label ?? null,
      row_index: rec.row_index != null && rec.row_index !== '' ? Number(rec.row_index) : null,
      col_index: rec.col_index != null && rec.col_index !== '' ? Number(rec.col_index) : null,
    });
  }

  return rows;
}

function groupRows(rows: FlatSlotRow[]): Map<string, Map<string, FlatSlotRow[]>> {
  const map = new Map<string, Map<string, FlatSlotRow[]>>();
  for (const r of rows) {
    if (!map.has(r.yard_name)) map.set(r.yard_name, new Map());
    const bmap = map.get(r.yard_name)!;
    if (!bmap.has(r.block_code)) bmap.set(r.block_code, []);
    bmap.get(r.block_code)!.push(r);
  }
  return map;
}

async function main() {
  try {
    const file = getArg('--file');
    const formatArg = getArg('--format');
    const dryRun = hasFlag('--dry-run');
    const preserveStatus = hasFlag('--preserve-status');
    const tierCapDefault = Number(getArg('--tier-capacity-default') || 5);

    if (!file) {
      console.error('Missing --file');
      usage(true);
      return;
    }
    const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    if (!fs.existsSync(abs)) {
      console.error('File not found:', abs);
      process.exit(1);
    }

    const fmt = (formatArg as any) || inferFormat(abs);
    if (!fmt || (fmt !== 'json' && fmt !== 'csv')) {
      console.error('Cannot determine format, please set --format json|csv');
      usage(true);
      return;
    }

    console.log('[Import] Reading file:', abs, `(format=${fmt})`);
    let rows: FlatSlotRow[] = [];
    rows = fmt === 'json' ? await readJson(abs) : await readCsv(abs);

    if (!rows.length) {
      console.error('No valid rows found in input.');
      process.exit(1);
    }

    // Normalize defaults
    rows = rows.map(r => ({
      ...r,
      status: normalizeStatus(r.status) || undefined,
      tier_capacity: r.tier_capacity != null ? Number(r.tier_capacity) : tierCapDefault,
      near_gate: r.near_gate != null ? Number(r.near_gate) : 0,
      avoid_main: r.avoid_main != null ? Number(r.avoid_main) : 0,
      is_odd: r.is_odd != null ? Boolean(r.is_odd) : false,
      row_label: r.row_label ?? null,
      row_index: r.row_index != null ? Number(r.row_index) : null,
      col_index: r.col_index != null ? Number(r.col_index) : null,
    }));

    const grouped = groupRows(rows);
    console.log(`[Import] Parsed rows: ${rows.length}. Yards: ${grouped.size}`);

    if (dryRun) {
      for (const [yName, bmap] of grouped.entries()) {
        console.log(`- Yard: ${yName} (blocks: ${bmap.size})`);
        for (const [bCode, slots] of bmap.entries()) {
          console.log(`  - Block: ${bCode} (slots: ${slots.length})`);
        }
      }
      console.log('[Import] Dry-run complete. No DB writes performed.');
      return;
    }

    for (const [yName, bmap] of grouped.entries()) {
      // Upsert Yard by name
      let yard = await prisma.yard.findFirst({ where: { name: yName } });
      if (!yard) yard = await prisma.yard.create({ data: { name: yName } });

      for (const [bCode, slots] of bmap.entries()) {
        // Upsert Block by (yard_id, code)
        let block = await prisma.yardBlock.findFirst({ where: { yard_id: yard.id, code: bCode } });
        if (!block) block = await prisma.yardBlock.create({ data: { yard_id: yard.id, code: bCode } });

        for (const s of slots) {
          const exists = await prisma.yardSlot.findFirst({ where: { block_id: block.id, code: s.slot_code } });
          if (exists) {
            const updateData: any = {
              tier_capacity: s.tier_capacity,
              near_gate: s.near_gate,
              avoid_main: s.avoid_main,
              is_odd: s.is_odd,
              row_label: s.row_label,
              row_index: s.row_index,
              col_index: s.col_index,
            };
            // For safety: only override status if not preserving and target is not OCCUPIED with occupant
            if (!preserveStatus) {
              const newStatus = s.status;
              if (newStatus && !(exists.occupant_container_no && exists.status === 'OCCUPIED')) {
                updateData.status = newStatus;
              }
            }
            await prisma.yardSlot.update({ where: { id: exists.id }, data: updateData });
          } else {
            await prisma.yardSlot.create({
              data: {
                block_id: block.id,
                code: s.slot_code,
                status: s.status || 'EMPTY',
                tier_capacity: s.tier_capacity,
                near_gate: s.near_gate,
                avoid_main: s.avoid_main,
                is_odd: s.is_odd,
                row_label: s.row_label,
                row_index: s.row_index,
                col_index: s.col_index,
              }
            });
          }
        }
      }
      console.log(`[Import] Upserted yard: ${yName}`);
    }

    console.log('[Import] Completed successfully.');
  } catch (e: any) {
    console.error('Import error:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
