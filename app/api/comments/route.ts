import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GIST_ID = process.env.GIST_ID || '4fc3639e846602d89c228973948ecaf5';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'comments.json');

// Read comments from GitHub Gist or local file
export async function GET() {
  try {
    if (GIST_ID && GITHUB_TOKEN) {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Debitinfo-Comments-App',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.files?.['comments.json']?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return NextResponse.json({ comments: parsed, source: 'cloud-db' });
        }
      }
    }

    // Fallback to local file if Gist read fails
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return NextResponse.json({ comments: JSON.parse(content), source: 'local-file' });
    }

    return NextResponse.json({ comments: [], source: 'empty' });
  } catch (err: any) {
    return NextResponse.json({ comments: [], error: err.message }, { status: 200 });
  }
}

// Write comments to GitHub Gist and local file
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { comments } = body;

    if (!Array.isArray(comments)) {
      return NextResponse.json({ error: 'Comments must be an array' }, { status: 400 });
    }

    const jsonString = JSON.stringify(comments, null, 2);

    // 1. Sync to GitHub Gist Cloud Database
    if (GIST_ID && GITHUB_TOKEN) {
      await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Debitinfo-Comments-App',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'comments.json': {
              content: jsonString,
            },
          },
        }),
      });
    }

    // 2. Also save to local file for dev
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
