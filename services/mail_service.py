from flask_mail import Mail, Message

mail = Mail()

def init_mail(app):
    mail.init_app(app)

def send_reset_email(user_email, reset_token):
    msg = Message('Password Reset Request',
                  sender='noreply@yourdomain.com',
                  recipients=[user_email])
    msg.body = f'''To reset your password, visit the following link:
    http://localhost:8080/user/reset_password/{reset_token}
rep cái gì đây
    If you did not make this request then simply ignore this email and no changes will be made.
    '''
    mail.send(msg)
