import { useAuth } from "@clerk/clerk-react";
import {
  Outlet,
  createRootRouteWithContext,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface RouterContext {
  auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Component,
  notFoundComponent: NotFoundComponent,
});

function Component() {
  return <Outlet />;
}

export default function NotFoundComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center gap-4 max-w-md text-center">
        <h1 className="text-4xl font-bold text-blue-600 balance">
          Page Not Found
        </h1>
        <p className="text-lg text-blue-600">
          Oops! The page you are looking for does not exist.
        </p>
        <Button
          className="w-1/2 bg-orange-500 hover:bg-orange-600"
          onClick={() => (window.location.href = "/")}
        >
          Home
        </Button>
      </div>
    </div>
  );
}
