from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import clients, cases, documents


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(cases.router)
app.include_router(documents.router, prefix="/clientify")
app.mount("/backend/data/uploads", StaticFiles(directory="data/uploads"), name="uploads")