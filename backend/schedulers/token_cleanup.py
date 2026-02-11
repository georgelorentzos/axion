from apscheduler.schedulers.background import BackgroundScheduler
from utils.database import Session as SessionLocal
from models import Token
from datetime import datetime
from utils.logger import logger

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('interval', minutes=5)
def cleanup_expired_tokens() -> None:
    db = SessionLocal()
    try:
        deleted_count = db.query(Token).filter(Token.expires_at < datetime.utcnow()).delete()
        db.commit()
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired tokens")
    except Exception as e:
        logger.error(f"Error cleaning up tokens: {e}")
        db.rollback()
    finally:
        db.close()

def token_cleanup_scheduler():
    scheduler.start()
    logger.info("Token cleanup scheduler started")