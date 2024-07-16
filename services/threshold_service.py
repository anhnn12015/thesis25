# services/threshold_service.py

# from datetime import datetime
# from models.qna import Qna, Conversation
# from crt_db import database
#
# # Define your threshold score
# THRESHOLD_SCORE = 0.5
#
# def notify_admin(query, conversation_id):
#     # This function should handle the logic for notifying the admin
#     # For simplicity, we'll just print a message to the console
#     # You can replace this with email notifications, Slack messages, etc.
#     print(f"Admin notification: The bot could not confidently answer the query '{query}' for conversation {conversation_id}.")
#
# def handle_low_confidence_answer(query, conversation_id):
#     # Notify the admin
#     notify_admin(query, conversation_id)
#
#     # Insert the query into the database for admin to review later
#     current_time = datetime.utcnow()
#     new_qna = Qna(
#         Question=str(query),
#         Answer="Pending admin response",
#         conversation_id=conversation_id,
#         created_at=current_time
#     )
#     try:
#         database.session.add(new_qna)
#         database.session.commit()
#         print("Inserted low confidence Q&A into database for admin review.")
#     except Exception as e:
#         print(f"Error inserting Q&A into database: {e}")
#         database.session.rollback()
#
#     # Return a placeholder response
#     return {"answer": "Xin lỗi, tôi không biết câu trả lời. Quản trị viên sẽ xem xét câu hỏi của bạn sớm."}

from datetime import datetime
from models.qna import Qna, Conversation
from crt_db import database

# Nội dung trả lời khi bot không biết câu trả lời
BOT_UNKNOWN_ANSWER = "Xin lỗi, tôi không biết câu trả lời!"


def notify_admin(query, conversation_id):
    # Hàm thông báo cho admin
    print(
        f"Admin notification: The bot could not confidently answer the query '{query}' for conversation {conversation_id}.")


def handle_low_confidence_answer(query, answer, conversation_id):
    if answer == BOT_UNKNOWN_ANSWER:
        # Notify the admin
        notify_admin(query, conversation_id)

        # Insert the query into the database for admin to review later
        current_time = datetime.utcnow()
        new_qna = Qna(
            Question=str(query),
            Answer="Pending admin response",
            conversation_id=conversation_id,
            created_at=current_time
        )
        try:
            database.session.add(new_qna)
            database.session.commit()
            print("Inserted low confidence Q&A into database for admin review.")
        except Exception as e:
            print(f"Error inserting Q&A into database: {e}")
            database.session.rollback()

        # Return a placeholder response
        return {"answer": "Xin lỗi, tôi không biết câu trả lời. Quản trị viên sẽ xem xét câu hỏi của bạn sớm."}

    # Trả về câu trả lời bình thường nếu không nằm trong trường hợp bot không biết câu trả lời
    return {"answer": answer}
