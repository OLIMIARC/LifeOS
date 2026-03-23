import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Bot, User, Sparkles } from "lucide-react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function MobileChat() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello. I am your business advisor. How can I help you understand your business reality today?",
    },
  ]);
  const scrollViewRef = useRef();

  const ownerId = "default_owner";
  const { data: business } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (msgs) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, businessId: business.id }),
      });
      if (!res.ok) throw new Error("Chat failed");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending || !business) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate(newMessages.slice(-5));
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, chatMutation.isPending]);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={20} color="#4F46E5" />
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
          LifeOS Advisor
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={{
              marginBottom: 20,
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor:
                  msg.role === "assistant" ? "#EEF2FF" : "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {msg.role === "assistant" ? (
                <Bot size={18} color="#4F46E5" />
              ) : (
                <User size={18} color="#4B5563" />
              )}
            </View>
            <View
              style={{
                maxWidth: "80%",
                backgroundColor:
                  msg.role === "assistant" ? "#F9FAFB" : "#4F46E5",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 20,
                borderTopLeftRadius: msg.role === "assistant" ? 4 : 20,
                borderTopRightRadius: msg.role === "user" ? 4 : 20,
              }}
            >
              <Text
                style={{
                  color: msg.role === "assistant" ? "#111827" : "#FFFFFF",
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}
        {chatMutation.isPending && (
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#EEF2FF",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
            <View
              style={{
                backgroundColor: "#F9FAFB",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 20,
                borderTopLeftRadius: 4,
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
                Analyzing business data...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingAnimatedView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            padding: 15,
            paddingBottom: Platform.OS === "ios" ? 0 : 15,
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F9FAFB",
              borderRadius: 25,
              paddingHorizontal: 15,
              paddingVertical: 8,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your business anything..."
              style={{
                flex: 1,
                fontSize: 15,
                color: "#111827",
                maxHeight: 100,
              }}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: input.trim() ? "#4F46E5" : "#E5E7EB",
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 10,
              }}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingAnimatedView>
    </View>
  );
}
