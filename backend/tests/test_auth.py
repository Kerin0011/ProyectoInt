"""Authentication and user registration (US01)."""


def test_first_user_registers_without_token(client):
    """Bootstrap: with no users in the database the initial admin must be creatable."""
    r = client.post("/api/auth/register", json={
        "nombre": "Admin", "email": "admin@nexora.com",
        "password": "123456", "rol_id": 1,
    })
    assert r.status_code == 200
    assert r.json()["rol"] == "admin"


def test_anonymous_registration_rejected_once_users_exist(client, admin):
    r = client.post("/api/auth/register", json={
        "nombre": "Intruder", "email": "hacker@mail.com",
        "password": "123456", "rol_id": 1,
    })
    assert r.status_code == 401


def test_admin_can_register_users(client, admin):
    r = client.post("/api/auth/register", json={
        "nombre": "Waiter", "email": "mozo@nexora.com",
        "password": "123456", "rol_id": 2,
    }, headers=admin)
    assert r.status_code == 200
    assert r.json()["rol"] == "mozo"


def test_waiter_cannot_register_users(client, admin):
    client.post("/api/auth/register", json={
        "nombre": "Waiter", "email": "mozo@nexora.com",
        "password": "123456", "rol_id": 2,
    }, headers=admin)
    token = client.post("/api/auth/login", json={
        "email": "mozo@nexora.com", "password": "123456",
    }).json()["access_token"]

    r = client.post("/api/auth/register", json={
        "nombre": "Another", "email": "other@mail.com",
        "password": "123456", "rol_id": 1,
    }, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_unknown_role_returns_400(client, admin):
    r = client.post("/api/auth/register", json={
        "nombre": "X", "email": "x@mail.com",
        "password": "123456", "rol_id": 99,
    }, headers=admin)
    assert r.status_code == 400


def test_short_password_rejected(client):
    r = client.post("/api/auth/register", json={
        "nombre": "X", "email": "x@mail.com",
        "password": "123", "rol_id": 1,
    })
    assert r.status_code == 422


def test_login_with_wrong_credentials(client, admin):
    r = client.post("/api/auth/login", json={
        "email": "admin@nexora.com", "password": "wrong",
    })
    assert r.status_code == 401


def test_protected_endpoint_without_token(client):
    assert client.get("/api/pedidos").status_code == 401
