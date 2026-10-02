"""Fill a throwaway CI ledger with realistic sample data so UI screenshots show populated pages. CI only."""
import datetime as dt, json, os, random, sys, urllib.request, http.cookiejar

BASE = os.environ.get("API", "http://127.0.0.1:8050")
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"})
    with op.open(req, timeout=30) as r:
        return json.loads(r.read() or b"null")

call("POST", "/api/auth/login", {"email": "treasurer", "password": os.environ["SEED_PASSWORD"]})
cats = call("GET", "/api/metadata/categories")
pms = call("GET", "/api/metadata/payment-methods")
inc = [c for c in cats if c["type"] == "INCOME"] or cats
exp = [c for c in cats if c["type"] == "EXPENSE"] or cats
pm = pms[0]["id"]
random.seed(7)
today = dt.date.today()
p1 = call("POST", "/api/projects", {"name": "AURIX 2026", "code": "AURIX26", "status": "ACTIVE", "budget_amount": "250000",
                                    "description": "Annual robotics championship", "start_date": str(today.replace(day=1))})
p2 = call("POST", "/api/projects", {"name": "YUVAAN Rover", "code": "YUVAAN", "status": "ACTIVE", "budget_amount": "120000"})
sources = ["Registration fees — Robo Soccer", "College grant", "Sponsorship — TechCorp", "Workshop fees", "Alumni donation", "Registration fees — Ideathon"]
for m in range(6):
    for k in range(2):
        d = (today.replace(day=1) - dt.timedelta(days=30 * m)).replace(day=min(5 + 9 * k, 28))
        call("POST", "/api/income", {"date": str(d), "source": random.choice(sources), "category_id": random.choice(inc)["id"],
                                     "amount": str(random.choice([4990, 12000, 25000, 7485, 50000, 3990])), "payment_method_id": pm,
                                     "received_by": "Treasurer", "project_id": random.choice([p1["id"], p2["id"], None])})
vendors = ["Robu.in", "Amazon Business", "Campus print shop", "Local fabricator", "Sound & stage rentals", "Trophy house"]
for m in range(6):
    for k in range(2):
        d = (today.replace(day=1) - dt.timedelta(days=30 * m)).replace(day=min(8 + 10 * k, 28))
        total = random.choice([1800, 6400, 15000, 22999, 3200, 9800])
        paid = random.choice([0, total, total // 2])
        call("POST", "/api/expenses", {"bill_date": str(d), "description": random.choice(["Motor drivers & batteries", "Arena banners", "Prize trophies", "Chassis parts", "PA system rental"]),
                                       "category_id": random.choice(exp)["id"], "vendor": random.choice(vendors), "total_amount": str(total),
                                       "amount_paid": str(paid), "due_date": str(d + dt.timedelta(days=15)),
                                       "payment_method_id": pm if paid else None, "payment_date": str(d) if paid else None,
                                       "project_id": random.choice([p1["id"], p2["id"]])})
call("POST", "/api/budgets", {"name": "AURIX 2026 event budget", "project_id": p1["id"], "period_start": str(today.replace(day=1)),
                              "period_end": str(today.replace(day=1) + dt.timedelta(days=60)), "total_budget": "250000",
                              "items": [{"category_id": exp[0]["id"], "allocated_amount": "90000"}] if exp else []})
print("seeded sample ledger")
