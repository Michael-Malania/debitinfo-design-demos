import { NextResponse } from 'next/server';
import { get, put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'comments.json');

// Read comments from Vercel Blob Store (or local fallback)
export async function GET() {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const res = await get('comments.json', {
          access: 'private',
          useCache: false,
        });

        if (res && res.statusCode === 200 && res.stream) {
          const text = await new Response(res.stream).text();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            return NextResponse.json(
              { comments: parsed, source: 'vercel-blob' },
              { headers: { 'Cache-Control': 'no-store, max-age=0' } }
            );
          }
        }
      } catch (blobErr) {
        console.warn('Vercel Blob GET warning, falling back to local:', blobErr);
      }
    }

    // Local file fallback for offline/local development
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return NextResponse.json(
        { comments: Array.isArray(parsed) ? parsed : [], source: 'local-file' },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      { comments: [], source: 'empty' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ comments: [], error: err.message }, { status: 200 });
  }
}

// Write comments to Vercel Blob Store (and local fallback)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { comments } = body;

    if (!Array.isArray(comments)) {
      return NextResponse.json({ error: 'Comments must be an array' }, { status: 400 });
    }

    const jsonString = JSON.stringify(comments, null, 2);

    // 1. Sync directly to Vercel Blob Store (cross-platform cloud persistence)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put('comments.json', jsonString, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
    }

    // 2. Also save to local file for dev environment
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, jsonString, 'utf-8');
    } catch {
      // Ignored in read-only production environments
    }

    return NextResponse.json({ success: true, count: comments.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
