import React, { useState } from 'react';
import Sidebar from './Sidebar';
import '../../styles/Admin/ChatResponse.css';

const ChatResponse = () => {
    const [conversations, setConversations] = useState([
        { id: 1, text: 'Làm thế nào để thanh toán hóa đơn online?', user: 'User1' },
        { id: 2, text: 'Tôi có thể vay tiền mặt không?', user: 'User2' },
        { id: 3, text: 'Thủ tục đăng ký thẻ tín dụng ra sao?', user: 'User3' },
        { id: 4, text: 'Lãi suất vay mua nhà hiện tại là bao nhiêu?', user: 'User4' },
        { id: 5, text: 'Tôi cần hỗ trợ đổi mật khẩu đăng nhập.', user: 'User5' }
    ]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [response, setResponse] = useState('');

    const selectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setResponse('');
    };

    const handleResponseSubmit = () => {
        if (!response.trim()) return;
        alert(`Response submitted for question ID ${selectedConversation.id}: ${response}`);
        setSelectedConversation(null); // Reset selection after submitting
        setResponse('');
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
                                <p>{conversation.user}: {conversation.text}</p>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="conversation-detail">
                        <h2>Đang trả lời: {selectedConversation.user}</h2>
                        <p>{selectedConversation.text}</p>
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
