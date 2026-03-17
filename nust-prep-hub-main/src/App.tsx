import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Content from "./pages/Content";
import Practice from "./pages/Practice";
import Tests from "./pages/Tests";
import TestAttempt from "./pages/TestAttempt";
import TestResult from "./pages/TestResult";
import Analytics from "./pages/Analytics";
import Bookmarks from "./pages/Bookmarks";
import Profile from "./pages/Profile";
import AdminContent from "./pages/admin/AdminContent";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStats from "./pages/admin/AdminStats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/content" element={<AppLayout><Content /></AppLayout>} />
            <Route path="/content/:fieldId" element={<AppLayout><Content /></AppLayout>} />
            <Route path="/content/:fieldId/:subjectId" element={<AppLayout><Content /></AppLayout>} />
            <Route path="/content/:fieldId/:subjectId/:topicId" element={<AppLayout><Content /></AppLayout>} />
            <Route path="/practice" element={<AppLayout><Practice /></AppLayout>} />
            <Route path="/practice/:fieldId" element={<AppLayout><Practice /></AppLayout>} />
            <Route path="/practice/:fieldId/:subjectId" element={<AppLayout><Practice /></AppLayout>} />
            <Route path="/practice/:fieldId/:subjectId/:topicId" element={<AppLayout><Practice /></AppLayout>} />
            <Route path="/tests" element={<AppLayout><Tests /></AppLayout>} />
            <Route path="/tests/:testId/attempt/:attemptId" element={<AppLayout><TestAttempt /></AppLayout>} />
            <Route path="/tests/:testId/result/:attemptId" element={<AppLayout><TestResult /></AppLayout>} />
            <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
            <Route path="/bookmarks" element={<AppLayout><Bookmarks /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/admin/content" element={<AppLayout><AdminContent /></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><AdminUsers /></AppLayout>} />
            <Route path="/admin/stats" element={<AppLayout><AdminStats /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
