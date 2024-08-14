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

# Đây là phoBert embeding dùng thêm MB25 và cosine để rank
# import os
# import json
# import requests
# import pandas as pd
# import tempfile
# import string
# import math
# from datetime import datetime
# from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine_similarity
# from transformers import AutoModel, AutoTokenizer
# from werkzeug.utils import secure_filename
# from flask import Flask, request, jsonify, Blueprint
# from langchain_community.llms import Ollama
# from langchain_community.vectorstores import Chroma
# from langchain.prompts import PromptTemplate
# from models.qna import Qna, Conversation, FieldStatistics
# from crt_db import database
# from services.threshold_service import handle_low_confidence_answer
# from underthesea import word_tokenize
#
# bp = Blueprint('ai', __name__, url_prefix='/ai')
#
# # Đường dẫn lưu trữ vectorstore trên sqlite 3
# base_folder_path = "db"
#
# # Thiết lập model
# cached_llm = Ollama(model="llama3")
#
# # Tạo Prompt
# raw_prompt = PromptTemplate.from_template(
#     """
#     <s>[INST] You are a virtual assistant for Techcombank, known as Techcombank AI.
# Please be respectful and courteous to customers.
# If there is no answer related to the question, kindly apologize and say that you do not have the information.
# If the customer only greets you without asking anything, introduce yourself and ask how you can assist them.
# Only respond to the queries raised by the customers; do not provide unsolicited information.
# Always answer in Vietnamese.
#
# Provide the most relevant information based on the given context and prioritize accuracy and helpfulness.
#
# [INST]
# Context: {context}
#
# Based on the above context, answer the following question in Vietnamese.
#
# Question: {input}
# Answer:
# [/INST]
#     """
# )
#
# # Sử dụng PhoBERT làm mô hình embedding
# tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
# model = AutoModel.from_pretrained("vinai/phobert-base")
#
#
# def embed_text(text):
#     # Đảm bảo rằng đầu vào là một chuỗi hoặc danh sách các chuỗi
#     if isinstance(text, list):
#         text = [str(t) for t in text]
#     else:
#         text = str(text)
#
#     inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
#     outputs = model(**inputs)
#     embeddings = outputs.last_hidden_state.mean(dim=1)
#
#     # Chuyển đổi từ ndarray thành một danh sách phẳng các giá trị float
#     return embeddings.detach().numpy().flatten().astype(float).tolist()
#
#
# # Tạo lớp bọc để tích hợp PhoBERT với Chroma
# from langchain.embeddings.base import Embeddings
#
#
# class PhoBERTEmbeddings(Embeddings):
#     def embed_documents(self, texts):
#         return [embed_text(text) for text in texts]
#
#     def embed_query(self, text):
#         return embed_text(text)
#
#
# embedding_function = PhoBERTEmbeddings()
#
#
# # Đọc danh sách stopwords từ file CSV
# def load_stopwords(file_path):
#     stopwords_df = pd.read_csv(file_path)
#     stopwords = set(stopwords_df.iloc[:, 0].tolist())  # Đọc cột đầu tiên
#     return stopwords
#
#
# STOPWORDS = load_stopwords('C:/thesis/RAG/pythonProject/routes/stopwords.csv')
#
#
# def tokenize(text):
#     # Tách từ bằng underthesea
#     tokens = word_tokenize(text, format="text")
#     # Chuyển văn bản thành chữ thường
#     tokens = tokens.lower()
#     # Xóa dấu câu
#     tokens = tokens.translate(str.maketrans("", "", string.punctuation))
#     # Loại bỏ từ dừng
#     tokens = [word for word in tokens.split() if word not in STOPWORDS]
#     return tokens
#
#
# class BM25:
#     def __init__(self, k1=1.5, b=0.75):
#         self.b = b
#         self.k1 = k1
#
#     def fit(self, corpus):
#         tf = []
#         df = {}
#         idf = {}
#         doc_len = []
#         corpus_size = 0
#         for document in corpus:
#             corpus_size += 1
#             doc_len.append(len(document))
#
#             frequencies = {}
#             for term in document:
#                 term_count = frequencies.get(term, 0) + 1
#                 frequencies[term] = term_count
#
#             tf.append(frequencies)
#
#             for term, _ in frequencies.items():
#                 df_count = df.get(term, 0) + 1
#                 df[term] = df_count
#
#         for term, freq in df.items():
#             idf[term] = math.log(1 + (corpus_size - freq + 0.5) / (freq + 0.5))
#
#         self.tf_ = tf
#         self.df_ = df
#         self.idf_ = idf
#         self.doc_len_ = doc_len
#         self.corpus_ = corpus
#         self.corpus_size = corpus_size
#         self.avg_doc_len_ = sum(doc_len) / corpus_size
#         return self
#
#     def search(self, query):
#         scores = [self._score(query, index) for index in range(self.corpus_size)]
#         return scores
#
#     def _score(self, query, index):
#         score = 0.0
#
#         doc_len = self.doc_len_[index]
#         frequencies = self.tf_[index]
#         for term in query:
#             if term not in frequencies:
#                 continue
#
#             freq = frequencies[term]
#             numerator = self.idf_[term] * freq * (self.k1 + 1)
#             denominator = freq + self.k1 * (1 - self.b + self.b * doc_len / self.avg_doc_len_)
#             score += (numerator / denominator)
#
#         return score
#
#
# def handle_query(vector_store_path, query, conversation_id):
#     print(f"Đang tải vector store từ: {vector_store_path}")
#     try:
#         vector_store = Chroma(persist_directory=vector_store_path, embedding_function=embedding_function)
#     except Exception as e:
#         print(f"Lỗi khi tải vector store: {e}")
#         return jsonify({"error": "Lỗi khi tải vector store", "detail": str(e)}), 500
#
#     # Tách từ query
#     query_tokens = tokenize(query)
#     # Embed query
#     query_vector = embedding_function.embed_query(query)
#
#     # Truy xuất tài liệu từ Chroma
#     print("Retrieving documents with Chroma")
#
#     retriever = vector_store.as_retriever(search_type="similarity",
#                                           search_kwargs={"k": 20})  # Tăng k để thu hồi nhiều tài liệu hơn
#
#     try:
#         all_documents = retriever.invoke({"query": query_vector})
#         print(f"Tổng số tài liệu trước khi áp dụng threshold: {len(all_documents)}")
#     except Exception as e:
#         print(f"Lỗi khi truy xuất tài liệu từ vectorstore: {e}")
#         return jsonify({"error": "Lỗi khi truy xuất tài liệu từ vectorstore", "detail": str(e)}), 500
#
#     if not all_documents:
#         print("Không có tài liệu nào được trả về từ vectorstore")
#         return jsonify({"answer": "Xin lỗi, tôi không tìm thấy tài liệu phù hợp để trả lời câu hỏi của bạn."})
#
#     # Đảm bảo rằng doc.page_content là một chuỗi trước khi chuyển vào embed_query
#     document_scores = [
#         (doc, cosine_similarity([query_vector], [embedding_function.embed_query(str(doc.page_content))])[0][0]) for doc
#         in all_documents]
#
#     # Sắp xếp tài liệu theo điểm tương tự
#     sorted_documents = sorted(document_scores, key=lambda x: x[1], reverse=True)
#     max_score = sorted_documents[0][1] if sorted_documents else 0
#
#     # Thiết lập ngưỡng động dựa trên điểm cao nhất
#     dynamic_threshold = max_score * 0.75
#
#     # Lọc các tài liệu dựa trên ngưỡng động
#     filtered_documents = [doc for doc, score in sorted_documents if score >= dynamic_threshold]
#     print(f"Số tài liệu sau khi áp dụng threshold động: {len(filtered_documents)}")
#
#     if not filtered_documents:
#         print("Không có tài liệu nào vượt qua threshold động")
#         return jsonify({"answer": "Xin lỗi, tôi không tìm thấy tài liệu phù hợp để trả lời câu hỏi của bạn."})
#
#     # Tách từ cho các tài liệu
#     documents_tokens = [tokenize(doc.page_content) for doc in filtered_documents]
#
#     # Tính điểm BM25 cho các tài liệu
#     bm25 = BM25()
#     bm25.fit(documents_tokens)
#     bm25_scores = bm25.search(query_tokens)
#
#     # Kết hợp điểm BM25 và cosine similarity với trọng số khác nhau
#     bm25_weight = 0.7
#     cosine_weight = 0.3
#     combined_scores = [(filtered_documents[i], (bm25_weight * bm25_score + cosine_weight * document_scores[i][1]))
#                        for i, bm25_score in enumerate(bm25_scores)]
#
#     # Sắp xếp tài liệu theo điểm kết hợp
#     top_k_docs = sorted(combined_scores, key=lambda x: x[1], reverse=True)[:7]
#     top_k_documents = [doc for doc, _ in top_k_docs]
#
#     for i, (doc, score) in enumerate(top_k_docs):
#         print(f"Document {i + 1}: {doc.page_content[:200]}... (Combined Score: {score})")
#
#     # Chọn tài liệu hàng đầu
#     if top_k_documents:
#         top_document = top_k_documents[0]
#         context = top_document.page_content
#     else:
#         context = "No relevant document found."
#
#     print(f"Context: {context}")
#     print(f"Query: {query}")
#     is_context_similar_to_query = context.lower().find(query.lower()) != -1
#     print(f"Context có giống với query không? {is_context_similar_to_query}")
#
#     # Điều chỉnh prompt với context thực tế
#     full_prompt = raw_prompt.format(context=context, input=query)
#
#     # Kiểm tra xem context có chứa câu trả lời không
#     if "Answer:" not in full_prompt or full_prompt.endswith("Answer:"):
#         print("Không tìm thấy câu trả lời trong prompt, thêm context từ tài liệu...")
#         if top_k_documents:
#             answer = top_k_documents[0].page_content.strip()[:5000]  # Giới hạn câu trả lời để tránh quá dài
#             full_prompt += f"\nAnswer: {answer}"
#         else:
#             full_prompt += "\nAnswer: Xin lỗi, tôi không tìm thấy tài liệu phù hợp để trả lời câu hỏi của bạn."
#
#     print(f"Full prompt: {full_prompt}")
#
#     print("Gọi LLM với context")
#     try:
#         result = cached_llm.invoke(full_prompt)
#         print(f"Kết quả từ LLM: {result}")
#     except Exception as e:
#         print(f"Lỗi khi gọi LLM: {e}")
#         return jsonify({"error": "Lỗi khi gọi LLM\n", "detail": str(e)}), 500
#
#     if result.startswith("[INST]"):
#         result = result.replace("[INST]", "").strip()
#
#     result_answer = result
#     if result_answer == "Xin lỗi, tôi không biết câu trả lời!":
#         response = handle_low_confidence_answer(query, result_answer, conversation_id)
#         if response == "Xin lỗi, tôi không biết câu trả lời!":
#             response = "Hãy đợi trong giây lát, chúng tôi đang thảo luận câu trả lời."
#             save_unanswered_question(query, conversation_id)
#     else:
#         response = result_answer
#
#     current_time = datetime.utcnow()
#     existing_conversation = database.session.query(Conversation).filter_by(id=conversation_id).first()
#     if not existing_conversation:
#         return jsonify({"error": "Conversation not found"}), 404
#
#     new_qna = Qna(
#         Question=query,
#         Answer=response,
#         conversation_id=conversation_id,
#         created_at=current_time
#     )
#     try:
#         database.session.add(new_qna)
#         database.session.commit()
#         print("Chèn Q&A vào cơ sở dữ liệu thành công!")
#     except Exception as e:
#         database.session.rollback()
#         print(f"Lỗi khi chèn Q&A vào cơ sở dữ liệu: {e}")
#         return jsonify({"error": "Database error", "detail": str(e)}), 500
#
#     return jsonify({"answer": response})
#
#
# def cosine_similarity(vector1, vector2):
#     """Tính điểm tương tự cosine giữa hai vector"""
#     return sklearn_cosine_similarity(vector1, vector2)
#
#
# def save_unanswered_question(query, conversation_id):
#     current_time = datetime.utcnow()
#     new_qna = Qna(
#         Question=query,
#         Answer="unanswer",
#         conversation_id=conversation_id,
#         created_at=current_time
#     )
#     try:
#         database.session.add(new_qna)
#         database.session.commit()
#         print("Chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu thành công!")
#     except Exception as e:
#         database.session.rollback()
#         print(f"Lỗi khi chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu: {e}")
#
# def update_field_statistics(field_name):
#     field_stat = FieldStatistics.query.first()
#     if not field_stat:
#         field_stat = FieldStatistics()
#         database.session.add(field_stat)
#         database.session.commit()
#
#     if field_name == 'Tài Khoản':
#         field_stat.taikhoan += 1
#     elif field_name == 'Bảo Hiểm':
#         field_stat.baohiem += 1
#     elif field_name == 'Hồ Sơ Bảo Hiểm':
#         field_stat.hosobaohiem += 1
#     elif field_name == 'Thẻ':
#         field_stat.the += 1
#     elif field_name == 'Đầu Tư':
#         field_stat.dautu += 1
#
#     database.session.commit()
#
# @bp.route("/ask_pdf", methods=["POST"])
# def askPDFPost():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#     return handle_query(base_folder_path, query, conversation_id)
#
#
# # _______________________________________________________________________Thẻ_____________________________________________________________
# @bp.route("/ask_pdf/the", methods=["POST"])
# def askPDFThe():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#     the_path = os.path.join(base_folder_path, "Thẻ")
#     update_field_statistics('Thẻ')
#     return handle_query(the_path, query, conversation_id)
#
# # ______________________________________________________________________________________________________________________________________________
#
# # _______________________________________________________________________Bảo Hiểm_____________________________________________________________
# @bp.route("/ask_pdf/baohiem", methods=["POST"])
# def askPDFBaoHiem():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#     bao_hiem_path = os.path.join(base_folder_path, "Bảo Hiểm")
#     update_field_statistics('Bảo Hiểm')
#     return handle_query(bao_hiem_path, query, conversation_id)
#
# # ______________________________________________________________________________________________________________________________________________
#
# # ________________________________________________________________________Đầu Tư_____________________________________________________________
# @bp.route("/ask_pdf/dautu", methods=["POST"])
# def askPDFDauTu():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#     dau_tu_path = os.path.join(base_folder_path, "Đầu Tư")
#     update_field_statistics('Đầu Tư')
#     return handle_query(dau_tu_path, query, conversation_id)
#
# # ______________________________________________________________________________________________________________________________________________
#
# # ________________________________________________________________________Tài Khoản____________________________________________________________
# @bp.route("/ask_pdf/taikhoan", methods=["POST"])
# def askPDFTaiKhoan():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#     tai_khoan_path = os.path.join(base_folder_path, "Tài Khoản")
#     update_field_statistics('Tài Khoản')
#     return handle_query(tai_khoan_path, query, conversation_id)
#
# # ______________________________________________________________________________________________________________________________________________
#
# @bp.route("/unanswered_questions", methods=["GET"])
# def get_unanswered_questions():
#     try:
#         unanswered_questions = database.session.query(Qna).filter_by(Answer="unanswer").all()
#         questions_list = []
#         for qna in unanswered_questions:
#             conversation = database.session.query(Conversation).filter_by(id=qna.conversation_id).first()
#             user_details = conversation.user if conversation else None
#             questions_list.append({
#                 "question": qna.Question,
#                 "conversation_id": qna.conversation_id,
#                 "user_details": user_details
#             })
#         return jsonify(questions_list)
#     except Exception as e:
#         print(f"Lỗi khi truy vấn các câu hỏi chưa được trả lời: {e}")
#         return jsonify({"error": "Lỗi khi truy vấn các câu hỏi chưa được trả lời", "detail": str(e)}), 500
#
# # _______________________________________________________________________Hồ Sơ Bảo Hiểm_____________________________________________________________
# @bp.route("/ask_pdf/HSBH", methods=["POST"])
# def askPDFHSBH():
#     json_content = request.json
#     query = json_content.get("query")
#     conversation_id = json_content.get("conversation_id")
#
#     # Kiểm tra xem query có chứa mã hồ sơ và mật khẩu không
#     if 'HSBH:' not in query or 'MK:' not in query:
#         prompt_message = "Vui lòng nhập mã hồ sơ và mật khẩu theo định dạng: HSBH:<mã hồ sơ>, MK:<mật khẩu>"
#         # Gọi LLM với prompt_message
#         result = cached_llm.invoke(prompt_message)
#
#         current_time = datetime.utcnow()
#         new_qna = Qna(
#             Question=query,
#             Answer=prompt_message,
#             conversation_id=conversation_id,
#             created_at=current_time
#         )
#         try:
#             database.session.add(new_qna)
#             database.session.commit()
#             print("Chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu thành công!")
#         except Exception as e:
#             database.session.rollback()
#             print(f"Lỗi khi chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu: {e}")
#
#         return jsonify({"answer": prompt_message}), 400
#
#     try:
#         # Tách mã hồ sơ và mật khẩu từ query
#         parts = query.split(',')
#         ma_ho_so = parts[0].split(':')[1].strip()
#         mat_khau = parts[1].split(':')[1].strip()
#
#         # Tạo đường dẫn tới thư mục vectorstore của mã hồ sơ
#         hsbh_path = os.path.join(base_folder_path, "Hồ Sơ Bảo Hiểm")
#
#         # Kiểm tra xem thư mục vectorstore có tồn tại không
#         if not os.path.exists(hsbh_path):
#             return jsonify({"answer": "Mã hồ sơ không tồn tại"}), 404
#
#         # Tạo Chroma vector store từ thư mục vectorstore
#         vector_store = Chroma(persist_directory=hsbh_path, embedding_function=embedding_function)
#
#         # Kiểm tra mật khẩu trong vector store
#         documents = vector_store.similarity_search("", k=1000)  # Lấy tất cả tài liệu
#         valid_document = None
#         for doc in documents:
#             if ma_ho_so in doc.page_content and mat_khau in doc.page_content:
#                 valid_document = doc
#                 break
#
#         if not valid_document:
#             answer = "Mã hồ sơ hoặc mật khẩu không chính xác"
#             current_time = datetime.utcnow()
#             new_qna = Qna(
#                 Question=query,
#                 Answer=answer,
#                 conversation_id=conversation_id,
#                 created_at=current_time
#             )
#             try:
#                 database.session.add(new_qna)
#                 database.session.commit()
#                 print("Chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu thành công!")
#             except Exception as e:
#                 database.session.rollback()
#                 print(f"Lỗi khi chèn câu hỏi chưa được trả lời vào cơ sở dữ liệu: {e}")
#
#             return jsonify({"answer": answer}), 401
#
#         update_field_statistics('Hồ Sơ Bảo Hiểm')
#
#         # Trả về tài liệu hợp lệ
#         return jsonify({"answer": valid_document.page_content}), 200
#
#     except Exception as e:
#         print(f"Lỗi khi xử lý query: {e}")
#         return jsonify({"error": "Lỗi khi xử lý query"}), 500
#
# @bp.route("/tts", methods=["POST"])
# def text_to_speech():
#     json_content = request.json
#     text = json_content.get("text")
#     api_key = 'oLa1vIKToA5u2Aw8DQ1z51ZQFC6t3dUV'
#     url = 'https://api.fpt.ai/hmi/tts/v5'
#     headers = {
#         'api-key': api_key,
#         'speed': '',
#         'voice': 'banmai'
#     }
#     response = requests.post(url, data=text.encode('utf-8'), headers=headers)
#     if response.status_code == 200:
#         return jsonify({"audio_url": response.json().get("async")})
#     else:
#         return jsonify({"error": "Failed to convert text to speech", "detail": response.text}), response.status_code
#
# @bp.route("/stt", methods=["POST"])
# def speech_to_text():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file part"}), 400
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
#     if file:
#         filename = secure_filename(file.filename)
#         with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
#             tmp_file.write(file.read())
#             tmp_file_path = tmp_file.name
#         try:
#             api_key = 'oLa1vIKToA5u2Aw8DQ1z51ZQFC6t3dUV'
#             url = 'https://api.fpt.ai/hmi/asr/general'
#             with open(tmp_file_path, 'rb') as audio_file:
#                 payload = audio_file.read()
#             headers = {
#                 'api-key': api_key
#             }
#             response = requests.post(url, data=payload, headers=headers)
#             if response.status_code == 200:
#                 return jsonify(response.json())
#             else:
#                 return jsonify({"error": "Failed to convert speech to text", "detail": response.text}), response.status_code
#         except Exception as e:
#             return jsonify({"error": str(e)}), 500
#         finally:
#             os.remove(tmp_file_path)  # Clean up the temporary file
#     return jsonify({"error": "Unknown error"}), 500
#
# @bp.route("/field_statistics/total", methods=["GET"])
# def get_field_statistics_total():
#     try:
#         field_stat = FieldStatistics.query.first()
#         if field_stat:
#             total_questions = (
#                 field_stat.taikhoan +
#                 field_stat.baohiem +
#                 field_stat.hosobaohiem +
#                 field_stat.the +
#                 field_stat.dautu
#             )
#             return jsonify({"total_questions": total_questions})
#         else:
#             return jsonify({"error": "No statistics found"}), 404
#     except Exception as e:
#         print(f"Lỗi khi lấy tổng số lượng các lĩnh vực: {e}")
#         return jsonify({"error": "Lỗi khi lấy tổng số lượng các lĩnh vực", "detail": str(e)}), 500
#
# @bp.route("/field_statistics", methods=["GET"])
# def get_field_statistics():
#     try:
#         field_stat = FieldStatistics.query.first()
#         if field_stat:
#             stats = {
#                 "Tài Khoản": field_stat.taikhoan,
#                 "Bảo Hiểm": field_stat.baohiem,
#                 "Hồ Sơ Bảo Hiểm": field_stat.hosobaohiem,
#                 "Thẻ": field_stat.the,
#                 "Đầu Tư": field_stat.dautu
#             }
#             return jsonify(stats)
#         else:
#             return jsonify({"error": "No statistics found"}), 404
#     except Exception as e:
#         print(f"Lỗi khi lấy thống kê lĩnh vực: {e}")
#         return jsonify({"error": "Lỗi khi lấy thống kê lĩnh vực", "detail": str(e)}), 500

