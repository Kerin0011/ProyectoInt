import os
import secrets
from dotenv import load_dotenv

load_dotenv()

_raw_db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/nexora")

if _raw_db_url.startswith("mysql://"):
    _raw_db_url = _raw_db_url.replace("mysql://", "mysql+pymysql://", 1)
elif _raw_db_url.startswith("mysql+mysqlconnector://"):
    _raw_db_url = _raw_db_url.replace("mysql+mysqlconnector://", "mysql+pymysql://", 1)

DATABASE_URL = _raw_db_url

_DEV_SECRET_KEY = "clave-solo-para-desarrollo-local"

_is_production = bool(os.getenv("RAILWAY_ENVIRONMENT")) or os.getenv("APP_ENV") == "production"

SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if not SECRET_KEY:
    if _is_production:
        # The dev key is public in the repo, so anyone could forge an admin
        # token with it. Fall back to a throwaway key instead: it keeps the
        # app booting, at the cost of invalidating tokens on every restart.
        SECRET_KEY = secrets.token_urlsafe(48)
        print(
            "[config] ADVERTENCIA: SECRET_KEY no esta definida. Se genero una "
            "clave temporal: los usuarios tendran que volver a iniciar sesion "
            "despues de cada reinicio. Configurala como variable de entorno "
            "(ver README > Variables de entorno)."
        )
    else:
        SECRET_KEY = _DEV_SECRET_KEY

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

_raw_cors = os.getenv("CORS_ORIGINS", "").strip()
if _raw_cors:
    CORS_ORIGINS = [o.strip() for o in _raw_cors.split(",") if o.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://kerin0011.github.io",
    ]
