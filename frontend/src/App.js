import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "@/App.css";
import "@/SurfaceRefinement.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChatDrawer from "@/components/ChatDrawer";
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import BuildBox from "@/pages/BuildBox";
import FestiveBoxEditor from "@/pages/FestiveBoxEditor";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderOption from "@/pages/OrderOption";
import OurStory from "@/pages/OurStory";
import "@/PageAlignment.css";
import "@/StorefrontExperience.css";
import "@/pages/HomeExperience.css";
import "@/pages/HomeLayoutFix.css";
import "@/WholeStorefrontDesign.css";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="site-shell">
      <Nav onOpenChat={() => setChatOpen(true)} />
      <main id="top">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/build" element={<BuildBox />} />
          <Route path="/festive/:boxId" element={<FestiveBoxEditor />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/local-pickup" element={<OrderOption orderType="local-pickup" />} />
          <Route path="/order/same-day" element={<OrderOption orderType="same-day" />} />
          <Route path="/order/corporate-catering" element={<OrderOption orderType="corporate-catering" />} />
          <Route path="/order/corporate-gifting" element={<OrderOption orderType="corporate-gifting" />} />
          <Route path="/order/celebrations" element={<OrderOption orderType="celebrations" />} />
          <Route path="/order/:orderNumber" element={<OrderSuccess />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
