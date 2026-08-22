import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App.tsx";

// 1. Import Tailwind
import "./index.css";

// 2. Setup TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-medium text-sm mt-5",
          style: { direction: "rtl", borderRadius: "50px" },
        }}
      />
      <div dir="rtl">
        <App />
      </div>
    </QueryClientProvider>
  </StrictMode>,
);