import bcrypt
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.admin import Admin
from app.schemas.auth import LoginRequest


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def authenticate_admin(db: Session, data: LoginRequest) -> Admin:
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return admin


def get_admin_by_email(db: Session, email: str) -> Admin | None:
    return db.query(Admin).filter(Admin.email == email).first()


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return email
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def ensure_default_admin(db: Session) -> None:
    if not settings.default_admin_password:
        return
    if db.query(Admin).filter(Admin.email == settings.default_admin_email).first():
        return
    admin = Admin(
        name=settings.default_admin_name,
        email=settings.default_admin_email,
        password_hash=hash_password(settings.default_admin_password),
    )
    db.add(admin)
    db.commit()
