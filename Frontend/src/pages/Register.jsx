import React, { useState } from 'react';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [DoB, setDoB] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          confirm_password: confirmPassword,
          firstname,
          lastname,
          DoB,
          phone,
          email,
          address
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  const handleShowHidePassword = () => {
    setIsShowPassword(!isShowPassword);
  };

  return (
    <Helmet title="Đăng ký">
      <section className="login-section">
        <Container className="login-container">
          <div className="login-box">
            <div className="chat-logo">Chat AI</div>
            <h2>Đăng ký</h2>
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
                <Input
                  type="text"
                  placeholder="Tên"
                  className="login-input"
                  value={firstname}
                  onChange={(event) => setFirstname(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="text"
                  placeholder="Họ"
                  className="login-input"
                  value={lastname}
                  onChange={(event) => setLastname(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="date"
                  placeholder="Ngày sinh"
                  className="login-input"
                  value={DoB}
                  onChange={(event) => setDoB(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="text"
                  placeholder="Số điện thoại"
                  className="login-input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="email"
                  placeholder="Email"
                  className="login-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="text"
                  placeholder="Địa chỉ"
                  className="login-input"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
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
              <FormGroup>
                <Input
                  type={isShowPassword ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu"
                  className="login-input"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </FormGroup>
              <Button type="submit" className="login-button" block>ĐĂNG KÝ</Button>
              {error && <div className="error">{error}</div>}
            </Form>
            <div className="create-account-container">
              Đã có tài khoản? <Link to="/login" className="create-account-link">ĐĂNG NHẬP</Link>
            </div>
          </div>
        </Container>
      </section>
    </Helmet>
  );
};

export default Register;
