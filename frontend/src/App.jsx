import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddClient from "./pages/AddClient";
import ClientDetails from "./pages/ClientDetails";
import AddCase from "./pages/AddCase";
import DuplicateForm from "./pages/cases/DuplicateForm";
import TransmissionForm from "./pages/cases/TransmissionForm";
import JointForm from "./pages/cases/JointForm";
import CaseDetails from "./pages/CaseDetails";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients/new" element={<AddClient />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/clients/:clientId/cases" element={<AddCase />} />
        <Route path="/cases/duplicate/:caseId" element={<DuplicateForm />} />
        <Route path="/cases/transmission/:caseId" element={<TransmissionForm />} />
        <Route path="/cases/joint/:caseId" element={<JointForm />} />
        <Route path="/clients/:clientId/cases/:caseId" element={<CaseDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;