import { SignUp } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        signInFallbackRedirectUrl="/"
      />
    </div>
  );
}
