import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { businessId, type, data } = await request.json();

    if (!businessId || !type || !data) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (type === "sales") {
      // Expecting data as array of { item_name, category, quantity, price, cost, sale_date }
      for (const row of data) {
        await sql`
          INSERT INTO sales (business_id, item_name, category, quantity, price, cost, sale_date)
          VALUES (${businessId}, ${row.item_name}, ${row.category}, ${row.quantity}, ${row.price}, ${row.cost}, ${row.sale_date || new Date()})
        `;
      }
    } else if (type === "inventory") {
      // Expecting data as array of { item_name, category, quantity, unit_cost, reorder_level }
      for (const row of data) {
        await sql`
          INSERT INTO inventory (business_id, item_name, category, quantity, unit_cost, reorder_level)
          VALUES (${businessId}, ${row.item_name}, ${row.category}, ${row.quantity}, ${row.unit_cost}, ${row.reorder_level || 10})
          ON CONFLICT (id) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            unit_cost = EXCLUDED.unit_cost,
            reorder_level = EXCLUDED.reorder_level,
            updated_at = NOW()
        `;
      }
    }

    return Response.json({ message: "Data uploaded successfully" });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to process upload" },
      { status: 500 },
    );
  }
}
