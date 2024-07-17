import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Admin/sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faComment, faReply, faChartBar, faCog } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const location = useLocation();
  const basePath = location.pathname.split('/').slice(0, 3).join('/');

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <Link to="/admin/dashboard" className="sidebar-title">
          <FontAwesomeIcon icon={faHome} className="sidebar-icon" />
          <a>Dashboard</a>
        </Link>
      </header>
      <ul className="sidebar-menu">
        <li>
          <Link to={`${basePath}/usermanagement`}>
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            <span>Quản lý người dùng</span>
          </Link>
        </li>
        <li>
          <Link to={`${basePath}/chatbotmanagement`}>
            <FontAwesomeIcon icon={faComment} className="sidebar-icon" />
            <span>Quản lý chatbot</span>
          </Link>
        </li>
        <li>
          <Link to={`${basePath}/botresponse`}>
            <FontAwesomeIcon icon={faReply} className="sidebar-icon" />
            <span>Câu trả lời của bot</span>
          </Link>
        </li>
        <li>
          <Link to={`${basePath}/statistics`}>
            <FontAwesomeIcon icon={faChartBar} className="sidebar-icon" />
            <span>Thống kê</span>
          </Link>
        </li>
        <li>
          <Link to={`${basePath}/settings`}>
            <FontAwesomeIcon icon={faCog} className="sidebar-icon" />
            <span>Cài đặt</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
