import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Queue message for offline sending
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { conversation_id, content, message_type = 'text', media_url, reply_to_id, client_id } = body || {};

    if (!conversation_id || !content) {
      return Response.json({ error: "conversation_id and content are required" }, { status: 400 });
    }

    if (!client_id) {
      return Response.json({ error: "client_id is required for offline messages" }, { status: 400 });
    }

    // Check if user is a participant in this conversation
    const participantCheck = await sql`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = ${conversation_id} 
      AND user_id = ${userId} 
      AND is_active = true
      LIMIT 1
    `;

    if (participantCheck.length === 0) {
      return Response.json({ error: "Not authorized to send messages to this conversation" }, { status: 403 });
    }

    // Queue the message
    const offlineMessage = await sql`
      INSERT INTO offline_messages (
        user_id, 
        conversation_id, 
        content, 
        message_type, 
        media_url, 
        reply_to_id, 
        client_id
      )
      VALUES (
        ${userId}, 
        ${conversation_id}, 
        ${content}, 
        ${message_type}, 
        ${media_url || null}, 
        ${reply_to_id || null}, 
        ${client_id}
      )
      ON CONFLICT (client_id) DO UPDATE SET
        content = EXCLUDED.content,
        message_type = EXCLUDED.message_type,
        media_url = EXCLUDED.media_url,
        reply_to_id = EXCLUDED.reply_to_id
      RETURNING id, client_id, created_at
    `;

    return Response.json({ offline_message: offlineMessage[0] });
  } catch (err) {
    console.error("POST /api/offline-messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Get and process queued offline messages
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all offline messages for this user
    const offlineMessages = await sql`
      SELECT 
        id,
        conversation_id,
        content,
        message_type,
        media_url,
        reply_to_id,
        client_id,
        created_at
      FROM offline_messages
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `;

    const processedMessages = [];
    const failedMessages = [];

    // Process each offline message
    for (const offlineMsg of offlineMessages) {
      try {
        // Send the message
        const messageResult = await sql`
          INSERT INTO messages (
            conversation_id, 
            sender_id, 
            content, 
            message_type, 
            media_url, 
            reply_to_id
          )
          VALUES (
            ${offlineMsg.conversation_id}, 
            ${userId}, 
            ${offlineMsg.content}, 
            ${offlineMsg.message_type}, 
            ${offlineMsg.media_url}, 
            ${offlineMsg.reply_to_id}
          )
          RETURNING id, conversation_id, sender_id, content, message_type, created_at
        `;

        const message = messageResult[0];

        // Create delivery records for other participants
        const participants = await sql`
          SELECT user_id FROM conversation_participants
          WHERE conversation_id = ${offlineMsg.conversation_id} 
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
          WHERE id = ${offlineMsg.conversation_id}
        `;

        // Delete the offline message
        await sql`
          DELETE FROM offline_messages 
          WHERE id = ${offlineMsg.id}
        `;

        processedMessages.push({
          client_id: offlineMsg.client_id,
          message_id: message.id,
          sent_at: message.created_at
        });

      } catch (msgErr) {
        console.error("Failed to process offline message:", msgErr);
        failedMessages.push({
          client_id: offlineMsg.client_id,
          error: msgErr.message
        });
      }
    }

    return Response.json({ 
      processed: processedMessages,
      failed: failedMessages,
      total_processed: processedMessages.length,
      total_failed: failedMessages.length
    });
  } catch (err) {
    console.error("GET /api/offline-messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}