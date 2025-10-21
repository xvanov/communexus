import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const rows = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.image,
        p.display_name,
        p.avatar_url,
        p.status,
        p.last_seen,
        p.push_token
      FROM auth_users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ${userId}
      LIMIT 1
    `;
    
    const user = rows?.[0] || null;
    return Response.json({ user });
  } catch (err) {
    console.error("GET /api/profile error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { display_name, avatar_url, status, push_token } = body || {};

    const setClauses = [];
    const values = [];

    if (typeof display_name === "string" && display_name.trim().length > 0) {
      setClauses.push("display_name = $" + (values.length + 1));
      values.push(display_name.trim());
    }

    if (typeof avatar_url === "string") {
      setClauses.push("avatar_url = $" + (values.length + 1));
      values.push(avatar_url || null);
    }

    if (status && ['online', 'offline', 'away'].includes(status)) {
      setClauses.push("status = $" + (values.length + 1));
      values.push(status);
    }

    if (typeof push_token === "string") {
      setClauses.push("push_token = $" + (values.length + 1));
      values.push(push_token || null);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    const finalQuery = `
      INSERT INTO user_profiles (user_id, ${setClauses.map((_, i) => 
        setClauses[i].split(' = ')[0]).join(', ')})
      VALUES ($${values.length + 1}, ${values.map((_, i) => '$' + (i + 1)).join(', ')})
      ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}
      RETURNING user_id, display_name, avatar_url, status, last_seen, push_token
    `;

    const result = await sql(finalQuery, [...values, userId]);
    const updated = result?.[0] || null;

    return Response.json({ user: updated });
  } catch (err) {
    console.error("PUT /api/profile error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}