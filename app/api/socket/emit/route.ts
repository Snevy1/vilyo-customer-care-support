import { NextResponse } from 'next/server';
import { getSocketServer } from '@/lib/socket/socket-server';

export async function POST(req: Request) {
  try {
    const { event, payload } = await req.json();

    const io = getSocketServer();
    if (io) {
      io.emit(event, payload);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Socket server not initialized" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}