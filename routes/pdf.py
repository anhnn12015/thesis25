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
        content=content,  # Lưu trữ nội dung nhị phân của file
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
