import { Bell, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  activeTab: "arriving" | "profiling";
  onTabChange: (tab: "arriving" | "profiling") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Singapore Maritime Crisis Centre"
              className="h-16"
              style={{ objectFit: "contain" }}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-6">
          <button
            onClick={() => onTabChange("arriving")}
            className={`nav-title pb-2 border-b-2 transition-colors ${
              activeTab === "arriving"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Arriving Vessel Threat Scoring
          </button>
          <button
            onClick={() => onTabChange("profiling")}
            className={`nav-title pb-2 border-b-2 transition-colors ${
              activeTab === "profiling"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Vessel Risk Profiling
          </button>
        </nav>
      </div>
    </header>
  );
}
