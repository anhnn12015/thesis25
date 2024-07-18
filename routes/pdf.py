from flask import Blueprint, request, jsonify
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.document_loaders import PDFPlumberLoader
from crt_db import database
from models.PdfDocument import PDFDocument

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


# Lưu vào cơ sở dữ liệu
    new_pdf_document = PDFDocument(
        filename=file_name,
        tylefile=category ,
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

    response = {
        "status": "Successfully Uploaded",
        "filename": file_name,
        "category": category,
        "doc_len": len(docs),
        "chunks": len(chunks),
    }
    return response

# @bp.route('/query', methods=['POST'])
# def query_pdf():
#     json_content = request.json
#     query = json_content.get('query')
#     response = handle_pdf_query(query)
#     return jsonify({'result': response})
