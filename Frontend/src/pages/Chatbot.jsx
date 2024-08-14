// import React, { useState, useEffect, useRef } from 'react';
// import { Container, Form, FormGroup, Input, Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
// import Helmet from '../components/Helmet/Helmet';
// import { useNavigate, useParams } from 'react-router-dom';
// import '../styles/chatbot.css';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';

// import api from '../axiosConfig';

// import logouser from '../assets/all-images/user (2) (1).png'

// const Chatbot = () => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [history, setHistory] = useState([]);
//     const messageListRef = useRef(null);
//     const navigate = useNavigate();
//     const { conversationId } = useParams();
//     // Delete
//     const [popoverOpen, setPopoverOpen] = useState(false);

//     useEffect(() => {
//         const token = localStorage.getItem('access_token');
//         if (!token) {
//             navigate('/login');
//         } else {
//             fetchHistory(token);
//             if (conversationId) {
//                 fetchConversation(conversationId);
//             }
//         }
//     }, [navigate, conversationId]);

//     useEffect(() => {
//         console.log('Updated Messages:', messages); 
//     }, [messages]);

//     const fetchHistory = async (token) => {
//         try {
//             const response = await fetch('http://localhost:8080/user/conversations', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Fetched History:', data);  
    
//             if (response.ok) {
//                 setHistory(data);
//             } else {
//                 console.error('Failed to fetch history:', response.status);
//             }
//         } catch (error) {
//             console.error('Error fetching history:', error);
//         }
//     };

//     const fetchConversation = async (conversationId) => {
//         const token = localStorage.getItem('access_token');
//         try {
//             const response = await fetch(`http://localhost:8080/user/conversations/${conversationId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Fetched Conversation:', data);  
    
//             if (response.ok) {
//                 // setMessages(data.chat_history);
//                 const formattedMessages = [];
//             let lastDate = null;

//             data.chat_history.forEach((item) => {
//                 const messageDate = new Date(item.timestamp).toLocaleDateString();

//                 if (messageDate !== lastDate) {
//                     formattedMessages.push({
//                         isDateSeparator: true,
//                         date: messageDate
//                     });
//                     lastDate = messageDate;
//                 }

//                 formattedMessages.push({
//                     fromUser: true,
//                     text: item.question,
//                     timestamp: item.timestamp
//                 });

//                 formattedMessages.push({
//                     fromUser: false,
//                     text: item.answer,
//                     timestamp: item.timestamp
//                 });
//             });

//             setMessages(formattedMessages);
//             } else {
//                 console.error('Failed to fetch conversation:', response.status);
//             }
//         } catch (error) {
//             console.error('Error fetching conversation:', error);
//         }
//     };

//     const handleNewChat = async () => {
//         const token = localStorage.getItem('access_token');
//         try {
//             const response = await fetch('http://localhost:8080/user/conversations', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Created New Chat:', data);  
    
//             if (response.ok) {
//                 const { conversation_id } = data;
//                 navigate(`/chatbot/c/${conversation_id}`);
//                 fetchConversation(conversation_id); // Lấy lịch sử cuộc trò chuyện mới tạo
//             } else {
//                 console.error('Failed to create new conversation:', response.status);
//             }
//         } catch (error) {
//             console.error('Error creating new conversation:', error);
//         }
//     };

//     const handleLogout = async () => {
//         try {
//             // Lấy token từ localStorage
//             const token = localStorage.getItem('access_token');
            
//             if (!token) {
//                 navigate('/login');
//                 return;
//             }
    
//             // Gọi API để đăng xuất
//             const response = await axios.post(
//                 'http://localhost:8080/user/logout',
//                 {}, // Dữ liệu gửi đi
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );
    
//             if (response.status === 200) {
//                 // Xóa token khỏi localStorage
//                 localStorage.removeItem('access_token');
    
//                 // Điều hướng về trang đăng nhập
//                 navigate('/login');
//             } else {
//                 console.error('Logout failed:', response.status);
//             }
//         } catch (error) {
//             console.error('Logout failed:', error.response ? error.response.data : error.message);
//             // Xử lý lỗi nếu cần
//         }
//     };
    

//     const formatTime = (date) => {
//         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (input.trim()) {
//             const userMessage = { text: input, fromUser: true, timestamp: new Date() };
//             setMessages(prevMessages => [...prevMessages, userMessage]);
//             setInput('');
    
//             try {
//                 setLoading(true);
//                 const response = await fetch('http://localhost:8080/ai/ask_pdf/thanhtoan', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                     },
//                     body: JSON.stringify({ query: input, conversation_id: conversationId }) // Sử dụng conversationId từ useParams
//                 });
//                 const data = await response.json();
    
//                 if (response.ok) {
//                     const answer = data.answer;
//                     let botMessage = '';
//                     for (let i = 0; i < answer.length; i++) {
//                         await new Promise(resolve => setTimeout(resolve, 40));
//                         botMessage += answer[i];
//                         setMessages(prevMessages => {
//                             const lastMessage = prevMessages[prevMessages.length - 1];
//                             if (!lastMessage.fromUser) {
//                                 return [...prevMessages.slice(0, -1), { text: botMessage, fromUser: false, timestamp: new Date() }];
//                             }
//                             return [...prevMessages, { text: botMessage, fromUser: false, timestamp: new Date() }];
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

//     const togglePopover = (conversationId) => {
//         if (popoverOpen === conversationId) {
//             setPopoverOpen(null);
//         } else {
//             setPopoverOpen(conversationId);
//         }
//     };

//     const handleDeleteConversation = async () => {
//         if (popoverOpen !== null) {
//             const token = localStorage.getItem('access_token');
//             try {
//                 const response = await fetch(`http://localhost:8080/user/conversations/${popoverOpen}`, {
//                     method: 'DELETE',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     }
//                 });
        
//                 if (response.ok) {
//                     const updatedHistory = history.filter(conversation => conversation.conversation_id !== popoverOpen);
//                     setHistory(updatedHistory);
//                     console.log(`Deleting conversation ${popoverOpen}`);
//                     setPopoverOpen(null); // Đóng popover sau khi xử lý xong
//                 } else {
//                     console.error('Failed to delete conversation:', response.status);
//                 }
//             } catch (error) {
//                 console.error('Error deleting conversation:', error);
//             }
//         }
//     };

//     useEffect(() => {
//         if (messageListRef.current) {
//             messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
//         }
//     }, [messages]);

//     return (
//         <Helmet title="Chatbot">
//             <section className="chatbot-section">
//                 <img src="C:/thesis/React-Car-Rental-Website/src/assets/all-images/bg.jpg" alt="" />
//                 <Container className="chatbot-container">
//                     <div className="chatbot-sidebar">
//                         <button className="chatbot-sidebar-button new-chat" onClick={handleNewChat}>+ NEW CHAT</button>
//                         <div className="history-content">
//                             {history.length === 0 ? (
//                                 <p>No conversation history found.</p>
//                             ) : (
//                                 history.map((conversation, index) => (
//                                     <div key={index} className="conversation-item">
//                                         <div className="conversation-header">
//                                             <button 
//                                                 className="conversation-title"
//                                                 onClick={() => navigate(`/chatbot/c/${conversation.conversation_id}`)}
//                                             >
//                                                 <h4>Conversation {index + 1}</h4>
//                                                 {/* <p>Started at: {new Date(conversation.created_at).toLocaleString()}</p> */}
//                                             </button>
//                                             <Button id={`popover-${index}`} type="button" onClick={() => togglePopover(conversation.conversation_id)}>
//                                                 &#8285;
//                                             </Button>
//                                             <Popover
//                                                 placement="bottom"
//                                                 isOpen={popoverOpen === conversation.conversation_id}
//                                                 target={`popover-${index}`}
//                                                 toggle={() => togglePopover(conversation.conversation_id)}
//                                             >
//                                                 <PopoverHeader>Options</PopoverHeader>
//                                                 <PopoverBody>
//                                                     <button className="dropdown-item" onClick={handleDeleteConversation}>Delete</button>
//                                                     {/* Thêm các lựa chọn khác vào đây nếu cần */}
//                                                 </PopoverBody>
//                                             </Popover>
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
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
//                             <button className="user-icon-button" onClick={() => navigate('/edit-user')}>
//                                 {/* <img src={logouser} alt="User logo" /> */}
//                                 <i class="fa-solid fa-user"></i>
//                             </button>
//                         </div>
//                         <div className="chatbot-messages" ref={messageListRef}>
//                                 {messages.map((message, index) => {
//                                     if (message.isDateSeparator) {
//                                         return (
//                                             <div key={index} className="date-separator">
//                                                 {message.date}
//                                             </div>
//                                         );
//                                     } else {
//                                         return (
//                                             <div
//                                                 key={index}
//                                                 className={`message ${message.fromUser ? 'user-message' : 'bot-message'}`}
//                                             >
//                                                 <div className="message-content">
//                                                     {message.text}
//                                                 </div>
//                                                 <div className="message-info">
//                                                     <span className="message-time">{formatTime(new Date(message.timestamp))}</span>
//                                                     <span className="message-sender">{message.fromUser ? 'You' : 'Bot'}</span>
//                                                 </div>
//                                             </div>
//                                         );
//                                     }
//                                 })}
//                                 {loading && (
//                                     <div className="message bot-message">
//                                         <p>...</p>
//                                     </div>
//                                 )}
//                             </div>

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

// ____________________________Đoạn 2____________________________________________________________
import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, FormGroup, Input, Button, Popover, PopoverHeader, PopoverBody, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/chatbot.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faMicrophone } from '@fortawesome/free-solid-svg-icons';

import api from '../axiosConfig';
import logouser from '../assets/all-images/user (2) (1).png';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [field, setField] = useState('general'); // State to keep track of the selected field
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const messageListRef = useRef(null);
    const navigate = useNavigate();
    const { conversationId } = useParams();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [modal, setModal] = useState(false); // State to control the modal
    const [feedback, setFeedback] = useState(''); // State to store feedback
    const [feedbackMessages, setFeedbackMessages] = useState([]); // State to store feedback messages

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
                fetchConversation(conversation_id); // Fetch the newly created conversation history
            } else {
                console.error('Failed to create new conversation:', response.status);
            }
        } catch (error) {
            console.error('Error creating new conversation:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/login');
                return;
            }
    
            const response = await axios.post(
                'http://localhost:8080/user/logout',
                {}, // No data needed for logout
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            if (response.status === 200) {
                localStorage.removeItem('access_token');
                navigate('/login');
            } else {
                console.error('Logout failed:', response.status);
            }
        } catch (error) {
            console.error('Logout failed:', error.response ? error.response.data : error.message);
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
                const url = `http://localhost:8080/ai/ask_pdf/${field}`; // Update the API endpoint based on the selected field
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({ query: input, conversation_id: conversationId })
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
                    setPopoverOpen(null); // Close popover after handling
                } else {
                    console.error('Failed to delete conversation:', response.status);
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        }
    };

    const handlePlayAudio = async (text) => {
        try {
            const response = await fetch('http://localhost:8080/ai/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            if (response.ok) {
                const audio = new Audio(data.audio_url);
                audio.play().then(() => {
                    console.log('Audio playing');
                }).catch(error => {
                    console.error('Error playing audio:', error);
                });
            } else {
                console.error('Failed to convert text to speech:', response.status);
            }
        } catch (error) {
            console.error('Error converting text to speech:', error);
        }
    };
    

    const handleMicClick = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
    
                    const audioChunks = [];
                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                    });
    
                    mediaRecorder.addEventListener("stop", () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'recording.wav');
    
                        fetch('http://localhost:8080/ai/stt', {
                            method: 'POST',
                            body: formData
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.hypotheses && data.hypotheses.length > 0) {
                                setInput(data.hypotheses[0].utterance);
                            } else {
                                console.error('Error converting speech to text:', data);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                    });
    
                    // Record for 5 seconds
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 5000);
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                });
        } else {
            console.error('getUserMedia not supported on your browser!');
        }
    };
    
    const toggleModal = () => setModal(!modal);

    const handleSendFeedback = async (feedbackText) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8080/user/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ feedback: feedbackText })
            });
            const data = await response.json();
            if (response.ok) {
                setFeedbackMessages([...feedbackMessages, { text: feedbackText, fromUser: true }]);
                setFeedback('');
            } else {
                console.error('Failed to send feedback:', data.error);
            }
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    };

    const fetchFeedback = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8080/user/feedback', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setFeedbackMessages(data);
            } else {
                console.error('Failed to fetch feedback:', data.error);
            }
        } catch (error) {
            console.error('Error fetching feedback:', error);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, feedbackMessages]);

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
                                                    {/* Add more options here if needed */}
                                                </PopoverBody>
                                            </Popover>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="chatbot-sidebar-bottom">
                            <button className="chatbot-sidebar-button support" onClick={toggleModal}>SUPPORT</button>
                            <button className="chatbot-sidebar-button rate-app">RATE APP</button>
                            <button className="chatbot-sidebar-button logout" onClick={handleLogout}>LOG OUT</button>
                        </div>
                    </div>
                    <div className="chatbot">
                        <div className="chatbot-header">
                            <h2>Chatbot</h2>
                            <button className="user-icon-button" onClick={() => navigate('/edit-user')}>
                                <i className="fa-solid fa-user"></i>
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
                                                <span className="message-sender">
                                                    {message.fromUser ? 'You' : 'Bot'}
                                                    {!message.fromUser && (
                                                        <FontAwesomeIcon
                                                            icon={faVolumeUp}
                                                            className="volume-icon"
                                                            onClick={() => handlePlayAudio(message.text)}
                                                        />
                                                    )}
                                                </span>
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
                                <Input type="select" value={field} onChange={e => setField(e.target.value)}>
                                    <option value="general">General</option>
                                    <option value="the">Thẻ</option>
                                    <option value="baohiem">Bảo Hiểm</option>
                                    <option value="dautu">Đầu Tư</option>
                                    <option value="taikhoan">Tài Khoản</option>
                                    <option value="HSBH">Hồ Sơ Bảo Hiểm</option>

                                </Input>
                                <Input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    required
                                />
                               
                            </FormGroup>
                            <Button type="button" className="chatbot-mic" onClick={handleMicClick}>
                                    <FontAwesomeIcon icon={faMicrophone} />
                                </Button>
                            <Button type="submit" className="chatbot-send">
                                Send
                            </Button>
                        </Form>
                    </div>
                </Container>
            </section>

            <Modal isOpen={modal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Support</ModalHeader>
                <ModalBody>
                    <div className="feedback-messages">
                        {feedbackMessages.map((message, index) => (
                            <div key={index} className={`message ${message.fromUser ? 'user-message' : 'admin-message'}`}>
                                <div className="message-content">{message.text}</div>
                            </div>
                        ))}
                    </div>
                    <Form>
                        <FormGroup>
                            <Input
                                type="textarea"
                                placeholder="Enter your feedback..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => handleSendFeedback(feedback)}>Send</Button>
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </Helmet>
    );
};

export default Chatbot;



// ______________________________đoạn 3______________________________________________________________________________


// import React, { useState, useEffect, useRef } from 'react';
// import { Container, Form, FormGroup, Input, Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
// import Helmet from '../components/Helmet/Helmet';
// import { useNavigate, useParams } from 'react-router-dom';
// import '../styles/chatbot.css';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faVolumeUp, faMicrophone } from '@fortawesome/free-solid-svg-icons';

// import api from '../axiosConfig';
// import logouser from '../assets/all-images/user (2) (1).png';

// const Chatbot = () => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState('');
//     const [field, setField] = useState('general'); // State to keep track of the selected field
//     const [loading, setLoading] = useState(false);
//     const [history, setHistory] = useState([]);
//     const messageListRef = useRef(null);
//     const navigate = useNavigate();
//     const { conversationId } = useParams();
//     const [popoverOpen, setPopoverOpen] = useState(false);

//     useEffect(() => {
//         const token = localStorage.getItem('access_token');
//         if (!token) {
//             navigate('/login');
//         } else {
//             fetchHistory(token);
//             if (conversationId) {
//                 fetchConversation(conversationId);
//             }
//         }
//     }, [navigate, conversationId]);

//     useEffect(() => {
//         console.log('Updated Messages:', messages);
//     }, [messages]);

//     const fetchHistory = async (token) => {
//         try {
//             const response = await fetch('http://localhost:8080/user/conversations', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Fetched History:', data);
    
//             if (response.ok) {
//                 setHistory(data);
//             } else {
//                 console.error('Failed to fetch history:', response.status);
//             }
//         } catch (error) {
//             console.error('Error fetching history:', error);
//         }
//     };

//     const fetchConversation = async (conversationId) => {
//         const token = localStorage.getItem('access_token');
//         try {
//             const response = await fetch(`http://localhost:8080/user/conversations/${conversationId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Fetched Conversation:', data);
    
//             if (response.ok) {
//                 const formattedMessages = [];
//                 let lastDate = null;

//                 data.chat_history.forEach((item) => {
//                     const messageDate = new Date(item.timestamp).toLocaleDateString();

//                     if (messageDate !== lastDate) {
//                         formattedMessages.push({
//                             isDateSeparator: true,
//                             date: messageDate
//                         });
//                         lastDate = messageDate;
//                     }

//                     formattedMessages.push({
//                         fromUser: true,
//                         text: item.question,
//                         timestamp: item.timestamp
//                     });

//                     formattedMessages.push({
//                         fromUser: false,
//                         text: item.answer,
//                         timestamp: item.timestamp
//                     });
//                 });

//                 setMessages(formattedMessages);
//             } else {
//                 console.error('Failed to fetch conversation:', response.status);
//             }
//         } catch (error) {
//             console.error('Error fetching conversation:', error);
//         }
//     };

//     const handleNewChat = async () => {
//         const token = localStorage.getItem('access_token');
//         try {
//             const response = await fetch('http://localhost:8080/user/conversations', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
    
//             const data = await response.json();
//             console.log('Created New Chat:', data);
    
//             if (response.ok) {
//                 const { conversation_id } = data;
//                 navigate(`/chatbot/c/${conversation_id}`);
//                 fetchConversation(conversation_id); // Fetch the newly created conversation history
//             } else {
//                 console.error('Failed to create new conversation:', response.status);
//             }
//         } catch (error) {
//             console.error('Error creating new conversation:', error);
//         }
//     };

//     const handleLogout = async () => {
//         try {
//             const token = localStorage.getItem('access_token');
            
//             if (!token) {
//                 navigate('/login');
//                 return;
//             }
    
//             const response = await axios.post(
//                 'http://localhost:8080/user/logout',
//                 {}, // No data needed for logout
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );
    
//             if (response.status === 200) {
//                 localStorage.removeItem('access_token');
//                 navigate('/login');
//             } else {
//                 console.error('Logout failed:', response.status);
//             }
//         } catch (error) {
//             console.error('Logout failed:', error.response ? error.response.data : error.message);
//         }
//     };

//     const formatTime = (date) => {
//         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (input.trim()) {
//             const userMessage = { text: input, fromUser: true, timestamp: new Date() };
//             setMessages(prevMessages => [...prevMessages, userMessage]);
//             setInput('');
    
//             try {
//                 setLoading(true);
//                 const url = `http://localhost:8080/ai/ask_pdf/${field}`; // Update the API endpoint based on the selected field
//                 const response = await fetch(url, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                     },
//                     body: JSON.stringify({ query: input, conversation_id: conversationId })
//                 });
//                 const data = await response.json();
    
//                 if (response.ok) {
//                     const answer = data.answer;
//                     let botMessage = '';
//                     for (let i = 0; i < answer.length; i++) {
//                         await new Promise(resolve => setTimeout(resolve, 40));
//                         botMessage += answer[i];
//                         setMessages(prevMessages => {
//                             const lastMessage = prevMessages[prevMessages.length - 1];
//                             if (!lastMessage.fromUser) {
//                                 return [...prevMessages.slice(0, -1), { text: botMessage, fromUser: false, timestamp: new Date() }];
//                             }
//                             return [...prevMessages, { text: botMessage, fromUser: false, timestamp: new Date() }];
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

//     const togglePopover = (conversationId) => {
//         if (popoverOpen === conversationId) {
//             setPopoverOpen(null);
//         } else {
//             setPopoverOpen(conversationId);
//         }
//     };

//     const handleDeleteConversation = async () => {
//         if (popoverOpen !== null) {
//             const token = localStorage.getItem('access_token');
//             try {
//                 const response = await fetch(`http://localhost:8080/user/conversations/${popoverOpen}`, {
//                     method: 'DELETE',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     }
//                 });
//                 if (response.ok) {
//                     const updatedHistory = history.filter(conversation => conversation.conversation_id !== popoverOpen);
//                     setHistory(updatedHistory);
//                     console.log(`Deleting conversation ${popoverOpen}`);
//                     setPopoverOpen(null); // Close popover after handling
//                 } else {
//                     console.error('Failed to delete conversation:', response.status);
//                 }
//             } catch (error) {
//                 console.error('Error deleting conversation:', error);
//             }
//         }
//     };

//     const handlePlayAudio = async (text) => {
//         try {
//             const response = await fetch('http://localhost:8080/ai/tts', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ text })
//             });
//             const data = await response.json();
//             if (response.ok) {
//                 const audio = new Audio(data.audio_url);
//                 audio.play().then(() => {
//                     console.log('Audio playing');
//                 }).catch(error => {
//                     console.error('Error playing audio:', error);
//                 });
//             } else {
//                 console.error('Failed to convert text to speech:', response.status);
//             }
//         } catch (error) {
//             console.error('Error converting text to speech:', error);
//         }
//     };
    

//     const handleMicClick = () => {
//         if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//             navigator.mediaDevices.getUserMedia({ audio: true })
//                 .then(stream => {
//                     const mediaRecorder = new MediaRecorder(stream);
//                     mediaRecorder.start();
    
//                     const audioChunks = [];
//                     mediaRecorder.addEventListener("dataavailable", event => {
//                         audioChunks.push(event.data);
//                     });
    
//                     mediaRecorder.addEventListener("stop", () => {
//                         const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
//                         const formData = new FormData();
//                         formData.append('file', audioBlob, 'recording.wav');
    
//                         fetch('http://localhost:8080/ai/stt', {
//                             method: 'POST',
//                             body: formData
//                         })
//                         .then(response => response.json())
//                         .then(data => {
//                             if (data.hypotheses && data.hypotheses.length > 0) {
//                                 setInput(data.hypotheses[0].utterance);
//                             } else {
//                                 console.error('Error converting speech to text:', data);
//                             }
//                         })
//                         .catch(error => {
//                             console.error('Error:', error);
//                         });
//                     });
    
//                     // Record for 5 seconds
//                     setTimeout(() => {
//                         mediaRecorder.stop();
//                     }, 5000);
//                 })
//                 .catch(error => {
//                     console.error('Error accessing microphone:', error);
//                 });
//         } else {
//             console.error('getUserMedia not supported on your browser!');
//         }
//     };
    
    
//     useEffect(() => {
//         if (messageListRef.current) {
//             messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
//         }
//     }, [messages]);

//     return (
//         <Helmet title="Chatbot">
//             <section className="chatbot-section">
//                 <img src="C:/thesis/React-Car-Rental-Website/src/assets/all-images/bg.jpg" alt="" />
//                 <Container className="chatbot-container">
//                     <div className="chatbot-sidebar">
//                         <button className="chatbot-sidebar-button new-chat" onClick={handleNewChat}>+ NEW CHAT</button>
//                         <div className="history-content">
//                             {history.length === 0 ? (
//                                 <p>No conversation history found.</p>
//                             ) : (
//                                 history.map((conversation, index) => (
//                                     <div key={index} className="conversation-item">
//                                         <div className="conversation-header">
//                                             <button 
//                                                 className="conversation-title"
//                                                 onClick={() => navigate(`/chatbot/c/${conversation.conversation_id}`)}
//                                             >
//                                                 <h4>Conversation {index + 1}</h4>
//                                             </button>
//                                             <Button id={`popover-${index}`} type="button" onClick={() => togglePopover(conversation.conversation_id)}>
//                                                 &#8285;
//                                             </Button>
//                                             <Popover
//                                                 placement="bottom"
//                                                 isOpen={popoverOpen === conversation.conversation_id}
//                                                 target={`popover-${index}`}
//                                                 toggle={() => togglePopover(conversation.conversation_id)}
//                                             >
//                                                 <PopoverHeader>Options</PopoverHeader>
//                                                 <PopoverBody>
//                                                     <button className="dropdown-item" onClick={handleDeleteConversation}>Delete</button>
//                                                     {/* Add more options here if needed */}
//                                                 </PopoverBody>
//                                             </Popover>
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
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
//                             <button className="user-icon-button" onClick={() => navigate('/edit-user')}>
//                                 <i className="fa-solid fa-user"></i>
//                             </button>
//                         </div>
//                         <div className="chatbot-messages" ref={messageListRef}>
//                             {messages.map((message, index) => {
//                                 if (message.isDateSeparator) {
//                                     return (
//                                         <div key={index} className="date-separator">
//                                             {message.date}
//                                         </div>
//                                     );
//                                 } else {
//                                     return (
//                                         <div
//                                             key={index}
//                                             className={`message ${message.fromUser ? 'user-message' : 'bot-message'}`}
//                                         >
//                                             <div className="message-content">
//                                                 {message.text}
//                                             </div>
//                                             <div className="message-info">
//                                                 <span className="message-time">{formatTime(new Date(message.timestamp))}</span>
//                                                 <span className="message-sender">
//                                                     {message.fromUser ? 'You' : 'Bot'}
//                                                     {!message.fromUser && (
//                                                         <FontAwesomeIcon
//                                                             icon={faVolumeUp}
//                                                             className="volume-icon"
//                                                             onClick={() => handlePlayAudio(message.text)}
//                                                         />
//                                                     )}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     );
//                                 }
//                             })}
//                             {loading && (
//                                 <div className="message bot-message">
//                                     <p>...</p>
//                                 </div>
//                             )}
//                         </div>
//                         <Form onSubmit={handleSubmit} className="chatbot-form">
//                             <FormGroup className="chatbot-input">
//                                 <Input type="select" value={field} onChange={e => setField(e.target.value)}>
//                                     <option value="general">General</option>
//                                     <option value="the">Thẻ</option>
//                                     <option value="baohiem">Bảo Hiểm</option>
//                                     <option value="dautu">Đầu Tư</option>
//                                     <option value="taikhoan">Tài Khoản</option>
//                                     <option value="HSBH">Hồ Sơ Bảo Hiểm</option>

//                                 </Input>
//                                 <Input
//                                     type="text"
//                                     placeholder="Type your message..."
//                                     value={input}
//                                     onChange={(e) => setInput(e.target.value)}
//                                     required
//                                 />
                               
//                             </FormGroup>
//                             <Button type="button" className="chatbot-mic" onClick={handleMicClick}>
//                                     <FontAwesomeIcon icon={faMicrophone} />
//                                 </Button>
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
