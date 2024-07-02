# thesis
Thesis Retrieval Augmented Generation Chatbot


Author: Thanh Phat Hoang



Language: Python, Reactjs.



Database: mySQL.



Technology: Langchain, Olama.
![image](https://github.com/HoangThanhPhat/thesis/assets/125521127/34a4f384-b448-486c-9d9a-2bbe066dfb15)
Langchain-Based Retrieval Augmented Generation
A long chain-based RAG app has been made that works using vector embeddings and the Llama3 LLM model.

1.1 Data Preprocessing



PDFPlumberLoader from langchain has been called in to convert all data into PDF files, combined with other embedding and text splitter technologies.




1.2 Model Used






The Llama3 model has been used for getting contextual chat completion.
cached_llm = Ollama(model= "llama3")

1.3 Vector Store




Chroma





Chroma is an AI-native open-source vector database focused on developer productivity and happiness. Chroma is licensed under Apache 2.0.




vector_store = Chroma.from_documents(documents=chunks, embedding=embedding, persist_directory=folder_path)






vector_store.persist()

1.4 Langchain Prompt Template
PromptTemplate has been used from langchain to craft efficient prompts which would later be passed on to the model. The prompt also contains input variables which indicate to the model that some information will be passed in by the user.



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
""")

1.5 Retreival Chain



Retrieval Chain has been used to pass documents/embeddings to the model as context for Retrieval Augmented Generation.




document_chain = create_stuff_documents_chain(cached_llm, raw_prompt)





chain = create_retrieval_chain(retriever, document_chain)

1.6 Query User Interface



Demo 
![image](https://github.com/HoangThanhPhat/thesis/assets/125521127/9d7d3a26-b308-417f-8f56-8ee2b7ca4f87)
