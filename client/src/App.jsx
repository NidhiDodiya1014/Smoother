import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Home from "./pages/home";
import AddSong from "./pages/addSong";
import Navbar from "./components/navbar";
import Current from "./pages/current";
import GlobalPlayer from "./components/GlobalPlayer";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-song" element={<AddSong />} />
        <Route path="/current" element={<Current />} />
      </Routes>

      <GlobalPlayer />
    </Router>
  );
}

export default App;
