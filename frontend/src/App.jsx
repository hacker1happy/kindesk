import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddClient from "./pages/AddClient";
import ClientDetails from "./pages/ClientDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients/new" element={<AddClient />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;