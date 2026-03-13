import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import AdFeedPage from "./pages/AdFeedPage";
import EventLogPage from "./pages/EventLogPage";
import ExperimentPage from "./pages/ExperimentPage";
import AdManagerPage from "./pages/AdManagerPage";
import CtrPredictionPage from "./pages/CtrPredictionPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/feed" element={<AdFeedPage />} />
        <Route path="/events" element={<EventLogPage />} />
        <Route path="/experiments" element={<ExperimentPage />} />
        <Route path="/ads/manage" element={<AdManagerPage />} />
        <Route path="/ctr" element={<CtrPredictionPage />} />
      </Routes>
    </>
  );
}

export default App;