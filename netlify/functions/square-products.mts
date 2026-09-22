const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2026-09-16";

function env(name) {
  return Netlify.env.get(name);
}

function atLocation(object, locationId) {
  if (!object) return false;
  if (Array.isArray(object.absent_at_location_ids) && object.absent_at_location_ids.includes(locationId)) return false;
  if (object.present_at_all_locations === true) return true;
  if (Array.isArray(object.present_at_location_ids)) return object.present_at_location_ids.includes(locationId);
  return true;
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

async function listCatalog() {
  const objects = [];
  let cursor = "";

  do {
    const params = new URLSearchParams({ types: "ITEM,IMAGE,CATEGORY" });
    if (cursor) params.set("cursor", cursor);
    const data = await squareFetch(`/v2/catalog/list?${params.toString()}`);
    objects.push(...(data.objects || []));
    cursor = data.cursor || "";
  } while (cursor);

  return objects;
}

async function inventoryCounts(ids, locationId) {
  const result = new Map();
  for (let i = 0; i < ids.length; i += 1000) {
    const data = await squareFetch("/v2/inventory/counts/batch-retrieve", {
      method: "POST",
      body: JSON.stringify({
        catalog_object_ids: ids.slice(i, i + 1000),
        location_ids: [locationId]
      })
    });

    for (const count of data.counts || []) {
      if (count.location_id !== locationId) continue;
      const quantity = Number(count.quantity || 0);
      const existing = result.get(count.catalog_object_id);
      if (!existing || String(count.calculated_at || "") >= String(existing.calculatedAt || "")) {
        result.set(count.catalog_object_id, {
          quantity: Number.isFinite(quantity) ? quantity : 0,
          state: count.state || null,
          calculatedAt: count.calculated_at || null
        });
      }
    }
  }
  return result;
}

export default async (request) => {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const locationId = env("SQUARE_LOCATION_ID");
    if (!locationId) {
      return Response.json({ error: "Square location is not configured." }, { status: 503 });
    }

    const objects = await listCatalog();
    const images = new Map(
      objects
        .filter((o) => o.type === "IMAGE" && o.image_data?.url)
        .map((o) => [o.id, o.image_data.url])
    );
    const categories = new Map(
      objects
        .filter((o) => o.type === "CATEGORY")
        .map((o) => [o.id, o.category_data?.name || "Other"])
    );

    const items = objects.filter((o) =>
      o.type === "ITEM" &&
      !o.is_deleted &&
      !o.item_data?.is_archived &&
      atLocation(o, locationId)
    );

    const candidateVariations = [];
    for (const item of items) {
      for (const variation of item.item_data?.variations || []) {
        const data = variation.item_variation_data || {};
        if (
          variation.is_deleted ||
          !atLocation(variation, locationId) ||
          !data.price_money ||
          !data.price_money.currency
        ) continue;
        candidateVariations.push({ item, variation });
      }
    }

    const ids = candidateVariations.map(({ variation }) => variation.id);
    const counts = await inventoryCounts(ids, locationId);

    const products = candidateVariations
      .map(({ item, variation }) => {
        const data = variation.item_variation_data || {};
        const count = counts.get(variation.id);
        const trackInventory = data.track_inventory === true || Boolean(count);
        const quantity = count ? count.quantity : null;
        const categoryIds = (item.item_data?.categories || []).map((c) => c.id).filter(Boolean);
        const imageId =
          (Array.isArray(data.image_ids) && data.image_ids[0]) ||
          (Array.isArray(item.item_data?.image_ids) && item.item_data.image_ids[0]) ||
          null;

        return {
          itemId: item.id,
          variationId: variation.id,
          name: item.item_data?.buyer_facing_name || item.item_data?.name || "Untitled item",
          variationName: data.name || "",
          description: item.item_data?.description_plaintext || item.item_data?.description || "",
          sku: data.sku || "",
          price: Number(data.price_money.amount || 0),
          currency: data.price_money.currency,
          trackInventory,
          quantity,
          available: trackInventory ? Number(quantity || 0) > 0 : true,
          image: imageId ? images.get(imageId) || null : null,
          categories: categoryIds.map((id) => categories.get(id)).filter(Boolean)
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json(
      {
        locationId,
        products,
        updatedAt: new Date().toISOString()
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("square-products", error);
    return Response.json(
      { error: "We couldn't load the shop right now." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
};

export const config = {
  path: "/api/shop/products"
};
