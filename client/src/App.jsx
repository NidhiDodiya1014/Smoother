import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/home";
import AddSong from "./pages/addSong";
import Navbar from "./components/navbar";
import Current from "./pages/current";
import GlobalPlayer from "./components/GlobalPlayer";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import { ToastProvider } from "./contexts/ToastContext";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

function App() {
  return (
    <ToastProvider>
      <Router>

        <Navbar />

        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={isAuthenticated() ? <Home /> : <Navigate to="/login" />}
          />

          <Route
            path="/add-song"
            element={isAuthenticated() ? <AddSong /> : <Navigate to="/login" />}
          />

          <Route
            path="/current"
            element={isAuthenticated() ? <Current /> : <Navigate to="/login" />}
          />

          <Route
            path="/profile"
            element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />}
          />

        </Routes>

        <GlobalPlayer />

      </Router>
    </ToastProvider>
  );
}

export default App;