"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Allergen = {
  id: string;
  name: string;
  icon: string;
};

type DishAllergen = {
  allergens: Allergen;
};

type Reservation = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  source: string;
  created_at: string;
};

type Dish = {
  id: string;
  name: string;
  name_en: string;
  name_de: string;
  name_fr: string;
  description: string;
  description_en: string;
  description_de: string;
  description_fr: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_pescatarian: boolean;
  is_meat: boolean;
  category_id: string;
  image_url: string | null;
  dish_allergens: DishAllergen[];
};

type Category = {
  id: string;
  name: string;
};

const emptyDish = {
  name: "",
  description: "",
  price: "",
  is_available: true,
  is_featured: false,
  is_meat: false,
  is_vegan: false,
  is_vegetarian: false,
  is_gluten_free: false,
  is_pescatarian: false,
  category_id: "",
  image_url: null as string | null,
  allergen_ids: [] as string[],
};

type ActiveTab = "dishes" | "categories" | "reservations";

const DEMO_SLUG = "la-taberna-del-puerto";

export default function AdminPage({ params }: { params: { slug: string } }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form, setForm] = useState(emptyDish);
  const [uploading, setUploading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dishes");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [updatingReservation, setUpdatingReservation] = useState<string | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsDemo(params.slug === DEMO_SLUG);
    const fetchData = async () => {
      const restRes = await fetch("/api/restaurants");
      const restaurants = await restRes.json();
      const restaurant = restaurants.find(
        (r: { slug: string; id: string }) => r.slug === params.slug,
      );
      if (!restaurant) return;
      setRestaurantId(restaurant.id);
      const [dishesRes, catsRes, allergensRes] = await Promise.all([
        fetch(`/api/dishes?restaurant_id=${restaurant.id}`),
        fetch(`/api/categories?restaurant_id=${restaurant.id}`),
        fetch("/api/allergens"),
      ]);
      setDishes(await dishesRes.json());
      setCategories(await catsRes.json());
      setAllergens(await allergensRes.json());
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  useEffect(() => {
    if (activeTab === "reservations" && restaurantId) {
      loadReservations();
    }
  }, [activeTab, restaurantId]);

  const loadReservations = async () => {
    if (!restaurantId) return;
    setLoadingReservations(true);
    const res = await fetch(`/api/reservations?restaurant_id=${restaurantId}`);
    const data = await res.json();
    setReservations(Array.isArray(data) ? data : []);
    setLoadingReservations(false);
  };

  const updateReservationStatus = async (id: string, status: string) => {
    setUpdatingReservation(id);
    await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: status as Reservation["status"] } : r,
      ),
    );
    setUpdatingReservation(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleAvailable = async (dish: Dish) => {
    setSaving(dish.id);
    await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dish_id: dish.id,
        is_available: !dish.is_available,
      }),
    });
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dish.id ? { ...d, is_available: !d.is_available } : d,
      ),
    );
    setSaving(null);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sin categoría";
  };

  const openCreate = () => {
    setEditingDish(null);
    setForm(emptyDish);
    setShowForm(true);
    setTimeout(() => {
      document
        .getElementById("form-top")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const openEdit = (dish: Dish) => {
    setEditingDish(dish);
    setForm({
      name: dish.name,
      description: dish.description || "",
      price: String(dish.price),
      is_available: dish.is_available,
      is_featured: dish.is_featured,
      is_meat: dish.is_meat,
      is_vegan: dish.is_vegan,
      is_vegetarian: dish.is_vegetarian,
      is_gluten_free: dish.is_gluten_free,
      is_pescatarian: dish.is_pescatarian,
      category_id: dish.category_id,
      image_url: dish.image_url,
      allergen_ids: dish.dish_allergens?.map((da) => da.allergens.id) || [],
    });
    setShowForm(true);
    setTimeout(() => {
      document
        .getElementById("form-top")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const toggleAllergen = (allergenId: string) => {
    setForm((prev) => ({
      ...prev,
      allergen_ids: prev.allergen_ids.includes(allergenId)
        ? prev.allergen_ids.filter((id) => id !== allergenId)
        : [...prev.allergen_ids, allergenId],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurant_id", restaurantId);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setForm((prev) => ({ ...prev, image_url: data.url }));
    setUploading(false);
  };

  const handleTranslateAndSubmit = async () => {
    if (!form.name || !form.price || !form.category_id) {
      alert("Nombre, precio y categoría son obligatorios");
      return;
    }
    setTranslating(true);
    const [nameTranslations, descTranslations] = await Promise.all([
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: form.name }),
      }).then((r) => r.json()),
      form.description
        ? fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: form.description }),
          }).then((r) => r.json())
        : Promise.resolve({ en: "", de: "", fr: "" }),
    ]);
    setTranslating(false);
    setFormSaving(true);
    const dishData = {
      name: form.name,
      name_en: nameTranslations.en,
      name_de: nameTranslations.de,
      name_fr: nameTranslations.fr,
      description: form.description,
      description_en: descTranslations.en,
      description_de: descTranslations.de,
      description_fr: descTranslations.fr,
      price: parseFloat(form.price as string),
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_meat: form.is_meat,
      is_vegan: form.is_vegan,
      is_vegetarian: form.is_vegetarian,
      is_gluten_free: form.is_gluten_free,
      is_pescatarian: form.is_pescatarian,
      category_id: form.category_id,
      image_url: form.image_url,
      allergen_ids: form.allergen_ids,
    };
    if (editingDish) {
      const res = await fetch("/api/dishes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDish.id, ...dishData }),
      });
      const updated = await res.json();
      setDishes((prev) =>
        prev.map((d) => (d.id === editingDish.id ? updated : d)),
      );
    } else {
      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, ...dishData }),
      });
      const created = await res.json();
      setDishes((prev) => [...prev, created]);
    }
    setFormSaving(false);
    setShowForm(false);
    setEditingDish(null);
    setForm(emptyDish);
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm("¿Seguro que quieres eliminar este plato?")) return;
    await fetch(`/api/dishes?id=${dishId}`, { method: "DELETE" });
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        name: newCategoryName.trim(),
        position: categories.length,
      }),
    });
    const created = await res.json();
    setCategories((prev) => [...prev, created]);
    setNewCategoryName("");
    setSavingCategory(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const dishesInCategory = dishes.filter((d) => d.category_id === categoryId);
    if (dishesInCategory.length > 0) {
      alert(
        `Esta categoría tiene ${dishesInCategory.length} platos. Mueve o elimina los platos primero.`,
      );
      return;
    }
    if (!confirm("¿Eliminar esta categoría?")) return;
    setDeletingCategory(categoryId);
    await fetch(`/api/categories?id=${categoryId}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setDeletingCategory(null);
  };

  const verCarta = () => window.open(`/r/${params.slug}`, "_blank");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">🍽️</p>
          <p className="text-gray-400 text-sm">Cargando panel...</p>
        </div>
      </div>
    );
  }

  const pendingCount = reservations.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              Panel Admin
            </h1>
            <p className="text-xs md:text-sm text-gray-400 capitalize">
              {params.slug.replace(/-/g, " ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/dashboard/${params.slug}`, "_blank")}
              className="hidden md:flex text-sm text-purple-500 hover:text-purple-600 font-medium border border-purple-200 px-3 py-2 rounded-xl transition items-center gap-1.5"
            >
              📊 Analytics
            </button>
            <button
              onClick={verCarta}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium border border-orange-200 px-3 py-2 rounded-xl transition"
            >
              Ver carta
            </button>
            {!isDemo && (
              <button
                onClick={handleLogout}
                className="hidden md:flex text-sm text-gray-400 hover:text-gray-600 font-medium border border-gray-200 px-3 py-2 rounded-xl transition items-center gap-1.5"
              >
                Cerrar sesión
              </button>
            )}
            {isDemo && (
              <span className="hidden md:flex items-center gap-1 text-xs bg-orange-100 text-orange-600 font-semibold px-3 py-1.5 rounded-full">
                🎯 Demo
              </span>
            )}
            <button
              onClick={openCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-2 rounded-xl transition text-sm"
            >
              + Plato
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("dishes")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
                activeTab === "dishes"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              🍽️ Platos ({dishes.length})
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
                activeTab === "categories"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              📂 Categorías ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition flex items-center gap-2 ${
                activeTab === "reservations"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              📅 Reservas
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* ── TAB CATEGORÍAS ── */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Nueva categoría
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Ej: Nigiris, Entrantes calientes, Postres..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={savingCategory || !newCategoryName.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shrink-0"
                >
                  {savingCategory ? "Guardando..." : "+ Añadir"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                🤖 Las traducciones EN/DE/FR se generan automáticamente
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {categories.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No hay categorías todavía
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {categories.map((cat) => {
                    const count = dishes.filter(
                      (d) => d.category_id === cat.id,
                    ).length;
                    return (
                      <li
                        key={cat.id}
                        className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {cat.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {count} platos
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCategory === cat.id}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                        >
                          Eliminar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── TAB RESERVAS ── */}
        {activeTab === "reservations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Reservas</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {reservations.filter((r) => r.status === "pending").length}{" "}
                  pendientes ·{" "}
                  {reservations.filter((r) => r.status === "confirmed").length}{" "}
                  confirmadas
                </p>
              </div>
              <button
                onClick={loadReservations}
                disabled={loadingReservations}
                className="text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-xl transition"
              >
                {loadingReservations ? "⏳" : "🔄"} Actualizar
              </button>
            </div>

            {loadingReservations ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                Cargando reservas...
              </div>
            ) : reservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-gray-400 text-sm font-medium">
                  No hay reservas todavía
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  Las reservas del chatbot aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((r) => {
                  const statusConfig = {
                    pending: {
                      label: "Pendiente",
                      bg: "bg-yellow-100",
                      text: "text-yellow-700",
                    },
                    confirmed: {
                      label: "Confirmada",
                      bg: "bg-green-100",
                      text: "text-green-700",
                    },
                    cancelled: {
                      label: "Cancelada",
                      bg: "bg-red-100",
                      text: "text-red-700",
                    },
                    completed: {
                      label: "Completada",
                      bg: "bg-gray-100",
                      text: "text-gray-600",
                    },
                  };
                  const config = statusConfig[r.status];
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                              via {r.source}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 text-sm">
                            {r.customer_name}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>📅</span>
                              <span>
                                {(() => {
                                  const [year, month, day] = r.reservation_date
                                    .split("-")
                                    .map(Number);
                                  return new Date(
                                    year,
                                    month - 1,
                                    day,
                                  ).toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  });
                                })()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>🕐</span>
                              <span>{r.reservation_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>👥</span>
                              <span>
                                {r.party_size} persona
                                {r.party_size > 1 ? "s" : ""}
                              </span>
                            </div>
                            {r.customer_email && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>✉️</span>
                                <span className="truncate">
                                  {r.customer_email}
                                </span>
                              </div>
                            )}
                            {r.customer_phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>📞</span>
                                <span>{r.customer_phone}</span>
                              </div>
                            )}
                          </div>
                          {r.notes && (
                            <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg italic">
                              &ldquo;{r.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                          <button
                            onClick={() =>
                              updateReservationStatus(r.id, "confirmed")
                            }
                            disabled={updatingReservation === r.id}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition text-sm"
                          >
                            ✅ Confirmar
                          </button>
                          <button
                            onClick={() =>
                              updateReservationStatus(r.id, "cancelled")
                            }
                            disabled={updatingReservation === r.id}
                            className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold py-2 rounded-xl transition text-sm"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      )}
                      {r.status === "confirmed" && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                          <button
                            onClick={() =>
                              updateReservationStatus(r.id, "completed")
                            }
                            disabled={updatingReservation === r.id}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold py-2 rounded-xl transition text-sm"
                          >
                            Marcar completada
                          </button>
                          <button
                            onClick={() =>
                              updateReservationStatus(r.id, "cancelled")
                            }
                            disabled={updatingReservation === r.id}
                            className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold py-2 rounded-xl transition text-sm"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB PLATOS ── */}
        {activeTab === "dishes" && (
          <>
            {showForm && (
              <div
                id="form-top"
                className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-orange-100"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-gray-900">
                    {editingDish ? "✏️ Editar plato" : "➕ Nuevo plato"}
                  </h3>
                  <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full">
                    <span className="text-xs">🤖</span>
                    <span className="text-xs text-orange-600 font-medium">
                      Auto EN/DE/FR
                    </span>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-gray-200 shrink-0">
                        🍽️
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition"
                      >
                        {uploading ? "⏳ Subiendo..." : "📷 Subir imagen"}
                      </button>
                      {form.image_url && (
                        <button
                          onClick={() =>
                            setForm((p) => ({ ...p, image_url: null }))
                          }
                          className="block mt-2 text-xs text-red-400 hover:text-red-600"
                        >
                          Eliminar imagen
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Nombre del plato *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                      placeholder="Ej: Croquetas de bacalao"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Descripción
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none"
                      rows={2}
                      placeholder="Describe el plato..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Precio *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.price}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, price: e.target.value }))
                          }
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 pr-8"
                          placeholder="12.50"
                        />
                        <span className="absolute right-3 top-3 text-sm text-gray-400">
                          €
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Categoría *
                      </label>
                      <select
                        value={form.category_id}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            category_id: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white"
                      >
                        <option value="">Seleccionar</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                      Características
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          key: "is_available",
                          label: "✅ Disponible",
                          desc: "En carta hoy",
                        },
                        {
                          key: "is_featured",
                          label: "⭐ Recomendado",
                          desc: "Aparece destacado",
                        },
                        {
                          key: "is_meat",
                          label: "🥩 Contiene carne",
                          desc: "Excluido en vegano",
                        },
                        {
                          key: "is_vegan",
                          label: "🌱 Vegano",
                          desc: "Apto veganos",
                        },
                        {
                          key: "is_vegetarian",
                          label: "🥦 Vegetariano",
                          desc: "Sin carne ni pescado",
                        },
                        {
                          key: "is_gluten_free",
                          label: "🌾 Sin gluten",
                          desc: "Apto celiaquía",
                        },
                        {
                          key: "is_pescatarian",
                          label: "🐟 Pescado",
                          desc: "Contiene pescado",
                        },
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            form[opt.key as keyof typeof form]
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-100 bg-gray-50 hover:border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              form[opt.key as keyof typeof form] as boolean
                            }
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [opt.key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-orange-500 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800 leading-tight">
                              {opt.label}
                            </p>
                            <p className="text-xs text-gray-400">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                      ⚠️ Alérgenos presentes en el plato
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allergens.map((a) => {
                        const selected = form.allergen_ids.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleAllergen(a.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                              selected
                                ? "bg-red-100 border-red-400 text-red-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200"
                            }`}
                          >
                            {a.icon} {a.name}
                          </button>
                        );
                      })}
                    </div>
                    {form.allergen_ids.length > 0 && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        {form.allergen_ids.length} alérgeno
                        {form.allergen_ids.length > 1 ? "s" : ""} seleccionado
                        {form.allergen_ids.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleTranslateAndSubmit}
                      disabled={formSaving || translating}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {translating ? (
                        <>
                          <span className="animate-spin inline-block">🌐</span>{" "}
                          Traduciendo...
                        </>
                      ) : formSaving ? (
                        <>
                          <span className="animate-spin inline-block">💾</span>{" "}
                          Guardando...
                        </>
                      ) : editingDish ? (
                        "Guardar cambios"
                      ) : (
                        "Crear plato"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingDish(null);
                        setForm(emptyDish);
                      }}
                      className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARDS móvil */}
            <div className="space-y-3 md:hidden">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    {dish.image_url ? (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-16 h-16 object-cover rounded-xl shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {dish.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {getCategoryName(dish.category_id)}
                      </p>
                      <p className="text-base font-black text-orange-500 mt-1">
                        {Number(dish.price).toFixed(2)} €
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {dish.is_featured && (
                          <span className="text-xs">⭐</span>
                        )}
                        {dish.is_vegan && <span className="text-xs">🌱</span>}
                        {dish.is_meat && <span className="text-xs">🥩</span>}
                        {dish.is_gluten_free && (
                          <span className="text-xs">🌾</span>
                        )}
                        {dish.dish_allergens?.map((da) => (
                          <span key={da.allergens.id} className="text-xs">
                            {da.allergens.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailable(dish)}
                        disabled={saving === dish.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          dish.is_available ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            dish.is_available
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-medium ${dish.is_available ? "text-green-600" : "text-gray-400"}`}
                      >
                        {dish.is_available ? "Disponible" : "Agotado"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(dish)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLA desktop */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Plato
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Categoría
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Precio
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {dish.image_url ? (
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-12 h-12 object-cover rounded-xl shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                              🍽️
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {dish.name}
                            </p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {dish.is_featured && (
                                <span className="text-xs text-orange-500">
                                  ⭐
                                </span>
                              )}
                              {dish.is_vegan && (
                                <span className="text-xs">🌱</span>
                              )}
                              {dish.is_meat && (
                                <span className="text-xs">🥩</span>
                              )}
                              {dish.is_gluten_free && (
                                <span className="text-xs">🌾</span>
                              )}
                              {dish.dish_allergens?.map((da) => (
                                <span
                                  key={da.allergens.id}
                                  className="text-xs"
                                  title={da.allergens.name}
                                >
                                  {da.allergens.icon}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {getCategoryName(dish.category_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-orange-500 text-sm">
                          {Number(dish.price).toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAvailable(dish)}
                            disabled={saving === dish.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              dish.is_available ? "bg-green-500" : "bg-gray-300"
                            } ${saving === dish.id ? "opacity-50" : ""}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                dish.is_available
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-medium ${dish.is_available ? "text-green-600" : "text-gray-400"}`}
                          >
                            {dish.is_available ? "Disponible" : "Agotado"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(dish)}
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(dish.id)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
