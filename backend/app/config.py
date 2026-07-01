import os
from dotenv import load_dotenv

load_dotenv()

_raw_db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/restaurant_pedidos")

if _raw_db_url.startswith("mysql://"):
    _raw_db_url = _raw_db_url.replace("mysql://", "mysql+pymysql://", 1)
elif _raw_db_url.startswith("mysql+mysqlconnector://"):
    _raw_db_url = _raw_db_url.replace("mysql+mysqlconnector://", "mysql+pymysql://", 1)

DATABASE_URL = _raw_db_url

SECRET_KEY = os.getenv("SECRET_KEY", "cambiar-esta-clave-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500"
    ).split(",")
    if origin.strip()
]
