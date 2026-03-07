import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { InstructionsPage } from "./pages/InstructionsPage.jsx";
import { ThankYouPage } from "./pages/ThankYouPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/instructions" element={<InstructionsPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
