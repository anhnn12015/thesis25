import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, FormGroup, Input, Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/chatbot.css';
import axios from 'axios';

import api from '../axiosConfig';

import logouser from '../assets/all-images/user (2) (1).png'

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const messageListRef = useRef(null);
    const navigate = useNavigate();
    const { conversationId } = useParams();
    // Delete
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        } else {
            fetchHistory(token);
            if (conversationId) {
                fetchConversation(conversationId);
            }
        }
    }, [navigate, conversationId]);

    useEffect(() => {
        console.log('Updated Messages:', messages); 
    }, [messages]);

    const fetchHistory = async (token) => {
        try {
            const response = await fetch('http://localhost:8080/user/conversations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
            console.log('Fetched History:', data);  
    
            if (response.ok) {
                setHistory(data);
            } else {
                console.error('Failed to fetch history:', response.status);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchConversation = async (conversationId) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8080/user/conversations/${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
            console.log('Fetched Conversation:', data);  
    
            if (response.ok) {
                // setMessages(data.chat_history);
                const formattedMessages = [];
            let lastDate = null;

            data.chat_history.forEach((item) => {
                const messageDate = new Date(item.timestamp).toLocaleDateString();

                if (messageDate !== lastDate) {
                    formattedMessages.push({
                        isDateSeparator: true,
                        date: messageDate
                    });
                    lastDate = messageDate;
                }

                formattedMessages.push({
                    fromUser: true,
                    text: item.question,
                    timestamp: item.timestamp
                });

                formattedMessages.push({
                    fromUser: false,
                    text: item.answer,
                    timestamp: item.timestamp
                });
            });

            setMessages(formattedMessages);
            } else {
                console.error('Failed to fetch conversation:', response.status);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const handleNewChat = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch('http://localhost:8080/user/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
            console.log('Created New Chat:', data);  
    
            if (response.ok) {
                const { conversation_id } = data;
                navigate(`/chatbot/c/${conversation_id}`);
                fetchConversation(conversation_id); // Lấy lịch sử cuộc trò chuyện mới tạo
            } else {
                console.error('Failed to create new conversation:', response.status);
            }
        } catch (error) {
            console.error('Error creating new conversation:', error);
        }
    };

    const handleLogout = async () => {
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/login');
                return;
            }
    
            // Gọi API để đăng xuất
            const response = await axios.post(
                'http://localhost:8080/user/logout',
                {}, // Dữ liệu gửi đi
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            if (response.status === 200) {
                // Xóa token khỏi localStorage
                localStorage.removeItem('access_token');
    
                // Điều hướng về trang đăng nhập
                navigate('/login');
            } else {
                console.error('Logout failed:', response.status);
            }
        } catch (error) {
            console.error('Logout failed:', error.response ? error.response.data : error.message);
            // Xử lý lỗi nếu cần
        }
    };
    

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim()) {
            const userMessage = { text: input, fromUser: true, timestamp: new Date() };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            setInput('');
    
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8080/ai/ask_pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({ query: input, conversation_id: conversationId }) // Sử dụng conversationId từ useParams
                });
                const data = await response.json();
    
                if (response.ok) {
                    const answer = data.answer;
                    let botMessage = '';
                    for (let i = 0; i < answer.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 40));
                        botMessage += answer[i];
                        setMessages(prevMessages => {
                            const lastMessage = prevMessages[prevMessages.length - 1];
                            if (!lastMessage.fromUser) {
                                return [...prevMessages.slice(0, -1), { text: botMessage, fromUser: false, timestamp: new Date() }];
                            }
                            return [...prevMessages, { text: botMessage, fromUser: false, timestamp: new Date() }];
                        });
                    }
                } else {
                    console.error('Request failed with status:', response.status);
                }
    
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setLoading(false);
            }
        }
    };

    const togglePopover = (conversationId) => {
        if (popoverOpen === conversationId) {
            setPopoverOpen(null);
        } else {
            setPopoverOpen(conversationId);
        }
    };

    const handleDeleteConversation = async () => {
        if (popoverOpen !== null) {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch(`http://localhost:8080/user/conversations/${popoverOpen}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
        
                if (response.ok) {
                    const updatedHistory = history.filter(conversation => conversation.conversation_id !== popoverOpen);
                    setHistory(updatedHistory);
                    console.log(`Deleting conversation ${popoverOpen}`);
                    setPopoverOpen(null); // Đóng popover sau khi xử lý xong
                } else {
                    console.error('Failed to delete conversation:', response.status);
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        }
    };

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Helmet title="Chatbot">
            <section className="chatbot-section">
                <img src="C:/thesis/React-Car-Rental-Website/src/assets/all-images/bg.jpg" alt="" />
                <Container className="chatbot-container">
                    <div className="chatbot-sidebar">
                        <button className="chatbot-sidebar-button new-chat" onClick={handleNewChat}>+ NEW CHAT</button>
                        <div className="history-content">
                            {history.length === 0 ? (
                                <p>No conversation history found.</p>
                            ) : (
                                history.map((conversation, index) => (
                                    <div key={index} className="conversation-item">
                                        <div className="conversation-header">
                                            <button 
                                                className="conversation-title"
                                                onClick={() => navigate(`/chatbot/c/${conversation.conversation_id}`)}
                                            >
                                                <h4>Conversation {index + 1}</h4>
                                                {/* <p>Started at: {new Date(conversation.created_at).toLocaleString()}</p> */}
                                            </button>
                                            <Button id={`popover-${index}`} type="button" onClick={() => togglePopover(conversation.conversation_id)}>
                                                &#8285;
                                            </Button>
                                            <Popover
                                                placement="bottom"
                                                isOpen={popoverOpen === conversation.conversation_id}
                                                target={`popover-${index}`}
                                                toggle={() => togglePopover(conversation.conversation_id)}
                                            >
                                                <PopoverHeader>Options</PopoverHeader>
                                                <PopoverBody>
                                                    <button className="dropdown-item" onClick={handleDeleteConversation}>Delete</button>
                                                    {/* Thêm các lựa chọn khác vào đây nếu cần */}
                                                </PopoverBody>
                                            </Popover>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="chatbot-sidebar-bottom">
                            <button className="chatbot-sidebar-button support">SUPPORT</button>
                            <button className="chatbot-sidebar-button rate-app">RATE APP</button>
                            <button className="chatbot-sidebar-button logout" onClick={handleLogout}>LOG OUT</button>
                        </div>
                    </div>
                    <div className="chatbot">
                        <div className="chatbot-header">
                            <h2>Chatbot</h2>
                            <button className="user-icon-button" onClick={() => navigate('/edit-user')}>
                                {/* <img src={logouser} alt="User logo" /> */}
                                <i class="fa-solid fa-user"></i>
                            </button>
                        </div>
                        <div className="chatbot-messages" ref={messageListRef}>
                                {messages.map((message, index) => {
                                    if (message.isDateSeparator) {
                                        return (
                                            <div key={index} className="date-separator">
                                                {message.date}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div
                                                key={index}
                                                className={`message ${message.fromUser ? 'user-message' : 'bot-message'}`}
                                            >
                                                <div className="message-content">
                                                    {message.text}
                                                </div>
                                                <div className="message-info">
                                                    <span className="message-time">{formatTime(new Date(message.timestamp))}</span>
                                                    <span className="message-sender">{message.fromUser ? 'You' : 'Bot'}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                                {loading && (
                                    <div className="message bot-message">
                                        <p>...</p>
                                    </div>
                                )}
                            </div>

                        <Form onSubmit={handleSubmit} className="chatbot-form">
                            <FormGroup className="chatbot-input">
                                <Input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    required
                                />
                            </FormGroup>
                            <Button type="submit" className="chatbot-send">
                                Send
                            </Button>
                        </Form>
                    </div>
                </Container>
            </section>
        </Helmet>
    );
};

export default Chatbot;
