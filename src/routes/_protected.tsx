import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_protected")({
  component: RootComponent,
  beforeLoad: ({ context }) => {
    const { auth } = context;

    if (!auth.isSignedIn) {
      redirect({ throw: true, to: "/sign-in" });
    }
  },
});

function RootComponent() {
  const [activeTab, setActiveTab] = useState<"arriving" | "profiling">(
    "arriving",
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <ChatSidebar />
      <div className="flex flex-col w-full min-h-screen">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <Outlet />
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
