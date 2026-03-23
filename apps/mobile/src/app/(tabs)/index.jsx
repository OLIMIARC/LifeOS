import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Bell,
  Target,
  Volume2,
  CheckCircle2,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function MobileDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ownerId = "default_owner";

  const { data: business } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ["alerts", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/alerts?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch actions
  const { data: actionsData } = useQuery({
    queryKey: ["actions", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/actions?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch forecasts
  const { data: forecastsData } = useQuery({
    queryKey: ["forecasts", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/forecasts?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  // Fetch voice briefing
  const { data: briefingData } = useQuery({
    queryKey: ["voice-briefing", business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/voice-briefing?businessId=${business.id}`);
      return res.json();
    },
    enabled: !!business?.id,
  });

  if (!business) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
          Welcome to LifeOS
        </Text>
        <Text
          style={{ textAlign: "center", color: "#6B7280", marginBottom: 30 }}
        >
          Register your business on the web or in settings to get started.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          style={{
            backgroundColor: "#4F46E5",
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Go to Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary, lowStock, recentInsights } = dashboard || {};
  const alerts = alertsData?.alerts || [];
  const actions = actionsData?.actions || [];
  const forecasts = forecastsData?.forecasts || [];
  const briefing = briefingData?.briefing;

  const criticalAlerts = alerts.filter(
    (a) => a.severity === "critical" && !a.is_read,
  );
  const pendingActions = actions.filter((a) => !a.is_completed);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 80,
        }}
      >
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
            Hello, {business.name}
          </Text>
          <Text style={{ color: "#6B7280", marginTop: 4 }}>
            Your business pulse is healthy.
          </Text>
        </View>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: "#FEE2E2",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <Bell size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    color: "#7F1D1D",
                    marginBottom: 8,
                  }}
                >
                  Critical Alerts
                </Text>
                {criticalAlerts.slice(0, 2).map((alert) => (
                  <Text
                    key={alert.id}
                    style={{ fontSize: 12, color: "#991B1B", marginBottom: 4 }}
                  >
                    • {alert.message}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Revenue"
            value={`$${Number(summary?.total_revenue || 0).toLocaleString()}`}
            icon={<TrendingUp size={18} color="#10B981" />}
          />
          <StatCard
            label="Profit"
            value={`$${Number(summary?.total_profit || 0).toLocaleString()}`}
            icon={<TrendingUp size={18} color="#4F46E5" />}
          />
        </View>

        {/* Voice Briefing Highlight */}
        {briefing && (
          <TouchableOpacity
            style={{
              backgroundColor: "#4F46E5",
              padding: 20,
              borderRadius: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Volume2 size={20} color="white" />
              <Text
                style={{ color: "white", fontSize: 14, fontWeight: "bold" }}
              >
                WEEKLY BRIEFING
              </Text>
            </View>
            <Text
              style={{ color: "#E0E7FF", fontSize: 14, lineHeight: 20 }}
              numberOfLines={4}
            >
              {briefing.briefing_text}
            </Text>
          </TouchableOpacity>
        )}

        {/* AI Insight Highlight */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/chat")}
          style={{
            backgroundColor: "#1E1B4B",
            padding: 20,
            borderRadius: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#E0E7FF",
                fontSize: 12,
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Daily Briefing
            </Text>
            <ArrowRight size={16} color="#E0E7FF" />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "500",
              lineHeight: 24,
            }}
          >
            {recentInsights?.[0]?.content ||
              "Sync your business data to get your first AI-driven briefing."}
          </Text>
        </TouchableOpacity>

        {/* Recommended Actions */}
        {pendingActions.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}
              >
                Actions for You
              </Text>
              <Target size={20} color="#4F46E5" />
            </View>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              {pendingActions.slice(0, 3).map((action) => (
                <View key={action.id} style={{ flexDirection: "row", gap: 12 }}>
                  <CheckCircle2
                    size={20}
                    color="#4F46E5"
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 20,
                    }}
                  >
                    {action.action_text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Forecasts */}
        {forecasts.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Business Forecasts
            </Text>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              {forecasts.slice(0, 2).map((forecast) => (
                <View
                  key={forecast.id}
                  style={{
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 18,
                      marginBottom: 8,
                    }}
                  >
                    {forecast.prediction}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: "#F3E8FF",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#7C3AED",
                          fontWeight: "600",
                        }}
                      >
                        {forecast.confidence_level} confidence
                      </Text>
                    </View>
                    {forecast.target_date && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#9CA3AF",
                          alignSelf: "center",
                        }}
                      >
                        {new Date(forecast.target_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Inventory Risk */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}
            >
              Stock Risks
            </Text>
            <Text style={{ color: "#4F46E5", fontSize: 14, fontWeight: "500" }}>
              View All
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
            }}
          >
            {lowStock?.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  borderBottomWidth: i === lowStock.length - 1 ? 0 : 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#F3F4F6",
                      padding: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Package size={16} color="#4B5563" />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {item.item_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      {item.quantity} units remaining
                    </Text>
                  </View>
                </View>
                <AlertTriangle size={18} color="#F59E0B" />
              </View>
            ))}
            {(!lowStock || lowStock.length === 0) && (
              <Text
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  paddingVertical: 20,
                }}
              >
                All inventory levels are healthy.
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <ActionButton
            label="Ask Advisor"
            onPress={() => router.push("/(tabs)/chat")}
          />
          <ActionButton label="View Sales" variant="secondary" />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
          {label}
        </Text>
        {icon}
      </View>
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({ label, onPress, variant = "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: isPrimary ? "#4F46E5" : "white",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text
        style={{ color: isPrimary ? "white" : "#374151", fontWeight: "bold" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
