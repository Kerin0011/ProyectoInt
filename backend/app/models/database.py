from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _column_exists(conn, table: str, column: str) -> bool:
    row = conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() "
            "AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).scalar()
    return bool(row)


STOCK_INICIAL_POR_DEFECTO = 100


def _migracion_aplicada(conn, nombre: str) -> bool:
    row = conn.execute(
        text("SELECT COUNT(*) FROM migraciones_aplicadas WHERE nombre = :n"),
        {"n": nombre},
    ).scalar()
    return bool(row)


def run_migrations():
    """Run pending migrations at startup, so the database stays in sync with
    the models without manual intervention.

    Schema migrations add a column if it is missing, which is idempotent on its
    own. Data migrations run exactly once and are recorded in the
    migraciones_aplicadas table: re-running them on every boot would overwrite
    real data, for example by refilling stock that has already been consumed.
    """
    migraciones_esquema = [
        ("platos", "destacado", "ALTER TABLE platos ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0"),
        ("detalle_pedidos", "nota", "ALTER TABLE detalle_pedidos ADD COLUMN nota VARCHAR(255) DEFAULT NULL"),
    ]

    migraciones_datos = [
        # Stock used to be decorative, so many ingredients sit at 0 without
        # meaning "sold out". Now that orders validate stock, an inherited 0
        # would block every order containing that ingredient.
        (
            "stock_inicial",
            f"UPDATE ingredientes SET stock = {STOCK_INICIAL_POR_DEFECTO} WHERE stock <= 0",
        ),
        # Dishes were created with their ingredients attached but with every
        # flag off, so nothing could be removed and only one dish showed as
        # customizable. Base ingredients become removable; the admin can untick
        # the ones that make no sense for a given dish.
        (
            "ingredientes_removibles",
            "UPDATE plato_ingredientes SET es_removible = 1 "
            "WHERE es_default = 1 AND es_extra = 0",
        ),
    ]

    try:
        with engine.begin() as conn:
            for tabla, columna, ddl in migraciones_esquema:
                if not _column_exists(conn, tabla, columna):
                    conn.execute(text(ddl))

            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS migraciones_aplicadas ("
                "  nombre VARCHAR(100) NOT NULL PRIMARY KEY,"
                "  aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                ")"
            ))

            for nombre, ddl in migraciones_datos:
                if not _migracion_aplicada(conn, nombre):
                    conn.execute(text(ddl))
                    conn.execute(
                        text("INSERT INTO migraciones_aplicadas (nombre) VALUES (:n)"),
                        {"n": nombre},
                    )
                    print(f"[migraciones] aplicada: {nombre}")
    except Exception as e:
        # A failed migration must not bring the API down on boot.
        print(f"[migraciones] advertencia: {e}")
