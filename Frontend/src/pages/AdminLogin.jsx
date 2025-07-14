import React, { useState } from 'react';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
// import logo from '../assets/all-images/bank (2).png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        const { admin_id, access_token, roleID } = data;

        // Check roleID for admin
        if (roleID === 0) {
          localStorage.setItem('admin_id', admin_id);
          localStorage.setItem('admin_token', access_token);
          navigate('/admin/dashboard');
        } else {
          setError('Bạn không có quyền truy cập trang quản trị.');
        }
      } else {
        if (data.error === 'Admin not found') {
          setError('Quản trị viên không tồn tại. Vui lòng kiểm tra lại.');
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        }
      }
    } catch (error) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  const handleShowHidePassword = () => {
    setIsShowPassword(!isShowPassword);
  };

  return (
    <Helmet title="Đăng nhập quản trị">
      <section className="login-section">
        <Container className="login-container">
          <div className="login-box">
            <div className="chat-logo">

            </div>
            <h2>Đăng nhập quản trị</h2>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Input 
                  type="text" 
                  placeholder="Tên đăng nhập" 
                  className="login-input" 
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <div className="password-container">
                  <Input 
                    type={isShowPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu" 
                    className="login-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <Button 
                    type="button" 
                    className="show-password btn btn-secondary" 
                    onClick={handleShowHidePassword}
                  >
                    👁
                  </Button>
                </div>
              </FormGroup>
              <Button type="submit" className="login-button btn btn-dark d-block w-100" block>ĐĂNG NHẬP</Button>
              {error && <div className="error">{error}</div>}
            </Form>
          </div>
        </Container>
      </section>
    </Helmet>
  );
};

export default AdminLogin;
