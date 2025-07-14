from datetime import datetime
from flask_jwt_extended import JWTManager, create_access_token,create_refresh_token, jwt_required, get_jwt_identity
from flask import Blueprint, request, jsonify
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.document_loaders import PDFPlumberLoader
from crt_db import database
from models.PdfDocument import PDFDocument
from  models.ActivityLog import ActivityLog
from models.user import User
from flask_jwt_extended import get_jwt_identity

bp = Blueprint('pdf', __name__, url_prefix='/pdf')

# Lưu trên sqlite 3 -> vectorstores
folder_path = "db"

# Embedding
embedding = FastEmbedEmbeddings()

# Tham số tách chữ văn bản
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size= 1024,
    chunk_overlap= 50,
    length_function= len,
    is_separator_regex= False
)


@bp.route("/pdf", methods=["POST"])
def pdfPost():
#--------------------------------------Load PDF------------------------------------------
    file = request.files["file"]
    file_name = file.filename
    category = request.form.get('category', 'unknown')
    save_file = "pdf/" + file_name
    file.save(save_file)
    print(f"filename: {file_name}, category: {category}")

#--------------------------------------Embedding------------------------------------------
    # Tải thư mục lên để chuẩn bị băm
    loader = PDFPlumberLoader(save_file)
    docs = loader.load_and_split()
    print(f"docs len={len(docs)}")

    # Tách văn bản
    chunks = text_splitter.split_documents(docs)
    print(f"chunks len={len(chunks)}")

    # Embedding và lưu vào vectorstore
    vector_store = Chroma.from_documents(
        documents=chunks, embedding=embedding, persist_directory=folder_path
    )

    vector_store.persist()

#--------------------------------------Save PDF to database-------------------------------
    file.seek(0)
    content = file.read()  # Đọc nội dung file để lưu vào DB

    # Lưu trữ thông tin và nội dung vào cơ sở dữ liệu
    new_pdf_document = PDFDocument(
        filename=file_name,
        typefile=category,
        # content=content,  # Lưu trữ nội dung nhị phân của file
        doc_len=len(docs),
        chunks_len=len(chunks)
    )
    try:
        database.session.add(new_pdf_document)
        database.session.commit()
        print("Inserted PDF document info into database successfully!")
    except Exception as e:
        print(f"Error inserting PDF document info into database: {e}")
        database.session.rollback()


 # -----------------------------------------------------------------



 #--------------------------------lưu nhật kí lưu---------------------------------------------------

    try:
        database.session.add(new_pdf_document)
        database.session.flush()  # Flush để lấy ID ngay lập tức

        # Ghi nhật ký hoạt động
        # admin_id = get_jwt_identity()  # Lấy ID của admin đăng nhập từ JWT
        new_log = ActivityLog(action='Upload', timestamp=datetime.utcnow(), pdf_id=new_pdf_document.id)
        database.session.add(new_log)
        database.session.commit()

        return jsonify({'message': 'File uploaded successfully', 'id': new_pdf_document.id}), 201
    except Exception as e:
        database.session.rollback()
        print(f"Error inserting PDF document info into database: {e}")
        return jsonify({'error': 'Failed to upload file'}), 500
#-----------------------------------------------------------------------------------------

    response = {
        "status": "Successfully Uploaded",
        "filename": file_name,
        "category": category,
        "doc_len": len(docs),
        "chunks": len(chunks),
    }
    return response

@bp.route("/pdfs", methods=["GET"])
def get_pdfs():
    try:
        # Truy vấn tất cả các bản ghi từ bảng pdf_documents
        pdfs = PDFDocument.query.all()

        # Chuyển danh sách các đối tượng PDFDocument thành danh sách các từ điển
        pdfs_list = [{
            'id': pdf.id,
            'filename': pdf.filename,
            'typefile': pdf.typefile,
            'upload_time': pdf.upload_time.strftime('%Y-%m-%d %H:%M:%S'),  # Định dạng ngày giờ cho dễ đọc
            'doc_len': pdf.doc_len,
            'chunks_len': pdf.chunks_len
        } for pdf in pdfs]

        # Trả về kết quả dưới dạng JSON
        return jsonify(pdfs_list)
    except Exception as e:
        print(f"Error retrieving PDF documents: {e}")
        return jsonify({"error": "Could not retrieve PDF documents"}), 500

@bp.route("/activities", methods=["GET"])
def get_activities():
    try:
        # Truy vấn tất cả các bản ghi từ bảng activity_logs
        activities = ActivityLog.query.all()

        # Chuyển danh sách các đối tượng ActivityLog thành danh sách các từ điển
        activities_list = [{
            'id': activity.id,
            'action': activity.action,
            'timestamp': activity.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'pdf_id': activity.pdf_id,
            'pdf_filename': activity.pdf.filename if activity.pdf else "No PDF linked"  # Hiển thị tên file nếu có liên kết
        } for activity in activities]

        # Trả về kết quả dưới dạng JSON
        return jsonify(activities_list)
    except Exception as e:
        print(f"Error retrieving activity logs: {e}")
        return jsonify({"error": "Could not retrieve activity logs"}), 500



# ________________________________________________________PhoBERT_________________________________________________________________
# import os
# from datetime import datetime
# from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
# from flask import Blueprint, request, jsonify
# from langchain_community.vectorstores import Chroma
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from transformers import AutoModel, AutoTokenizer
# from langchain_community.document_loaders import PDFPlumberLoader
# from crt_db import database
# from models.PdfDocument import PDFDocument
# from models.ActivityLog import ActivityLog
# from models.user import User
# import pandas as pd

# bp = Blueprint('pdf', __name__, url_prefix='/pdf')

# # Lưu trên sqlite 3 -> vectorstores
# base_folder_path = "db"

# # Thiết lập PhoBERT làm mô hình embedding
# tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
# model = AutoModel.from_pretrained("vinai/phobert-base")


# def embed_text(text):
#     # Đảm bảo rằng đầu vào là một chuỗi hoặc danh sách các chuỗi
#     if isinstance(text, list):
#         text = [str(t) for t in text]
#     else:
#         text = str(text)

#     inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
#     outputs = model(**inputs)
#     embeddings = outputs.last_hidden_state.mean(dim=1)

#     # Chuyển đổi từ ndarray thành một danh sách phẳng các giá trị float
#     return embeddings.detach().numpy().flatten().astype(float).tolist()


# # Tạo lớp bọc để tích hợp PhoBERT với Chroma
# from langchain.embeddings.base import Embeddings


# class PhoBERTEmbeddings(Embeddings):
#     def embed_documents(self, texts):
#         return [embed_text(text) for text in texts]

#     def embed_query(self, text):
#         return embed_text(text)


# embedding = PhoBERTEmbeddings()

# # Tham số tách chữ văn bản
# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=1024,
#     chunk_overlap=50,
#     length_function=len,
#     is_separator_regex=False
# )


# @bp.route("/pdf", methods=["POST"])
# def pdfPost():
#     # --------------------------------------Load PDF------------------------------------------
#     file = request.files["file"]
#     file_name = file.filename
#     category = request.form.get('category', 'unknown')
#     save_file = "pdf/" + file_name
#     file.save(save_file)
#     print(f"filename: {file_name}, category: {category}")

#     # --------------------------------------Embedding------------------------------------------
#     # Tải thư mục lên để chuẩn bị băm
#     loader = PDFPlumberLoader(save_file)
#     docs = loader.load_and_split()
#     print(f"docs len={len(docs)}")

#     # Tách văn bản
#     chunks = text_splitter.split_documents(docs)
#     print(f"chunks len={len(chunks)}")

#     # Tạo thư mục cho category nếu chưa tồn tại
#     category_folder_path = os.path.join(base_folder_path, category)
#     if not os.path.exists(category_folder_path):
#         os.makedirs(category_folder_path)

#     # Embedding và lưu vào vectorstore
#     vector_store = Chroma.from_documents(
#         documents=chunks, embedding=embedding, persist_directory=category_folder_path
#     )

#     vector_store.persist()

#     # Tạo DataFrame để lưu văn bản và vector
#     data = []
#     for i, chunk in enumerate(chunks):
#         text_content = chunk.page_content  # Lấy nội dung văn bản từ chunk
#         vector = embedding.embed_documents([text_content])
#         data.append([text_content, vector[0]])  # vector[0] vì embed_documents trả về danh sách

#     df = pd.DataFrame(data, columns=["Text", "Vector"])

#     # Lưu DataFrame vào file Excel
#     excel_file_path = os.path.join(category_folder_path, f"{file_name}_embeddings.xlsx")
#     df.to_excel(excel_file_path, index=False)
#     print(f"Saved embeddings to {excel_file_path}")

#     # --------------------------------------Save PDF to database-------------------------------
#     file.seek(0)
#     content = file.read()  # Đọc nội dung file để lưu vào DB

#     # Lưu trữ thông tin và nội dung vào cơ sở dữ liệu
#     new_pdf_document = PDFDocument(
#         filename=file_name,
#         typefile=category,
#         content=content,  # Lưu trữ nội dung nhị phân của file
#         doc_len=len(docs),
#         chunks_len=len(chunks)
#     )
#     try:
#         database.session.add(new_pdf_document)
#         database.session.commit()
#         print("Inserted PDF document info into database successfully!")
#     except Exception as e:
#         print(f"Error inserting PDF document info into database: {e}")
#         database.session.rollback()

#     # --------------------------------lưu nhật kí lưu---------------------------------------------------
#     try:
#         database.session.add(new_pdf_document)
#         database.session.flush()  # Flush để lấy ID ngay lập tức

#         # Ghi nhật ký hoạt động
#         new_log = ActivityLog(action='Upload', timestamp=datetime.utcnow(), pdf_id=new_pdf_document.id)
#         database.session.add(new_log)
#         database.session.commit()

#         return jsonify({'message': 'File uploaded successfully', 'id': new_pdf_document.id}), 201
#     except Exception as e:
#         database.session.rollback()
#         print(f"Error inserting PDF document info into database: {e}")
#         return jsonify({'error': 'Failed to upload file'}), 500

#     response = {
#         "status": "Successfully Uploaded",
#         "filename": file_name,
#         "category": category,
#         "doc_len": len(docs),
#         "chunks": len(chunks),
#     }
#     return response


# @bp.route("/pdfs", methods=["GET"])
# def get_pdfs():
#     try:
#         # Truy vấn tất cả các bản ghi từ bảng pdf_documents
#         pdfs = PDFDocument.query.all()

#         # Chuyển danh sách các đối tượng PDFDocument thành danh sách các từ điển
#         pdfs_list = [{
#             'id': pdf.id,
#             'filename': pdf.filename,
#             'typefile': pdf.typefile,
#             'upload_time': pdf.upload_time.strftime('%Y-%m-%d %H:%M:%S'),  # Định dạng ngày giờ cho dễ đọc
#             'doc_len': pdf.doc_len,
#             'chunks_len': pdf.chunks_len
#         } for pdf in pdfs]

#         # Trả về kết quả dưới dạng JSON
#         return jsonify(pdfs_list)
#     except Exception as e:
#         print(f"Error retrieving PDF documents: {e}")
#         return jsonify({"error": "Could not retrieve PDF documents"}), 500


# @bp.route("/activities", methods=["GET"])
# def get_activities():
#     try:
#         # Truy vấn tất cả các bản ghi từ bảng activity_logs
#         activities = ActivityLog.query.all()

#         # Chuyển danh sách các đối tượng ActivityLog thành danh sách các từ điển
#         activities_list = [{
#             'id': activity.id,
#             'action': activity.action,
#             'timestamp': activity.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
#             'pdf_id': activity.pdf_id,
#             'pdf_filename': activity.pdf.filename if activity.pdf else "No PDF linked"
#             # Hiển thị tên file nếu có liên kết
#         } for activity in activities]

#         # Trả về kết quả dưới dạng JSON
#         return jsonify(activities_list)
#     except Exception as e:
#         print(f"Error retrieving activity logs: {e}")
#         return jsonify({"error": "Could not retrieve activity logs"}), 500

import os
from datetime import datetime
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask import Blueprint, request, jsonify
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from transformers import AutoModel, AutoTokenizer
from langchain_community.document_loaders import PDFPlumberLoader
from crt_db import database
from models.PdfDocument import PDFDocument
from models.ActivityLog import ActivityLog
from models.user import User
import pandas as pd

bp = Blueprint('pdf', __name__, url_prefix='/pdf')

# Lưu trên sqlite 3 -> vectorstores
base_folder_path = "db"

# Thiết lập PhoBERT làm mô hình embedding
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = AutoModel.from_pretrained("vinai/phobert-base")


def embed_text(text):
    # Đảm bảo rằng đầu vào là một chuỗi hoặc danh sách các chuỗi
    if isinstance(text, list):
        text = [str(t) for t in text]
    else:
        text = str(text)

    inputs = tokenizer(text, return_tensors="pt", truncation=True,padding="max_length",max_length=512,add_special_tokens=True)
    outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)

    # Chuyển đổi từ ndarray thành một danh sách phẳng các giá trị float
    return embeddings.detach().numpy().flatten().astype(float).tolist()


# Tạo lớp bọc để tích hợp PhoBERT với Chroma
from langchain.embeddings.base import Embeddings


class PhoBERTEmbeddings(Embeddings):
    def embed_documents(self, texts):
        return [embed_text(text) for text in texts]

    def embed_query(self, text):
        return embed_text(text)


embedding = PhoBERTEmbeddings()

# Tham số tách chữ văn bản
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,   #chunk_size=1024
    chunk_overlap=50,
    length_function=len,
    is_separator_regex=False
)


@bp.route("/pdf", methods=["POST"])
def pdfPost():
    # --------------------------------------Load PDF------------------------------------------
    file = request.files["file"]
    file_name = file.filename
    category = request.form.get('category', 'unknown')
    save_file = "pdf/" + file_name
    file.save(save_file)
    print(f"filename: {file_name}, category: {category}")

    # --------------------------------------Embedding------------------------------------------
    # Tải thư mục lên để chuẩn bị băm
    loader = PDFPlumberLoader(save_file)
    docs = loader.load_and_split()
    print(f"docs len={len(docs)}")

    # Tách văn bản
    chunks = text_splitter.split_documents(docs)
    print(f"chunks len={len(chunks)}")

    # Tạo thư mục cho category nếu chưa tồn tại
    category_folder_path = os.path.join(base_folder_path, category)
    if not os.path.exists(category_folder_path):
        os.makedirs(category_folder_path)

    # Embedding và lưu vào vectorstore
    vector_store = Chroma.from_documents(
        documents=chunks, embedding=embedding, persist_directory=category_folder_path
    )

    vector_store.persist()

    # Tạo DataFrame để lưu văn bản và vector
    data = []
    for i, chunk in enumerate(chunks):
        text_content = chunk.page_content  # Lấy nội dung văn bản từ chunk
        vector = embedding.embed_documents([text_content])
        data.append([text_content, vector[0]])  # vector[0] vì embed_documents trả về danh sách

    df = pd.DataFrame(data, columns=["Text", "Vector"])

    # Lưu DataFrame vào file Excel
    excel_file_path = os.path.join(category_folder_path, f"{file_name}_embeddings.xlsx")
    df.to_excel(excel_file_path, index=False)
    print(f"Saved embeddings to {excel_file_path}")

    # --------------------------------------Save PDF to database-------------------------------
    file.seek(0)
    content = file.read()  # Đọc nội dung file để lưu vào DB

    # Lưu trữ thông tin và nội dung vào cơ sở dữ liệu
    new_pdf_document = PDFDocument(
        filename=file_name,
        typefile=category,
        # content=content,  # Lưu trữ nội dung nhị phân của file
        doc_len=len(docs),
        chunks_len=len(chunks)
    )
    try:
        database.session.add(new_pdf_document)
        database.session.commit()
        print("Inserted PDF document info into database successfully!")
    except Exception as e:
        print(f"Error inserting PDF document info into database: {e}")
        database.session.rollback()

    # --------------------------------lưu nhật kí lưu---------------------------------------------------
    try:
        database.session.add(new_pdf_document)
        database.session.flush()  # Flush để lấy ID ngay lập tức

        # Ghi nhật ký hoạt động
        new_log = ActivityLog(action='Upload', timestamp=datetime.utcnow(), pdf_id=new_pdf_document.id)
        database.session.add(new_log)
        database.session.commit()

        return jsonify({'message': 'File uploaded successfully', 'id': new_pdf_document.id}), 201
    except Exception as e:
        database.session.rollback()
        print(f"Error inserting PDF document info into database: {e}")
        return jsonify({'error': 'Failed to upload file'}), 500

    response = {
        "status": "Successfully Uploaded",
        "filename": file_name,
        "category": category,
        "doc_len": len(docs),
        "chunks": len(chunks),
    }
    return response


@bp.route("/pdfs", methods=["GET"])
def get_pdfs():
    try:
        # Truy vấn tất cả các bản ghi từ bảng pdf_documents
        pdfs = PDFDocument.query.all()

        # Chuyển danh sách các đối tượng PDFDocument thành danh sách các từ điển
        pdfs_list = [{
            'id': pdf.id,
            'filename': pdf.filename,
            'typefile': pdf.typefile,
            'upload_time': pdf.upload_time.strftime('%Y-%m-%d %H:%M:%S'),  # Định dạng ngày giờ cho dễ đọc
            'doc_len': pdf.doc_len,
            'chunks_len': pdf.chunks_len
        } for pdf in pdfs]

        # Trả về kết quả dưới dạng JSON
        return jsonify(pdfs_list)
    except Exception as e:
        print(f"Error retrieving PDF documents: {e}")
        return jsonify({"error": "Could not retrieve PDF documents"}), 500
# from flask_cors import cross_origin

# @bp.route('/ai/ask_pdf/general', methods=['POST', 'OPTIONS'])
# @cross_origin()  # Cho phép CORS riêng cho route này nếu cần
# def ask_pdf_general():
#     if request.method == 'OPTIONS':
#         return '', 204  # Trả về OK cho preflight request

#     # Xử lý logic POST ở đây
#     data = request.get_json()
#     return jsonify({
#         "message": "Đã nhận yêu cầu từ frontend",
#         "data": data
#     }), 200
@bp.route("/activities", methods=["GET"])
def get_activities():
    try:
        # Truy vấn tất cả các bản ghi từ bảng activity_logs
        activities = ActivityLog.query.all()

        # Chuyển danh sách các đối tượng ActivityLog thành danh sách các từ điển
        activities_list = [{
            'id': activity.id,
            'action': activity.action,
            'timestamp': activity.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'pdf_id': activity.pdf_id,
            'pdf_filename': activity.pdf.filename if activity.pdf else "No PDF linked"
            # Hiển thị tên file nếu có liên kết
        } for activity in activities]

        # Trả về kết quả dưới dạng JSON
        return jsonify(activities_list)
    except Exception as e:
        print(f"Error retrieving activity logs: {e}")
        return jsonify({"error": "Could not retrieve activity logs"}), 500




