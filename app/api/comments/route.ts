import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_COMMENTS } from '@/lib/comments-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'comments.json');

// Helper to check if Vercel KV / Upstash Redis is configured
const hasKV = () => Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function getFromKV() {
  const url = `${process.env.KV_REST_API_URL}/get/debitinfo_comments`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.result) {
    try {
      return JSON.parse(data.result);
    } catch {
      return null;
    }
  }
  return null;
}

async function saveToKV(comments: any) {
  const url = `${process.env.KV_REST_API_URL}/set/debitinfo_comments`;
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    body: JSON.stringify(comments),
  });
}

export async function GET() {
  try {
    // 1. Try Vercel KV / Upstash
    if (hasKV()) {
      const kvData = await getFromKV();
      if (kvData) {
        return NextResponse.json({ comments: kvData, source: 'kv' });
      }
    }

    // 2. Try Local File (Dev / Server)
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return NextResponse.json({ comments: JSON.parse(content), source: 'local-file' });
    }

    // 3. Fallback to Initial Default
    return NextResponse.json({ comments: INITIAL_COMMENTS, source: 'defaults' });
  } catch (err: any) {
    return NextResponse.json({ comments: INITIAL_COMMENTS, error: err.message }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { comments } = body;

    if (!Array.isArray(comments)) {
      return NextResponse.json({ error: 'Comments must be an array' }, { status: 400 });
    }

    // 1. Try Vercel KV if available
    if (hasKV()) {
      await saveToKV(comments);
      return NextResponse.json({ success: true, target: 'kv' });
    }

    // 2. Try Local File (only works in Node dev environments, not on serverless readonly fs)
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2), 'utf-8');
      return NextResponse.json({ success: true, target: 'local-file' });
    } catch {
      // In serverless readonly environments without KV, client handles persistence in localStorage
      return NextResponse.json({ success: true, target: 'client-storage' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
