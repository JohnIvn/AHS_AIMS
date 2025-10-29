// Simple localStorage-backed appointment service with mock data

const STORAGE_KEY = "appointments";

function loadAppointments() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAppointments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedMockDataIfEmpty() {
  const current = loadAppointments();
  if (current.length > 0) return current;

  const names = [
    "Alex Johnson",
    "Taylor Smith",
    "Jordan Lee",
    "Morgan Brown",
    "Casey Davis",
    "Riley Wilson",
    "Jamie Clark",
    "Drew Lewis",
  ];
  const reasons = [
    "Consultation",
    "Follow-up",
    "Routine Check",
    "New Issue",
    "Lab Results",
  ];

  const now = new Date();
  const mock = Array.from({ length: 18 }).map((_, i) => {
    const daysOffset = Math.floor(Math.random() * 15) - 5; // some in past, some in future
    const date = new Date(now);
    date.setDate(now.getDate() + daysOffset);
    date.setHours(
      9 + Math.floor(Math.random() * 8),
      [0, 15, 30, 45][Math.floor(Math.random() * 4)],
      0,
      0
    );

    const statusPool = ["pending", "pending", "pending", "accepted", "denied"]; // skew to pending
    const status = randomFrom(statusPool);

    const createdAt = new Date(date);
    createdAt.setDate(date.getDate() - Math.floor(Math.random() * 7) - 1);

    return {
      id: `${Date.now()}_${i}`,
      patientName: randomFrom(names),
      dateTime: date.toISOString(),
      reason: randomFrom(reasons),
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      notes: "",
    };
  });

  saveAppointments(mock);
  return mock;
}

export function getAppointments({ status, search } = {}) {
  const list = seedMockDataIfEmpty();
  let result = [...list];
  if (status && status !== "all") {
    result = result.filter((a) => a.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
    );
  }
  // sort by date ascending
  result.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  return result;
}

export function getStats() {
  const list = seedMockDataIfEmpty();
  const todayStr = new Date().toDateString();
  const totals = {
    total: list.length,
    pending: 0,
    accepted: 0,
    denied: 0,
    today: 0,
  };
  for (const a of list) {
    if (a.status in totals) totals[a.status] += 1;
    if (new Date(a.dateTime).toDateString() === todayStr) totals.today += 1;
  }
  return totals;
}

export function updateStatus(id, newStatus) {
  const valid = ["pending", "accepted", "denied", "cancelled"];
  if (!valid.includes(newStatus)) {
    throw new Error("Invalid status");
  }
  const list = seedMockDataIfEmpty();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("Appointment not found");
  list[idx] = {
    ...list[idx],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
  saveAppointments(list);
  return list[idx];
}

export function getRecent({ limit = 5 } = {}) {
  const list = seedMockDataIfEmpty();
  // most recent by createdAt
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return sorted.slice(0, limit);
}

export function clearAllAppointments() {
  localStorage.removeItem(STORAGE_KEY);
}
