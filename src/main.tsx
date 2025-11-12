import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Activity, StrictMode, useEffect } from "react";
// eslint-disable-next-line import-x/default
import ReactDOM from "react-dom/client";
import { initializeApiAuth } from "./lib/api";
import reportWebVitals from "./reportWebVitals";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import "./styles/globals.css";

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    auth: undefined!,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// App component to use hooks
function App() {
  const auth = useAuth();

  // Initialize API auth with Clerk's getToken function
  useEffect(() => {
    initializeApiAuth(auth.getToken);
  }, [auth.getToken]);

  return (
    <Activity mode={auth.isLoaded ? "visible" : "hidden"}>
      <RouterProvider router={router} context={{ auth }} />;
    </Activity>
  );
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ClerkProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
