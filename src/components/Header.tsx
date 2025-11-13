import { UserButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "./ui/sidebar";

interface HeaderProps {
  activeTab: "arriving" | "profiling" | "chat";
  onTabChange: (tab: "arriving" | "profiling" | "chat") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="bg-card border-b border-border">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <img
              src="/logo.png"
              alt="Singapore Maritime Crisis Centre"
              className="h-16"
              style={{ objectFit: "contain" }}
            />
            <nav className="flex gap-6">
              <button
                onClick={() => {
                  onTabChange("arriving");
                  navigate({ to: "/" });
                }}
                className={`nav-title pb-2 border-b-2 transition-colors ${
                  activeTab === "arriving"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Arriving Vessels
              </button>
              <button
                onClick={() => {
                  onTabChange("profiling");
                  navigate({ to: "/search" });
                }}
                className={`nav-title pb-2 border-b-2 transition-colors ${
                  activeTab === "profiling"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Vessel Risk Profiling
              </button>
              <button
                onClick={() => {
                  onTabChange("chat");
                  navigate({ to: "/chat", search: { id: undefined } });
                }}
                className={`nav-title pb-2 border-b-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                SeaSense AI
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
