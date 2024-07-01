import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Chatbot from "../pages/Chatbot";
import Register from "../pages/Register";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Routers;
