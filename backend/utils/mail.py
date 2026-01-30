import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
from schemas import SendMail
from utils.logger import logger

load_dotenv()

SMTP_SERVER: str = "smtp.gmail.com"
SMTP_PORT: int = 587
MAIL_USERNAME: str = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD: str = os.getenv('MAIL_PASSWORD')

def send_mail(mail: SendMail) -> bool:
    try:
        message: MIMEMultipart = MIMEMultipart()
        message["From"] = MAIL_USERNAME
        message['To'] = mail.recipient
        message["Subject"] = mail.subject

        html_part: MIMEText = MIMEText(mail.message, "html", "utf-8")
        message.attach(html_part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(message)
        
        logger.info("Mail sent successfully")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False