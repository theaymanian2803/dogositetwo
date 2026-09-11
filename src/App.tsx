import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/hooks/useCart";
import { SettingsProvider } from "@/hooks/useSettings";
import { SettingsDialogProvider } from "@/components/SettingsDialogProvider";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { FloatingContact } from "@/components/FloatingContact";
import { isOnboardingDone, ONBOARDING_RESTART_EVENT } from "@/lib/onboarding";
import { I18nProvider } from "@/lib/i18n";
import { useEffect, useState } from "react";
import Index from "@/pages/Index";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Track from "@/pages/Track";
import OrderConfirmed from "@/pages/OrderConfirmed";
import Product from "@/pages/Product";
import Category from "@/pages/Category";
import Shop from "@/pages/Shop";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import InfoPage from "@/pages/InfoPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  const [onboardingOpen, setOnboardingOpen] = useState(() => !isOnboardingDone());

  useEffect(() => {
    const onRestart = () => setOnboardingOpen(true);
    window.addEventListener(ONBOARDING_RESTART_EVENT, onRestart);
    return () => window.removeEventListener(ONBOARDING_RESTART_EVENT, onRestart);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <CartProvider>
            <SettingsProvider>
              <SettingsDialogProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/order-confirmed" element={<OrderConfirmed />} />
                  <Route path="/product/:slug" element={<Product />} />
                  <Route path="/category/:category" element={<Category />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/:page" element={<InfoPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <OnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
                <FloatingContact />
              </SettingsDialogProvider>
            </SettingsProvider>
          </CartProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
