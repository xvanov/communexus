import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Set typing indicator
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = parseInt(params.id);
    const body = await request.json();
    const { is_typing = true } = body || {};

    if (!conversationId) {
      return Response.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    // Check if user is a participant in this conversation
    const participantCheck = await sql`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = ${conversationId} 
      AND user_id = ${userId} 
      AND is_active = true
      LIMIT 1
    `;

    if (participantCheck.length === 0) {
      return Response.json({ error: "Not authorized to access this conversation" }, { status: 403 });
    }

    // Update or create typing indicator
    await sql`
      INSERT INTO typing_indicators (conversation_id, user_id, is_typing, last_activity)
      VALUES (${conversationId}, ${userId}, ${is_typing}, CURRENT_TIMESTAMP)
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET
        is_typing = EXCLUDED.is_typing,
        last_activity = CURRENT_TIMESTAMP
    `;

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/conversations/[id]/typing error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Get typing indicators for a conversation
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = parseInt(params.id);

    if (!conversationId) {
      return Response.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    // Check if user is a participant in this conversation
    const participantCheck = await sql`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = ${conversationId} 
      AND user_id = ${userId} 
      AND is_active = true
      LIMIT 1
    `;

    if (participantCheck.length === 0) {
      return Response.json({ error: "Not authorized to access this conversation" }, { status: 403 });
    }

    // Get typing indicators (exclude current user and clean up old ones)
    await sql`
      DELETE FROM typing_indicators 
      WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 seconds'
    `;

    const typingUsers = await sql`
      SELECT 
        ti.user_id,
        u.name,
        p.display_name,
        ti.is_typing,
        ti.last_activity
      FROM typing_indicators ti
      JOIN auth_users u ON ti.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE ti.conversation_id = ${conversationId}
      AND ti.user_id != ${userId}
      AND ti.is_typing = true
      AND ti.last_activity >= CURRENT_TIMESTAMP - INTERVAL '30 seconds'
    `;

    return Response.json({ typing_users: typingUsers });
  } catch (err) {
    console.error("GET /api/conversations/[id]/typing error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}