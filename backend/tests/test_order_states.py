"""Order state machine (US04, US12)."""

import pytest

TABLE = "table-token-1"


@pytest.fixture
def order_id(client):
    r = client.post("/api/public/pedidos", json={
        "mesa_token": TABLE, "detalles": [{"plato_id": 1, "cantidad": 1}],
    })
    return r.json()["id"]


def move_to(client, order_id, estado, admin):
    return client.patch(f"/api/pedidos/{order_id}/estado", json={"estado": estado}, headers=admin)


def test_order_starts_as_pending(client, order_id, admin):
    r = client.get(f"/api/pedidos/{order_id}", headers=admin)
    assert r.json()["estado"] == "pendiente"


def test_full_flow_to_delivered(client, order_id, admin):
    for estado in ["confirmado", "en_preparacion", "listo", "entregado"]:
        r = move_to(client, order_id, estado, admin)
        assert r.status_code == 200, f"could not move to {estado}: {r.text}"
        assert r.json()["estado"] == estado


def test_states_cannot_be_skipped(client, order_id, admin):
    """A pending order cannot jump straight to ready."""
    assert move_to(client, order_id, "listo", admin).status_code == 400


def test_states_cannot_go_backwards(client, order_id, admin):
    move_to(client, order_id, "confirmado", admin)
    assert move_to(client, order_id, "pendiente", admin).status_code == 400


def test_delivered_is_a_final_state(client, order_id, admin):
    for estado in ["confirmado", "en_preparacion", "listo", "entregado"]:
        move_to(client, order_id, estado, admin)
    assert move_to(client, order_id, "cancelado", admin).status_code == 400


def test_unknown_state_rejected(client, order_id, admin):
    assert move_to(client, order_id, "teleported", admin).status_code == 422


def test_only_a_pending_order_can_be_cancelled(client, order_id, admin):
    r = client.put(f"/api/pedidos/{order_id}/cancelar", headers=admin)
    assert r.status_code == 200
    assert r.json()["estado"] == "cancelado"


def test_a_confirmed_order_cannot_be_cancelled(client, order_id, admin):
    move_to(client, order_id, "confirmado", admin)
    assert client.put(f"/api/pedidos/{order_id}/cancelar", headers=admin).status_code == 400


def test_changing_state_requires_authentication(client, order_id):
    r = client.patch(f"/api/pedidos/{order_id}/estado", json={"estado": "confirmado"})
    assert r.status_code == 401


def test_unknown_order_returns_404(client, admin):
    r = client.patch("/api/pedidos/999/estado", json={"estado": "confirmado"}, headers=admin)
    assert r.status_code == 404


def test_table_becomes_occupied_when_the_order_is_placed(client, order_id, admin):
    tables = client.get("/api/mesas", headers=admin).json()
    assert tables[0]["estado"] == "ocupada"
