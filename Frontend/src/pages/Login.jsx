import React, { useState } from 'react';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';

const Login = () => {
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
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('access_token', data.access_token);
        navigate('/chatbot'); // Thay thế history.push bằng navigate
      } else {
        if (data.error === 'User not found') {
          setError('Người dùng không có tài khoản. Vui lòng đăng ký.');
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
    <Helmet title="Đăng nhập">
      <section className="login-section">
        <Container className="login-container">
          <div className="login-box">
            <div className="chat-logo">Chat AI</div>
            <h2>Đăng nhập</h2>
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
                    className="show-password" 
                    onClick={handleShowHidePassword}
                  >
                    👁
                  </Button>
                </div>
              </FormGroup>
              <div className="forgot-password">
                <Link to="/home">Quên mật khẩu?</Link>
              </div>
              <Button type="submit" className="login-button" block>ĐĂNG NHẬP</Button>
              {error && <div className="error">{error}</div>}
            </Form>
            <div className="create-account-container">
              Chưa có tài khoản? <Link to="#" className="create-account-link">TẠO TÀI KHOẢN</Link>
            </div>
          </div>
        </Container>
      </section>
    </Helmet>
  );
};

export default Login;



