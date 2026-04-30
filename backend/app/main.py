from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.repository.storage import UPLOADS_DIR
from app.routes import clients, cases, case_status, fill_form, doc_gen, case_docs, company


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/data/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(cases.router)
app.include_router(case_status.router)
app.include_router(fill_form.router)
app.include_router(doc_gen.router)
app.include_router(case_docs.router)
app.include_router(company.router)
