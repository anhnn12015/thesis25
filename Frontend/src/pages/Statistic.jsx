import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../../styles/Admin/statistic.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [data, setData] = useState({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [date, setDate] = useState(new Date());
  
  useEffect(() => {
    fetchData();
    fetchTotalQuestions();
  }, [date]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/ai/field_statistics'); // Thay thế URL với API endpoint của bạn
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchTotalQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:8080/ai/field_statistics/total'); // Thay thế URL với API endpoint của bạn
      setTotalQuestions(response.data.total_questions);
    } catch (error) {
      console.error('Error fetching total questions:', error);
    }
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const labels = Object.keys(data);
  const questionCounts = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Question Count',
        data: questionCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.7)',
        hoverBorderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Question Count by Field',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#555', // Color for Y-axis labels
        },
      },
      x: {
        ticks: {
          color: '#555', // Color for X-axis labels
        },
      },
    },
  };

  return (
    <div className='statistic-container'>
      <Sidebar />
      <div className='statistic-main'>
        <h1>Statistics Page</h1>
        <div className='date-picker'>
          <label htmlFor='date'>Choose a date: </label>
          <input 
            type='date' 
            id='date' 
            value={format(date, 'yyyy-MM-dd')} 
            onChange={handleDateChange} 
          />
        </div>
        <div className='total-questions'>
          <h2>Total Questions: {totalQuestions}</h2>
        </div>
        <div className='chart-container'>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
