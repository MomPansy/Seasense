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
        {activeTab === "arriving" ? (
          <Outlet />
        ) : (
          <main className="px-8 py-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <h2>Vessel Risk Profiling</h2>
                <p className="text-muted-foreground">
                  This feature is coming soon. Stay tuned for comprehensive
                  vessel risk analysis.
                </p>
              </div>
            </div>
          </main>
        )}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
