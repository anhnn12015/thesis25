import React, { useState } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';
import '../../styles/Admin/chatbotmanagement.css';

const ChatbotManagement = () => {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        alert('Please select a file');
        return;
      }

      const formData = new FormData();
      formData.append('a', file);

      const response = await axios.post('http://localhost:5000/pdf/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadMessage(`Uploaded ${response.data.filename} successfully.`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage('Error uploading file. Please try again.');
    }
  };

  return (
    <div className="content-container">
      <Sidebar />
      <div className="content">
        <h2>Quản lý chat</h2>
        <div className="upload-form">
          <div className="upload-header">
            <h3>Upload PDF</h3>
          </div>
          <div className="upload-body">
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
          </div>
          <div className="upload-footer">
            {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotManagement;
