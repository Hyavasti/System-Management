import { type NextRequest, NextResponse } from "next/server"

const activeConnections = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pcId, action, value } = body

    console.log("[v0] Received command:", { pcId, action, value })

    // For now, we'll just log and return success

    // Simulate sending command to WPF client
    const command = {
      pcId,
      action,
      value,
      timestamp: new Date().toISOString(),
    }

    // Here you would:
    // 1. Use WebSocket to send real-time commands
    // 2. Or use SignalR Hub to push to specific clients
    // 3. Or have WPF clients poll this endpoint

    return NextResponse.json({
      success: true,
      message: `Command ${action} sent to ${pcId}`,
      command,
    })
  } catch (error) {
    console.error("[v0] Error processing command:", error)
    return NextResponse.json({ success: false, error: "Failed to process command" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const pcId = searchParams.get("pcId")

  if (!pcId) {
    return NextResponse.json({ error: "PC ID required" }, { status: 400 })
  }

  // Return any pending commands for this PC
  // In production, use a queue system
  return NextResponse.json({
    pcId,
    commands: [],
    timestamp: new Date().toISOString(),
  })
}
