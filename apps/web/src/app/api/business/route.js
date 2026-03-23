import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId") || "default_owner"; // In a real app, this would come from auth

    const businesses = await sql`
      SELECT * FROM businesses WHERE owner_id = ${ownerId} LIMIT 1
    `;

    return Response.json(businesses[0] || null);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch business" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { name, category, ownerId } = await request.json();

    const [business] = await sql`
      INSERT INTO businesses (name, category, owner_id)
      VALUES (${name}, ${category}, ${ownerId || "default_owner"})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category
      RETURNING *
    `;

    return Response.json(business);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to save business" }, { status: 500 });
  }
}
