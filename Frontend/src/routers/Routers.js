import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Chatbot from "../pages/Chatbot";
import Register from "../pages/Register";
import AdminLogin from "../pages/Admin/AdminLogin";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import UserManagement from "../pages/Admin/UserManagement";
import ChatbotManagement from "../pages/Admin/ChatbotManagement";
import Settings from "../pages/Admin/Setting";
import Statistics from "../pages/Admin/Statistic";
import ChatResponse from "../pages/Admin/ChatResponse";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/chatbot/c/:conversationId" element={<Chatbot />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/dashboard/usermanagement" element={<UserManagement/>} />
        <Route path="/admin/dashboard/chatbotmanagement" element={<ChatbotManagement/>} />
        <Route path="/admin/dashboard/chatbotresponse" element={<ChatResponse />} />
        <Route path="/admin/dashboard/settings" element={< Settings/>} />
        <Route path="/admin/dashboard/statistic" element={<Statistics />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Routers;
