import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return Response.json({ error: "businessId required" }, { status: 400 });
  }

  try {
    // Get existing alerts
    const existingAlerts = await sql`
      SELECT * FROM alerts 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `;

    // If we have recent alerts, return them
    if (existingAlerts.length > 0) {
      return Response.json({ alerts: existingAlerts });
    }

    // Otherwise, generate new alerts based on business rules
    const [sales, inventory, expenses] = await Promise.all([
      sql`SELECT * FROM sales WHERE business_id = ${businessId} ORDER BY sale_date DESC LIMIT 100`,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
      sql`SELECT * FROM expenses WHERE business_id = ${businessId} ORDER BY expense_date DESC LIMIT 50`,
    ]);

    const newAlerts = [];

    // Rule 1: Low stock alerts
    const lowStockItems = inventory.filter(
      (item) => item.quantity <= item.reorder_level,
    );
    for (const item of lowStockItems) {
      newAlerts.push({
        alert_type: "low_stock",
        severity: item.quantity === 0 ? "critical" : "warning",
        message: `${item.item_name} is ${item.quantity === 0 ? "out of stock" : "running low"} (${item.quantity} units remaining)`,
        metadata: {
          item_name: item.item_name,
          quantity: item.quantity,
          reorder_level: item.reorder_level,
        },
      });
    }

    // Rule 2: Profit margin drops (compare last 7 days vs previous 7 days)
    const last7Days = sales.filter(
      (s) =>
        new Date(s.sale_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    const prev7Days = sales.filter((s) => {
      const date = new Date(s.sale_date);
      return (
        date > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
        date <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
    });

    if (last7Days.length > 0 && prev7Days.length > 0) {
      const calcMargin = (salesData) => {
        const total = salesData.reduce(
          (sum, s) => {
            const profit =
              (parseFloat(s.price) - parseFloat(s.cost)) * parseInt(s.quantity);
            const revenue = parseFloat(s.price) * parseInt(s.quantity);
            return {
              profit: sum.profit + profit,
              revenue: sum.revenue + revenue,
            };
          },
          { profit: 0, revenue: 0 },
        );
        return total.revenue > 0 ? (total.profit / total.revenue) * 100 : 0;
      };

      const lastMargin = calcMargin(last7Days);
      const prevMargin = calcMargin(prev7Days);
      const marginDrop = prevMargin - lastMargin;

      if (marginDrop > 3) {
        newAlerts.push({
          alert_type: "margin_drop",
          severity: marginDrop > 5 ? "critical" : "warning",
          message: `Profit margin dropped ${marginDrop.toFixed(1)}% this week (was ${prevMargin.toFixed(1)}%, now ${lastMargin.toFixed(1)}%)`,
          metadata: {
            last_margin: lastMargin,
            prev_margin: prevMargin,
            drop_percentage: marginDrop,
          },
        });
      }
    }

    // Rule 3: Expense spikes (compare last 7 days to average)
    const last7DaysExpenses = expenses.filter(
      (e) =>
        new Date(e.expense_date) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    const allExpenses = expenses.filter(
      (e) =>
        new Date(e.expense_date) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    if (last7DaysExpenses.length > 0 && allExpenses.length > 7) {
      const last7Total = last7DaysExpenses.reduce(
        (sum, e) => sum + parseFloat(e.amount),
        0,
      );
      const avgWeekly =
        allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / 4;

      if (last7Total > avgWeekly * 1.5) {
        newAlerts.push({
          alert_type: "expense_spike",
          severity: "warning",
          message: `Expenses are ${((last7Total / avgWeekly - 1) * 100).toFixed(0)}% higher than usual this week ($${last7Total.toFixed(2)} vs avg $${avgWeekly.toFixed(2)})`,
          metadata: { last_week_total: last7Total, average_weekly: avgWeekly },
        });
      }
    }

    // Rule 4: Sales anomaly detection (unusual sales patterns)
    const todaySales = sales.filter((s) => {
      const saleDate = new Date(s.sale_date);
      const today = new Date();
      return saleDate.toDateString() === today.toDateString();
    });

    const last30DaysSales = sales.filter(
      (s) =>
        new Date(s.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    if (todaySales.length > 0 && last30DaysSales.length > 30) {
      const todayRevenue = todaySales.reduce(
        (sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity),
        0,
      );
      const avgDailyRevenue =
        last30DaysSales.reduce(
          (sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity),
          0,
        ) / 30;

      if (todayRevenue < avgDailyRevenue * 0.5) {
        newAlerts.push({
          alert_type: "sales_drop",
          severity: "warning",
          message: `Today's sales are unusually low ($${todayRevenue.toFixed(2)} vs avg $${avgDailyRevenue.toFixed(2)})`,
          metadata: {
            today_revenue: todayRevenue,
            average_daily: avgDailyRevenue,
          },
        });
      } else if (todayRevenue > avgDailyRevenue * 1.8) {
        newAlerts.push({
          alert_type: "sales_spike",
          severity: "info",
          message: `Exceptional sales today! Revenue is ${((todayRevenue / avgDailyRevenue - 1) * 100).toFixed(0)}% above average ($${todayRevenue.toFixed(2)} vs avg $${avgDailyRevenue.toFixed(2)})`,
          metadata: {
            today_revenue: todayRevenue,
            average_daily: avgDailyRevenue,
          },
        });
      }
    }

    // Insert new alerts into database
    for (const alert of newAlerts) {
      await sql`
        INSERT INTO alerts (business_id, alert_type, severity, message, metadata)
        VALUES (${businessId}, ${alert.alert_type}, ${alert.severity}, ${alert.message}, ${JSON.stringify(alert.metadata)})
      `;
    }

    // Fetch the newly created alerts
    const alerts = await sql`
      SELECT * FROM alerts 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `;

    return Response.json({ alerts });
  } catch (error) {
    console.error("Error generating alerts:", error);
    return Response.json(
      { error: "Failed to generate alerts" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { alertId, isRead } = await request.json();

    if (!alertId) {
      return Response.json({ error: "alertId required" }, { status: 400 });
    }

    await sql`
      UPDATE alerts 
      SET is_read = ${isRead} 
      WHERE id = ${alertId}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating alert:", error);
    return Response.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
