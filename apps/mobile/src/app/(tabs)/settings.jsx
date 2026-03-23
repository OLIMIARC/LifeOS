import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Store, Tag, Save, Info, AlertCircle } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function MobileSettings() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const ownerId = "default_owner";

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const [form, setForm] = useState({
    name: business?.name || "",
    category: business?.category || "",
  });

  React.useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        category: business.category || "",
      });
    }
  }, [business]);

  const mutation = useMutation({
    mutationFn: async (newData) => {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newData, ownerId }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Business details updated successfully");
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
            Setup
          </Text>
          <Text style={{ color: "#6B7280", marginTop: 4 }}>
            Configure your business intelligence center.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 20,
            borderWeight: 1,
            borderColor: "#F3F4F6",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#374151",
              marginBottom: 20,
            }}
          >
            Business Profile
          </Text>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>
              Business Name
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
                paddingVertical: 8,
              }}
            >
              <Store size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
              <TextInput
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
                placeholder="Enter business name"
                style={{ flex: 1, fontSize: 16, color: "#111827" }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>
              Industry Category
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
                paddingVertical: 8,
              }}
            >
              <Tag size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
              <TextInput
                value={form.category}
                onChangeText={(val) => setForm({ ...form, category: val })}
                placeholder="Retail, Restaurant, Salon, etc."
                style={{ flex: 1, fontSize: 16, color: "#111827" }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={mutation.isPending}
            style={{
              backgroundColor: "#4F46E5",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Save size={20} color="white" />
            )}
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "#EEF2FF",
            padding: 20,
            borderRadius: 20,
            flexDirection: "row",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Info size={24} color="#4F46E5" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#1E1B4B",
                marginBottom: 4,
              }}
            >
              Sync your data
            </Text>
            <Text style={{ fontSize: 14, color: "#4338CA", lineHeight: 20 }}>
              To get insights on your phone, upload your CSV records using the
              LifeOS web dashboard. Once synced, the AI advisor will update
              automatically.
            </Text>
          </View>
        </View>

        <View style={{ padding: 10, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <AlertCircle size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Encrypted & Private Data
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
            LifeOS version 1.0.0 (Global Edition)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
