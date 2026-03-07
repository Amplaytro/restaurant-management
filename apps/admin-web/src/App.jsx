import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./layout/AdminShell.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { MenuPage } from "./pages/MenuPage.jsx";
import { OrderLinePage } from "./pages/OrderLinePage.jsx";
import { TablesPage } from "./pages/TablesPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/order-line" element={<OrderLinePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}
