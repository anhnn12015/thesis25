import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles/ChatResponse.css';
import axios from 'axios';

const ChatResponse = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [response, setResponse] = useState('');

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8080/user/feedback', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const selectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setResponse('');
    };

    const handleResponseSubmit = async () => {
        if (!response.trim()) return;
        try {
            const token = localStorage.getItem('access_token');
            const feedbackId = selectedConversation.id;
            const data = {
                answer: response
            };

            const responseApi = await axios.post(`http://localhost:8080/user/feedback/${feedbackId}/answer`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (responseApi.status === 201) {
                // Remove the answered feedback from the list
                setConversations(conversations.filter(conversation => conversation.id !== feedbackId));
                setSelectedConversation(null); // Reset selection after submitting
                setResponse('');
                alert("Response submitted successfully!");
            } else {
                alert("Failed to submit response");
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            alert("Error submitting response");
        }
    };

    return (
        <div className="chat-response-container">
            <Sidebar />
            <div className="questions-container">
                {!selectedConversation ? (
                    <>
                        <h2>Cuộc hội thoại cần tư vấn</h2>
                        {conversations.map(conversation => (
                            <div key={conversation.id} className="question-item" onClick={() => selectConversation(conversation)}>
                                <p>
                                    <span className="username">{conversation.user.username}</span>: 
                                    <span className="message-text">{conversation.feedback}</span>
                                </p>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="conversation-detail">
                        <h2>Đang trả lời: {selectedConversation.user.username}</h2>
                        <p>{selectedConversation.feedback}</p>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Type your response here..."
                        ></textarea>
                        <button onClick={handleResponseSubmit}>Submit Response</button>
                        <button onClick={() => setSelectedConversation(null)}>Back to List</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatResponse;
