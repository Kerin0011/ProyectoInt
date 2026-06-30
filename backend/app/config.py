import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/restaurant_pedidos"
)

SECRET_KEY = os.getenv("SECRET_KEY", "cambiar-esta-clave-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")
