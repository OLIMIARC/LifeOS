import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return Response.json(
        { error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Basic stats for the last 30 days
    const stats = await sql`
      SELECT 
        COALESCE(SUM(price * quantity), 0) as total_revenue,
        COALESCE(SUM((price - cost) * quantity), 0) as total_profit,
        COALESCE(AVG((price - cost) / NULLIF(price, 0)) * 100, 0) as avg_margin
      FROM sales
      WHERE business_id = ${businessId}
      AND sale_date >= NOW() - INTERVAL '30 days'
    `;

    // Top selling items
    const topItems = await sql`
      SELECT item_name, SUM(quantity) as total_sold, SUM(price * quantity) as revenue
      FROM sales
      WHERE business_id = ${businessId}
      GROUP BY item_name
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    // Low stock items
    const lowStock = await sql`
      SELECT item_name, quantity, reorder_level
      FROM inventory
      WHERE business_id = ${businessId}
      AND quantity <= reorder_level
      LIMIT 5
    `;

    // Recent insights
    const recentInsights = await sql`
      SELECT * FROM insights
      WHERE business_id = ${businessId}
      ORDER BY created_at DESC
      LIMIT 3
    `;

    return Response.json({
      summary: stats[0],
      topItems,
      lowStock,
      recentInsights,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
