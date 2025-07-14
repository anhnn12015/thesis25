from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import check_password_hash
from flask_bcrypt import generate_password_hash
from pymysql import IntegrityError
from flask_jwt_extended import JWTManager, create_access_token,create_refresh_token, jwt_required, get_jwt_identity

from itsdangerous import URLSafeTimedSerializer as Serializer
from services.mail_service import send_reset_email
from config import app_config

# from models.FnA import Feedback, Answer
from models.user import User
from models.qna import Conversation, Qna
from crt_db import database


bp = Blueprint('user', __name__, url_prefix='/user')


@bp.route("/login", methods=["POST"])
def login():
    if request.method == "POST":
        try:
            data = request.json
            username = data.get('username')
            password = data.get('password')

            if not username or not password:
                return jsonify({"error": "Username and password are required"}), 400

            # Truy vấn người dùng từ cơ sở dữ liệu
            user = User.query.filter_by(username=username).first()

            if user and check_password_hash(user.password, password):
                role_id = user.roleID
                # Tạo JWT token
                access_token = create_access_token(identity=str(user.id))  # ensure string
                refresh_token = create_refresh_token(identity=str(user.id))


                # Cập nhật trạng thái online
                user.is_online = True
                database.session.commit()

                return jsonify(
                    {"message": "Login successfully!", "access_token": access_token, "refresh_token": refresh_token,
                     "user_id": user.id, "roleID": role_id}), 200
            else:
                # Xác thực thất bại
                return jsonify({"error": "Invalid username or password"}), 401
        except Exception as e:
            # Xử lý các ngoại lệ và trả về thông báo lỗi
            return jsonify({"error": str(e)}), 500

@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        current_user = get_jwt_identity()
        user = User.query.get(current_user)
        if user:
            user.is_online = False
            database.session.commit()
        return jsonify({"message": "Logout successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user)
        return jsonify({"access_token": new_access_token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        DoB = data.get('DoB')
        phone = data.get('phone')
        email = data.get('email')
        address = data.get('address')

        # Set roleID to 1 as default
        roleID = data.get('roleID', 1)

        if not username or not password or not firstname or not lastname or not DoB or not phone or not email or not address:
            return jsonify({"error": "All fields are required"}), 400

        confirm_password = data.get('confirm_password')

        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Kiểm tra xem người dùng đã tồn tại hay chưa
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400

        # Create a new user object
        new_user = User(username=username, password=hashed_password, firstname=firstname, lastname=lastname,
                        DoB=DoB, phone=phone, email=email, address=address, roleID=roleID)

        # Add the new user to the database
        database.session.add(new_user)
        database.session.commit()

        return jsonify({"message": "User registered successfully"}), 201
    except IntegrityError:
        database.session.rollback()
        return jsonify({"error": "Username already exists"}), 400
    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------------------------------------------------------



# -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# --------------------------------------------------------------------------------------CRUD USER------------------------------------------------------------------------------------------

# -----------------Create User--------------------------
@bp.route("/create_user", methods=["POST"])
def create_user():
    try:
        # Trích xuất thông tin người dùng từ yêu cầu POST
        data = request.json
        username  = data.get("username")
        password  = data.get("password")
        firstname = data.get("firstname")
        lastname  = data.get("lastname")
        DoB       = data.get("DoB")
        phone     = data.get("phone")
        email     = data.get("email")
        address   = data.get("address")
        roleID    = data.get("roleID")

        # Hash mật khẩu
        hashed_password = generate_password_hash(password).decode("utf-8")


        # Tạo một bản ghi mới trong cơ sở dữ liệu với thông tin người dùng
        new_user = User(
            username  = username,
            password  = hashed_password,
            firstname = firstname,
            lastname  = lastname,
            DoB       = DoB,
            phone     = phone,
            email     = email,
            address   = address,
            roleID    = roleID
        )
        database.session.add(new_user)
        database.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except IntegrityError:
        database.session.rollback()
        return jsonify({"error": "User already exists"}), 400
    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500

# -----------------Get User--------------------------
@bp.route("/user/<username>", methods=["GET"])
def get_user(username):
    try:
        # Tìm người dùng trong cơ sở dữ liệu
        user = User.query.filter_by(username=username).first()

        # Kiểm tra xem người dùng có tồn tại hay không
        if user:
            # Nếu tồn tại, trả về thông tin của người dùng
            user_data = {
                "username": user.username,
                "password": user.password,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "DoB": user.DoB,
                "phone": user.phone,
                "email": user.email,
                "address": user.address,
                "roleID": user.roleID
            }
            return jsonify(user_data), 200
        else:
            # Nếu không tồn tại, trả về thông báo lỗi
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        # Xử lý các ngoại lệ và trả về thông báo lỗi
        return jsonify({"error": str(e)}), 500

# -------------------Get all user-----------------
@bp.route("/users", methods=["GET"])
def get_all_users():
    try:
        # Lấy tất cả người dùng từ cơ sở dữ liệu
        all_users = User.query.all()

        # Tạo danh sách chứa thông tin của tất cả người dùng
        users_data = []
        for user in all_users:
            user_data = {
                "id": user.id,
                "username": user.username,
                "password": user.password,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "DoB": user.DoB,
                "phone": user.phone,
                "email": user.email,
                "address": user.address,
                "status": "online" if user.is_online else "offline",
                "roleID": user.roleID
            }
            users_data.append(user_data)

        # Trả về danh sách người dùng dưới dạng JSON
        return jsonify(users_data), 200
    except Exception as e:
        # Xử lý các ngoại lệ và trả về thông báo lỗi
        return jsonify({"error": str(e)}), 500

# -----------------Update User--------------------------
@bp.route("/user/<username>", methods=["PUT"])
def update_user(username):
    try:
        # Tìm người dùng trong cơ sở dữ liệu
        user = User.query.filter_by(username=username).first()

        # Kiểm tra xem người dùng có tồn tại hay không
        if user:
            # Cập nhật thông tin người dùng với dữ liệu được gửi trong yêu cầu
            data = request.json
            # Kiểm tra nếu có mật khẩu mới được cung cấp
            new_password = data.get("password")
            if new_password:
                # Hash mật khẩu mới trước khi lưu vào cơ sở dữ liệu
                user.password = generate_password_hash(new_password).decode("utf-8")
            user.firstname = data.get("firstname", user.firstname)
            user.lastname = data.get("lastname", user.lastname)
            user.DoB = data.get("DoB", user.DoB)
            user.phone = data.get("phone", user.phone)
            user.email = data.get("email", user.email)
            user.address = data.get("address", user.address)
            user.roleID = data.get("roleID", user.roleID)

            # Lưu thay đổi vào cơ sở dữ liệu
            database.session.commit()
            return jsonify({"message": "User updated successfully"}), 200
        else:
            # Nếu không tồn tại, trả về thông báo lỗi
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        # Xử lý các ngoại lệ và trả về thông báo lỗi
        return jsonify({"error": str(e)}), 500

# -----------------Delete User--------------------------
@bp.route("/user/<username>", methods=["DELETE"])
def delete_user(username):
    try:
        # Tìm người dùng trong cơ sở dữ liệu
        user = User.query.filter_by(username=username).first()

        # Kiểm tra xem người dùng có tồn tại hay không
        if user:
            # Xóa người dùng
            database.session.delete(user)
            database.session.commit()
            return jsonify({"message": "User deleted successfully"}), 200
        else:
            # Nếu không tồn tại, trả về thông báo lỗi
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        # Xử lý các ngoại lệ và trả về thông báo lỗi
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------------------------------------------------------------------------------

@bp.route('/reset_password', methods=['POST'])
def reset_request():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        token = get_reset_token(user.id)
        send_reset_email(user.email, token)
        return jsonify({"message": "An email has been sent with instructions to reset your password."}), 200
    else:
        return jsonify({"error": "Email not found."}), 404

def get_reset_token(user_id, expires_sec=1800):
    s = Serializer(app_config['development'].SECRET_KEY)
    return s.dumps({'user_id': user_id}, salt=app_config['development'].SECURITY_PASSWORD_SALT)

@bp.route('/reset_password/<token>', methods=['POST'])
def reset_token(token):
    data = request.json
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    user_id = verify_reset_token(token)
    if user_id is None:
        return jsonify({"error": "That is an invalid or expired token"}), 400
    user = User.query.get(user_id)
    user.password = generate_password_hash(password).decode('utf-8')
    database.session.commit()
    return jsonify({"message": "Your password has been updated!"}), 200

# Function to get reset token
def get_reset_token(user_id, expires_sec=1800):
    s = Serializer(current_app.config['SECRET_KEY'])
    return s.dumps({'user_id': user_id})
    # return s.dumps({'user_id': user_id}).decode('utf-8')

# Function to verify reset token
def verify_reset_token(token):
    s = Serializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token)
        user_id = data['user_id']
    except Exception as e:
        print(str(e))
        return None
    return user_id

@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        user_id = get_jwt_identity()
        conversations = Conversation.query.filter_by(user_id=user_id).all()

        history = [{
            'conversation_id': conversation.id,
            'created_at': conversation.created_at
        } for conversation in conversations]

        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_details(conversation_id):
    try:
        user_id = get_jwt_identity()
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()

        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        qnas = Qna.query.filter_by(conversation_id=conversation.id).all()
        chat_history = [{
            'question': qna.Question,
            'answer': qna.Answer,
            'timestamp': qna.created_at
        } for qna in qnas]

        return jsonify({
            'conversation_id': conversation.id,
            'created_at': conversation.created_at,
            'chat_history': chat_history
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    try:
        user_id = get_jwt_identity()

        # Tạo một Conversation mới
        new_conversation = Conversation(user_id=user_id)
        database.session.add(new_conversation)
        database.session.commit()

        return jsonify({
            "message": "Conversation created successfully",
            "conversation_id": new_conversation.id,
            "created_at": new_conversation.created_at
        }), 201
    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    try:
        user_id = get_jwt_identity()

        # Find the conversation to delete
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()

        if not conversation:
            return jsonify({"error": "Conversation not found or you don't have permission to delete"}), 404

        # Delete associated Q&A records if needed
        Qna.query.filter_by(conversation_id=conversation_id).delete()

        # Delete the conversation itself
        database.session.delete(conversation)
        database.session.commit()

        return jsonify({"message": "Conversation deleted successfully"}), 200

    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route("/feedback", methods=["POST"])
@jwt_required()
def send_feedback():
    try:
        user_id = get_jwt_identity()
        data = request.json
        feedback_text = data.get("feedback")

        if not feedback_text:
            return jsonify({"error": "Feedback text is required"}), 400

        new_feedback = Feedback(
            user_id=user_id,
            feedback=feedback_text
        )

        database.session.add(new_feedback)
        database.session.commit()

        return jsonify({"message": "Feedback sent successfully"}), 201
    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route("/feedback", methods=["GET"])
@jwt_required()
def get_feedback():
    try:
        feedbacks = Feedback.query.filter_by(status=False).all()  # Lọc các feedback chưa được trả lời
        feedback_list = []
        for feedback in feedbacks:
            feedback_data = {
                "id": feedback.id,
                "feedback": feedback.feedback,
                "created_at": feedback.created_at,
                "user": {
                    "id": feedback.user.id,
                    "username": feedback.user.username
                },
                "answers": [
                    {"id": answer.id, "answer": answer.answer, "created_at": answer.created_at}
                    for answer in feedback.answers
                ]
            }
            feedback_list.append(feedback_data)

        return jsonify(feedback_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/feedback/<int:feedback_id>/answers", methods=["GET"])
@jwt_required()
def get_feedback_answers(feedback_id):
    try:
        feedback = Feedback.query.filter_by(id=feedback_id).first()

        if not feedback:
            return jsonify({"error": "Feedback not found"}), 404

        answers = Answer.query.filter_by(feedback_id=feedback_id).all()
        answers_data = [{
            'id': answer.id,
            'feedback_id': answer.feedback_id,
            'answer': answer.answer,
            'created_at': answer.created_at
        } for answer in answers]

        return jsonify(answers_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/feedback/<int:feedback_id>/answer", methods=["POST"])
@jwt_required()
def add_feedback_answer(feedback_id):
    try:
        data = request.json
        answer_text = data.get("answer")

        if not answer_text:
            return jsonify({"error": "Answer text is required"}), 400

        feedback = Feedback.query.filter_by(id=feedback_id).first()

        if not feedback:
            return jsonify({"error": "Feedback not found"}), 404

        new_answer = Answer(
            feedback_id=feedback_id,
            answer=answer_text
        )

        feedback.status = True  # Cập nhật trạng thái của feedback

        database.session.add(new_answer)
        database.session.commit()

        return jsonify({"message": "Answer added successfully"}), 201
    except Exception as e:
        database.session.rollback()
        return jsonify({"error": str(e)}), 500

