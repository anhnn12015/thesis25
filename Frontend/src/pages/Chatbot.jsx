import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
import { useNavigate } from 'react-router-dom';
import '../styles/chatbot.css';
// import { FaUser } from 'react-icons/fa';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messageListRef = useRef(null);
    const navigate = useNavigate();

    // Check for token on component mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // Function to format time
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Handle user message submission
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
                    body: JSON.stringify({ query: input })
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

    // Ensure scrolling to bottom when new messages are added
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
                        <button className="chatbot-sidebar-button new-chat">+ NEW CHAT</button>
                        <div className="chatbot-history">
                            <h3>History</h3>
                            <div className="history-content">
                                {/* History content goes here */}
                            </div>
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
                            <button className="user-icon-button" onClick={() => navigate('/useredit')}>
                                <img src='C:/thesis/React-Car-Rental-Website/src/assets/all-images/user.png' alt="User Icon"></img>
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





// import React, { useState, useEffect, useRef } from 'react';
// import { Container, Form, FormGroup, Input, Button } from 'reactstrap';
// import Helmet from '../components/Helmet/Helmet';
// import { useNavigate } from 'react-router-dom';
// import '../styles/chatbot.css';
// // import { FaUser } from 'react-icons/fa';

// const Chatbot = () => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState('');
//     const [loading, setLoading] = useState(false);
//     const messageListRef = useRef(null);
//     const navigate = useNavigate();

//     // Check for token on component mount
//     useEffect(() => {
//         const token = localStorage.getItem('access_token');
//         if (!token) {
//             navigate('/login');
//         }
//     }, [navigate]);

//     // Handle user logout
//     const handleLogout = () => {
//         localStorage.removeItem('access_token');
//         navigate('/login');
//     };

//     // Xử lý khi người dùng gửi tin nhắn
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (input.trim()) {
//             const userMessage = { text: input, fromUser: true };
//             setMessages(prevMessages => [...prevMessages, userMessage]);
//             setInput('');

//             try {
//                 setLoading(true);
//                 const response = await fetch('http://localhost:8080/ask_pdf', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                     },
//                     body: JSON.stringify({ query: input })
//                 });
//                 const data = await response.json();

//                 if (response.ok) {
//                     const answer = data.answer;
//                     let botMessage = '';
//                     for (let i = 0; i < answer.length; i++) {
//                         await new Promise(resolve => setTimeout(resolve, 100));
//                         botMessage += answer[i];
//                         setMessages(prevMessages => {
//                             const lastMessage = prevMessages[prevMessages.length - 1];
//                             if (!lastMessage.fromUser) {
//                                 return [...prevMessages.slice(0, -1), { text: botMessage, fromUser: false }];
//                             }
//                             return [...prevMessages, { text: botMessage, fromUser: false }];
//                         });
//                     }
//                 } else {
//                     console.error('Request failed with status:', response.status);
//                 }

//                 setLoading(false);
//             } catch (error) {
//                 console.error('Error:', error);
//                 setLoading(false);
//             }
//         }
//     };

//     // Đảm bảo cuộn xuống cuối khi có tin nhắn mới
//     useEffect(() => {
//         if (messageListRef.current) {
//             messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
//         }
//     }, [messages]);

//     return (
//         <Helmet title="Chatbot">
//             <section className="chatbot-section">
//                 <Container className="chatbot-container">
//                     <div className="chatbot-sidebar">
//                         <button className="chatbot-sidebar-button new-chat">+ NEW CHAT</button>
//                         <div className="chatbot-history">
//                             <h3>History</h3>
//                             <div className="history-content">
//                                 {/* History content goes here */}
//                             </div>
//                         </div>
//                         <div className="chatbot-sidebar-bottom">
//                             <button className="chatbot-sidebar-button support">SUPPORT</button>
//                             <button className="chatbot-sidebar-button rate-app">RATE APP</button>
//                             <button className="chatbot-sidebar-button logout" onClick={handleLogout}>LOG OUT</button>
//                         </div>
//                     </div>
//                     <div className="chatbot">
//                         <div className="chatbot-header">
//                             <h2>Chatbot</h2>
//                             <button className="user-icon-button" onClick={() => navigate('/useredit')}>
//                                 <img src='C:/thesis/React-Car-Rental-Website/src/assets/all-images/user.png'></img>
//                             </button>
//                         </div>
//                         <div className="chatbot-messages" ref={messageListRef}>
//                             {messages.map((message, index) => (
//                                 <div
//                                     key={index}
//                                     className={`message ${message.fromUser ? 'user-message' : 'bot-message'}`}
//                                 >
//                                     <div className="message-content">
//                                         {message.text}
//                                     </div>
//                                     <div className="message-info">
//                                         <span className="message-time">12:34 PM</span>
//                                         <span className="message-sender">{message.fromUser ? 'You' : 'Bot'}</span>
//                                     </div>
//                                 </div>
//                             ))}
//                             {loading && (
//                                 <div className="message bot-message">
//                                     <p>...</p>
//                                 </div>
//                             )}
//                         </div>
//                         <Form onSubmit={handleSubmit} className="chatbot-form">
//                             <FormGroup className="chatbot-input">
//                                 <Input
//                                     type="text"
//                                     placeholder="Type your message..."
//                                     value={input}
//                                     onChange={(e) => setInput(e.target.value)}
//                                     required
//                                 />
//                             </FormGroup>
//                             <Button type="submit" className="chatbot-send">
//                                 Send
//                             </Button>
//                         </Form>
//                     </div>
//                 </Container>
//             </section>
//         </Helmet>
//     );
// };

// export default Chatbot;








