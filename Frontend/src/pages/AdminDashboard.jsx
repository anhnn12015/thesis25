import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Helmet from '../../components/Helmet/Helmet';
import Sidebar from './Sidebar';
import { WiDaySunny, WiCloudy, WiRain, WiCloud } from 'react-icons/wi';
import axios from 'axios';
import '../../styles/Admin/dashboard.css';

const AdminDashboard = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = '4778f1e9c8c830918eed745a99a551f8';
      const city = 'Hanoi'; // Replace with your city
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
      
      try {
        const response = await axios.get(apiUrl);
        setWeather(response.data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const WeatherIcon = () => {
    if (!weather) return null;

    const weatherId = weather.weather[0].id;
    if (weatherId >= 200 && weatherId < 300) {
      return <WiRain />;
    } else if (weatherId >= 300 && weatherId < 600) {
      return <WiCloudy />;
    } else {
      return <WiDaySunny />;
    }
  };

  return (
    <Helmet title="Bảng điều khiển quản trị">
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-content">
          <h1>Chào mừng đến bảng điều khiển quản trị</h1>
          <div className="today-info">
            <h2>Hôm nay là {currentDate}</h2>
            <div className="weather">
              <WeatherIcon />
              <p>{weather && `${weather.main.temp}°C - ${weather.weather[0].description}`}</p>
            </div>
          </div>
          {/* Thêm các thành phần khác vào đây */}
          <Outlet />
        </main>
      </div>
    </Helmet>
  );
};

export default AdminDashboard;
