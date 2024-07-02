from flask import Flask, request, jsonify, Blueprint
from flask_caching import Cache
from langchain.chains.retrieval import create_retrieval_chain
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.prompts import PromptTemplate
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from datetime import datetime
from models.qna import Qna, Conversation
from crt_db import database


bp = Blueprint('ai', __name__, url_prefix='/ai')

# cache = Cache(config={
#     "CACHE_TYPE": "SimpleCache",  # Loại cache đơn giản
#     "CACHE_DEFAULT_TIMEOUT": 300  # Thời gian timeout mặc định là 300 giây (5 phút)
# })

# Lưu trên sqlite 3 -> vectorstores
folder_path = "db"


# ----------------------------------------------------------Setup model-------------------------------------------------------------------
# Model
cached_llm = Ollama(model= "llama3")

# Tạo Prompt
raw_prompt = PromptTemplate.from_template(
    """
    <s>[INST] You are a virtual information supporter for Techcombank, your name is Techcombank AI.
Be polite to customers.
Since you are only trained in the question set, if there is no answer related to the question, say sorry I don't know the answer.
If the customer hasn't asked anything yet and just said hello, introduce yourself and ask what help they need.
Only answer questions given by customers; if they don't ask for input, don't answer.
Always answer in Vietnamese. [/INST] </s>

[INST]
Context: {context}
Examples:
Q: Xin chào
A: Chào bạn, tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay?
Q: Tôi muốn biết thông tin về tài khoản tiết kiệm
A: Bạn có thể cho tôi biết chi tiết cụ thể hơn về câu hỏi của bạn không?
[/INST]

[INST]
Question: {input}
Answer:
    [/INST]
    """
)

# Embedding
embedding = FastEmbedEmbeddings()
def filter_relevant_content(docs, query):
    relevant_docs = []
    for doc in docs:
        if is_relevant(doc, query):
            relevant_docs.append(doc)
    return relevant_docs

def is_relevant(doc, query):
    return query.lower() in doc.page_content.lower()
# -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Test talk llama3 base
@bp.route("/ai", methods= ["POST"])
def aiPost():
    print("Post /ai called")
    json_content = request.json
    query = json_content.get("query")
    print(f"query: {query}")

    response = cached_llm.invoke(query)
    print(response)

    response_answer = {"answer": response}
    return response_answer

# --------------------------------------------------------------------------------------------Talk with bot-----------------------------------------------------------------------------
@bp.route("/ask_pdf", methods= ["POST"])
def askPDFPost():
# --------------------------------------Question------------------------------------------
    print("Post /ask_pdf called")
    json_content = request.json
    query = json_content.get("query")
    conversation_id = json_content.get("conversation_id")  # Nhận conversation_id từ request
    print(f"query: {query}")
    print(f"query: {query}, conversation_id: {conversation_id}")
# --------------------------------------Answer--------------------------------------------
#     # Kiểm tra cache trước
#     cache_key = f"query:{query}"
#     cached_result = cache.get(cache_key)
#     if cached_result:
#         print("Returning cached result")
#         return jsonify(cached_result)

    # Tải dữ liệu từ vectorstores
    print("Loading vector store")
    vector_store = Chroma(persist_directory=folder_path, embedding_function= embedding)

    # Tạo train với tham số so sánh k=20,
    print("Creating train")
    retriever = vector_store.as_retriever(
        search_type = "similarity_score_threshold",
        search_kwargs = {
            "k": 1,
            "score_threshold": 0.09,
        },
    )

    # Dùng model và đặt promp cho nó
    document_chain = create_stuff_documents_chain(cached_llm, raw_prompt)
    chain = create_retrieval_chain(retriever, document_chain)


    # In result ra api
    result = chain.invoke({"input": query})


# --------------------------------------Add database------------------------------------------
    # Lấy câu trả lời từ result
    result_answer = result["answer"]

    # Lấy thời gian hiện tại của hệ thống
    current_time = datetime.utcnow()

    # Kiểm tra nếu conversation_id có tồn tại trong cơ sở dữ liệu
    existing_conversation = database.session.query(Conversation).filter_by(id=conversation_id).first()
    if not existing_conversation:
        return jsonify({"error": "Conversation not found"}), 404

    # vẫn chưa tham chiếu được vào conversation để lấy conversation_id, có nghĩa là chưa nhận được phản hồi từ client về server
    # Tạo một bản ghi mới cho bảng "qna"
    new_qna = Qna(
        Question=str(query),
        Answer=str(result_answer),
        conversation_id=conversation_id,
        created_at=current_time
    )
    try:
        # Thêm bản ghi mới vào cơ sở dữ liệu
        database.session.add(new_qna)
        database.session.commit()
        print("Inserted Q&A into database successfully!")
    except Exception as e:
        print(f"Error inserting Q&A into database: {e}")
        database.session.rollback()
#
    print(result)

    response_answer = {"answer": result["answer"]}


    # Lưu kết quả vào cache
    # cache.set(cache_key, result_answer)
    return response_answer


# ----------------------------------------------------------------------------------------------------------------------
# """
#     <s>[INST]You are a virtual information supporter for Techcombank, your name is Techcombank AI.
# Be polite to customers.
# Since you are only trained in the question set, if there is no answer related to the question then say sorry I don't know the answer.
# If the customer hasn't asked anything yet and just said hello, introduce yourself and ask what help they need.
# Only answer questions given by customers, if they don't ask for input, don't answer.
# Always answer in Vietnamese.
#     [/INST] </s>
#     [INST]  Question of Customer: {input}
#             Context: {context}
#             Answer:
#     [/INST]
#
#     """----------------------------

