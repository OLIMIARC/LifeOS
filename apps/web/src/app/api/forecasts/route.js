import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return Response.json({ error: "businessId required" }, { status: 400 });
  }

  try {
    // Get existing forecasts
    const existingForecasts = await sql`
      SELECT * FROM forecasts 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY target_date ASC
    `;

    // If we have recent forecasts, return them
    if (existingForecasts.length > 0) {
      return Response.json({ forecasts: existingForecasts });
    }

    // Otherwise, generate new forecasts
    const [sales, inventory] = await Promise.all([
      sql`SELECT * FROM sales WHERE business_id = ${businessId} ORDER BY sale_date DESC LIMIT 200`,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
    ]);

    const newForecasts = [];

    // Forecast 1: Inventory depletion predictions
    const last30Days = sales.filter(
      (s) =>
        new Date(s.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    // Calculate daily sales rate per item
    const itemSalesRate = {};
    last30Days.forEach((s) => {
      if (!itemSalesRate[s.item_name]) {
        itemSalesRate[s.item_name] = [];
      }
      itemSalesRate[s.item_name].push({
        date: new Date(s.sale_date),
        quantity: parseInt(s.quantity),
      });
    });

    // Predict stockout dates
    for (const item of inventory) {
      const salesData = itemSalesRate[item.item_name] || [];
      if (salesData.length === 0) continue;

      const totalSold = salesData.reduce((sum, s) => sum + s.quantity, 0);
      const dailyRate = totalSold / 30; // average daily sales

      if (dailyRate > 0 && item.quantity > 0) {
        const daysUntilEmpty = Math.floor(item.quantity / dailyRate);
        if (daysUntilEmpty <= 14 && daysUntilEmpty > 0) {
          const targetDate = new Date(
            Date.now() + daysUntilEmpty * 24 * 60 * 60 * 1000,
          );
          newForecasts.push({
            forecast_type: "stockout_prediction",
            item_name: item.item_name,
            prediction: `${item.item_name} will run out in approximately ${daysUntilEmpty} days`,
            confidence_level: salesData.length > 20 ? "high" : "medium",
            target_date: targetDate.toISOString().split("T")[0],
            metadata: {
              current_stock: item.quantity,
              daily_rate: dailyRate.toFixed(2),
              days_until_empty: daysUntilEmpty,
            },
          });
        }
      }
    }

    // Forecast 2: Peak sales day prediction
    const salesByDayOfWeek = {};
    last30Days.forEach((s) => {
      const dayIndex = new Date(s.sale_date).getDay();
      if (!salesByDayOfWeek[dayIndex]) {
        salesByDayOfWeek[dayIndex] = { count: 0, revenue: 0 };
      }
      salesByDayOfWeek[dayIndex].count++;
      salesByDayOfWeek[dayIndex].revenue +=
        parseFloat(s.price) * parseInt(s.quantity);
    });

    const bestDay = Object.entries(salesByDayOfWeek)
      .map(([day, data]) => ({
        day: parseInt(day),
        avgRevenue: data.revenue / data.count,
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)[0];

    if (bestDay) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const nextOccurrence = new Date();
      while (nextOccurrence.getDay() !== bestDay.day) {
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);
      }

      newForecasts.push({
        forecast_type: "sales_pattern",
        item_name: null,
        prediction: `${dayNames[bestDay.day]} typically generates ${bestDay.avgRevenue.toFixed(0)}% more revenue — next ${dayNames[bestDay.day]} is likely to be strong`,
        confidence_level: "high",
        target_date: nextOccurrence.toISOString().split("T")[0],
        metadata: {
          best_day: dayNames[bestDay.day],
          avg_revenue: bestDay.avgRevenue,
        },
      });
    }

    // Forecast 3: Revenue trend prediction
    const last7DaysRevenue = sales
      .filter(
        (s) =>
          new Date(s.sale_date) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      )
      .reduce((sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity), 0);

    const prev7DaysRevenue = sales
      .filter((s) => {
        const date = new Date(s.sale_date);
        return (
          date > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
          date <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
      })
      .reduce((sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity), 0);

    if (prev7DaysRevenue > 0) {
      const growthRate =
        ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100;
      const nextWeekRevenue = last7DaysRevenue * (1 + growthRate / 100);

      const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      newForecasts.push({
        forecast_type: "revenue_forecast",
        item_name: null,
        prediction:
          growthRate > 0
            ? `Revenue trending up ${growthRate.toFixed(1)}% — expect approximately $${nextWeekRevenue.toFixed(2)} next week`
            : `Revenue down ${Math.abs(growthRate).toFixed(1)}% — projected $${nextWeekRevenue.toFixed(2)} next week`,
        confidence_level: "medium",
        target_date: nextWeekDate.toISOString().split("T")[0],
        metadata: {
          last_week: last7DaysRevenue,
          prev_week: prev7DaysRevenue,
          growth_rate: growthRate,
          projection: nextWeekRevenue,
        },
      });
    }

    // Forecast 4: Fast-moving item predictions
    const itemVelocity = {};
    last30Days.forEach((s) => {
      itemVelocity[s.item_name] =
        (itemVelocity[s.item_name] || 0) + parseInt(s.quantity);
    });

    const fastMovers = Object.entries(itemVelocity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [itemName, quantity] of fastMovers) {
      const monthlyRate = quantity;
      const currentStock =
        inventory.find((i) => i.item_name === itemName)?.quantity || 0;

      if (currentStock > 0) {
        newForecasts.push({
          forecast_type: "demand_forecast",
          item_name: itemName,
          prediction: `${itemName} sells ${(monthlyRate / 30).toFixed(1)} units/day — high demand expected to continue`,
          confidence_level: "high",
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          metadata: {
            monthly_sales: monthlyRate,
            daily_rate: (monthlyRate / 30).toFixed(1),
            current_stock: currentStock,
          },
        });
      }
    }

    // Insert new forecasts into database
    for (const forecast of newForecasts) {
      await sql`
        INSERT INTO forecasts (business_id, forecast_type, item_name, prediction, confidence_level, target_date, metadata)
        VALUES (${businessId}, ${forecast.forecast_type}, ${forecast.item_name}, ${forecast.prediction}, ${forecast.confidence_level}, ${forecast.target_date}, ${JSON.stringify(forecast.metadata)})
      `;
    }

    // Fetch the newly created forecasts
    const forecasts = await sql`
      SELECT * FROM forecasts 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY target_date ASC
    `;

    return Response.json({ forecasts });
  } catch (error) {
    console.error("Error generating forecasts:", error);
    return Response.json(
      { error: "Failed to generate forecasts" },
      { status: 500 },
    );
  }
}
