const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2026-09-16";

function env(name) {
  return Netlify.env.get(name);
}

async function squareFetch(path, init = {}) {
  const token = env("SQUARE_ACCESS_TOKEN");
  if (!token) throw new Error("Square is not configured.");

  const response = await fetch(`${SQUARE_API}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.errors)
      ? data.errors.map((e) => e.detail || e.code).filter(Boolean).join("; ")
      : "";
    throw new Error(detail || `Square request failed with status ${response.status}`);
  }
  return data;
}

async function getInventory(ids, locationId) {
  const data = await squareFetch("/v2/inventory/counts/batch-retrieve", {
    method: "POST",
    body: JSON.stringify({
      catalog_object_ids: ids,
      location_ids: [locationId]
    })
  });

  const counts = new Map();
  for (const count of data.counts || []) {
    if (count.location_id !== locationId) continue;
    const quantity = Number(count.quantity || 0);
    const previous = counts.get(count.catalog_object_id);
    if (!previous || String(count.calculated_at || "") >= String(previous.calculatedAt || "")) {
      counts.set(count.catalog_object_id, {
        quantity: Number.isFinite(quantity) ? quantity : 0,
        calculatedAt: count.calculated_at || null
      });
    }
  }
  return counts;
}

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const locationId = env("SQUARE_LOCATION_ID");
    if (!locationId) {
      return Response.json({ error: "Square location is not configured." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      return Response.json({ error: "Your cart is empty or invalid." }, { status: 400 });
    }

    const quantities = new Map();
    for (const item of body.items) {
      const id = String(item?.catalogObjectId || "").trim();
      const quantity = Number(item?.quantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return Response.json({ error: "Your cart contains an invalid item." }, { status: 400 });
      }
      quantities.set(id, (quantities.get(id) || 0) + quantity);
    }

    const ids = [...quantities.keys()];
    const inventory = await getInventory(ids, locationId);

    for (const [id, requested] of quantities) {
      const count = inventory.get(id);
      if (!count || count.quantity < requested) {
        return Response.json(
          { error: "One of those items has just sold or there isn't enough stock. Please refresh the shop." },
          { status: 409 }
        );
      }
    }

    const payment = await squareFetch("/v2/online-checkout/payment-links", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        description: "Santa's Secret website order",
        order: {
          location_id: locationId,
          line_items: ids.map((catalogObjectId) => ({
            catalog_object_id: catalogObjectId,
            quantity: String(quantities.get(catalogObjectId))
          }))
        },
        checkout_options: {
          ask_for_shipping_address: true,
          allow_tipping: false,
          merchant_support_email: "info.santasecret@gmail.com",
          redirect_url: "https://santasecret.com.au/shop.html?order=success"
        },
        payment_note: "Online order from santasecret.com.au"
      })
    });

    const url = payment.payment_link?.long_url || payment.payment_link?.url;
    if (!url) throw new Error("Square did not return a checkout URL.");

    return Response.json({ url });
  } catch (error) {
    console.error("square-checkout", error);
    return Response.json(
      { error: "We couldn't start checkout right now. Please try again." },
      { status: 502 }
    );
  }
};

export const config = {
  path: "/api/shop/checkout"
};
