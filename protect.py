import os
secret_key = os.urandom(24).hex()
SECURITY_PASSWORD_SALT = os.urandom(24).hex()
print(secret_key)
print(SECURITY_PASSWORD_SALT)