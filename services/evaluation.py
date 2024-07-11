import nltk
from collections import defaultdict
from rouge import Rouge
from nltk.translate.meteor_score import meteor_score
from bert_score import BERTScorer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, fbeta_score, roc_auc_score, log_loss, confusion_matrix
from nltk.translate.bleu_score import sentence_bleu
import numpy as np
import warnings
from sklearn.feature_extraction.text import CountVectorizer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import matplotlib.pyplot as plt
import seaborn as sns

# Download NLTK data
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('stopwords')

warnings.filterwarnings('ignore')

# Initialize BERTScorer
scorer = BERTScorer(model_type="bert-base-uncased", num_layers=8)

# Define true answers and generated answers for evaluation
true_answers = {
    "Ứng dụng Techcombank Mobile là gì?": "Là ứng dụng không chỉ giúp khách hàng chuyển tiền, thanh toán, quản lý tài chính cá nhân thuận tiện, dễ dàng và nhanh chóng mà còn giúp bạn có thể đăng ký mở tài khoản, đăng ký dịch vụ ngân hàng trực tuyến để sử dụng sản phẩm, dịch vụ của Techcombank ở bất cứ nơi đâu và bất kỳ lúc nào.",
    "Ứng dụng Techcombank Mobile có thể sử dụng trên thiết bị nào?": "Khách hàng có thể sử dụng ứng dụng Techcombank Mobile trên các thiết bị di động có hệ điều hành iOS từ 14.0 trở lên và Android 7.0 trở lên. Ngoài ra, Techcombank Mobile khôngđược hỗ trợ cài đặt trên các thiết bị đã can thiệp ở mức độ hệ điều hành (jail break, unlock,rooted,...) nhằm bảo đảm an toàn bảo mật tài khoản và giao dịch của khách hàng.",
    "Tại sao tôi không nhận được mã OTP gửi từ Techcombank?": "Mã OTP sẽ được Techcombank gửi đến số điện thoại đã đăng ký với ngân hàng của bạn. Ngoài ra bạn cần đảm bảo thiết bị của bạn không cài đặt chặn tin nhắn được gửi từ Techcombank đến số điện thoại này.",
    "Tôi có bắt buộc phải thiết lập sinh trắc học để sử dụng ứng dụng không?": "Việc thiết lập cho phép sử dụng sinh trắc học trên ứng dụng là không bắt buộc. Bạn có thể bỏ qua bước này và thực hiện thiết lập sau bằng cách bấm vào lựa chọn .",
    "Mã mở khóa được dùng để làm gì?": "Bạn bắt buộc tạo mã mở khóa để sử dụng cho việc đăng nhập ứng dụng và xác thực giao dịch.",
    "Thiết lập sinh trắc học để làm gì?": "Việc thiết lập sinh trắc học (vân tay/ khuôn mặt) giúp đăng nhập ứng dụng nhanh hơn và để sử dụng khi xác thực giao dịch. Tuy nhiên việc thiết lập này là không bắt buộc.",
    "Tôi muốn cài lại ứng dụng Techcombank Mobile trên thiết bị mới để sử dụng. Tôi phải làm gì?": "Quý khách vui lòng soạn tin nhắn trên thiết bị cũ để gỡ bỏ trước khi chuyển sang sử dụng ứng dụng trên thiết bị mới. Tin nhắn được gửi từ số điện thoại đã đăng ký với ngân hàng theo cú pháp: TCB HUY SMARTOTP gửi tới 8049. Quý khách cũng có thể gọi điện tới tổng đài 1800 588 822 hoặc tới CN/PGD Techcombank gần nhất để được hỗ trợ.",
    "Dịch vụ chuyển khoản nhanh 24/7 có gì khác so với chuyển liên ngân hàng?": "Khi sử dụng dịch vụ chuyển khoản nhanh 24/7, bạn sẽ được trải nghiệm thao tác chuyển tiền đơn giản, rút ngắn thời gian trong việc nhận và chuyển tiền ngoài Techcombank. Việc chuyển tiền thực hiện được mọi lúc, không bị phụ thuộc vào thời gian giao dịch của Ngân hàng. Trong khi đó, khi chuyển thường, bạn cần chờ trong vòng 1 ngày làm việc để giao dịch được thực hiện thành công.",
    "Làm thế nào để chuyển khoản qua số điện thoại?": "Để chuyển khoản qua số điện thoại, bạn cần liên kết số điện thoại với một trong các tài khoản thanh toán của mình bằng cách chọn 'Liên kết số điện thoại' trong mục 'Cài đặt'.",
    "Tôi có thể thanh toán bằng mã QR tại các đơn vị chấp nhận thanh toán nào?": "Hiện tại tính năng thanh toán qua QR code của Techcombank được chấp nhận thanh toán tại tất cả các đơn vị thanh toán của VN PAY và mPOS",
    "Tôi có thể nạp tiền di động trả trước hoặc thanh toán hóa đơn di động trả sau cho người khác trên Techcombank Mobile được không?": "Bạn có thể nạp tiền di động trả trước hoặc thanh toán hóa đơn di động trả sau cho người khác trừ nhà mạng Viettel.",
    "Biểu đồ chi tiêu dùng để làm gì?": "Công cụ này được coi như một trợ lý tài chính cho người dùng, hỗ trợ bạn quản lý tài chính cá nhân bằng cách theo dõi thu chi trong một chu kỳ chi tiêu do chính bạn tự thiết lập. Tùy theo tình trạng chi tiêu tại từng thời điểm, bạn sẽ nhận được các thông điệp khác nhau từ ứng dụng để hỗ trợ quản lý chi tiêu tốt hơn. Biểu đồ này gồm 3 cột biểu thị cho dòng tiền vào, dòng tiền ra của tất cả các tài khoản mà bạn đang sở hữu cũng như số tiền tiết kiệm trong chu kỳ chi tiêu.",
    "Thời gian thẻ bị khóa khi sử dụng tính năng Khóa thẻ là bao lâu?": "Thẻ tạm thời bị khóa đến khi bạn mở khóa thẻ bằng cách thực hiện ngay trên ứng dụng này",
    "Tôi có thể mở tài khoản tiền gửi nào trên Techcombank Mobile?": "Hiện tại bạn có thể mở tài khoản tiền gửi online trên ứng dụng Techcombank Mobile với sản phẩm Phát Lộc online và Tiền gửi online."
}

generated_answers = {
    "Ứng dụng Techcombank Mobile là gì?": "Chào bạn, Tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay? Câu hỏi của bạn là: Ứng dụng Techcombank Mobile là gì? Trả lời: Ứng dụng Techcombank Mobile là ứng dụng di động cho phép khách hàng truy cập và quản lý tài khoản Techcombank, bao gồm các chức năng như tra cứu thông tin tài khoản, thực hiện giao dịch, nộp tiền và nhận tiền... Hãy tiếp tục hỏi thêm về các vấn đề của bạn!",
    "Ứng dụng Techcombank Mobile có thể sử dụng trên thiết bị nào?": "Chào bạn, tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay? Về câu hỏi của bạn, ứng dụng Techcombank Mobile có thể sử dụng trên các thiết bị di động chạy hệ điều hành Android và iOS. Bạn có thể tải xuống và cài đặt ứng dụng này để thực hiện nhiều chức năng như quản lý tài khoản, thanh toán hóa đơn, gửi tiền... rất tiện lợi!",
    "Tại sao tôi không nhận được mã OTP gửi từ Techcombank?": "Kính thưa khách hàng, tại sao bạn không nhận được mã OTP gửi từ Techcombank? Tôi khuyên bạn nên kiểm tra lại số điện thoại đã đăng ký với ngân hàng của mình và đảm bảo thiết bị của bạn không cài đặt chặn tin nhắn được gửi đến từ Techcombank. Nếu vấn đề vẫn diễn ra, vui lòng liên hệ với chúng tôi để trợ giúp thêm. Xin chào!",
    "Tôi có bắt buộc phải thiết lập sinh trắc học để sử dụng ứng dụng không?": "Chào bạn, Techcombank AI có thể giúp gì cho bạn hôm nay? Về câu hỏi của bạn, không bắt buộc phải thiết lập sinh trắc học để sử dụng ứng dụng. Bạn có thể sử dụng ứng dụng mà không cần thiết lập sinh trắc học, tuy nhiên thiết lập sinh trắc học sẽ giúp bạn đăng nhập nhanh hơn và xác thực giao dịch dễ dàng hơn.",
    "Mã mở khóa được dùng để làm gì?": "Mã mở khóa được dùng để tạo mã để sử dụng cho việc đăng nhập ứng dụng và xác thực giao dịch. Bạn được yêu cầu bắt buộc tạo mã mở khóa để sử dụng cho việc đăng nhập ứng dụng và xác thực giao dịch.",
    "Thiết lập sinh trắc học để làm gì?": "Bạn có thể thiết lập sinh trắc học để sử dụng vân tay/ khuôn mặt trong việc đăng nhập ứng dụng và xác thực giao dịch. Tuy nhiên, việc thiết lập này là không bắt buộc.",
    "Tôi muốn cài lại ứng dụng Techcombank Mobile trên thiết bị mới để sử dụng. Tôi phải làm gì?": "Chào bạn, tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay? Về vấn đề cài lại ứng dụng Techcombank Mobile trên thiết bị mới, bạn có thể làm theo các bước sau: 1. Xóa ứng dụng Techcombank Mobile cũ trên thiết bị. 2. Tải xuống và cài đặt lại ứng dụng Techcombank Mobile từ CH Play (đối với Android) hoặc App Store (đối với iOS). 3. Đăng nhập vào ứng dụng với thông tin tài khoản của bạn. Sau khi cài đặt xong, bạn có thể sử dụng ứng dụng Techcombank Mobile như bình thường. Nếu bạn cần giúp đỡ thêm về vấn đề này, vui lòng hỏi lại!",
    "Dịch vụ chuyển khoản nhanh 24/7 có gì khác so với chuyển liên ngân hàng?": "Chào bạn, dịch vụ chuyển khoản nhanh 24/7 của Techcombank có điểm khác biệt là cho phép thực hiện thao tác chuyển tiền đơn giản, rút ngắn thời gian trong việc nhận và chuyển tiền ngoài Techcombank. Ngoài ra, dịch vụ này còn không bị phụ thuộc vào thời gian giao dịch của Ngân hàng, giúp khách hàng có thể thực hiện giao dịch tại mọi lúc. Và để sử dụng dịch vụ chuyển khoản nhanh 24/7, số tiền giao dịch của bạn phải lớn hơn 50.000 đồng nhưng không vượt quá 500.000.000 đồng, như vậy nếu giao dịch của bạn là 1 tỷ đồng thì không thể thực hiện được. Hi vọng thông tin trên sẽ giúp ích cho bạn!",
    "Làm thế nào để chuyển khoản qua số điện thoại?": "Chào bạn, Techcombank AI giúp gì cho bạn hôm nay? Bạn hỏi làm thế nào để chuyển khoản qua số điện thoại. Tôi xin trả lời rằng với tài khoản thanh toán và dịch vụ Ngân hàng số đăng ký theo phương thức eKYC, bạn có thể sử dụng chức năng chuyển tiền mặt qua ứng dụng của Techcombank. Bạn chỉ cần nhập số điện thoại, mật khẩu và xác nhận giao dịch là xong!",
    "Tôi có thể thanh toán bằng mã QR tại các đơn vị chấp nhận thanh toán nào?": "Bạn có thể thanh toán bằng mã QR tại tất cả các đơn vị thanh toán của VN PAY và mPOS.",
    "Tôi có thể nạp tiền di động trả trước hoặc thanh toán hóa đơn di động trả sau cho người khác trên Techcombank Mobile được không?": "Bạn có thể nạp tiền di động trả trước hoặc thanh toán hóa đơn di động trả sau cho người khác trừ nhà mạng Viettel.",
    "Biểu đồ chi tiêu dùng để làm gì?": "Chào bạn, Tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay? Bạn hỏi: Bạn có thể cho tôi thêm thông tin chi tiết về biểu đồ chi tiêu không, như này tôi không hiểu rõ. Tôi có thể cung cấp thông tin về biểu đồ chi tiêu của chúng tôi. Biểu đồ chi tiêu là công cụ hữu ích giúp bạn quản lý tài chính hiệu quả hơn. Chúng tôi sẽ giúp bạn ghi chép các giao dịch, tạo ra một bức tranh về thu nhập và chi phí để bạn có thể đưa ra quyết định tài chính sáng suốt. Mọi thông tin chi tiết về biểu đồ chi tiêu của chúng tôi, vui lòng tham khảo tại trang website của Techcombank hoặc đến Chi nhánh gần nhất để được hỗ trợ thêm. Xin chào!",
    "Thời gian thẻ bị khóa khi sử dụng tính năng Khóa thẻ là bao lâu?": "Thưa khách hàng, thẻ tạm thời bị khóa đến khi bạn mở khóa thẻ bằng cách thực hiện ngay trên ứng dụng này.",
    "Tôi có thể mở tài khoản tiền gửi nào trên Techcombank Mobile?": "Chào bạn, tôi là Techcombank AI. Tôi có thể giúp gì cho bạn hôm nay? Về câu hỏi của bạn, bạn có thể mở các sổ tiết kiệm được tạo tại quầy qua ứng dụng Techcombank Mobile. Ngoài ra, bạn cũng có thể mở tài khoản tiền gửi khác trên ứng dụng này, bao gồm nhưng không giới hạn là Tài khoản tiền gửi thanh toán, Tài khoản tiền gửi dài hạn,... Mọi chi tiết về cách mở tài khoản, vui lòng xem lại hướng dẫn trong ứng dụng hoặc liên hệ với chúng tôi để được tư vấn."
}

def calculate_nlp_metrics(true_answers, generated_answers):
    meteor_scores = {}
    rouge = Rouge()
    rouge_scores = {}
    bert_scores = {}

    for key, true_sentence in true_answers.items():
        reference = true_sentence.split()
        hypothesis = generated_answers[key].split()

        # Calculate METEOR score for each key
        meteor_scores[key] = meteor_score([reference], hypothesis)

        # Calculate ROUGE scores
        rouge_scores[key] = rouge.get_scores(' '.join(hypothesis), ' '.join(reference), avg=True)

        # Calculate BERT scores
        precision, recall, f1 = scorer.score([" ".join(hypothesis)], [" ".join(reference)])
        bert_scores[key] = {
            'precision': precision.mean().item(),
            'recall': recall.mean().item(),
            'f1': f1.mean().item()
        }

    return meteor_scores, rouge_scores, bert_scores


# Function to calculate basic classification metrics
def calculate_basic_metrics(true_labels, predicted_labels):
    return {
        'Accuracy': accuracy_score(true_labels, predicted_labels),
        'Precision': precision_score(true_labels, predicted_labels),
        'Recall': recall_score(true_labels, predicted_labels),
        'F1 Score': f1_score(true_labels, predicted_labels)
    }

# Function to calculate F-beta scores with configurability
def calculate_fbeta_scores(true_labels, predicted_labels, beta=1.0):
    return {
        f'F{beta} Score': fbeta_score(true_labels, predicted_labels, beta=beta)
    }

# Convert the true and generated answers into binary labels for classification metrics
true_binary = [1 if true_answers[key] == generated_answers[key] else 0 for key in true_answers]
predicted_binary = [1 if true_answers[key] == generated_answers[key] else 0 for key in true_answers]

# Function to calculate BLEU score for text evaluation
def calculate_text_metrics(true_answers, generated_answers):
    bleu_scores = defaultdict(float)

    for key in true_answers:
        true_sentence = true_answers[key]
        generated_sentence = generated_answers[key]
        reference = [true_sentence.split()]
        hypothesis = generated_sentence.split()
        bleu_scores[key] = sentence_bleu(reference, hypothesis)

    return bleu_scores


# Advanced Composite Metrics
def calculate_advanced_composite_metrics(true_labels, predicted_labels, references, hypotheses):
    f2 = fbeta_score(true_labels, predicted_labels, beta=2)
    f0_5 = fbeta_score(true_labels, predicted_labels, beta=0.5)
    bleu = calculate_text_metrics(true_answers, generated_answers)
    meteor, rouge, bert = calculate_nlp_metrics(true_answers, generated_answers)

    return {
        'F2 Score': f2,
        'F0.5 Score': f0_5,
        'BLEU': bleu,
        'METEOR': meteor,
        'ROUGE': rouge,
        'BERTScore': bert
    }

# Probability and Uncertainty Metrics
def calculate_probability_metrics(y_true, y_pred, probs):
    return {
        'Cross-Entropy': log_loss(y_true, y_pred),
        'Per-token Perplexity': perplexity(probs)
    }


def perplexity(probs):
    return np.exp(-np.mean(np.log(probs)))


# Diversity and Novelty Metrics
def calculate_diversity_metrics(sentences):
    return {
        'Distinct-1': distinct_n(1, sentences),
        'Distinct-2': distinct_n(2, sentences),
        'Self-BLEU': self_bleu(sentences)
    }


def distinct_n(n, sentences):
    ngrams = [tuple(sent.split()[i:i + n]) for sent in sentences for i in range(len(sent.split()) - n + 1)]
    return len(set(ngrams)) / len(ngrams)


def self_bleu(sentences):
    return np.mean([sentence_bleu([s.split() for s in sentences if s != sent], sent.split()) for sent in sentences])


# Ranking and Retrieval Metrics
def calculate_ranking_metrics(true_labels, predicted_scores, ranks, k):
    return {
        'MRR': mean_reciprocal_rank(ranks),
        'Hit@K': hit_rate_at_k(true_labels, predicted_scores, k),
        'AUC': roc_auc_score(true_labels, predicted_scores[:len(true_labels)])
    }


def mean_reciprocal_rank(ranks):
    return np.mean([1 / rank for rank in ranks if rank > 0])


def hit_rate_at_k(true_labels, predicted_scores, k):
    hits = 0
    for true, pred in zip(true_labels, predicted_scores):
        top_k_preds = np.argsort(pred)[-k:]
        if true in top_k_preds:
            hits += 1
    return hits / len(true_labels)


# Semantic and Contextual Evaluation Metrics
def calculate_semantic_contextual_metrics(references, hypotheses):
    return {
        'Semantic Similarity': semantic_similarity(references, hypotheses),
        'Jaccard Index': jaccard_index(set(references), set(hypotheses))
    }


def semantic_similarity(references, hypotheses):
    vectorizer = CountVectorizer().fit_transform(references + hypotheses)
    vectors = vectorizer.toarray()
    cosine_similarities = np.dot(vectors[:len(references)], vectors[len(references):].T)
    return np.mean(cosine_similarities)


def jaccard_index(set1, set2):
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union


# RAG-specific Metrics
def calculate_rag_specific_metrics(references, hypotheses):
    return {
        'Toxicity': toxicity(hypotheses),
        'Hallucination': hallucination(references, hypotheses),
        'Relevance': relevance(references, hypotheses)
    }


def toxicity(texts, model_name='unitary/toxic-bert'):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    inputs = tokenizer(texts, return_tensors='pt', truncation=True, padding=True)
    outputs = model(**inputs)
    scores = torch.softmax(outputs.logits, dim=-1)
    return scores[:, 1].mean().item()


def hallucination(references, hypotheses):
    hallucination_scores = []
    for ref, hyp in zip(references, hypotheses):
        reference_set = set(ref.split())
        hypothesis_set = set(hyp.split())
        hallucinated = hypothesis_set - reference_set
        hallucination_scores.append(len(hallucinated) / len(hypothesis_set))
    return np.mean(hallucination_scores)


def relevance(references, hypotheses):
    relevance_scores = []
    for ref, hyp in zip(references, hypotheses):
        reference_set = set(ref.split())
        hypothesis_set = set(hyp.split())
        relevant = reference_set & hypothesis_set
        relevance_scores.append(len(relevant) / len(reference_set))
    return np.mean(relevance_scores)

# Calculate all metrics
binary_metrics = calculate_basic_metrics(true_binary, predicted_binary)
fbeta_metrics = calculate_fbeta_scores(true_binary, predicted_binary, beta=2)
bleu_scores = calculate_text_metrics(true_answers, generated_answers)
meteor_scores, rouge_scores, bert_scores = calculate_nlp_metrics(true_answers, generated_answers)
advanced_metrics = calculate_advanced_composite_metrics(true_binary, predicted_binary, list(true_answers.values()), list(generated_answers.values()))
probability_metrics = calculate_probability_metrics(true_binary, predicted_binary, [0.8, 0.6, 0.7])
diversity_metrics = calculate_diversity_metrics(list(generated_answers.values()))
ranking_metrics = calculate_ranking_metrics(true_binary, [0.8, 0.6, 0.7, 0.4, 0.3, 0.2, 0.1, 0.9, 0.95, 0.85, 0.75, 0.65, 0.55, 0.45], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], k=2)
semantic_contextual_metrics = calculate_semantic_contextual_metrics(list(true_answers.values()), list(generated_answers.values()))
rag_specific_metrics = calculate_rag_specific_metrics(list(true_answers.values()), list(generated_answers.values()))

# Print metrics in a readable format
def print_metrics(title, metrics):
    print(f"\n{title}")
    print("-" * len(title))
    for key, value in metrics.items():
        if isinstance(value, dict):
            print(f"{key}:")
            for sub_key, sub_value in value.items():
                print(f"  {sub_key}: {sub_value}")
        else:
            print(f"{key}: {value}")

def visualize_all_metrics(true_binary, predicted_binary, true_answers, generated_answers):
    binary_metrics = calculate_basic_metrics(true_binary, predicted_binary)
    fbeta_metrics = calculate_fbeta_scores(true_binary, predicted_binary, beta=2)
    meteor_scores, rouge_scores, bert_scores = calculate_nlp_metrics(true_answers, generated_answers)
    probability_metrics = calculate_probability_metrics(true_binary, predicted_binary, [0.8] * len(true_binary))
    diversity_metrics = calculate_diversity_metrics(list(generated_answers.values()))
    ranking_metrics = calculate_ranking_metrics(true_binary, [0.8] * len(true_binary), list(range(1, len(true_binary) + 1)), k=2)
    semantic_contextual_metrics = calculate_semantic_contextual_metrics(list(true_answers.values()), list(generated_answers.values()))
    rag_specific_metrics = calculate_rag_specific_metrics(list(true_answers.values()), list(generated_answers.values()))

    # Confusion Matrix
    fig, ax = plt.subplots(figsize=(10, 5))
    cm = confusion_matrix(true_binary, predicted_binary)
    print("Confusion Matrix:\n", cm)
    sns.heatmap(cm, annot=True, fmt='d', ax=ax, cmap='Blues')
    ax.set_title('Confusion Matrix')
    ax.set_xlabel('Predicted Labels')
    ax.set_ylabel('True Labels')
    plt.show()

    # Binary Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(binary_metrics.keys(), binary_metrics.values(), color='skyblue')
    ax.set_title('Binary Classification Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # F-beta Scores
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(fbeta_metrics.keys(), fbeta_metrics.values(), color='lightgreen')
    ax.set_title('F-Beta Scores')
    ax.set_ylim(0, 1.1)
    plt.show()

    # METEOR Scores
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(meteor_scores.keys(), meteor_scores.values(), color='orange')
    ax.set_title('METEOR Scores')
    ax.set_ylim(0, 1.1)
    plt.show()

    # ROUGE Scores
    fig, ax = plt.subplots(figsize=(10, 5))
    rouge_f_scores = {key: value['rouge-l']['f'] for key, value in rouge_scores.items()}
    ax.bar(rouge_f_scores.keys(), rouge_f_scores.values(), color='purple')
    ax.set_title('ROUGE-L F Scores')
    ax.set_ylim(0, 1.1)
    plt.show()

    # BERT F1 Scores
    fig, ax = plt.subplots(figsize=(10, 5))
    bert_f1_scores = {key: score['f1'] for key, score in bert_scores.items()}
    ax.bar(bert_f1_scores.keys(), bert_f1_scores.values(), color='red')
    ax.set_title('BERT F1 Scores')
    ax.set_ylim(0, 1.1)
    plt.show()

    # Probability Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(probability_metrics.keys(), probability_metrics.values(), color='cyan')
    ax.set_title('Probability Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # Diversity Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(diversity_metrics.keys(), diversity_metrics.values(), color='magenta')
    ax.set_title('Diversity Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # Ranking Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(ranking_metrics.keys(), ranking_metrics.values(), color='gold')
    ax.set_title('Ranking Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # Semantic and Contextual Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(semantic_contextual_metrics.keys(), semantic_contextual_metrics.values(), color='silver')
    ax.set_title('Semantic and Contextual Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # RAG-specific Metrics
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(rag_specific_metrics.keys(), rag_specific_metrics.values(), color='teal')
    ax.set_title('RAG-specific Metrics')
    ax.set_ylim(0, 1.1)
    plt.show()

    # Thresholds for Metrics
    thresholds = {
        'Accuracy': 0.9, 'Precision': 0.8, 'Recall': 0.8, 'F1 Score': 0.85, 'F2 Score': 0.8, 'F0.5 Score': 0.8,
        'BLEU': 0.5, 'METEOR': 0.5, 'ROUGE': 0.5, 'BERTScore': 0.85, 'Cross-Entropy': 0.3, 'Per-token Perplexity': 20,
        'Distinct-1': 0.5, 'Distinct-2': 0.5, 'Self-BLEU': 0.3, 'MRR': 0.8, 'Hit@K': 0.8, 'AUC': 0.85,
        'Semantic Similarity': 0.8, 'Jaccard Index': 0.8, 'Toxicity': 0.2, 'Hallucination': 0.1, 'Relevance': 0.8
    }

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(thresholds.keys(), thresholds.values(), color='lightcoral')
    ax.set_title('Target Thresholds')
    ax.set_ylim(0, 1.1)
    plt.show()

def main():
    print_metrics("Binary Metrics", binary_metrics)
    print_metrics("F-Beta Metrics", fbeta_metrics)
    print_metrics("BLEU Scores", bleu_scores)
    print_metrics("METEOR Scores", meteor_scores)
    print_metrics("ROUGE Scores", {k: v['rouge-l']['f'] for k, v in rouge_scores.items()})
    print_metrics("BERTScore", bert_scores)
    print_metrics("Advanced Composite Metrics", advanced_metrics)
    print_metrics("Probability Metrics", probability_metrics)
    print_metrics("Diversity Metrics", diversity_metrics)
    print_metrics("Ranking Metrics", ranking_metrics)
    print_metrics("Semantic and Contextual Metrics", semantic_contextual_metrics)
    print_metrics("RAG-specific Metrics", rag_specific_metrics)

    # Execute the function
    visualize_all_metrics(true_binary, predicted_binary, true_answers, generated_answers)


if __name__ == "__main__":
    main()
