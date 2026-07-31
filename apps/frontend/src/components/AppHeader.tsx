"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

import { useCurrentUser } from "@/hooks/useCurrentUser";

const { Text } = Typography;

export function AppHeader() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  async function cycleUser() {
    localStorage.clear();
    await queryClient.refetchQueries({ queryKey: ["currentUser"] });
    window.location.reload();
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 24px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fff",
      }}
    >
      <UserOutlined style={{ fontSize: 16, color: "#8c8c8c" }} />
      <Text strong style={{ minWidth: 120 }}>
        {currentUser?.email ?? "Loading…"}
      </Text>

      <Button size="small" onClick={cycleUser}>
        Cycle User
      </Button>

      <Text type="secondary" style={{ fontSize: 12 }}>
        Clears local storage and randomly fetches a new user from the API (user
        is stored in local storage so user persists even after page refresh).
      </Text>
    </header>
  );
}
