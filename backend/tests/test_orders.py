"""Public ordering: validation, customization and stock (US05, US07, US10)."""

TABLE = "table-token-1"


def create_order(client, lines, table_token=TABLE):
    return client.post("/api/public/pedidos", json={
        "mesa_token": table_token, "detalles": lines,
    })


# --- Input validation -------------------------------------------------------

def test_order_without_dishes_rejected(client):
    assert create_order(client, []).status_code == 422


def test_negative_quantity_rejected(client):
    assert create_order(client, [{"plato_id": 1, "cantidad": -5}]).status_code == 422


def test_zero_quantity_rejected(client):
    assert create_order(client, [{"plato_id": 1, "cantidad": 0}]).status_code == 422


def test_unknown_table_returns_404(client):
    r = create_order(client, [{"plato_id": 1, "cantidad": 1}], table_token="nope")
    assert r.status_code == 404


def test_unknown_dish_returns_404(client):
    assert create_order(client, [{"plato_id": 999, "cantidad": 1}]).status_code == 404


# --- Customization rules ----------------------------------------------------

def test_cannot_add_an_ingredient_that_is_not_an_extra(client):
    """Beef is a base ingredient, not an extra, so it cannot be added."""
    r = create_order(client, [{
        "plato_id": 1, "cantidad": 1,
        "personalizaciones": [{"ingrediente_id": 2, "accion": "agregar", "cantidad": 1}],
    }])
    assert r.status_code == 400


def test_cannot_remove_a_non_removable_ingredient(client):
    r = create_order(client, [{
        "plato_id": 1, "cantidad": 1,
        "personalizaciones": [{"ingrediente_id": 2, "accion": "quitar", "cantidad": 1}],
    }])
    assert r.status_code == 400


def test_unknown_action_rejected(client):
    r = create_order(client, [{
        "plato_id": 1, "cantidad": 1,
        "personalizaciones": [{"ingrediente_id": 1, "accion": "explode", "cantidad": 1}],
    }])
    assert r.status_code == 422


# --- Total ------------------------------------------------------------------

def test_total_accounts_for_extras_and_quantity(client):
    """(15000 base + 2000 cheese) x 2 units = 34000."""
    r = create_order(client, [{
        "plato_id": 1, "cantidad": 2,
        "personalizaciones": [{"ingrediente_id": 1, "accion": "agregar", "cantidad": 1}],
    }])
    assert r.status_code == 201
    assert r.json()["total"] == 34000.0
    assert r.json()["estado"] == "pendiente"


# --- Stock ------------------------------------------------------------------

def test_order_deducts_base_ingredients_and_extras(client, stock):
    create_order(client, [{
        "plato_id": 1, "cantidad": 2,
        "personalizaciones": [{"ingrediente_id": 1, "accion": "agregar", "cantidad": 1}],
    }])
    assert stock(2)[0] == 1   # beef: 3 - 2
    assert stock(1)[0] == 8   # cheese: 10 - 2


def test_removing_an_ingredient_does_not_consume_its_stock(client, stock):
    before = stock(3)[0]
    r = create_order(client, [{
        "plato_id": 1, "cantidad": 1,
        "personalizaciones": [{"ingrediente_id": 3, "accion": "quitar", "cantidad": 1}],
    }])
    assert r.status_code == 201
    assert stock(3)[0] == before


def test_order_beyond_available_stock_returns_409(client, stock):
    r = create_order(client, [{"plato_id": 1, "cantidad": 5}])   # only 3 beef in stock
    assert r.status_code == 409
    assert stock(2)[0] == 3, "a rejected order must not touch stock"


def test_depleted_ingredient_becomes_unavailable(client, stock):
    create_order(client, [{"plato_id": 1, "cantidad": 3}])
    assert stock(2) == (0, False)


def test_two_lines_of_the_same_dish_add_up_against_stock(client, stock):
    """Regression: validating line by line let 2+2 through on a stock of 3."""
    r = create_order(client, [
        {"plato_id": 1, "cantidad": 2},
        {"plato_id": 1, "cantidad": 2, "nota": "no salt"},
    ])
    assert r.status_code == 409
    assert stock(2)[0] == 3


def test_rejected_order_is_not_persisted(client):
    r = create_order(client, [{"plato_id": 1, "cantidad": 50}])
    assert r.status_code == 409
    # The order never made it to the commit, so id 1 does not exist.
    assert client.get("/api/public/pedidos/1").status_code == 404


# --- Table requests ---------------------------------------------------------

def test_valid_request(client):
    r = client.post(f"/api/public/solicitar/{TABLE}", json={"tipo": "mesero"})
    assert r.status_code == 200


def test_request_with_unknown_type(client):
    r = client.post(f"/api/public/solicitar/{TABLE}", json={"tipo": "whatever"})
    assert r.status_code == 422
