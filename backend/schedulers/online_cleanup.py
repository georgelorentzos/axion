from apscheduler.schedulers.background import BackgroundScheduler
from utils.database import Session as SessionLocal
from models import User
from datetime import datetime, timedelta
from utils.logger import logger

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('interval', minutes=5)
def cleanup_forgotten_online_users() -> None:
    db = SessionLocal()
    try:
        deleted_count = db.query(User).filter(
            User.last_seen < datetime.utcnow + timedelta(minutes=15)
        ).delete()
        db.commit()

        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired tokens")
    except Exception as e:
        logger.error(f"Error to clean up forgotten online users: {e}")
        db.rollback()
    finally:
        db.close()

def forgotten_online_users_scheduler():
    scheduler.start()
    logger.info("Clean up forgotten online users scheduler started")