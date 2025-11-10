import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/components/ui/chatStore";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function ChatSidebar() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const navigate = useNavigate();

  // Subscribe to Zustand store
  const activeChats = useChatStore((state) => state.activeChats);
  const createChat = useChatStore((state) => state.createChat);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await api.chat.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      return await response.json();
    },
  });

  const handleNewChat = () => {
    const newChatId = createChat();
    setActiveChat(newChatId);
    navigate({ to: "/chat", search: { id: newChatId } });
  };

  const handleChatClick = (chatId: string) => {
    setActiveChat(chatId);
    navigate({ to: "/chat", search: { id: chatId } });
  };

  const groupChatsByDate = (chats: Chat[]) => {
    const today: Chat[] = [];
    const yesterday: Chat[] = [];
    const thisWeek: Chat[] = [];
    const older: Chat[] = [];

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= todayStart) {
        today.push(chat);
      } else if (chatDate >= yesterdayStart) {
        yesterday.push(chat);
      } else if (chatDate >= weekStart) {
        thisWeek.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  // Derive displayed chats: only add active chats if they have completed first message
  const allChats = [...chats];

  // Add active chats that have completed their first message
  Array.from(activeChats.values()).forEach((chatState) => {
    // Only add if not already in the fetched chats and has completed first message
    if (
      !chats.find((c) => c.id === chatState.chatId) &&
      chatState.hasCompletedFirstMessage &&
      chatState.title
    ) {
      allChats.unshift({
        id: chatState.chatId,
        title: chatState.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // Get streaming chats (chats that are actively streaming but haven't completed)
  const streamingChats = Array.from(activeChats.values()).filter(
    (chatState) => chatState.isStreaming && !chatState.hasCompletedFirstMessage,
  );

  const { today, yesterday, thisWeek, older } = groupChatsByDate(allChats);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b p-4">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          </div>
        ) : (
          <>
            {/* Show streaming chats at the top */}
            {streamingChats.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {streamingChats.map((chatState) => (
                      <SidebarMenuItem key={chatState.chatId}>
                        <SidebarMenuButton
                          onClick={() => handleChatClick(chatState.chatId)}
                          isActive={activeChat === chatState.chatId}
                          className={cn(
                            "justify-between group",
                            activeChat === chatState.chatId && "bg-accent",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-muted-foreground">
                              Generating title...
                            </span>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {allChats.length === 0 && streamingChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new conversation
                </p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Today</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {today.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat.id)}
                              isActive={activeChat === chat.id}
                              className={cn(
                                "justify-between group",
                                activeChat === chat.id && "bg-accent",
                              )}
                            >
                              <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {yesterday.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Yesterday</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {yesterday.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat.id)}
                              isActive={activeChat === chat.id}
                              className={cn(
                                "justify-between group",
                                activeChat === chat.id && "bg-accent",
                              )}
                            >
                              <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {thisWeek.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>This Week</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {thisWeek.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat.id)}
                              isActive={activeChat === chat.id}
                              className={cn(
                                "justify-between group",
                                activeChat === chat.id && "bg-accent",
                              )}
                            >
                              <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {older.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Older</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {older.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat.id)}
                              isActive={activeChat === chat.id}
                              className={cn(
                                "justify-between group",
                                activeChat === chat.id && "bg-accent",
                              )}
                            >
                              <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
