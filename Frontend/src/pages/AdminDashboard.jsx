import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Helmet from '../../components/Helmet/Helmet';
import Sidebar from './Sidebar';
import axios from 'axios';
import { WiDaySunny, WiCloudy, WiRain } from 'react-icons/wi';
import '../../styles/Admin/dashboard.css';

const AdminDashboard = () => {
  const [weather, setWeather] = useState([]);
  const [weatherImages, setWeatherImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = '4778f1e9c8c830918eed745a99a551f8';
      const city = 'Hanoi'; // Replace with your city
      const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

      try {
        const response = await axios.get(apiUrl);
        const dailyWeather = response.data.list.filter((_, index) => index % 8 === 0).slice(0, 7);
        setWeather(dailyWeather);

        // Fetch weather images from Google Custom Search API
        const weatherDescriptions = dailyWeather.map(day => day.weather[0].description);
        const googleApiKey = 'AIzaSyChZis0fc9Xo9ecBdcDy879GjuAA_0WFP0';
        const googleSearchEngineId = 'd14d30a59e2c648b2';
        const imagePromises = weatherDescriptions.map(description => {
          const googleUrl = `https://www.googleapis.com/customsearch/v1?q=${description}+weather&cx=${googleSearchEngineId}&key=${googleApiKey}&searchType=image&num=1`;
          return axios.get(googleUrl);
        });

        const imageResponses = await Promise.all(imagePromises);
        const images = imageResponses.map(response => response.data.items[0].link);
        setWeatherImages(images);
      } catch (error) {
        console.error('Error fetching weather or image:', error);
      }
    };

    fetchWeather();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:8080/user/logout',
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        localStorage.removeItem('access_token');
        navigate('/admin/login');
      } else {
        console.error('Logout failed:', response.status);
      }
    } catch (error) {
      console.error('Logout failed:', error.response ? error.response.data : error.message);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getWeatherIcon = (description) => {
    if (description.includes('clear')) {
      return <WiDaySunny size={50} />;
    } else if (description.includes('clouds')) {
      return <WiCloudy size={50} />;
    } else if (description.includes('rain')) {
      return <WiRain size={50} />;
    } else {
      return null;
    }
  };

  return (
    <Helmet title="Bảng điều khiển quản trị">
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-content">
          <div className="header">
            <h1>Chào mừng đến bảng điều khiển quản trị</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          <div className="info-cards">
            <div className="info-card conversations">
              <h3>Total Conversations</h3>
              <p>1234</p>
            </div>
            <div className="info-card unresolved">
              <h3>Unresolved Issues</h3>
              <p>12</p>
            </div>
            <div className="info-card chatbot-status">
              <h3>Chatbot Status</h3>
              <p>Active</p>
            </div>
          </div>
          <div className="today-info">
            <div className="weather-card">
              <h2>Hôm nay là {currentDate}</h2>
              <div className="weather">
                {weather.length > 0 && weather.map((day, index) => (
                  <div
                    key={index}
                    className={`weather-day ${index === 0 ? 'today' : ''}`}
                    style={{ backgroundImage: `url(${weatherImages[index]})` }}
                  >
                    <p>{new Date(day.dt_txt).toLocaleDateString('vi-VN', { weekday: 'long' })}</p>
                    {getWeatherIcon(day.weather[0].description)}
                    <p>{day.main.temp}°C - {day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="performance-card">
              <h2>Performance History</h2>
              <p>The best performance: +45.2%</p>
              <p>Worst performance: -35.3%</p>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </Helmet>
  );
};

export default AdminDashboard;
