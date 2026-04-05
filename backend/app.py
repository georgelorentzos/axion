from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from dependencies import limiter
from utils.websocket_manager import router as ws_router
from schedulers.token_cleanup import token_cleanup_scheduler
from schedulers.online_cleanup import forgotten_online_users_scheduler
from routers import auth, users, friends, messages, images
from routers.community import community as communities, members, roles, bans, logs, categories, permissions, channels

app = FastAPI()
app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Too many sign-in attempts. Please try again later."}
))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.on_event('startup')
def startup():
    token_cleanup_scheduler()
    forgotten_online_users_scheduler()

app.include_router(ws_router, prefix="/api")
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(messages.router)
app.include_router(communities.router)
app.include_router(members.router)
app.include_router(roles.router)
app.include_router(bans.router)
app.include_router(logs.router)
app.include_router(categories.router)
app.include_router(permissions.router)
app.include_router(images.router)
app.include_router(channels.router)