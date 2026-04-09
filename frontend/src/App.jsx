import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import AddClient from "./pages/AddClient/AddClient";
import ClientDetails from "./pages/ClientDetails/ClientDetails";
import AddCase from "./pages/AddCase/AddCase";
import CaseDetails from "./pages/CaseDetails/CaseDetails";
import DuplicateProcess from "./pages/DuplicateProcess/DuplicateProcess";
import TransmissionProcess from "./pages/TransmissionProcess/TransmissionProcess";
import JointProcess from "./pages/JointProcess/JointProcess";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients/new" element={<AddClient />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/clients/:clientId/cases" element={<AddCase />} />
        <Route path="/clients/:clientId/cases/:caseId" element={<CaseDetails />} />
        <Route path="/clients/:clientId/cases/:caseId/duplicate" element={<DuplicateProcess />} />
        <Route path="/clients/:clientId/cases/:caseId/transmission" element={<TransmissionProcess />} />
        <Route path="/clients/:clientId/cases/:caseId/joint" element={<JointProcess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;