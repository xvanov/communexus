import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get messages for a conversation
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = parseInt(params.id);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before'); // message ID to paginate before

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
      return Response.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    // Build query with optional before parameter for pagination
    let whereClause = 'WHERE m.conversation_id = $1 AND m.is_deleted = false';
    let queryParams = [conversationId];

    if (before) {
      whereClause += ' AND m.id < $2';
      queryParams.push(before);
    }

    const messagesQuery = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.media_url,
        m.media_type,
        m.reply_to_id,
        m.created_at,
        m.updated_at,
        -- Sender info
        sender.name as sender_name,
        sender_profile.display_name as sender_display_name,
        sender_profile.avatar_url as sender_avatar_url,
        -- Reply-to message info
        reply_msg.content as reply_to_content,
        reply_msg.message_type as reply_to_message_type,
        reply_sender.name as reply_to_sender_name,
        -- Delivery status for this user
        md.delivery_status,
        md.delivered_at,
        md.read_at
      FROM messages m
      LEFT JOIN auth_users sender ON m.sender_id = sender.id
      LEFT JOIN user_profiles sender_profile ON sender.id = sender_profile.user_id
      LEFT JOIN messages reply_msg ON m.reply_to_id = reply_msg.id
      LEFT JOIN auth_users reply_sender ON reply_msg.sender_id = reply_sender.id
      LEFT JOIN message_delivery md ON m.id = md.message_id AND md.user_id = $${queryParams.length + 1}
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${queryParams.length + 2}
    `;

    const messages = await sql(messagesQuery, [...queryParams, userId, limit]);

    // Update last_read_message_id for this user
    if (messages.length > 0) {
      const latestMessageId = messages[0].id;
      await sql`
        UPDATE conversation_participants
        SET last_read_message_id = ${latestMessageId}
        WHERE conversation_id = ${conversationId} AND user_id = ${userId}
      `;

      // Mark messages as read
      await sql`
        INSERT INTO message_delivery (message_id, user_id, delivery_status, read_at)
        SELECT m.id, ${userId}, 'read', CURRENT_TIMESTAMP
        FROM messages m
        WHERE m.conversation_id = ${conversationId}
        AND m.sender_id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM message_delivery md 
          WHERE md.message_id = m.id AND md.user_id = ${userId}
        )
        ON CONFLICT (message_id, user_id) DO UPDATE SET
          delivery_status = 'read',
          read_at = CURRENT_TIMESTAMP
        WHERE message_delivery.delivery_status != 'read'
      `;
    }

    return Response.json({ messages: messages.reverse() }); // Reverse to get chronological order
  } catch (err) {
    console.error("GET /api/conversations/[id]/messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Send a new message
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = parseInt(params.id);
    const body = await request.json();
    const { content, message_type = 'text', media_url, media_type, reply_to_id, client_id } = body || {};

    if (!conversationId) {
      return Response.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    if (!content && !media_url) {
      return Response.json({ error: "Message must have content or media" }, { status: 400 });
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
      return Response.json({ error: "Not authorized to send messages to this conversation" }, { status: 403 });
    }

    // Create message
    const messageResult = await sql`
      INSERT INTO messages (
        conversation_id, 
        sender_id, 
        content, 
        message_type, 
        media_url, 
        media_type, 
        reply_to_id
      )
      VALUES (
        ${conversationId}, 
        ${userId}, 
        ${content || null}, 
        ${message_type}, 
        ${media_url || null}, 
        ${media_type || null}, 
        ${reply_to_id || null}
      )
      RETURNING id, conversation_id, sender_id, content, message_type, media_url, media_type, reply_to_id, created_at
    `;

    const message = messageResult[0];

    // Create delivery records for all other participants
    const participants = await sql`
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = ${conversationId} 
      AND user_id != ${userId} 
      AND is_active = true
    `;

    for (const participant of participants) {
      await sql`
        INSERT INTO message_delivery (message_id, user_id, delivery_status, delivered_at)
        VALUES (${message.id}, ${participant.user_id}, 'delivered', CURRENT_TIMESTAMP)
      `;
    }

    // Update conversation updated_at
    await sql`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
    `;

    // Remove any offline message with the same client_id to prevent duplicates
    if (client_id) {
      await sql`
        DELETE FROM offline_messages 
        WHERE client_id = ${client_id} AND user_id = ${userId}
      `;
    }

    return Response.json({ message });
  } catch (err) {
    console.error("POST /api/conversations/[id]/messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}