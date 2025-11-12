import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    const { auth } = context;

    if (!auth.isSignedIn) {
      redirect({ throw: true, to: "/sign-in" });
    } else {
      redirect({ throw: true, to: "/table" });
    }
  },
});
