"""Table management: QR, state and deletion (US02)."""


def test_list_tables(client, admin):
    r = client.get("/api/mesas", headers=admin)
    assert r.status_code == 200
    assert r.json()[0]["numero"] == "M1"


def test_create_table_gets_a_unique_token(client, admin):
    r = client.post("/api/mesas", json={"numero": "M2"}, headers=admin)
    assert r.status_code == 201
    assert r.json()["token_qr"] != "table-token-1"
    assert r.json()["estado"] == "libre"


def test_duplicate_table_number_rejected(client, admin):
    assert client.post("/api/mesas", json={"numero": "M1"}, headers=admin).status_code == 400


def test_occupy_a_table(client, admin):
    """Regression: the table endpoint reused the order-state schema, so
    'ocupada' was rejected with a 422 before reaching the logic."""
    r = client.patch("/api/mesas/1/estado", json={"estado": "ocupada"}, headers=admin)
    assert r.status_code == 200
    assert r.json()["estado"] == "ocupada"


def test_free_a_table(client, admin):
    client.patch("/api/mesas/1/estado", json={"estado": "ocupada"}, headers=admin)
    r = client.patch("/api/mesas/1/estado", json={"estado": "libre"}, headers=admin)
    assert r.status_code == 200
    assert r.json()["estado"] == "libre"


def test_an_order_state_is_not_a_valid_table_state(client, admin):
    r = client.patch("/api/mesas/1/estado", json={"estado": "en_preparacion"}, headers=admin)
    assert r.status_code == 422


def test_unknown_table_returns_404(client, admin):
    r = client.patch("/api/mesas/999/estado", json={"estado": "libre"}, headers=admin)
    assert r.status_code == 404


def test_changing_table_state_requires_authentication(client):
    assert client.patch("/api/mesas/1/estado", json={"estado": "libre"}).status_code == 401


def test_regenerate_qr_changes_the_token(client, admin):
    before = client.get("/api/mesas", headers=admin).json()[0]["token_qr"]
    r = client.patch("/api/mesas/1/regenerar-qr", headers=admin)
    assert r.status_code == 200
    assert r.json()["token_qr"] != before


def test_waiter_cannot_create_tables(client, admin):
    client.post("/api/auth/register", json={
        "nombre": "Waiter", "email": "mozo@nexora.com",
        "password": "123456", "rol_id": 2,
    }, headers=admin)
    token = client.post("/api/auth/login", json={
        "email": "mozo@nexora.com", "password": "123456",
    }).json()["access_token"]

    r = client.post("/api/mesas", json={"numero": "M9"},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_deleting_a_table_removes_its_orders(client, admin):
    client.post("/api/public/pedidos", json={
        "mesa_token": "table-token-1", "detalles": [{"plato_id": 1, "cantidad": 1}],
    })
    assert client.delete("/api/mesas/1", headers=admin).status_code == 204
    assert client.get("/api/public/pedidos/1").status_code == 404
