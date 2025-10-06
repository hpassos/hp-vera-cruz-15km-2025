import { NextResponse } from 'next/server';

const BIN_ID = process.env.JSONBIN_ID;
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const LATEST_URL = `${JSONBIN_URL}/latest`;

const headers = {
  "X-Master-Key": MASTER_KEY || "",
  "X-Bin-Meta": "false",
  "Content-Type": "application/json",
};

export async function GET() {
  try {
    const res = await fetch(LATEST_URL, { headers: { "X-Master-Key": MASTER_KEY || "", "X-Bin-Meta": "false" } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to load data from JSONBin" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to save data to JSONBin" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}