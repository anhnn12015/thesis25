import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const messageListRef = useRef(null);
    const navigate = useNavigate();
    const { conversationId } = useParams();

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
                setMessages(data.chat_history);
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
            } else {
                console.error('Failed to create new conversation:', response.status);
            }
        } catch (error) {
            console.error('Error creating new conversation:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
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
                        await new Promise(resolve => setTimeout(resolve, 100));
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

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Helmet title="Chatbot">
            <section className="chatbot-section">
                <Container className="chatbot-container">
                    <div className="chatbot-sidebar">
                        <button className="chatbot-sidebar-button new-chat" onClick={handleNewChat}>+ NEW CHAT</button>
                        <div className="history-content">
                            {history.length === 0 ? (
                                <p>No conversation history found.</p>
                            ) : (
                                history.map((conversation, index) => (
                                    <button 
                                        key={index} 
                                        className="conversation-title"
                                        onClick={() => navigate(`/chatbot/c/${conversation.conversation_id}`)}
                                    >
                                        <h4>Conversation {index + 1}</h4>
                                        <p>Started at: {new Date(conversation.created_at).toLocaleString()}</p>
                                    </button>
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
                                <img src='C:/thesis/React-Car-Rental-Website/src/assets/all-images/user.png' alt="User Icon" />
                                👁
                            </button>
                        </div>
                        <div className="chatbot-messages" ref={messageListRef}>
                            {messages.map((message, index) => (
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
                            ))}
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






