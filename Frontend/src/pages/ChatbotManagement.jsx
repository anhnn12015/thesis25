import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';
import '../../styles/Admin/chatbotmanagement.css';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const ChatbotManagement = () => {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [category, setCategory] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [data, setData] = useState([
    { id: 1, name: 'Tài liệu Thuế 1', category: 'thuế' },
    { id: 2, name: 'Tài liệu Khoản vay 1', category: 'khoản vay' },
    { id: 3, name: 'Tài liệu Thanh toán 1', category: 'thanh toán' },
    { id: 4, name: 'Tài liệu Thuế 2', category: 'thuế' },
    { id: 5, name: 'Tài liệu Khoản vay 2', category: 'khoản vay' },
  ]);
  useEffect(() => {
    fetchData();
    fetchActivityLog();
  }, []);
  const [dataSummary, setDataSummary] = useState({
    total: 5,
    categories: {
      'thuế': 2,
      'khoản vay': 2,
      'thanh toán': 1
    }
  });
  const fetchActivityLog = async () => {
    const response = await axios.get('http://localhost:8080/pdf/activities');
    setActivityLog(response.data);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handleUpload = async () => {
    if (!file || !category) {
        setUploadMessage('Vui lòng chọn tệp và loại tài liệu');
        return;
    }

    const formData = new FormData();
    formData.append('file', file); // Make sure 'file' matches the key expected by the backend
    formData.append('category', category); // Ensure this also matches the backend expectation

    // Get JWT from local storage or your state management solution
    const token = localStorage.getItem('token');

    try {
        const response = await axios.post('http://localhost:8080/pdf/pdf', formData, { 
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`  // Add token to request headers
            }
        });

        setUploadMessage(`Tải lên thành công: ${response.data.filename}.`);
        fetchDataSummary(); // Assuming you have a function to refresh data
        // Add to activity log
    } catch (error) {
        console.error('Lỗi khi tải lên tệp:', error.response ? error.response.data : 'Server error');
        setUploadMessage('Lỗi khi tải lên tệp. Vui lòng thử lại.');
    }
};



  const fetchDataSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/data/summary');
      setDataSummary(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tóm tắt:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/pdf/pdfs/${id}`); // Adjust the URL based on your setup
      fetchData(); // Refresh data after deletion
      const deletedItem = data.find(item => item.id === id);
      setActivityLog([...activityLog, { id: Date.now(), action: `Xóa ${deletedItem.name}`, timestamp: new Date().toLocaleString() }]);
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };
  

  const pieData = {
    labels: Object.keys(dataSummary.categories),
    datasets: [{
      data: Object.values(dataSummary.categories),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  };

  useEffect(() => {
    // fetchDataSummary(); // Uncomment when integrating with backend
  }, []);



  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/pdf/pdfs'); // Adjust the URL based on your setup
      setData(response.data); // Assuming the response has the data directly
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Dependency array is empty to only run once on mount

  return (
    <div className="content-container">
      <Sidebar />
      <div className="content">
        <h2>Quản lý Chatbot</h2>
        
        <div className="upload-section">
          <h3>Cập nhật Dữ liệu cho Chatbot</h3>
          <div className="upload-form">
            <select onChange={handleCategoryChange}>
              <option value="">Chọn loại tài liệu</option>
              <option value="thuế">Thuế</option>
              <option value="khoản vay">Khoản vay</option>
              <option value="thanh toán">Thanh toán</option>
              {/* Add more categories as needed */}
            </select>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Tải lên</button>
          </div>
          {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
        </div>

        <div className="control-section">
          <h3>Kiểm soát Dữ liệu</h3>
          <div className="data-table">
            {data.map((item) => (
              <div key={item.id} className="data-item">
                <p>Tên file: {item.filename}</p> {/* Hiển thị tên file */}
                <p>Loại tài liệu: {item.typefile}</p> {/* Hiển thị loại tài liệu */}
                <p>Thời gian tải lên: {item.upload_time}</p> {/* Hiển thị thời gian tải lên */}
                <button onClick={() => handleDelete(item.id)}>Xóa</button>
              </div>
            ))}
          </div>


        </div>

        <div className="chart-section">
          <h3>Tóm tắt Dữ liệu</h3>
          <div className="chart-container">
            <Pie data={pieData} />
          </div>
          <p>Tổng số Dữ liệu: {dataSummary.total}</p>
        </div>

        <div className="activity-log-section">
          <h3>Nhật ký Hoạt động</h3>
          <div className="activity-log">
            {activityLog.map(log => (
              <div key={log.id} className="log-item">
                <p>{log.action} - {log.pdf_filename}</p>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotManagement;
