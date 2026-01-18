import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import AddSong from "./pages/addSong";
import Navbar from "./components/navbar";
import Current from "./pages/current";

function App() {
  const [queue, setQueue] = useState([]);

  const addToQueue = (song) => {
    setQueue(prev => {
      if (prev.find(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  };

  const removeFromQueue = (id) => {
    setQueue(prev => prev.filter(song => song._id !== id));
  };

  const clearQueue = () => setQueue([]);

  return (
    <Router>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home addToQueue={addToQueue} queue={queue} />}
        />
        <Route path="/add-song" element={<AddSong />} />
        <Route
          path="/current"
          element={<Current queue={queue} removeFromQueue={removeFromQueue} clearQueue={clearQueue} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
