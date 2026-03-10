import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import MusicPage from "./pages/Music";
import StoryPage from "./pages/Story";
import VideosPage from "./pages/Videos";
import PressPage from "./pages/Press";
import NotFound from "./pages/NotFound";
import ReleasePage from "./pages/ReleasePage";
import StoryDetailPage from "./pages/StoryDetail";
import StorePage from "./pages/Store";
import ProductDetailPage from "./pages/ProductDetail";
import { useCartSync } from "./hooks/useCartSync";

const queryClient = new QueryClient();

const AppInner = () => {
  useCartSync();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/music" element={<MusicPage />} />
      <Route path="/release/:id" element={<ReleasePage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/story/:id" element={<StoryDetailPage />} />
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/store" element={<StorePage />} />
      <Route path="/product/:handle" element={<ProductDetailPage />} />
      <Route path="/press" element={<PressPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
