import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get all conversations for the current user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    const conversations = await sql`
      SELECT 
        c.id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        -- Get last message info
        lm.id as last_message_id,
        lm.content as last_message_content,
        lm.message_type as last_message_type,
        lm.created_at as last_message_time,
        lm_sender.name as last_message_sender_name,
        -- Get unread count
        COALESCE(unread_count.count, 0) as unread_count,
        -- Get other participants (for direct messages)
        CASE 
          WHEN c.conversation_type = 'direct' THEN
            (SELECT json_agg(json_build_object(
              'id', u.id,
              'name', u.name,
              'display_name', p.display_name,
              'avatar_url', p.avatar_url,
              'status', p.status
            ))
            FROM conversation_participants cp2
            JOIN auth_users u ON cp2.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE cp2.conversation_id = c.id AND cp2.user_id != ${userId} AND cp2.is_active = true)
          ELSE 
            (SELECT json_agg(json_build_object(
              'id', u.id,
              'name', u.name,
              'display_name', p.display_name,
              'avatar_url', p.avatar_url,
              'status', p.status
            ))
            FROM conversation_participants cp2
            JOIN auth_users u ON cp2.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE cp2.conversation_id = c.id AND cp2.is_active = true)
        END as participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN messages lm ON lm.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
      LEFT JOIN auth_users lm_sender ON lm.sender_id = lm_sender.id
      LEFT JOIN (
        SELECT 
          m.conversation_id,
          COUNT(*) as count
        FROM messages m
        JOIN conversation_participants cp_inner ON m.conversation_id = cp_inner.conversation_id
        WHERE cp_inner.user_id = ${userId}
        AND (cp_inner.last_read_message_id IS NULL OR m.id > cp_inner.last_read_message_id)
        AND m.sender_id != ${userId}
        GROUP BY m.conversation_id
      ) unread_count ON c.id = unread_count.conversation_id
      WHERE cp.user_id = ${userId} AND cp.is_active = true
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `;

    return Response.json({ conversations });
  } catch (err) {
    console.error("GET /api/conversations error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Create a new conversation
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { participant_ids, conversation_type = 'direct', title } = body || {};

    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return Response.json({ error: "participant_ids is required and must be an array" }, { status: 400 });
    }

    // For direct messages, check if conversation already exists
    if (conversation_type === 'direct' && participant_ids.length === 1) {
      const existingConversation = await sql`
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE c.conversation_type = 'direct'
        AND cp1.user_id = ${userId}
        AND cp2.user_id = ${participant_ids[0]}
        AND cp1.is_active = true
        AND cp2.is_active = true
        LIMIT 1
      `;

      if (existingConversation.length > 0) {
        return Response.json({ conversation_id: existingConversation[0].id });
      }
    }

    // Validate that we're not including ourselves in participant_ids
    const filteredParticipantIds = participant_ids.filter(id => id !== userId);
    
    if (filteredParticipantIds.length === 0) {
      return Response.json({ error: "Cannot create conversation with only yourself" }, { status: 400 });
    }

    // Create conversation and add participants in a transaction
    const [conversationResult] = await sql.transaction([
      sql`
        INSERT INTO conversations (conversation_type, title, created_by)
        VALUES (${conversation_type}, ${title || null}, ${userId})
        RETURNING id, conversation_type, title, created_at
      `
    ]);

    const conversation = conversationResult[0];
    const conversationId = conversation.id;

    // Add all participants including the creator
    const allParticipants = [userId, ...filteredParticipantIds];
    
    for (const participantId of allParticipants) {
      await sql`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (${conversationId}, ${participantId})
      `;
    }

    return Response.json({ 
      conversation_id: conversationId,
      conversation
    });
  } catch (err) {
    console.error("POST /api/conversations error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}