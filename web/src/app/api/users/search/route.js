import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Search for users to start conversations with
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (query.length < 2) {
      return Response.json({ users: [] });
    }

    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        p.display_name,
        p.avatar_url,
        p.status,
        p.last_seen
      FROM auth_users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id != ${userId}
      AND (
        LOWER(u.name) LIKE LOWER(${'%' + query + '%'}) OR
        LOWER(u.email) LIKE LOWER(${'%' + query + '%'}) OR
        LOWER(p.display_name) LIKE LOWER(${'%' + query + '%'})
      )
      ORDER BY 
        CASE WHEN p.status = 'online' THEN 1 ELSE 2 END,
        u.name ASC
      LIMIT ${limit}
    `;

    return Response.json({ users });
  } catch (err) {
    console.error("GET /api/users/search error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}