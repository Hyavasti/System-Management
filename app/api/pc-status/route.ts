import { type NextRequest, NextResponse } from "next/server"

const pcStatusStore = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const status = await request.json()
    const { pcId, user, timeLeft, totalMinutes, status: pcStatus } = status

    console.log("[v0] Received status update from:", pcId)

    pcStatusStore.set(pcId, {
      ...status,
      lastUpdate: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating PC status:", error)
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
  }
}

export async function GET() {
  const allStatus = Array.from(pcStatusStore.values())
  return NextResponse.json({ pcs: allStatus })
}
