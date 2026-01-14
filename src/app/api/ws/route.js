/**
 * =========================================================================
 * SSE ROUTE - Server-Sent Events Connection Endpoint
 * =========================================================================
 * 
 * Minimal SSE endpoint for real-time connections.
 * All business logic is handled through server actions.
 * 
 * =========================================================================
 */

// Global connections store (shared across the app via globalThis)
if (!globalThis.__sseConnections) {
  globalThis.__sseConnections = new Map();
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const customerPhone = searchParams.get("customerPhone");
  const type = searchParams.get("type");

  if (!restaurantId) {
    return new Response("Missing restaurantId", { status: 400 });
  }

  const connectionId = `${type}_${restaurantId}_${customerPhone || "admin"}_${Date.now()}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const connectionData = {
        controller,
        encoder,
        restaurantId,
        customerPhone,
        type,
      };
      globalThis.__sseConnections.set(connectionId, connectionData);

      // Send connected event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ event: "connected", connectionId })}\n\n`)
      );

      // Keep-alive ping every 30s
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: "ping" })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
          globalThis.__sseConnections.delete(connectionId);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        globalThis.__sseConnections.delete(connectionId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
