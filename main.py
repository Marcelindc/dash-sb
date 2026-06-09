from fastapi import FastAPI, UploadFile, File, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError, OperationalError, IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from contextlib import asynccontextmanager
import pandas as pd
import uvicorn
import asyncio
import sys
import io
import unicodedata
import hashlib
import secrets
import json
import re
import time
import traceback
import os
import base64
import hmac
import logging
import uuid
from urllib.parse import unquote
from pathlib import Path


# Evita ConnectionResetError ruidoso no Windows/Python 3.14 quando o navegador cancela requisições.
if sys.platform.startswith("win"):
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

# ================= SEGURANÇA / AMBIENTE =================
# As credenciais não ficam mais dentro do código.
# Crie o arquivo .env na mesma pasta deste main.py com, no mínimo:
# DATABASE_URL=postgresql://...
# JWT_SECRET=uma_chave_grande_e_segura
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

BASE_DIR = Path(__file__).resolve().parent
ENV_PATHS = [BASE_DIR / ".env", Path.cwd() / ".env", BASE_DIR.parent / ".env"]

if load_dotenv:
    for env_path in ENV_PATHS:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, encoding="utf-8-sig", override=True)
            break

DATABASE_URL = os.getenv("DATABASE_URL")
ALLOWED_ORIGINS = [origem.strip() for origem in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origem.strip()]
JWT_SECRET = os.getenv("JWT_SECRET", "dash-sb-dev-secret-trocar-antes-de-publicar")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "720"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if not DATABASE_URL:
    caminhos = ", ".join(str(p) for p in ENV_PATHS)
    raise RuntimeError(
        "DATABASE_URL não configurada. "
        f"Crie um arquivo .env com DATABASE_URL=postgresql://... em um destes locais: {caminhos}"
    )

if ENVIRONMENT.lower() == "production" and JWT_SECRET == "dash-sb-dev-secret-trocar-antes-de-publicar":
    raise RuntimeError("Configure JWT_SECRET seguro no .env antes de publicar em produção.")

database_engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
    connect_args={"options": "-c statement_timeout=300000"}
)


# ================= LOGS / ERROS SEGUROS =================
# Em produção, o usuário recebe mensagens amigáveis. O detalhe técnico fica salvo em logs.
LOG_DIR = Path(os.getenv("LOG_DIR", str(BASE_DIR / "logs")))
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "backend.log"

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("dash_sb")

def gerar_request_id() -> str:
    return uuid.uuid4().hex[:12]

def detalhe_eh_tecnico(detalhe) -> bool:
    texto = str(detalhe or "").lower()
    termos_tecnicos = [
        "traceback", "sqlalchemy", "psycopg2", "operationalerror", "integrityerror",
        "programmingerror", "syntaxerror", "database_url", "select ", "insert ",
        "update ", "delete ", "from ", "where ", "connection to server",
        "could not translate host name", "password authentication failed"
    ]
    return any(t in texto for t in termos_tecnicos)

def mensagem_amigavel(status_code: int, contexto: str = "") -> str:
    if status_code == 401:
        return "Sessão expirada ou não autenticada. Faça login novamente."
    if status_code == 403:
        return "Você não tem permissão para executar esta ação."
    if status_code == 404:
        return "Recurso não encontrado."
    if status_code == 413:
        return "Arquivo muito grande para processar."
    if status_code == 422:
        return "Alguns dados enviados estão inválidos. Verifique as informações e tente novamente."
    if status_code == 429:
        return "Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente."
    if contexto == "banco":
        return "Não foi possível conectar ou consultar o banco de dados agora. Tente novamente em alguns instantes."
    return "Não foi possível processar sua solicitação agora. Tente novamente em alguns instantes."

def registrar_erro(request: Request | None, erro: Exception, contexto: str = "erro") -> str:
    request_id = gerar_request_id()
    metodo = getattr(request, "method", "-") if request else "-"
    caminho = str(getattr(getattr(request, "url", None), "path", "-")) if request else "-"
    usuario = getattr(getattr(request, "state", None), "usuario", None) if request else None
    usuario_txt = f"{usuario.get('email')} ({usuario.get('perfil')})" if isinstance(usuario, dict) else "não autenticado/desconhecido"
    logger.exception(
        "request_id=%s | contexto=%s | metodo=%s | rota=%s | usuario=%s | erro=%s",
        request_id, contexto, metodo, caminho, usuario_txt, repr(erro)
    )
    return request_id


# ================= RATE LIMIT / PROTEÇÃO CONTRA EXCESSO DE REQUISIÇÕES =================
# Proteção em memória para uso local/produção simples.
# Em produção com várias instâncias, o ideal é trocar por Redis, mas esta camada já
# evita loops de requisições, força bruta no login e excesso de chamadas nos filtros.
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMITS = {
    "login": int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "5")),
    "upload": int(os.getenv("RATE_LIMIT_UPLOAD_PER_MINUTE", "10")),
    "dashboard": int(os.getenv("RATE_LIMIT_DASHBOARD_PER_MINUTE", "60")),
    "metas": int(os.getenv("RATE_LIMIT_METAS_PER_MINUTE", "60")),
    "gestao_nucleos": int(os.getenv("RATE_LIMIT_GESTAO_NUCLEOS_PER_MINUTE", "60")),
    "geral": int(os.getenv("RATE_LIMIT_GERAL_PER_MINUTE", "120")),
}
_rate_limit_store: dict[str, list[float]] = {}
_ultima_limpeza_rate_limit = 0.0

def obter_ip_cliente(request: Request) -> str:
    encaminhado = request.headers.get("x-forwarded-for")
    if encaminhado:
        return encaminhado.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "desconhecido"

def obter_grupo_rate_limit(path: str) -> str:
    if path == "/auth/login":
        return "login"
    if path.startswith("/upload"):
        return "upload"
    if path.startswith("/dashboard"):
        return "dashboard"
    if path.startswith("/metas"):
        return "metas"
    if path.startswith("/gestao-nucleos"):
        return "gestao_nucleos"
    return "geral"

def limpar_rate_limit_antigo(agora: float):
    global _ultima_limpeza_rate_limit
    if agora - _ultima_limpeza_rate_limit < RATE_LIMIT_WINDOW_SECONDS:
        return
    limite_tempo = agora - RATE_LIMIT_WINDOW_SECONDS
    chaves_remover = []
    for chave, timestamps in list(_rate_limit_store.items()):
        recentes = [t for t in timestamps if t >= limite_tempo]
        if recentes:
            _rate_limit_store[chave] = recentes
        else:
            chaves_remover.append(chave)
    for chave in chaves_remover:
        _rate_limit_store.pop(chave, None)
    _ultima_limpeza_rate_limit = agora

def verificar_rate_limit(request: Request):
    # OPTIONS é liberado para CORS.
    if request.method.upper() == "OPTIONS":
        return

    agora = time.time()
    limpar_rate_limit_antigo(agora)

    path = request.url.path
    grupo = obter_grupo_rate_limit(path)
    limite = RATE_LIMITS.get(grupo, RATE_LIMITS["geral"])
    janela = RATE_LIMIT_WINDOW_SECONDS
    ip = obter_ip_cliente(request)
    chave = f"{ip}:{grupo}"

    limite_tempo = agora - janela
    timestamps = [t for t in _rate_limit_store.get(chave, []) if t >= limite_tempo]

    if len(timestamps) >= limite:
        retry_after = max(1, int(janela - (agora - timestamps[0])))
        raise HTTPException(
            status_code=429,
            detail=f"Muitas requisições em pouco tempo. Aguarde {retry_after} segundos e tente novamente.",
            headers={"Retry-After": str(retry_after)},
        )

    timestamps.append(agora)
    _rate_limit_store[chave] = timestamps


# ================= AUTENTICAÇÃO JWT =================
def _base64url_encode(valor: bytes) -> str:
    return base64.urlsafe_b64encode(valor).rstrip(b"=").decode("utf-8")

def _base64url_decode(valor: str) -> bytes:
    padding = "=" * (-len(valor) % 4)
    return base64.urlsafe_b64decode((valor + padding).encode("utf-8"))

def criar_token_jwt(usuario: dict) -> str:
    agora = int(time.time())
    payload = {
        "sub": str(usuario.get("id")),
        "nome": usuario.get("nome"),
        "email": usuario.get("email"),
        "perfil": usuario.get("perfil", "visualizador"),
        "iat": agora,
        "exp": agora + (JWT_EXPIRATION_MINUTES * 60),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    assinatura = hmac.new(JWT_SECRET.encode("utf-8"), f"{header_b64}.{payload_b64}".encode("utf-8"), hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_base64url_encode(assinatura)}"

def validar_token_jwt(token: str) -> dict:
    try:
        header_b64, payload_b64, assinatura_b64 = token.split(".")
        assinatura_esperada = hmac.new(JWT_SECRET.encode("utf-8"), f"{header_b64}.{payload_b64}".encode("utf-8"), hashlib.sha256).digest()
        assinatura_recebida = _base64url_decode(assinatura_b64)
        if not hmac.compare_digest(assinatura_esperada, assinatura_recebida):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada. Faça login novamente.")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou ausente.")

def extrair_token_authorization(request: Request) -> str:
    authorization = request.headers.get("Authorization") or ""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de autenticação ausente.")
    return authorization.replace("Bearer ", "", 1).strip()

PUBLIC_PATHS = {
    "/auth/login",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}

# Permissões mínimas de segurança no backend.
# O front continua controlando quais abas aparecem, mas o backend também bloqueia
# chamadas diretas para rotas sem autorização.
PERMISSOES_PADRAO_BACKEND = {
    "admin": ["Dashboard", "Metas", "N1", "N2", "Ranking", "Comparativo", "Revendedores", "Consultores", "Base", "Configurações", "Perfil"],
    "gestor": ["Dashboard", "Metas", "N1", "N2", "Ranking", "Comparativo", "Revendedores", "Consultores", "Perfil"],
    "visualizador": ["Dashboard", "Metas", "Ranking", "Comparativo", "Revendedores", "Perfil"],
}

# Prefixos que só administrador pode acessar/modificar.
ADMIN_PATHS_PREFIX = (
    "/auth/usuarios",
    "/auth/criar-usuario",
    "/auth/atualizar-usuario",
    "/auth/deletar-usuario",
    "/upload",
)

ADMIN_EXACT_METHODS = {
    ("POST", "/auth/permissoes"),
    ("POST", "/ciclos"),
}

ADMIN_METHOD_PREFIXES = (
    ("PUT", "/ciclos/"),
    ("DELETE", "/ciclos/"),
    ("POST", "/consultores"),
    ("PUT", "/consultores/"),
    ("DELETE", "/consultores/"),
)

# Rotas onde gestor também pode gravar, desde que tenha acesso à aba N1/N2.
GESTOR_OU_ADMIN_METHOD_PREFIXES = (
    ("POST", "/gestao-nucleos/"),
)

_permissoes_cache = {"valor": None, "expira_em": 0}

# Mantém as automações locais funcionando no ambiente de desenvolvimento.
# Em produção, estes endpoints também exigem JWT.
AUTOMATION_LOCAL_PATHS = {
    "/upload/pedidos/arquivo-local",
    "/upload/vendas-make/arquivos-locais",
    "/upload/vendas-cabelo/arquivos-locais",
}

def rota_publica(path: str) -> bool:
    if path in PUBLIC_PATHS:
        return True
    if path.startswith("/docs/") or path.startswith("/redoc/"):
        return True
    return False

ABAS_SISTEMA_BACKEND = [
    "Dashboard", "Metas", "N1", "N2", "Ranking", "Comparativo",
    "Revendedores", "Consultores", "Base", "Configurações", "Perfil"
]
PERFIS_SISTEMA_BACKEND = ["admin", "gestor", "visualizador"]

def normalizar_permissoes_backend(permissoes: dict | None) -> dict:
    existe_configuracao_salva = isinstance(permissoes, dict) and any(
        isinstance(permissoes.get(perfil), list) for perfil in PERFIS_SISTEMA_BACKEND
    )

    if not existe_configuracao_salva:
        return {perfil: list(abas) for perfil, abas in PERMISSOES_PADRAO_BACKEND.items()}

    normalizadas = {}
    for perfil in PERFIS_SISTEMA_BACKEND:
        abas_salvas = permissoes.get(perfil, [])
        if not isinstance(abas_salvas, list):
            abas_salvas = []
        normalizadas[perfil] = list(dict.fromkeys([
            aba for aba in abas_salvas if aba in ABAS_SISTEMA_BACKEND
        ]))

    # O admin nunca pode perder acesso à configuração e ao próprio perfil.
    for aba_obrigatoria in ["Configurações", "Perfil"]:
        if aba_obrigatoria not in normalizadas["admin"]:
            normalizadas["admin"].append(aba_obrigatoria)

    return normalizadas

def carregar_permissoes_backend() -> dict:
    agora = time.time()
    if _permissoes_cache["valor"] is not None and _permissoes_cache["expira_em"] > agora:
        return _permissoes_cache["valor"]

    permissoes = PERMISSOES_PADRAO_BACKEND
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn) if "get_all_tables" in globals() else []
            if "config_sistema" in tables:
                res = conn.execute(text("SELECT valor FROM config_sistema WHERE chave = 'permissoes_perfil' LIMIT 1")).fetchone()
                if res and res[0]:
                    permissoes = json.loads(res[0])
    except Exception:
        permissoes = PERMISSOES_PADRAO_BACKEND

    permissoes = normalizar_permissoes_backend(permissoes)
    _permissoes_cache["valor"] = permissoes
    _permissoes_cache["expira_em"] = agora + 30
    return permissoes

def limpar_cache_permissoes_backend():
    _permissoes_cache["valor"] = None
    _permissoes_cache["expira_em"] = 0

def exige_admin(method: str, path: str) -> bool:
    metodo = method.upper()
    if (metodo, path) in ADMIN_EXACT_METHODS:
        return True
    if any(metodo == m and path.startswith(prefixo) for m, prefixo in ADMIN_METHOD_PREFIXES):
        return True
    return any(path.startswith(prefixo) for prefixo in ADMIN_PATHS_PREFIX)

def exige_gestor_ou_admin(method: str, path: str) -> bool:
    metodo = method.upper()
    return any(metodo == m and path.startswith(prefixo) for m, prefixo in GESTOR_OU_ADMIN_METHOD_PREFIXES)

def aba_exigida_por_rota(method: str, path: str) -> str | None:
    metodo = method.upper()

    if path.startswith("/gestao-nucleos/N1"):
        return "N1"
    if path.startswith("/gestao-nucleos/N2"):
        return "N2"
    if path.startswith("/dashboard"):
        return "Dashboard"
    if path.startswith("/metas"):
        return "Metas"
    if path.startswith("/revendedores"):
        return "Revendedores"
    if path.startswith("/consultores/listar"):
        return "Consultores"
    if path.startswith("/ciclos") and metodo == "GET":
        return "Base"
    if path.startswith("/auth/alterar-senha"):
        return "Perfil"
    return None

def usuario_tem_acesso_aba(usuario: dict, aba: str | None) -> bool:
    if not aba:
        return True
    perfil = usuario.get("perfil", "visualizador")
    if perfil == "admin":
        return True
    permissoes = carregar_permissoes_backend()
    return aba in permissoes.get(perfil, [])

def inicializar_tabela_usuarios():
    with database_engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS usuarios_sistema (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha_hash TEXT NOT NULL, salt TEXT NOT NULL, perfil TEXT NOT NULL DEFAULT 'visualizador', status_usuario TEXT NOT NULL DEFAULT 'ativo', criado_em TIMESTAMP DEFAULT NOW());"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS config_sistema (chave TEXT PRIMARY KEY, valor TEXT);"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS ciclos_comerciais (id SERIAL PRIMARY KEY, ciclo TEXT NOT NULL, data_inicio DATE NOT NULL, data_fim DATE NOT NULL, meta_ciclo DOUBLE PRECISION NOT NULL DEFAULT 0, status_ciclo TEXT NOT NULL DEFAULT 'ativo', criado_em TIMESTAMP DEFAULT NOW());"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS metas_gerenciais_nucleos (id BIGSERIAL PRIMARY KEY, ciclo TEXT NOT NULL, nucleo TEXT NOT NULL, meta_oficial DOUBLE PRECISION NOT NULL DEFAULT 0, meta_gerencial DOUBLE PRECISION NOT NULL DEFAULT 0, observacao TEXT, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (ciclo, nucleo));"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS metas_gerenciais_estruturas (id BIGSERIAL PRIMARY KEY, ciclo TEXT NOT NULL, nucleo TEXT NOT NULL, estrutura TEXT NOT NULL, peso DOUBLE PRECISION NOT NULL DEFAULT 0, meta_oficial DOUBLE PRECISION NOT NULL DEFAULT 0, meta_gerencial DOUBLE PRECISION NOT NULL DEFAULT 0, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (ciclo, nucleo, estrutura));"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS metas_gerenciais_consultores (id BIGSERIAL PRIMARY KEY, ciclo TEXT NOT NULL, nucleo TEXT NOT NULL, estrutura TEXT NOT NULL, id_colaborador TEXT NOT NULL, consultor TEXT NOT NULL, peso DOUBLE PRECISION NOT NULL DEFAULT 0, meta_gerencial DOUBLE PRECISION NOT NULL DEFAULT 0, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (ciclo, nucleo, estrutura, id_colaborador));"))
        if not conn.execute(text("SELECT id FROM usuarios_sistema WHERE LOWER(email) = :email"), {"email": "marcelodc34@gmail.com"}).fetchone():
            sh, salt = criar_senha_hash(os.getenv("ADMIN_DEFAULT_PASSWORD", "123456"))
            conn.execute(text("INSERT INTO usuarios_sistema (nome, email, senha_hash, salt, perfil, status_usuario) VALUES (:n, :e, :sh, :s, :p, :st)"), {"n": "Marcelin Cabral", "e": "marcelodc34@gmail.com", "sh": sh, "s": salt, "p": "admin", "st": "ativo"})

@asynccontextmanager
async def lifespan(app: FastAPI):
    inicializar_tabela_usuarios()
    inicializar_indices_performance()
    yield

app = FastAPI(title="Backend Gerenciador de Vendas", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.exception_handler(RequestValidationError)
async def handler_validacao_requisicao(request: Request, exc: RequestValidationError):
    request_id = registrar_erro(request, exc, "validacao_requisicao")
    return JSONResponse(
        status_code=422,
        content={
            "detail": mensagem_amigavel(422),
            "request_id": request_id,
        },
    )

@app.exception_handler(IntegrityError)
async def handler_integridade_banco(request: Request, exc: IntegrityError):
    request_id = registrar_erro(request, exc, "integridade_banco")
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Não foi possível salvar porque já existe um registro igual ou os dados violam uma regra do banco.",
            "request_id": request_id,
        },
    )

async def responder_erro_banco(request: Request, exc: Exception):
    request_id = registrar_erro(request, exc, "banco")
    return JSONResponse(
        status_code=503,
        content={
            "detail": mensagem_amigavel(503, "banco"),
            "request_id": request_id,
        },
    )

@app.exception_handler(OperationalError)
async def handler_operacional_banco(request: Request, exc: OperationalError):
    return await responder_erro_banco(request, exc)

@app.exception_handler(SQLAlchemyError)
async def handler_banco_dados(request: Request, exc: SQLAlchemyError):
    return await responder_erro_banco(request, exc)

@app.exception_handler(HTTPException)
async def handler_http_exception(request: Request, exc: HTTPException):
    request_id = None
    detalhe = exc.detail

    if exc.status_code >= 500 or detalhe_eh_tecnico(detalhe):
        request_id = registrar_erro(request, exc, "http_exception")
        detalhe = mensagem_amigavel(exc.status_code)

    content = {"detail": detalhe}
    if request_id:
        content["request_id"] = request_id

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=getattr(exc, "headers", None) or {},
    )

@app.exception_handler(Exception)
async def handler_erro_geral(request: Request, exc: Exception):
    request_id = registrar_erro(request, exc, "erro_geral")
    return JSONResponse(
        status_code=500,
        content={
            "detail": mensagem_amigavel(500),
            "request_id": request_id,
        },
    )


@app.middleware("http")
async def middleware_autenticacao(request: Request, call_next):
    # Rate limit antes da autenticação para proteger também /auth/login.
    try:
        verificar_rate_limit(request)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None) or {},
        )

    # Libera preflight CORS e rotas públicas.
    if request.method.upper() == "OPTIONS" or rota_publica(request.url.path):
        return await call_next(request)

    # As extensões Chrome locais enviam arquivos para estes endpoints.
    # Para não quebrar o fluxo local, libera apenas em development e apenas localmente.
    cliente_host = request.client.host if request.client else ""
    if (
        ENVIRONMENT.lower() == "development"
        and request.url.path in AUTOMATION_LOCAL_PATHS
        and cliente_host in {"127.0.0.1", "::1", "localhost"}
    ):
        return await call_next(request)

    try:
        token = extrair_token_authorization(request)
        usuario_token = validar_token_jwt(token)

        # Confere se o usuário ainda existe e está ativo.
        with database_engine.connect() as conn:
            usuario_banco = conn.execute(
                text("SELECT id, nome, email, perfil, status_usuario FROM usuarios_sistema WHERE id = :id LIMIT 1"),
                {"id": int(usuario_token.get("sub"))}
            ).mappings().fetchone()

        if not usuario_banco or usuario_banco["status_usuario"] != "ativo":
            return JSONResponse(status_code=401, content={"detail": "Usuário inativo ou não encontrado."})

        usuario = dict(usuario_banco)
        request.state.usuario = usuario

        path = request.url.path
        metodo = request.method.upper()

        if exige_admin(metodo, path) and usuario.get("perfil") != "admin":
            return JSONResponse(status_code=403, content={"detail": "Acesso restrito ao administrador."})

        if exige_gestor_ou_admin(metodo, path) and usuario.get("perfil") not in {"admin", "gestor"}:
            return JSONResponse(status_code=403, content={"detail": "Acesso permitido apenas para gestor ou administrador."})

        aba_necessaria = aba_exigida_por_rota(metodo, path)
        if not usuario_tem_acesso_aba(usuario, aba_necessaria):
            return JSONResponse(status_code=403, content={"detail": f"Seu perfil não tem acesso à aba {aba_necessaria}."})

        return await call_next(request)
    except HTTPException as erro:
        return JSONResponse(status_code=erro.status_code, content={"detail": erro.detail})
    except Exception as erro:
        request_id = registrar_erro(request, erro, "middleware_autenticacao")
        return JSONResponse(status_code=401, content={"detail": "Falha na autenticação da requisição.", "request_id": request_id})

STATUS_VALIDOS_REALIZADO = ["aprovado", "transporte", "separacao", "entregue", "pendente"]

NUCLEOS_MAP = {
    "NUCLEO 1": ["CURURUPU", "ER SANTA HELENA", "ALCANTARA", "PINHEIRO", "ROSEANE", "GISELE", "LILIANE", "STEPHANY", "LUDMILLA", "MARCOS", "SOSTENES", "ELISEU", "CARLOS ALBERTO", "BENILSON"],
    "NUCLEO 2": ["ER VIANA", "ER VITORIA", "ER VITÓRIA", "SAO BENTO", "SÃO BENTO", "BERCARIO", "BERÇÁRIO", "BRENDA", "GRAZIELLE", "IVAN", "CHARLYANE", "LEONILDE", "LUCIANE", "YAN PABLO"]
}

MAPA_COLUNAS_PEDIDOS = {
    "CodigoPedido": "codigo_pedido", "CódigoPedido": "codigo_pedido", "Codigo Pedido": "codigo_pedido", "Código Pedido": "codigo_pedido",
    "Pessoa": "pessoa", "NomePessoa": "nome_pessoa", "Nome Pessoa": "nome_pessoa", "Papel": "papel", "QtdeItens": "qtde_itens",
    "Qtde Itens": "qtde_itens", "Quantidade Itens": "qtde_itens", "ValorPraticado": "valor_praticado", "Valor Praticado": "valor_praticado",
    "ValorLiquido": "valor_liquido", "Valor Líquido": "valor_liquido", "Valor Liquido": "valor_liquido", "MeioCaptacao": "meio_captacao",
    "Meio Captação": "meio_captacao", "Meio Captacao": "meio_captacao", "SituaçãoComercial": "situacao_comercial", "Situação Comercial": "situacao_comercial",
    "SituacaoComercial": "situacao_comercial", "Situacao Comercial": "situacao_comercial", "DetalheSituaçãoComercial": "detalhe_situacao_comercial",
    "Detalhe Situação Comercial": "detalhe_situacao_comercial", "DetalheSituacaoComercial": "detalhe_situacao_comercial", "Detalhe Situacao Comercial": "detalhe_situacao_comercial",
    "Data Captação": "data_captacao", "Data Captacao": "data_captacao", "DataCaptação": "data_captacao", "DataCaptacao": "data_captacao",
    "Data de Captação": "data_captacao", "Data de Captacao": "data_captacao", "Data Pedido": "data_captacao", "DataPedido": "data_captacao",
    "HoraPedido": "hora_pedido", "Hora Pedido": "hora_pedido", "Ciclo Captação": "ciclo_captacao", "Ciclo Captacao": "ciclo_captacao",
    "CicloCaptação": "ciclo_captacao", "CicloCaptacao": "ciclo_captacao", "PlanoPagamento": "plano_pagamento", "Plano Pagamento": "plano_pagamento",
    "Cidade": "cidade", "ModeloComercial": "modelo_comercial", "Modelo Comercial": "modelo_comercial", "EstruturaPai": "estrutura_pai",
    "Estrutura Pai": "estrutura_pai", "Cód Estrutura": "cod_estrutura", "Cod Estrutura": "cod_estrutura", "Código Estrutura": "cod_estrutura",
    "Codigo Estrutura": "cod_estrutura", "Estrutura": "estrutura", "Cód Usuário Finalização": "cod_usuario_finalizacao", "Cod Usuário Finalização": "cod_usuario_finalizacao",
    "Cód Usuario Finalizacao": "cod_usuario_finalizacao", "Cod Usuario Finalizacao": "cod_usuario_finalizacao", "Código Usuário Finalização": "cod_usuario_finalizacao",
    "Codigo Usuario Finalizacao": "cod_usuario_finalizacao", "Usuario de Finalização": "usuario_finalizacao", "Usuário de Finalização": "usuario_finalizacao",
    "Usuario de Finalizacao": "usuario_finalizacao", "Usuário Finalização": "usuario_finalizacao", "Usuario Finalizacao": "usuario_finalizacao"
}

MAPA_COLUNAS_METAS = {
    "Estrutura": "estrutura", "Receita": "receita", "Atividade": "atividade", "RPA": "rpa", "Tkt Médio": "tkt_medio",
    "Tkt Medio": "tkt_medio", "Ticket Médio": "tkt_medio", "Ticket Medio": "tkt_medio", "UPA": "upa", "Pen. Make": "pen_make",
    "Pen Make": "pen_make", "Penetração Make": "pen_make", "Penetracao Make": "pen_make", "Pen. Cabelos": "pen_cabelos",
    "Pen Cabelos": "pen_cabelos", "Penetração Cabelos": "pen_cabelos", "Penetracao Cabelos": "pen_cabelos", "Pen. Multimarcas": "pen_multimarcas",
    "Pen Multimarcas": "pen_multimarcas", "Penetração Multimarcas": "pen_multimarcas", "Penetracao Multimarcas": "pen_multimarcas"
}

MAPA_COLUNAS_CONSULTORES = {
    "id_colaborador": "id_colaborador", "Id Colaborador": "id_colaborador", "ID Colaborador": "id_colaborador", "Código Colaborador": "id_colaborador",
    "Codigo Colaborador": "id_colaborador", "Cód Colaborador": "id_colaborador", "Cod Colaborador": "id_colaborador", "nome": "nome",
    "Nome": "nome", "Estrutura": "estrutura", "estrutura": "estrutura", "Canal": "canal", "canal": "canal",
    "Status": "status_consultor", "status": "status_consultor", "status_consultor": "status_consultor", "Peso Meta": "peso_meta",
    "Peso": "peso_meta", "peso_meta": "peso_meta"
}

MAPA_COLUNAS_BASE_ATIVA = {
    "Estrutura": "estrutura", "estrutura": "estrutura", "Base_Ativa": "base_ativa", "Base Ativa": "base_ativa",
    "Base ativa": "base_ativa", "base_ativa": "base_ativa", "BaseAtiva": "base_ativa", "Base": "base_ativa", "base": "base_ativa"
}

MAPA_COLUNAS_REVENDEDORES = {
    "ajt_cod_des_revendedor": "cod_des_revendedor",
    "Cod Estrutura": "cod_estrutura",
    "Código Estrutura": "cod_estrutura",
    "Codigo Estrutura": "cod_estrutura",
    "Nome Estrutura": "nome_estrutura",
    "Estrutura": "nome_estrutura",
    "Cod Revendedor": "cod_revendedor",
    "Código Revendedor": "cod_revendedor",
    "Codigo Revendedor": "cod_revendedor",
    "Nome Revendedor": "nome_revendedor",
    "Revendedor": "nome_revendedor",
    "Idade": "idade",
    "Tel. Celular": "tel_celular",
    "Telefone": "tel_celular",
    "E-mail": "email",
    "Email": "email",
    "Endereço": "endereco",
    "Endereco": "endereco",
    "Bairro": "bairro",
    "Cidade": "cidade",
    "Origem Revendedor": "origem_revendedor",
    "Atividade": "atividade",
    "Papel": "papel",
    "Manutenção Papel PVR": "manutencao_papel_pvr",
    "Termômetro Prox. Papel ": "termometro_prox_papel",
    "Termômetro Prox. Papel": "termometro_prox_papel",
    "Faixa Ganhe Mais": "faixa_ganhe_mais",
    "Termômetro Próxima Faixa": "termometro_proxima_faixa",
    "Comprou no App?": "comprou_app",
    "Comprou no ER?": "comprou_er",
    "Comprou no Portal?": "comprou_portal",
    "Opt Out BOT": "opt_out_bot",
    "Opt Out EUD": "opt_out_eud",
    "Opt Out EAM": "opt_out_eam",
    "Opt Out OUI": "opt_out_oui",
    "Inadimplente?": "inadimplente",
    "Campanha BOT": "campanha_bot",
    "Campanha OUI": "campanha_oui",
    "Campanha QDB": "campanha_qdb",
    "Campanha EUD": "campanha_eud",
    "Campanha MM": "campanha_mm",
    "Crédito Disponível": "credito_disponivel",
    "Crédito Dinâmico Mooz ": "credito_dinamico_mooz",
    "Crédito Dinâmico Mooz": "credito_dinamico_mooz",
    "vlr_receita_liquida": "vlr_receita_liquida",
    "Receita VD Últimos 6 ciclos": "receita_vd_ultimos_6_ciclos",
    "Receita Média VD 6 ciclos": "receita_media_vd_6_ciclos",
    "Receita VD Ciclo": "receita_vd_ciclo",
    "Receita BOT Últimos 6 ciclos": "receita_bot_ultimos_6_ciclos",
    "Receita BOT Ciclo": "receita_bot_ciclo",
    "Receita QDB Últimos 6 ciclos": "receita_qdb_ultimos_6_ciclos",
    "Receita QDB Ciclo": "receita_qdb_ciclo",
    "Receita OUI Últimos 6 ciclos": "receita_oui_ultimos_6_ciclos",
    "Receita OUI Ciclo": "receita_oui_ciclo",
    "Receita AG Últimos 6 ciclos": "receita_ag_ultimos_6_ciclos",
    "Receita AG Ciclo": "receita_ag_ciclo",
    "Receita EUD Últimos 6 ciclos": "receita_eud_ultimos_6_ciclos",
    "Receita EUD Ciclo": "receita_eud_ciclo",
    "Receita Entregas": "receita_entregas",
    "Receita ER": "receita_er",
    "Receita NEW": "receita_new",
    "Receita Gifts": "receita_gifts"
}

MAPA_COLUNAS_SKUS_IAF = {
    "Código": "codigo_produto", "Codigo": "codigo_produto", "Código Produto": "codigo_produto", "Codigo Produto": "codigo_produto",
    "Cód Produto": "codigo_produto", "Cod Produto": "codigo_produto", "SKU": "codigo_produto", "sku": "codigo_produto",
    "Produto": "produto", "produto": "produto", "Descrição": "produto", "Descricao": "produto", "Marca": "marca", "marca": "marca"
}

MAPA_COLUNAS_VENDAS_ITEM = {
    "Código Produto": "codigo_produto", "Codigo Produto": "codigo_produto", "Cód Produto": "codigo_produto", "Cod Produto": "codigo_produto",
    "Produto": "produto", "Qtde": "quantidade", "Quantidade": "quantidade", "Total Praticado": "total_praticado", "Valor Praticado": "total_praticado",
    "ValorPraticado": "total_praticado", "Total Líquido": "total_liquido", "Total Liquido": "total_liquido", "Valor Líquido": "total_liquido",
    "Valor Liquido": "total_liquido", "Código Pedido": "codigo_pedido", "Codigo Pedido": "codigo_pedido", "CodigoPedido": "codigo_pedido",
    "CódigoPedido": "codigo_pedido", "Data captação pedido": "data_captacao", "Data Captação Pedido": "data_captacao", "Data Captacao Pedido": "data_captacao",
    "Data captação": "data_captacao", "Data Captação": "data_captacao", "Data Captacao": "data_captacao", "Ciclo captação pedido": "ciclo_captacao",
    "Ciclo Captação Pedido": "ciclo_captacao", "Ciclo Captacao Pedido": "ciclo_captacao", "Código Revendedor": "pessoa", "Codigo Revendedor": "pessoa",
    "Código Pessoa": "pessoa", "Codigo Pessoa": "pessoa", "Pessoa": "pessoa", "Revendedor": "nome_pessoa", "Nome Revendedor": "nome_pessoa",
    "Nome Pessoa": "nome_pessoa", "Meio de captação": "meio_captacao", "Meio de Captacao": "meio_captacao", "Meio Captação": "meio_captacao",
    "Meio Captacao": "meio_captacao", "Código usuário finalização": "cod_usuario_finalizacao", "Codigo usuário finalização": "cod_usuario_finalizacao",
    "Código usuario finalizacao": "cod_usuario_finalizacao", "Codigo usuario finalizacao": "cod_usuario_finalizacao", "Código Usuário Finalização": "cod_usuario_finalizacao",
    "Cód Usuário Finalização": "cod_usuario_finalizacao", "Cod Usuario Finalizacao": "cod_usuario_finalizacao", "Usuário finalização": "usuario_finalizacao",
    "Usuario finalização": "usuario_finalizacao", "Usuário Finalização": "usuario_finalizacao", "Usuario Finalizacao": "usuario_finalizacao",
    "Canal de distribuição": "canal_distribuicao", "Canal de Distribuição": "canal_distribuicao", "Canal de Distribuicao": "canal_distribuicao"
}

class FiltrosRequest(BaseModel):
    nucleos: List[str] = []
    unidades: List[str] = []
    estruturas: List[str] = []
    consultores: List[str] = []
    situacoes: List[str] = []
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None

class LoginRequest(BaseModel): email: str; senha: str
class CriarUsuarioRequest(BaseModel): nome: str; email: str; senha: str; perfil: str = "visualizador"; status_usuario: str = "ativo"
class AlterarSenhaRequest(BaseModel): email: str; senha_atual: str; nova_senha: str
class AtualizarUsuarioRequest(BaseModel): id: int; nome: str; perfil: str; status_usuario: str
class CicloRequest(BaseModel): ciclo: str; data_inicio: str; data_fim: str; meta_ciclo: float; status_ciclo: str = "ativo"
class AtualizarCicloRequest(BaseModel): ciclo: str; data_inicio: str; data_fim: str; meta_ciclo: float; status_ciclo: str
class AtualizarConsultorRequest(BaseModel): nome: str; estrutura: str; canal: str; status_consultor: str; peso_meta: float
class CriarConsultorRequest(BaseModel): id_colaborador: str; nome: str; estrutura: str; canal: str; status_consultor: str; peso_meta: float
class PermissoesRequest(BaseModel): permissoes: dict
class ArquivoLocalRequest(BaseModel):
    caminho: str

class ArquivosLocaisRequest(BaseModel):
    caminhos: List[str]


class MetaGerencialEstruturaRequest(BaseModel):
    estrutura: str
    peso: float = 0
    meta_oficial: float = 0
    meta_gerencial: float = 0

class MetaGerencialConsultorRequest(BaseModel):
    estrutura: str
    id_colaborador: str
    consultor: str
    peso: float = 0
    meta_gerencial: float = 0

class SalvarMetaGerencialRequest(BaseModel):
    ciclo: Optional[str] = None
    nucleo: Optional[str] = None
    meta_gerencial_nucleo: float = 0
    observacao: Optional[str] = None
    estruturas: List[MetaGerencialEstruturaRequest] = []
    consultores: List[MetaGerencialConsultorRequest] = []


def get_all_tables(conn):
    res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).fetchall()
    return set([r[0] for r in res])

# Cache curto de tabelas inteiras em memória.
# O gargalo do dashboard era ler várias tabelas do Supabase em toda troca de aba/filtro.
# Mantemos TTL curto e limpamos em todo upload/cadastro para não ficar com dado antigo.
CACHE_TABELAS = {}
CACHE_TTL_SEGUNDOS = 45

def limpar_cache_tabelas():
    CACHE_TABELAS.clear()

def ler_tabela_cacheada(nome_tabela: str, conn, ttl: int = CACHE_TTL_SEGUNDOS) -> pd.DataFrame:
    agora = time.time()
    item = CACHE_TABELAS.get(nome_tabela)
    if item and (agora - item["ts"] <= ttl):
        return item["df"].copy()

    df = pd.read_sql(f"SELECT * FROM {nome_tabela}", conn)
    CACHE_TABELAS[nome_tabela] = {"ts": agora, "df": df}
    return df.copy()


def obter_colunas_tabela_seguro(conn, nome_tabela: str) -> set:
    try:
        res = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :t"
        ), {"t": nome_tabela}).fetchall()
        return set([r[0] for r in res])
    except Exception:
        return set()

def criar_indice_se_coluna_existir(conn, nome_tabela: str, nome_coluna: str, nome_indice: str):
    colunas = obter_colunas_tabela_seguro(conn, nome_tabela)
    if nome_coluna in colunas:
        conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{nome_indice}" ON "{nome_tabela}" ("{nome_coluna}");'))

def inicializar_indices_performance():
    try:
        with database_engine.begin() as conn:
            tables = get_all_tables(conn)
            if "consulta_pedidos" in tables:
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "data_captacao", "idx_consulta_pedidos_data_captacao")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "estrutura", "idx_consulta_pedidos_estrutura")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "unidade", "idx_consulta_pedidos_unidade")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "situacao_normalizada", "idx_consulta_pedidos_situacao_normalizada")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "usuario_finalizacao", "idx_consulta_pedidos_usuario_finalizacao")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "cod_usuario_finalizacao", "idx_consulta_pedidos_cod_usuario_finalizacao")
                criar_indice_se_coluna_existir(conn, "consulta_pedidos", "meio_captacao", "idx_consulta_pedidos_meio_captacao")
            if "metas_estruturas" in tables:
                criar_indice_se_coluna_existir(conn, "metas_estruturas", "estrutura", "idx_metas_estruturas_estrutura")
            if "consultores_metas" in tables:
                criar_indice_se_coluna_existir(conn, "consultores_metas", "estrutura", "idx_consultores_metas_estrutura")
                criar_indice_se_coluna_existir(conn, "consultores_metas", "id_colaborador", "idx_consultores_metas_id_colaborador")
            if "base_ativa_revendedores" in tables:
                criar_indice_se_coluna_existir(conn, "base_ativa_revendedores", "estrutura", "idx_base_ativa_revendedores_estrutura")
            if "vendas_make" in tables:
                criar_indice_se_coluna_existir(conn, "vendas_make", "data_captacao", "idx_vendas_make_data_captacao")
                criar_indice_se_coluna_existir(conn, "vendas_make", "codigo_produto_normalizado", "idx_vendas_make_codigo_produto_normalizado")
                criar_indice_se_coluna_existir(conn, "vendas_make", "cod_usuario_finalizacao", "idx_vendas_make_cod_usuario_finalizacao")
            if "vendas_cabelo" in tables:
                criar_indice_se_coluna_existir(conn, "vendas_cabelo", "data_captacao", "idx_vendas_cabelo_data_captacao")
                criar_indice_se_coluna_existir(conn, "vendas_cabelo", "codigo_produto_normalizado", "idx_vendas_cabelo_codigo_produto_normalizado")
                criar_indice_se_coluna_existir(conn, "vendas_cabelo", "cod_usuario_finalizacao", "idx_vendas_cabelo_cod_usuario_finalizacao")
    except Exception as erro:
        print(f"Aviso: não foi possível criar todos os índices de performance: {erro}")

def tabela_existe_upload(n): 
    return n in inspect(database_engine).get_table_names()

def normalizar_texto(v):
    if pd.isna(v): return ""
    return "".join([c for c in unicodedata.normalize("NFKD", str(v).strip().lower()) if not unicodedata.combining(c)])

def normalizar_codigo(v):
    if pd.isna(v): return ""
    return str(v).strip().replace(".0", "").replace(".", "").replace(",", "").replace("-", "").replace("/", "").replace(" ", "")

def normalizar_identificador(v): return normalizar_codigo(v)

def normalizar_nome_coluna_banco(nome):
    texto = str(nome or "").strip().lower()
    texto = "".join([c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c)])
    texto = re.sub(r"[^a-z0-9]+", "_", texto).strip("_")
    return texto or "coluna_sem_nome"



def padronizar_colunas(dataframe: pd.DataFrame, mapa_colunas: dict) -> pd.DataFrame:
    """Padroniza nomes de colunas vindos do Excel ou já salvos no banco.
    Mantém compatibilidade com colunas já normalizadas, ex.: receita, estrutura.
    """
    if dataframe is None or dataframe.empty:
        return dataframe
    df = dataframe.copy()
    mapa_direto = dict(mapa_colunas or {})
    mapa_normalizado = {normalizar_nome_coluna_banco(k): v for k, v in mapa_direto.items()}
    renomear = {}
    for coluna in df.columns:
        nome_original = str(coluna)
        nome_norm = normalizar_nome_coluna_banco(nome_original)
        if nome_original in mapa_direto:
            renomear[coluna] = mapa_direto[nome_original]
        elif nome_norm in mapa_normalizado:
            renomear[coluna] = mapa_normalizado[nome_norm]
        else:
            renomear[coluna] = nome_norm
    df = df.rename(columns=renomear)
    return df


def garantir_colunas(dataframe: pd.DataFrame, colunas: list, valor_padrao=None) -> pd.DataFrame:
    """Garante que um DataFrame tenha as colunas esperadas para evitar NameError/KeyError."""
    if dataframe is None:
        return pd.DataFrame(columns=colunas)
    for coluna in colunas:
        if coluna not in dataframe.columns:
            dataframe[coluna] = valor_padrao
    return dataframe

def limpar_numero(v):
    if pd.isna(v): return 0.0
    t = str(v).strip().replace("R$", "").replace("%", "").replace("\xa0", "").replace(" ", "")
    if t == "": return 0.0
    if "," in t and "." in t: t = t.replace(".", "").replace(",", ".")
    elif "," in t: t = t.replace(",", ".")
    try: return float(t)
    except: return 0.0

def converter_data_brasileira(v):
    if pd.isna(v) or v is None: return None
    if isinstance(v, (pd.Timestamp, datetime)): return v.date()
    if isinstance(v, date): return v
    t = str(v).strip()
    try:
        n = float(t.replace(",", "."))
        if 20000 <= n <= 60000: return pd.to_datetime(n, unit="D", origin="1899-12-30").date()
    except: pass
    for f in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
        try: return pd.to_datetime(t, format=f).date()
        except: pass
    return None

def hoje_brasil(): return datetime.now(ZoneInfo("America/Sao_Paulo")).date()

def gerar_hash_senha(s, t): return hashlib.pbkdf2_hmac("sha256", s.encode("utf-8"), t.encode("utf-8"), 100000).hex()
def criar_senha_hash(s): t = secrets.token_hex(16); return gerar_hash_senha(s, t), t
def verificar_senha(d, h, t): return secrets.compare_digest(gerar_hash_senha(d, t), h)

def calcular_percentual(p, t): return round((float(p)/float(t))*100, 2) if float(t)>0 else 0.0

def peso_dia(d): return 1.0 if d.weekday() <= 4 else 0.5 if d.weekday() == 5 else 0.0
def somar_dias_p(i, f):
    if not i or not f or i > f: return 0.0
    t = 0.0; cur = i
    while cur <= f: t += peso_dia(cur); cur += timedelta(days=1)
    return round(t, 2)

def aplicar_filtro_nucleo(df: pd.DataFrame, nucleos: List[str]) -> pd.DataFrame:
    if not nucleos or df.empty or "estrutura" not in df.columns: return df
    termos = []
    for n in nucleos: termos.extend([normalizar_texto(t) for t in NUCLEOS_MAP.get(n, [])])
    def check_estrutura(est):
        if pd.isna(est): return False
        est_norm = normalizar_texto(est)
        for t in termos:
            if t in est_norm: return True
        return False
    return df[df["estrutura"].apply(check_estrutura)].copy()

def preparar_dataframe_pedidos(df):
    if df.empty: return df
    df = df.rename(columns=MAPA_COLUNAS_PEDIDOS)
    df["qtde_itens"] = pd.to_numeric(df["qtde_itens"], errors="coerce").fillna(0).astype(int)
    df["valor_praticado"] = df["valor_praticado"].apply(limpar_numero)
    df["valor_liquido"] = df["valor_liquido"].apply(limpar_numero)
    df["data_captacao"] = df["data_captacao"].apply(converter_data_brasileira)
    df["situacao_normalizada"] = df["situacao_comercial"].apply(normalizar_texto)
    df["unidade"] = df["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x))
    df["cod_usuario_finalizacao"] = df["cod_usuario_finalizacao"].apply(normalizar_identificador)
    df["pessoa"] = df["pessoa"].apply(normalizar_identificador)
    return df

def preparar_dataframe_metas(df):
    if df.empty: return df
    df = df.rename(columns=MAPA_COLUNAS_METAS)
    df["receita"] = df["receita"].apply(limpar_numero)
    return df

def preparar_dataframe_consultores(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty: return df
    df = df.rename(columns=MAPA_COLUNAS_CONSULTORES)
    df["id_colaborador"] = df["id_colaborador"].apply(normalizar_identificador)
    df["status_consultor"] = df["status_consultor"].fillna("ativo").astype(str).str.strip().str.lower()
    df["peso_meta"] = df["peso_meta"].apply(limpar_numero)
    return df.where(pd.notnull(df), None)

def aplicar_pesos_consultores(df_consultores: pd.DataFrame) -> pd.DataFrame:
    if df_consultores.empty: return df_consultores
    df = df_consultores.copy()
    df["status_normalizado"] = df["status_consultor"].apply(normalizar_texto)
    consultores_ativos = df[~df["status_normalizado"].isin(["ferias", "férias", "inativo", "ausente"])].copy()
    resultado = []
    for estrutura, grupo_original in df.groupby("estrutura"):
        grupo_ativo = consultores_ativos[consultores_ativos["estrutura"] == estrutura].copy()
        ids_ativos = set(grupo_ativo["id_colaborador"].astype(str).tolist())
        soma_pesos_informados = grupo_ativo["peso_meta"].fillna(0).sum()
        quantidade_ativos = len(grupo_ativo)
        for _, consultor in grupo_original.iterrows():
            item = consultor.to_dict()
            if str(item["id_colaborador"]) not in ids_ativos: item["peso_meta_calculado"] = 0.0
            else:
                if soma_pesos_informados > 0: item["peso_meta_calculado"] = float(item.get("peso_meta") or 0)
                else: item["peso_meta_calculado"] = round(100 / quantidade_ativos, 4) if quantidade_ativos > 0 else 0.0
            resultado.append(item)
    return pd.DataFrame(resultado).drop(columns=["status_normalizado"], errors="ignore")

def preparar_dataframe_base_ativa(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty: return df
    df = df.rename(columns=MAPA_COLUNAS_BASE_ATIVA)
    df["base_ativa"] = df["base_ativa"].apply(limpar_numero).astype(int)
    return df

def preparar_dataframe_revendedores(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.rename(columns=MAPA_COLUNAS_REVENDEDORES)
    novas_colunas = []
    vistos = {}
    for coluna in df.columns:
        col = MAPA_COLUNAS_REVENDEDORES.get(coluna, normalizar_nome_coluna_banco(coluna))
        if col in vistos:
            vistos[col] += 1
            col = f"{col}_{vistos[col]}"
        else:
            vistos[col] = 0
        novas_colunas.append(col)
    df.columns = novas_colunas

    colunas_obrigatorias = ["cod_estrutura", "nome_estrutura", "cod_revendedor", "nome_revendedor"]
    for coluna in colunas_obrigatorias:
        if coluna not in df.columns:
            df[coluna] = ""

    if "estrutura" not in df.columns:
        df["estrutura"] = df["nome_estrutura"]

    for coluna in ["cod_estrutura", "cod_revendedor"]:
        if coluna in df.columns:
            df[coluna] = df[coluna].apply(normalizar_identificador)

    for coluna in ["nome_estrutura", "estrutura", "nome_revendedor", "cidade", "bairro", "atividade", "papel", "inadimplente"]:
        if coluna in df.columns:
            df[coluna] = df[coluna].fillna("").astype(str).str.strip()

    if "estrutura_normalizada" not in df.columns:
        df["estrutura_normalizada"] = df["estrutura"].apply(normalizar_texto)
    if "nome_revendedor_normalizado" not in df.columns:
        df["nome_revendedor_normalizado"] = df["nome_revendedor"].apply(normalizar_texto)

    colunas_numericas = [
        "idade", "credito_disponivel", "credito_dinamico_mooz", "vlr_receita_liquida",
        "receita_vd_ultimos_6_ciclos", "receita_media_vd_6_ciclos", "receita_vd_ciclo",
        "receita_bot_ultimos_6_ciclos", "receita_bot_ciclo", "receita_qdb_ultimos_6_ciclos",
        "receita_qdb_ciclo", "receita_oui_ultimos_6_ciclos", "receita_oui_ciclo",
        "receita_ag_ultimos_6_ciclos", "receita_ag_ciclo", "receita_eud_ultimos_6_ciclos",
        "receita_eud_ciclo", "receita_entregas", "receita_er", "receita_new", "receita_gifts"
    ]
    for coluna in colunas_numericas:
        if coluna in df.columns:
            df[coluna] = df[coluna].apply(limpar_numero)

    df = df[df["cod_revendedor"].astype(str).str.strip() != ""].copy()
    df = df.drop_duplicates(subset=["cod_revendedor"], keep="last")
    return df.where(pd.notnull(df), None)


def preparar_dataframe_skus_iaf(df: pd.DataFrame, indicador: str) -> pd.DataFrame:
    if df.empty: return df
    df = df.rename(columns=MAPA_COLUNAS_SKUS_IAF)
    df["codigo_produto_normalizado"] = df["codigo_produto"].apply(normalizar_codigo)
    return df[df["codigo_produto_normalizado"] != ""].drop_duplicates(subset=["codigo_produto_normalizado"], keep="first")

def preparar_dataframe_vendas_item(df: pd.DataFrame, nome_arquivo: str = "") -> pd.DataFrame:
    if df.empty:
        return df

    df = df.rename(columns=MAPA_COLUNAS_VENDAS_ITEM)

    colunas_necessarias = [
        "codigo_produto", "produto", "quantidade", "total_praticado", "total_liquido",
        "codigo_pedido", "data_captacao", "ciclo_captacao", "pessoa", "nome_pessoa",
        "meio_captacao", "cod_usuario_finalizacao", "usuario_finalizacao", "canal_distribuicao"
    ]

    for coluna in colunas_necessarias:
        if coluna not in df.columns:
            df[coluna] = ""

    df["codigo_produto_normalizado"] = df["codigo_produto"].apply(normalizar_codigo)
    df["quantidade"] = df["quantidade"].apply(limpar_numero)
    df["total_praticado"] = df["total_praticado"].apply(limpar_numero)
    df["total_liquido"] = df["total_liquido"].apply(limpar_numero)
    df["codigo_pedido"] = df["codigo_pedido"].apply(normalizar_codigo)
    df["data_captacao"] = df["data_captacao"].apply(converter_data_brasileira)
    df["pessoa"] = df["pessoa"].apply(normalizar_identificador)
    df["cod_usuario_finalizacao"] = df["cod_usuario_finalizacao"].apply(normalizar_identificador)

    colunas_finais = colunas_necessarias + ["codigo_produto_normalizado"]
    df = df[colunas_finais].copy()
    return df[df["codigo_produto_normalizado"] != ""]

def obter_primeiros_pedidos_revendedores(df_validos: pd.DataFrame) -> pd.DataFrame:
    if df_validos.empty: return pd.DataFrame()
    df = df_validos.copy()
    df = df[df["pessoa"] != ""]
    df["dt"] = pd.to_datetime(df["data_captacao"], errors="coerce")
    if "hora_pedido" not in df.columns: df["hora_pedido"] = ""
    df["hora_pedido"] = df["hora_pedido"].fillna("").astype(str)
    df = df.sort_values(by=["pessoa", "dt", "hora_pedido", "codigo_pedido"], ascending=True)
    return df.drop_duplicates(subset=["pessoa"], keep="first")

def obter_primeiros_pedidos_indicador(df_indicador: pd.DataFrame) -> pd.DataFrame:
    if df_indicador.empty: return pd.DataFrame()
    df = df_indicador.copy()
    df = df[df["pessoa"] != ""]
    df["dt"] = pd.to_datetime(df["data_captacao"], errors="coerce")
    df = df.sort_values(by=["pessoa", "dt", "codigo_pedido", "cod_usuario_finalizacao"], ascending=True)
    return df.drop_duplicates(subset=["pessoa"], keep="first")

def classificar_meio_captacao(valor):
    meio = normalizar_texto(valor)
    if "app" in meio and "revendedor" in meio: return "app_revendedor"
    if "omni" in meio: return "omni"
    if "portal" in meio and "revendedor" in meio: return "portal_revendedor"
    if "vd+" in meio or meio in ["vd+", "vd"] or "sgi" in meio or ("auto" in meio and "atendimento" in meio) or ("call" in meio and "center" in meio) or "sv" in meio: return "vd_mais"
    return "outros"

def calcular_meta_contextual_dashboard(filtros: FiltrosRequest, df_metas: pd.DataFrame, df_consultores: pd.DataFrame, meta_padrao: float) -> float:
    if df_metas.empty: return float(meta_padrao or 0)
    metas_filtradas = df_metas.copy()
    if filtros.unidades:
        metas_filtradas["unidade"] = metas_filtradas["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
        metas_filtradas = metas_filtradas[metas_filtradas["unidade"].isin(filtros.unidades)]
    if filtros.estruturas:
        metas_filtradas = metas_filtradas[metas_filtradas["estrutura"].isin(filtros.estruturas)]
    
    meta_contextual_sem_consultor = float(metas_filtradas["receita"].sum())
    if not filtros.consultores or df_consultores.empty: return round(meta_contextual_sem_consultor, 2)

    consultores = df_consultores.copy()
    if filtros.unidades:
        consultores["unidade"] = consultores["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
        consultores = consultores[consultores["unidade"].isin(filtros.unidades)]
    if filtros.estruturas:
        consultores = consultores[consultores["estrutura"].isin(filtros.estruturas)]
        
    consultores["nome_normalizado"] = consultores["nome"].apply(normalizar_texto)
    consultores_filtrados = consultores[consultores["nome"].isin(filtros.consultores) | consultores["nome_normalizado"].isin([normalizar_texto(c) for c in filtros.consultores]) | consultores["id_colaborador"].isin(filtros.consultores)].copy()

    meta_individual_total = 0.0
    for _, c in consultores_filtrados.iterrows():
        m_est = metas_filtradas[metas_filtradas["estrutura"] == c["estrutura"]]
        if not m_est.empty:
            meta_individual_total += float(m_est.iloc[0]["receita"] or 0) * (float(c.get("peso_meta_calculado") or 0) / 100)

    return round(meta_individual_total, 2) if meta_individual_total > 0 else round(meta_contextual_sem_consultor, 2)

def preparar_vendas_indicador_para_calculo(
    df_vendas: pd.DataFrame,
    df_consultores: pd.DataFrame,
    filtros: Optional[FiltrosRequest] = None,
    df_pedidos_contexto: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Prepara as bases de MAKE/CABELO para cálculo dos indicadores.

    Correção importante:
    - Evita erro de merge/atribuição quando filtros deixam subconjuntos diferentes.
    - Primeiro tenta localizar a estrutura real pelo pedido na tabela consulta_pedidos.
    - Se não conseguir, usa a estrutura do consultor como fallback.
    """
    if df_vendas is None or df_vendas.empty:
        return pd.DataFrame(columns=[
            "pessoa", "codigo_pedido", "cod_usuario_finalizacao", "usuario_finalizacao",
            "data_captacao", "estrutura", "nome_consultor", "unidade", "estrutura_normalizada"
        ])

    df = df_vendas.copy()

    colunas_base = [
        "pessoa", "codigo_pedido", "cod_usuario_finalizacao", "usuario_finalizacao",
        "ciclo_captacao", "data_captacao"
    ]
    for coluna in colunas_base:
        if coluna not in df.columns:
            df[coluna] = ""

    for coluna in ["pessoa", "codigo_pedido", "cod_usuario_finalizacao"]:
        df[coluna] = df[coluna].apply(normalizar_identificador)

    df["usuario_finalizacao"] = df["usuario_finalizacao"].fillna("").astype(str)
    df["data_captacao"] = df["data_captacao"].apply(converter_data_brasileira)

    df = df.drop_duplicates(
        subset=["pessoa", "ciclo_captacao", "cod_usuario_finalizacao", "codigo_pedido"],
        keep="first"
    ).copy()

    # 1) Estrutura pelo pedido, usando consulta_pedidos como fonte principal.
    if df_pedidos_contexto is not None and not df_pedidos_contexto.empty:
        pedidos = df_pedidos_contexto.copy()
        for coluna in ["codigo_pedido", "pessoa", "estrutura", "cod_usuario_finalizacao", "usuario_finalizacao"]:
            if coluna not in pedidos.columns:
                pedidos[coluna] = ""

        pedidos["codigo_pedido"] = pedidos["codigo_pedido"].apply(normalizar_identificador)
        pedidos["pessoa"] = pedidos["pessoa"].apply(normalizar_identificador)
        pedidos["cod_usuario_finalizacao"] = pedidos["cod_usuario_finalizacao"].apply(normalizar_identificador)
        pedidos["estrutura"] = pedidos["estrutura"].fillna("").astype(str).str.strip()
        pedidos["usuario_finalizacao"] = pedidos["usuario_finalizacao"].fillna("").astype(str).str.strip()

        pedidos_cp = pedidos[["codigo_pedido", "pessoa", "estrutura", "cod_usuario_finalizacao", "usuario_finalizacao"]].copy()
        pedidos_cp = pedidos_cp.sort_values(["codigo_pedido", "pessoa"]).drop_duplicates(
            subset=["codigo_pedido", "pessoa"], keep="first"
        )
        pedidos_cp = pedidos_cp.rename(columns={
            "estrutura": "estrutura_pedido",
            "cod_usuario_finalizacao": "cod_usuario_finalizacao_pedido",
            "usuario_finalizacao": "usuario_finalizacao_pedido"
        })
        df = df.merge(pedidos_cp, on=["codigo_pedido", "pessoa"], how="left")

        # Fallback por código do pedido quando pessoa veio vazia/diferente na base de item.
        pedidos_cod = pedidos[["codigo_pedido", "estrutura", "cod_usuario_finalizacao", "usuario_finalizacao"]].copy()
        pedidos_cod = pedidos_cod.sort_values(["codigo_pedido"]).drop_duplicates(subset=["codigo_pedido"], keep="first")
        pedidos_cod = pedidos_cod.rename(columns={
            "estrutura": "estrutura_pedido_cod",
            "cod_usuario_finalizacao": "cod_usuario_finalizacao_pedido_cod",
            "usuario_finalizacao": "usuario_finalizacao_pedido_cod"
        })
        df = df.merge(pedidos_cod, on="codigo_pedido", how="left")

        for coluna_base, coluna_fallback in [
            ("estrutura_pedido", "estrutura_pedido_cod"),
            ("cod_usuario_finalizacao_pedido", "cod_usuario_finalizacao_pedido_cod"),
            ("usuario_finalizacao_pedido", "usuario_finalizacao_pedido_cod"),
        ]:
            if coluna_base not in df.columns:
                df[coluna_base] = ""
            if coluna_fallback not in df.columns:
                df[coluna_fallback] = ""
            df[coluna_base] = df[coluna_base].fillna("").astype(str).str.strip()
            df[coluna_fallback] = df[coluna_fallback].fillna("").astype(str).str.strip()
            df[coluna_base] = df[coluna_base].where(df[coluna_base] != "", df[coluna_fallback])

        df["cod_usuario_finalizacao"] = df["cod_usuario_finalizacao"].where(
            df["cod_usuario_finalizacao"].fillna("").astype(str).str.strip() != "",
            df["cod_usuario_finalizacao_pedido"]
        )
    else:
        df["estrutura_pedido"] = ""
        df["usuario_finalizacao_pedido"] = ""

    # 2) Fallback pela base de consultores.
    if df_consultores is not None and not df_consultores.empty:
        c_prep = aplicar_pesos_consultores(preparar_dataframe_consultores(df_consultores.copy()))
        for coluna in ["id_colaborador", "nome", "estrutura", "canal", "peso_meta_calculado"]:
            if coluna not in c_prep.columns:
                c_prep[coluna] = ""
        c_prep["id_colaborador"] = c_prep["id_colaborador"].apply(normalizar_identificador)
        c_merge = c_prep[["id_colaborador", "nome", "estrutura", "canal", "peso_meta_calculado"]].rename(columns={
            "id_colaborador": "id_c",
            "nome": "nome_c",
            "estrutura": "est_c",
            "canal": "canal_c",
            "peso_meta_calculado": "peso_c"
        })
        df = df.merge(c_merge, left_on="cod_usuario_finalizacao", right_on="id_c", how="left")
    else:
        df["nome_c"] = ""
        df["est_c"] = ""

    df["estrutura_pedido"] = df.get("estrutura_pedido", "").fillna("").astype(str).str.strip()
    df["est_c"] = df.get("est_c", "").fillna("").astype(str).str.strip()
    df["estrutura"] = df["estrutura_pedido"].where(df["estrutura_pedido"] != "", df["est_c"])

    nome_pedido = df.get("usuario_finalizacao_pedido", "")
    if not hasattr(nome_pedido, "fillna"):
        nome_pedido = pd.Series([""] * len(df), index=df.index)
    df["nome_c"] = df.get("nome_c", "").fillna("").astype(str).str.strip()
    df["nome_consultor"] = df["nome_c"].where(df["nome_c"] != "", nome_pedido.fillna("").astype(str).str.strip())
    df["nome_consultor"] = df["nome_consultor"].where(df["nome_consultor"] != "", df["usuario_finalizacao"].fillna("").astype(str).str.strip())

    df["unidade"] = df["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
    df["estrutura_normalizada"] = df["estrutura"].apply(normalizar_texto)

    if filtros:
        if filtros.unidades:
            unidades_norm = [normalizar_texto(u) for u in filtros.unidades]
            df = df[df["unidade"].apply(normalizar_texto).isin(unidades_norm)]
        if filtros.estruturas:
            estruturas_norm = [normalizar_texto(e) for e in filtros.estruturas]
            df = df[df["estrutura_normalizada"].isin(estruturas_norm)]
        if filtros.consultores:
            c_norm = [normalizar_texto(c) for c in filtros.consultores]
            df = df[
                df["usuario_finalizacao"].apply(normalizar_texto).isin(c_norm) |
                df["nome_consultor"].apply(normalizar_texto).isin(c_norm) |
                df["cod_usuario_finalizacao"].isin([normalizar_identificador(c) for c in filtros.consultores])
            ]
        if filtros.data_inicio or filtros.data_fim:
            datas_indicador = pd.to_datetime(df["data_captacao"], errors="coerce").dt.normalize()
            if filtros.data_inicio:
                data_inicio = pd.to_datetime(filtros.data_inicio).normalize()
                df = df[datas_indicador >= data_inicio]
                datas_indicador = datas_indicador.loc[df.index]
            if filtros.data_fim:
                data_fim = pd.to_datetime(filtros.data_fim).normalize()
                df = df[datas_indicador <= data_fim]

    return df.copy()

def obter_base_ativa_estrutura(df_base_ativa: pd.DataFrame, estrutura: str) -> int:
    if df_base_ativa.empty: return 0
    linha = df_base_ativa[df_base_ativa["estrutura"] == estrutura]
    return int(linha.iloc[0]["base_ativa"] or 0) if not linha.empty else 0

def calcular_metricas_ciclo(df_validos: pd.DataFrame, ciclo_atual: Optional[dict], data_referencia: Optional[date] = None) -> dict:
    """
    Calcula métricas do ciclo usando uma data de referência.

    Quando o usuário filtra uma data específica, o dashboard precisa mostrar:
    - vendido naquele dia;
    - meta diária calculada para aquele dia;
    - tendência considerando o acumulado até aquele dia.

    Sem filtro de data, usa o dia atual.
    """
    data_ref = data_referencia or hoje_brasil()
    res = { "ciclo_atual": None, "inicio_ciclo": None, "fim_ciclo": None, "meta_ciclo": 0.0, "realizado_ciclo": 0.0, "realizado_ate_ontem": 0.0, "realizado_diario": 0.0, "meta_diaria": 0.0, "percentual_meta_diaria": 0.0, "valor_faltante_ciclo": 0.0, "tendencia_ciclo": 0.0, "gap_tendencia": 0.0, "status_tendencia": "Sem ciclo cadastrado" }
    if not ciclo_atual:
        if not df_validos.empty and "data_captacao" in df_validos.columns:
            res["realizado_diario"] = float(df_validos[df_validos["data_captacao"] == data_ref]["valor_praticado"].sum())
        return res

    di = converter_data_brasileira(ciclo_atual.get("data_inicio")); dfim = converter_data_brasileira(ciclo_atual.get("data_fim")); meta = float(ciclo_atual.get("meta_ciclo") or 0)
    if not di or not dfim: return res

    if df_validos is not None and not df_validos.empty:
        base = df_validos.copy()
        base["data_captacao"] = base["data_captacao"].apply(converter_data_brasileira)
        df_c = base[(base["data_captacao"] >= di) & (base["data_captacao"] <= dfim)].copy()
    else:
        df_c = pd.DataFrame()

    df_c_ate_ref = df_c[df_c["data_captacao"] <= data_ref].copy() if not df_c.empty else pd.DataFrame()
    r_ciclo = float(df_c_ate_ref["valor_praticado"].sum()) if not df_c_ate_ref.empty else 0.0
    r_ontem = float(df_c[df_c["data_captacao"] < data_ref]["valor_praticado"].sum()) if not df_c.empty else 0.0
    r_dia = float(df_c[df_c["data_captacao"] == data_ref]["valor_praticado"].sum()) if not df_c.empty else 0.0

    d_tot = somar_dias_p(di, dfim)
    d_dec = somar_dias_p(di, min(data_ref, dfim))
    d_rest = somar_dias_p(data_ref, dfim) if data_ref <= dfim else 0.0
    m_dia = max(meta - r_ontem, 0.0) / d_rest if d_rest > 0 else 0.0
    m_pon = r_ciclo / d_dec if d_dec > 0 else 0.0
    tend = m_pon * d_tot
    gap = tend - meta

    st = "Sem meta cadastrada" if meta <= 0 else "Tendência positiva" if tend >= meta else "Risco de não bater"

    return {
        "ciclo_atual": ciclo_atual.get("ciclo"), "inicio_ciclo": di.isoformat(), "fim_ciclo": dfim.isoformat(), "meta_ciclo": round(meta, 2), "realizado_ciclo": round(r_ciclo, 2), "realizado_ate_ontem": round(r_ontem, 2), "realizado_diario": round(r_dia, 2), "meta_diaria": round(m_dia, 2), "percentual_meta_diaria": round(calcular_percentual(r_dia, m_dia), 2), "valor_faltante_ciclo": round(max(meta - r_ciclo, 0.0), 2), "tendencia_ciclo": round(tend, 2), "gap_tendencia": round(gap, 2), "status_tendencia": st
    }

def obter_data_referencia_filtro(filtros: Optional[FiltrosRequest]) -> Optional[date]:
    """Retorna a data de referência quando o usuário filtra um dia ou período."""
    if not filtros:
        return None
    try:
        if filtros.data_fim:
            return pd.to_datetime(filtros.data_fim).date()
        if filtros.data_inicio:
            return pd.to_datetime(filtros.data_inicio).date()
    except Exception:
        return None
    return None

def aplicar_filtros_pedidos_sem_data(df: pd.DataFrame, filtros: FiltrosRequest) -> pd.DataFrame:
    """Aplica filtros estruturais, sem mexer no período. Usado para calcular meta diária histórica."""
    if df is None or df.empty:
        return pd.DataFrame()
    r = df.copy()
    if filtros.unidades and "unidade" in r.columns:
        r = r[r["unidade"].isin(filtros.unidades)]
    if filtros.estruturas and "estrutura" in r.columns:
        r = r[r["estrutura"].isin(filtros.estruturas)]
    if filtros.consultores and "usuario_finalizacao" in r.columns:
        r = r[r["usuario_finalizacao"].isin(filtros.consultores)]
    if filtros.situacoes and "situacao_normalizada" in r.columns:
        r = r[r["situacao_normalizada"].isin([normalizar_texto(s) for s in filtros.situacoes])]
    return r.copy()

def aplicar_filtros_data_pedidos(df: pd.DataFrame, filtros: FiltrosRequest) -> pd.DataFrame:
    if df is None or df.empty:
        return pd.DataFrame()
    r = df.copy()
    if "data_captacao" in r.columns:
        r["data_captacao"] = r["data_captacao"].apply(converter_data_brasileira)
    if filtros.data_inicio:
        di = pd.to_datetime(filtros.data_inicio).date()
        r = r[r["data_captacao"] >= di]
    if filtros.data_fim:
        dfim = pd.to_datetime(filtros.data_fim).date()
        r = r[r["data_captacao"] <= dfim]
    return r.copy()

def calcular_primeiros_indicador_seguro(df_vendas, df_consultores, filtros, df_pedidos_contexto, nome_indicador):
    try:
        prep = preparar_vendas_indicador_para_calculo(df_vendas, df_consultores, filtros, df_pedidos_contexto)
        return obter_primeiros_pedidos_indicador(prep)
    except Exception as exc:
        print(f"Erro ao calcular indicador {nome_indicador}: {exc}")
        traceback.print_exc()
        return pd.DataFrame(columns=["pessoa", "codigo_pedido", "cod_usuario_finalizacao", "estrutura", "data_captacao"])


EXTENSOES_PLANILHAS_PERMITIDAS = {"csv", "xls", "xlsx"}


def obter_extensao_upload(nome_arquivo: str | None) -> str:
    nome = str(nome_arquivo or "").strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Arquivo sem nome. Envie uma planilha válida.")
    if "/" in nome or "\\" in nome:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")
    if "." not in nome:
        raise HTTPException(status_code=400, detail="Arquivo sem extensão. Envie .xlsx, .xls ou .csv.")
    return nome.rsplit(".", 1)[-1].lower().strip()


def validar_extensao_upload(arquivo: UploadFile, contexto: str = "arquivo") -> str:
    ext = obter_extensao_upload(getattr(arquivo, "filename", None))
    if ext not in EXTENSOES_PLANILHAS_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato inválido para {contexto}. Envie apenas .xlsx, .xls ou .csv."
        )
    return ext


def validar_caminho_local_planilha(caminho: str, contexto: str = "arquivo") -> tuple[Path, str]:
    if not caminho or not str(caminho).strip():
        raise HTTPException(status_code=400, detail=f"Caminho local vazio para {contexto}.")
    arquivo = Path(caminho).expanduser().resolve()
    if not arquivo.exists() or not arquivo.is_file():
        raise HTTPException(status_code=400, detail=f"Arquivo baixado não encontrado no computador: {caminho}")
    ext = arquivo.suffix.lower().replace(".", "")
    if ext not in EXTENSOES_PLANILHAS_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato inválido para {contexto}. A automação deve baixar .xlsx, .xls ou .csv."
        )
    return arquivo, ext


def validar_quantidade_exata(arquivos, quantidade_esperada: int, nome_indicador: str):
    qtd = len(arquivos or [])
    if qtd != quantidade_esperada:
        raise HTTPException(
            status_code=400,
            detail=f"Upload de {nome_indicador} exige exatamente {quantidade_esperada} arquivo(s). Recebido(s): {qtd}."
        )


def validar_dataframe_nao_vazio(df: pd.DataFrame, contexto: str):
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail=f"A planilha de {contexto} não possui dados válidos.")
    return df

async def carregar_dataframe_do_arquivo(arquivo: UploadFile) -> pd.DataFrame:
    ext = validar_extensao_upload(arquivo, "upload")
    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio. Envie uma planilha com dados.")
    try:
        if ext == "csv":
            return validar_dataframe_nao_vazio(pd.read_csv(io.BytesIO(conteudo), dtype=str), arquivo.filename)
        return validar_dataframe_nao_vazio(pd.read_excel(io.BytesIO(conteudo), dtype=str), arquivo.filename)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler a planilha {arquivo.filename}. Verifique se o arquivo não está corrompido.") from exc

def carregar_dataframe_do_caminho_local(caminho: str) -> pd.DataFrame:
    arquivo, ext = validar_caminho_local_planilha(caminho, "importação automática")
    try:
        if ext == "csv":
            return validar_dataframe_nao_vazio(pd.read_csv(arquivo, dtype=str), arquivo.name)
        return validar_dataframe_nao_vazio(pd.read_excel(arquivo, dtype=str), arquivo.name)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler o arquivo baixado: {arquivo.name}") from exc

def salvar_atualizacao_pedidos(df: pd.DataFrame):
    df_preparado = preparar_dataframe_pedidos(df)
    salvar_dataframe_tabela("consulta_pedidos", df_preparado.where(pd.notnull(df_preparado), None))

    hora_agora = datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat()
    with database_engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS config_sistema (chave TEXT PRIMARY KEY, valor TEXT);"))
        res = conn.execute(text("SELECT chave FROM config_sistema WHERE chave = 'ultima_atualizacao_pedidos'")).fetchone()
        if res:
            conn.execute(text("UPDATE config_sistema SET valor = :dt WHERE chave = 'ultima_atualizacao_pedidos'"), {"dt": hora_agora})
        else:
            conn.execute(text("INSERT INTO config_sistema (chave, valor) VALUES ('ultima_atualizacao_pedidos', :dt)"), {"dt": hora_agora})

    return {"status": "sucesso", "mensagem": "Pedidos atualizados.", "linhas": int(len(df_preparado))}

async def carregar_abas_skus_iaf(arquivo: UploadFile) -> tuple[pd.DataFrame, pd.DataFrame]:
    ext = validar_extensao_upload(arquivo, "SKUs IAF")
    if ext == "csv":
        raise HTTPException(status_code=400, detail="SKUs IAF precisa ser uma planilha Excel com as abas SKU MAKE e SKU CABELO.")
    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo de SKUs IAF vazio.")
    try:
        df_m = pd.read_excel(io.BytesIO(conteudo), sheet_name="SKU MAKE", dtype=str)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Aba SKU MAKE não encontrada no arquivo de SKUs IAF.") from exc
    try:
        df_c = pd.read_excel(io.BytesIO(conteudo), sheet_name="SKU CABELO", dtype=str)
    except Exception:
        df_c = pd.DataFrame()
    return validar_dataframe_nao_vazio(df_m, "SKU MAKE"), df_c

async def carregar_dataframe_vendas_item(arquivo: UploadFile) -> pd.DataFrame:
    ext = validar_extensao_upload(arquivo, "vendas de indicador")
    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail=f"Arquivo vazio: {arquivo.filename}")
    try:
        if ext == "csv":
            return validar_dataframe_nao_vazio(pd.read_csv(io.BytesIO(conteudo), dtype=str), arquivo.filename)
        try:
            return validar_dataframe_nao_vazio(pd.read_excel(io.BytesIO(conteudo), sheet_name="Pag", dtype=str), arquivo.filename)
        except Exception:
            return validar_dataframe_nao_vazio(pd.read_excel(io.BytesIO(conteudo), dtype=str), arquivo.filename)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler a planilha de indicador: {arquivo.filename}") from exc


def carregar_dataframe_vendas_item_do_caminho_local(caminho: str) -> pd.DataFrame:
    arquivo, ext = validar_caminho_local_planilha(caminho, "vendas de indicador")
    try:
        if ext == "csv":
            return validar_dataframe_nao_vazio(pd.read_csv(arquivo, dtype=str), arquivo.name)
        try:
            return validar_dataframe_nao_vazio(pd.read_excel(arquivo, sheet_name="Pag", dtype=str), arquivo.name)
        except Exception:
            return validar_dataframe_nao_vazio(pd.read_excel(arquivo, dtype=str), arquivo.name)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler o arquivo baixado: {arquivo.name}") from exc

def garantir_colunas_tabela(nome_tabela: str, dataframe: pd.DataFrame, conn):
    colunas_existentes = [coluna["name"] for coluna in inspect(conn).get_columns(nome_tabela)] if tabela_existe_upload(nome_tabela) else []
    tipos_personalizados = {
        "valor_praticado": "DOUBLE PRECISION", "valor_liquido": "DOUBLE PRECISION", "qtde_itens": "INTEGER",
        "data_captacao": "DATE", "receita": "DOUBLE PRECISION", "atividade": "DOUBLE PRECISION", "rpa": "DOUBLE PRECISION",
        "tkt_medio": "DOUBLE PRECISION", "upa": "DOUBLE PRECISION", "pen_make": "DOUBLE PRECISION", "pen_cabelos": "DOUBLE PRECISION",
        "peso_meta": "DOUBLE PRECISION", "peso_meta_calculado": "DOUBLE PRECISION",
        "base_ativa": "INTEGER", "idade": "DOUBLE PRECISION", "credito_disponivel": "DOUBLE PRECISION", "credito_dinamico_mooz": "DOUBLE PRECISION",
        "vlr_receita_liquida": "DOUBLE PRECISION", "receita_vd_ultimos_6_ciclos": "DOUBLE PRECISION", "receita_media_vd_6_ciclos": "DOUBLE PRECISION",
        "receita_vd_ciclo": "DOUBLE PRECISION", "receita_bot_ultimos_6_ciclos": "DOUBLE PRECISION", "receita_bot_ciclo": "DOUBLE PRECISION",
        "receita_qdb_ultimos_6_ciclos": "DOUBLE PRECISION", "receita_qdb_ciclo": "DOUBLE PRECISION", "receita_oui_ultimos_6_ciclos": "DOUBLE PRECISION",
        "receita_oui_ciclo": "DOUBLE PRECISION", "receita_ag_ultimos_6_ciclos": "DOUBLE PRECISION", "receita_ag_ciclo": "DOUBLE PRECISION",
        "receita_eud_ultimos_6_ciclos": "DOUBLE PRECISION", "receita_eud_ciclo": "DOUBLE PRECISION", "receita_entregas": "DOUBLE PRECISION",
        "receita_er": "DOUBLE PRECISION", "receita_new": "DOUBLE PRECISION", "receita_gifts": "DOUBLE PRECISION",
        "quantidade": "DOUBLE PRECISION", "total_praticado": "DOUBLE PRECISION", "total_liquido": "DOUBLE PRECISION",
        "is_sku_make": "BOOLEAN", "is_sku_cabelo": "BOOLEAN"
    }
    for coluna in dataframe.columns:
        if coluna not in colunas_existentes:
            conn.execute(text(f'ALTER TABLE {nome_tabela} ADD COLUMN "{coluna}" {tipos_personalizados.get(coluna, "TEXT")};'))

def salvar_dataframe_tabela(nome_tabela: str, df_final: pd.DataFrame):
    if tabela_existe_upload(nome_tabela):
        with database_engine.begin() as conn:
            garantir_colunas_tabela(nome_tabela, df_final, conn)
            conn.execute(text(f"TRUNCATE TABLE {nome_tabela};"))
            df_final.to_sql(name=nome_tabela, con=conn, if_exists="append", index=False)
    else:
        with database_engine.begin() as conn:
            df_final.to_sql(name=nome_tabela, con=conn, if_exists="replace", index=False)
            try: conn.execute(text(f"ALTER TABLE {nome_tabela} ADD COLUMN id SERIAL PRIMARY KEY;"))
            except: pass
    limpar_cache_tabelas()

async def processar_upload_vendas_indicador(arquivos: List[UploadFile], tabela_skus: str, tabela_vendas: str, nome_indicador: str, coluna_flag: str, quantidade_esperada: int | None = None):
    if not arquivos:
        raise HTTPException(status_code=400, detail=f"Envie planilha {nome_indicador}.")
    if quantidade_esperada is not None:
        validar_quantidade_exata(arquivos, quantidade_esperada, nome_indicador)
    if not tabela_existe_upload(tabela_skus): raise HTTPException(status_code=400, detail="Envie SKUS IAF primeiro.")
    with database_engine.connect() as conn: df_skus = ler_tabela_cacheada(tabela_skus, conn)
    df_skus = preparar_dataframe_skus_iaf(df_skus, nome_indicador)
    lista_dfs = []
    for arquivo in arquivos:
        df_bruto = await carregar_dataframe_vendas_item(arquivo)
        if not df_bruto.empty:
            df_p = preparar_dataframe_vendas_item(df_bruto, arquivo.filename)
            if not df_p.empty: lista_dfs.append(df_p)
    if not lista_dfs: raise HTTPException(status_code=400, detail="Nenhuma linha válida.")
    df_vendas = pd.concat(lista_dfs, ignore_index=True)
    codigos_validos = set(df_skus["codigo_produto_normalizado"].astype(str).tolist())
    df_vendas[coluna_flag] = df_vendas["codigo_produto_normalizado"].isin(codigos_validos)
    df_final = df_vendas[df_vendas[coluna_flag] == True].copy()
    if df_final.empty: raise HTTPException(status_code=400, detail="Nenhum item bateu com SKUs.")
    df_final = df_final.drop_duplicates(subset=["pessoa", "ciclo_captacao", "cod_usuario_finalizacao", "codigo_pedido"], keep="first")
    salvar_dataframe_tabela(tabela_vendas, df_final.where(pd.notnull(df_final), None))
    return {"status": "sucesso", "mensagem": f"Vendas {nome_indicador} atualizadas."}


def processar_upload_vendas_indicador_local(caminhos: List[str], tabela_skus: str, tabela_vendas: str, nome_indicador: str, coluna_flag: str, quantidade_esperada: int = 3):
    if not caminhos:
        raise HTTPException(status_code=400, detail=f"Nenhum arquivo local de {nome_indicador} recebido.")
    if len(caminhos) != quantidade_esperada:
        raise HTTPException(status_code=400, detail=f"A automação de {nome_indicador} precisa enviar exatamente {quantidade_esperada} relatório(s). Recebido(s): {len(caminhos)}.")
    if not tabela_existe_upload(tabela_skus):
        raise HTTPException(status_code=400, detail="Envie SKUS IAF primeiro.")

    with database_engine.connect() as conn:
        df_skus = ler_tabela_cacheada(tabela_skus, conn)

    df_skus = preparar_dataframe_skus_iaf(df_skus, nome_indicador)
    lista_dfs = []
    nomes_processados = []

    for caminho in caminhos:
        df_bruto = carregar_dataframe_vendas_item_do_caminho_local(caminho)
        if not df_bruto.empty:
            df_p = preparar_dataframe_vendas_item(df_bruto, Path(caminho).name)
            if not df_p.empty:
                lista_dfs.append(df_p)
                nomes_processados.append(Path(caminho).name)

    if not lista_dfs:
        raise HTTPException(status_code=400, detail=f"Nenhuma linha válida nos arquivos locais de {nome_indicador}.")

    df_vendas = pd.concat(lista_dfs, ignore_index=True)
    codigos_validos = set(df_skus["codigo_produto_normalizado"].astype(str).tolist())
    df_vendas[coluna_flag] = df_vendas["codigo_produto_normalizado"].isin(codigos_validos)
    df_final = df_vendas[df_vendas[coluna_flag] == True].copy()

    if df_final.empty:
        raise HTTPException(status_code=400, detail=f"Nenhum item dos relatórios {nome_indicador} bateu com os SKUs IAF cadastrados.")

    df_final = df_final.drop_duplicates(subset=["pessoa", "ciclo_captacao", "cod_usuario_finalizacao", "codigo_pedido"], keep="first")
    salvar_dataframe_tabela(tabela_vendas, df_final.where(pd.notnull(df_final), None))

    return {
        "status": "sucesso",
        "mensagem": f"Vendas {nome_indicador} atualizadas automaticamente.",
        "arquivos": nomes_processados,
        "linhas": int(len(df_final))
    }

@app.post("/auth/login")
def login(dados: LoginRequest):
    try:
        email = dados.email.strip().lower()
        with database_engine.connect() as conn: u = conn.execute(text("SELECT id, nome, email, senha_hash, salt, perfil, status_usuario FROM usuarios_sistema WHERE LOWER(email) = :email LIMIT 1"), {"email": email}).mappings().fetchone()
        if not u or u["status_usuario"] != "ativo" or not verificar_senha(dados.senha, u["senha_hash"], u["salt"]): raise HTTPException(status_code=401, detail="Dados inválidos.")
        usuario = {"id": u["id"], "nome": u["nome"], "email": u["email"], "perfil": u["perfil"], "status_usuario": u["status_usuario"]}
        token = criar_token_jwt(usuario)
        return {"status": "sucesso", "usuario": usuario, "access_token": token, "token_type": "bearer", "expires_in_minutes": JWT_EXPIRATION_MINUTES}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me")
def obter_usuario_logado(request: Request):
    return {"status": "sucesso", "usuario": request.state.usuario}

@app.get("/auth/usuarios")
def listar_usuarios():
    try:
        with database_engine.connect() as conn: return {"status": "sucesso", "usuarios": [dict(x) for x in conn.execute(text("SELECT id, nome, email, perfil, status_usuario FROM usuarios_sistema ORDER BY nome ASC")).mappings().all()]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/criar-usuario")
def criar_usuario(dados: CriarUsuarioRequest):
    try:
        email = dados.email.strip().lower()
        sh, salt = criar_senha_hash(dados.senha)
        with database_engine.begin() as conn:
            if conn.execute(text("SELECT id FROM usuarios_sistema WHERE LOWER(email) = :email"), {"email": email}).fetchone(): raise HTTPException(status_code=400, detail="E-mail já existe.")
            conn.execute(text("INSERT INTO usuarios_sistema (nome, email, senha_hash, salt, perfil, status_usuario) VALUES (:n, :e, :sh, :s, :p, :st)"), {"n": dados.nome.strip(), "e": email, "sh": sh, "s": salt, "p": dados.perfil, "st": dados.status_usuario})
        return {"status": "sucesso"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/auth/atualizar-usuario")
def atualizar_usuario(dados: AtualizarUsuarioRequest):
    try:
        with database_engine.begin() as conn: conn.execute(text("UPDATE usuarios_sistema SET nome=:n, perfil=:p, status_usuario=:st WHERE id=:id"), {"n": dados.nome.strip(), "p": dados.perfil, "st": dados.status_usuario, "id": dados.id})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.delete("/auth/deletar-usuario/{id}")
def deletar_usuario(id: int):
    try:
        with database_engine.begin() as conn: conn.execute(text("DELETE FROM usuarios_sistema WHERE id = :id"), {"id": id})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/alterar-senha")
def alterar_senha(dados: AlterarSenhaRequest):
    try:
        email = dados.email.strip().lower()
        with database_engine.begin() as conn:
            u = conn.execute(text("SELECT id, senha_hash, salt FROM usuarios_sistema WHERE LOWER(email) = :email LIMIT 1"), {"email": email}).mappings().fetchone()
            if not u or not verificar_senha(dados.senha_atual, u["senha_hash"], u["salt"]): raise HTTPException(status_code=401, detail="Senha atual incorreta.")
            sh, salt = criar_senha_hash(dados.nova_senha)
            conn.execute(text("UPDATE usuarios_sistema SET senha_hash=:sh, salt=:s WHERE id=:id"), {"sh": sh, "s": salt, "id": u["id"]})
        return {"status": "sucesso"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# ================= NOVA ROTA DE PERMISSÕES DINÂMICAS =================
@app.get("/auth/permissoes")
def obter_permissoes():
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "config_sistema" in tables:
                res = conn.execute(text("SELECT valor FROM config_sistema WHERE chave = 'permissoes_perfil'")).fetchone()
                if res and res[0]:
                    return {"status": "sucesso", "permissoes": json.loads(res[0])}
            
            # Se não existir ainda no banco, envia o padrão com todas as abas atuais do sistema.
            return {"status": "sucesso", "permissoes": normalizar_permissoes_backend(PERMISSOES_PADRAO_BACKEND)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/permissoes")
def salvar_permissoes(dados: PermissoesRequest):
    try:
        permissoes_normalizadas = normalizar_permissoes_backend(dados.permissoes)
        valor = json.dumps(permissoes_normalizadas)
        with database_engine.begin() as conn:
            conn.execute(text("CREATE TABLE IF NOT EXISTS config_sistema (chave TEXT PRIMARY KEY, valor TEXT);"))
            res = conn.execute(text("SELECT chave FROM config_sistema WHERE chave = 'permissoes_perfil'")).fetchone()
            if res:
                conn.execute(text("UPDATE config_sistema SET valor = :v WHERE chave = 'permissoes_perfil'"), {"v": valor})
            else:
                conn.execute(text("INSERT INTO config_sistema (chave, valor) VALUES ('permissoes_perfil', :v)"), {"v": valor})
        limpar_cache_permissoes_backend()
        return {"status": "sucesso", "permissoes": permissoes_normalizadas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# =====================================================================

@app.get("/ciclos")
def listar_ciclos():
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "ciclos_comerciais" not in tables: return {"status": "sucesso", "ciclos": []}
            return {"status": "sucesso", "ciclos": [dict(x) for x in conn.execute(text("SELECT * FROM ciclos_comerciais ORDER BY data_inicio DESC")).mappings().all()]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/ciclos")
def criar_ciclo(dados: CicloRequest):
    try:
        di = converter_data_brasileira(dados.data_inicio); df = converter_data_brasileira(dados.data_fim)
        with database_engine.begin() as conn: conn.execute(text("INSERT INTO ciclos_comerciais (ciclo, data_inicio, data_fim, meta_ciclo, status_ciclo) VALUES (:c, :di, :df, :m, :s)"), {"c": dados.ciclo.strip(), "di": di, "df": df, "m": float(dados.meta_ciclo or 0), "s": dados.status_ciclo.strip().lower()})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/ciclos/{id}")
def atualizar_ciclo(id: int, dados: AtualizarCicloRequest):
    try:
        di = converter_data_brasileira(dados.data_inicio); df = converter_data_brasileira(dados.data_fim)
        with database_engine.begin() as conn: conn.execute(text("UPDATE ciclos_comerciais SET ciclo=:c, data_inicio=:di, data_fim=:df, meta_ciclo=:m, status_ciclo=:s WHERE id=:id"), {"c": dados.ciclo.strip(), "di": di, "df": df, "m": float(dados.meta_ciclo or 0), "s": dados.status_ciclo.strip().lower(), "id": id})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.delete("/ciclos/{id}")
def deletar_ciclo(id: int):
    try:
        with database_engine.begin() as conn: conn.execute(text("DELETE FROM ciclos_comerciais WHERE id = :id"), {"id": id})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/pedidos")
async def atualizar_base_pedidos(arquivo: UploadFile = File(...)):
    try:
        return salvar_atualizacao_pedidos(await carregar_dataframe_do_arquivo(arquivo))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/pedidos/arquivo-local")
def atualizar_base_pedidos_arquivo_local(dados: ArquivoLocalRequest):
    try:
        return salvar_atualizacao_pedidos(carregar_dataframe_do_caminho_local(dados.caminho))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/metas")
async def atualizar_base_metas(arquivo: UploadFile = File(...)):
    try:
        df = preparar_dataframe_metas(await carregar_dataframe_do_arquivo(arquivo))
        salvar_dataframe_tabela("metas_estruturas", df.where(pd.notnull(df), None))
        return {"status": "sucesso", "mensagem": "Metas atualizadas."}
    except HTTPException:
        raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/consultores")
async def atualizar_base_consultores(arquivo: UploadFile = File(...)):
    try:
        df = aplicar_pesos_consultores(preparar_dataframe_consultores(await carregar_dataframe_do_arquivo(arquivo)))
        salvar_dataframe_tabela("consultores_metas", df.where(pd.notnull(df), None))
        return {"status": "sucesso", "mensagem": "Consultores atualizados."}
    except HTTPException:
        raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/base-ativa")
async def atualizar_base_ativa(arquivo: UploadFile = File(...)):
    try:
        df = preparar_dataframe_base_ativa(await carregar_dataframe_do_arquivo(arquivo))
        salvar_dataframe_tabela("base_ativa_revendedores", df.where(pd.notnull(df), None))
        return {"status": "sucesso", "mensagem": "Base Ativa atualizada."}
    except HTTPException:
        raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/revendedores")
async def atualizar_base_revendedores(arquivo: UploadFile = File(...)):
    try:
        df = preparar_dataframe_revendedores(await carregar_dataframe_do_arquivo(arquivo))
        if df.empty:
            raise HTTPException(status_code=400, detail="Nenhum revendedor válido encontrado na planilha.")
        salvar_dataframe_tabela("revendedores", df)
        return {"status": "sucesso", "mensagem": "Base de Revendedores atualizada.", "linhas": int(len(df))}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/skus-iaf")
async def atualizar_skus_iaf(arquivo: UploadFile = File(...)):
    try:
        df_make, df_cabelo = await carregar_abas_skus_iaf(arquivo)
        salvar_dataframe_tabela("skus_make_iaf", preparar_dataframe_skus_iaf(df_make, "MAKE"))
        if not df_cabelo.empty: salvar_dataframe_tabela("skus_cabelo_iaf", preparar_dataframe_skus_iaf(df_cabelo, "CABELO"))
        return {"status": "sucesso", "mensagem": "SKUs atualizados."}
    except HTTPException:
        raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/vendas-make")
async def atualizar_vendas_make(arquivos: List[UploadFile] = File(...)):
    try:
        return await processar_upload_vendas_indicador(arquivos, "skus_make_iaf", "vendas_make", "MAKE", "is_sku_make", quantidade_esperada=3)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/vendas-make/arquivos-locais")
def atualizar_vendas_make_arquivos_locais(dados: ArquivosLocaisRequest):
    try:
        return processar_upload_vendas_indicador_local(dados.caminhos, "skus_make_iaf", "vendas_make", "MAKE", "is_sku_make", quantidade_esperada=3)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/vendas-cabelo")
async def atualizar_vendas_cabelo(arquivos: List[UploadFile] = File(...)):
    try:
        return await processar_upload_vendas_indicador(arquivos, "skus_cabelo_iaf", "vendas_cabelo", "CABELO", "is_sku_cabelo", quantidade_esperada=2)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/vendas-cabelo/arquivos-locais")
def atualizar_vendas_cabelo_arquivos_locais(dados: ArquivosLocaisRequest):
    try:
        return processar_upload_vendas_indicador_local(dados.caminhos, "skus_cabelo_iaf", "vendas_cabelo", "CABELO", "is_sku_cabelo", quantidade_esperada=2)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/revendedores/resumo")
def obter_resumo_revendedores():
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "revendedores" not in tables:
                return {
                    "status": "sem_base", "total_revendedores": 0, "total_estruturas": 0,
                    "total_cidades": 0, "inadimplentes": 0, "com_telefone": 0,
                    "credito_disponivel_total": 0.0, "receita_liquida_total": 0.0,
                    "revendedores": [], "papel_adimplencia": [], "atividade_tabela": [], "receita_por_papel": []
                }
            df = ler_tabela_cacheada("revendedores", conn)
            df_pedidos = ler_tabela_cacheada("consulta_pedidos", conn) if "consulta_pedidos" in tables else pd.DataFrame()

        if df.empty:
            return {
                "status": "sucesso", "total_revendedores": 0, "total_estruturas": 0,
                "total_cidades": 0, "inadimplentes": 0, "com_telefone": 0,
                "credito_disponivel_total": 0.0, "receita_liquida_total": 0.0,
                "revendedores": [], "papel_adimplencia": [], "atividade_tabela": [], "receita_por_papel": []
            }

        colunas_texto = [
            "nome_estrutura", "cod_estrutura", "cod_revendedor", "nome_revendedor", "cidade", "bairro",
            "atividade", "papel", "inadimplente", "tel_celular"
        ]
        colunas_numericas = [
            "credito_disponivel", "vlr_receita_liquida", "receita_vd_ciclo", "receita_bot_ciclo",
            "receita_qdb_ciclo", "receita_oui_ciclo", "receita_ag_ciclo", "receita_eud_ciclo",
            "receita_er", "receita_new", "receita_entregas"
        ]

        for coluna in colunas_texto:
            if coluna not in df.columns:
                df[coluna] = ""
            df[coluna] = df[coluna].fillna("").astype(str).str.strip()

        for coluna in colunas_numericas:
            if coluna not in df.columns:
                df[coluna] = 0.0
            df[coluna] = pd.to_numeric(df[coluna], errors="coerce").fillna(0)

        df["cod_revendedor"] = df["cod_revendedor"].apply(normalizar_identificador)
        df["papel_tratado"] = df["papel"].replace("", "Não informado").fillna("Não informado")
        df["atividade_tratada"] = df["atividade"].replace("", "Não informado").fillna("Não informado")
        df["eh_inadimplente"] = df["inadimplente"].apply(lambda x: "sim" in normalizar_texto(x))

        papel_group = df.groupby("papel_tratado").agg(
            adimplente=("eh_inadimplente", lambda s: int((~s).sum())),
            inadimplente=("eh_inadimplente", lambda s: int(s.sum()))
        ).reset_index().rename(columns={"papel_tratado": "name"})
        papel_group["total"] = papel_group["adimplente"] + papel_group["inadimplente"]
        papel_adimplencia = papel_group.sort_values("total", ascending=False).to_dict(orient="records")

        atividade_group = df.groupby("atividade_tratada").size().reset_index(name="value").rename(columns={"atividade_tratada": "name"})
        ordem_atividade = {v: i for i, v in enumerate(["I", "R", "A0", "A1", "A2", "A3", "I4", "I5", "I6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15"])}
        atividade_group["ordem"] = atividade_group["name"].map(lambda x: ordem_atividade.get(str(x).upper(), 999))
        atividade_tabela = atividade_group.sort_values(["ordem", "name"]).drop(columns=["ordem"]).to_dict(orient="records")

        # Receita Praticada da aba Revendedores precisa seguir a mesma origem do Dashboard:
        # consulta_pedidos filtrada por status válidos, somando valor_praticado.
        # A planilha de revendedores pode trazer colunas de receita próprias, mas elas não batem
        # necessariamente com o Realizado Total do Dashboard. Por isso usamos pedidos como fonte oficial.
        df["receita_praticada_pedidos"] = 0.0
        receita_praticada_total_pedidos = 0.0
        receita_por_papel = []
        if not df_pedidos.empty:
            df_p = preparar_dataframe_pedidos(df_pedidos)
            df_p = df_p[df_p["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy()
            if not df_p.empty:
                receita_praticada_total_pedidos = float(pd.to_numeric(df_p["valor_praticado"], errors="coerce").fillna(0).sum())

                mapa_papel = df[["cod_revendedor", "papel_tratado"]].drop_duplicates(subset=["cod_revendedor"], keep="last")
                df_p["pessoa"] = df_p["pessoa"].apply(normalizar_identificador)
                df_merge = df_p.merge(mapa_papel, left_on="pessoa", right_on="cod_revendedor", how="left")
                df_merge["papel_tratado"] = df_merge["papel_tratado"].fillna("Não informado")

                receita_revendedor = df_p.groupby("pessoa")["valor_praticado"].sum().reset_index().rename(columns={"pessoa": "cod_revendedor", "valor_praticado": "receita_praticada_pedidos"})
                df = df.drop(columns=["receita_praticada_pedidos"], errors="ignore").merge(receita_revendedor, on="cod_revendedor", how="left")
                df["receita_praticada_pedidos"] = pd.to_numeric(df["receita_praticada_pedidos"], errors="coerce").fillna(0)

                receita_por_papel = df_merge.groupby("papel_tratado")["valor_praticado"].sum().reset_index().rename(columns={"papel_tratado": "name", "valor_praticado": "value"}).sort_values("value", ascending=False).to_dict(orient="records")

        if not receita_por_papel:
            receita_por_papel = df.groupby("papel_tratado")["vlr_receita_liquida"].sum().reset_index().rename(columns={"papel_tratado": "name", "vlr_receita_liquida": "value"}).sort_values("value", ascending=False).to_dict(orient="records")
            receita_praticada_total_pedidos = float(pd.to_numeric(df["vlr_receita_liquida"], errors="coerce").fillna(0).sum())

        colunas_retorno = colunas_texto + colunas_numericas + ["receita_praticada_pedidos"]
        revendedores = df[colunas_retorno].fillna("").to_dict(orient="records")

        inad = int(df["eh_inadimplente"].sum())
        com_tel = int((df["tel_celular"].fillna("").astype(str).str.strip() != "").sum())
        ativos = int(df["atividade"].fillna("").astype(str).str.upper().str.startswith("A").sum())
        app_fez_compra = int((df["receita_bot_ciclo"] > 0).sum())
        er_fez_compra = int((df["receita_er"] > 0).sum())

        return {
            "status": "sucesso",
            "total_revendedores": int(len(df)),
            "total_estruturas": int(df["nome_estrutura"].fillna("").astype(str).str.strip().replace("", pd.NA).dropna().nunique()),
            "total_cidades": int(df["cidade"].fillna("").astype(str).str.strip().replace("", pd.NA).dropna().nunique()),
            "inadimplentes": inad,
            "com_telefone": com_tel,
            "ativos": ativos,
            "percentual_ativos": calcular_percentual(ativos, len(df)),
            "app_fez_compra": app_fez_compra,
            "er_fez_compra": er_fez_compra,
            "percentual_app": calcular_percentual(app_fez_compra, len(df)),
            "percentual_er": calcular_percentual(er_fez_compra, len(df)),
            "credito_disponivel_total": float(df["credito_disponivel"].sum()),
            # Mantive a chave receita_liquida_total para não precisar alterar o App.jsx,
            # mas agora ela representa a Receita Praticada oficial, igual ao Dashboard.
            "receita_liquida_total": float(receita_praticada_total_pedidos),
            "papel_adimplencia": papel_adimplencia,
            "atividade_tabela": atividade_tabela,
            "receita_por_papel": receita_por_papel,
            "revendedores": revendedores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/revendedores/listar")
def listar_revendedores():
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "revendedores" not in tables:
                return {"status": "sucesso", "revendedores": []}
            df = pd.read_sql("SELECT * FROM revendedores LIMIT 1000", conn)
        return {"status": "sucesso", "revendedores": df.fillna("").to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/opcoes-filtros")
def obter_opcoes_filtros():
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "consulta_pedidos" not in tables:
                return {"unidades": [], "estruturas": [], "consultores": [], "situacoes": []}

            estruturas_rows = conn.execute(text("SELECT DISTINCT estrutura FROM consulta_pedidos WHERE estrutura IS NOT NULL AND TRIM(CAST(estrutura AS TEXT)) <> :vazio"), {"vazio": ""}).fetchall()
            consultores_rows = conn.execute(text("SELECT DISTINCT usuario_finalizacao FROM consulta_pedidos WHERE usuario_finalizacao IS NOT NULL AND TRIM(CAST(usuario_finalizacao AS TEXT)) <> :vazio"), {"vazio": ""}).fetchall()
            situacoes_rows = conn.execute(text("SELECT DISTINCT situacao_comercial FROM consulta_pedidos WHERE situacao_comercial IS NOT NULL AND TRIM(CAST(situacao_comercial AS TEXT)) <> :vazio"), {"vazio": ""}).fetchall()

        estruturas = sorted([str(r[0]).strip() for r in estruturas_rows if str(r[0]).strip()])
        unidades = sorted(list(set([e.split("-")[0].strip() if "-" in e else e.strip() for e in estruturas if e.strip()])))
        consultores = sorted([str(r[0]).strip() for r in consultores_rows if str(r[0]).strip()])
        situacoes = sorted([str(r[0]).strip() for r in situacoes_rows if str(r[0]).strip()])

        return {
            "unidades": unidades,
            "estruturas": estruturas,
            "consultores": consultores,
            "situacoes": situacoes
        }
    except Exception as e:
        print(f"Erro /dashboard/opcoes-filtros: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dashboard/dados")
def obter_dados(filtros: FiltrosRequest):
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "consulta_pedidos" not in tables: return {}
            
            df = ler_tabela_cacheada("consulta_pedidos", conn)
            df_metas = ler_tabela_cacheada("metas_estruturas", conn) if "metas_estruturas" in tables else pd.DataFrame()
            df_base = ler_tabela_cacheada("base_ativa_revendedores", conn) if "base_ativa_revendedores" in tables else pd.DataFrame()
            df_make = ler_tabela_cacheada("vendas_make", conn) if "vendas_make" in tables else pd.DataFrame()
            df_cabelo = ler_tabela_cacheada("vendas_cabelo", conn) if "vendas_cabelo" in tables else pd.DataFrame()
            df_consultores_raw = ler_tabela_cacheada("consultores_metas", conn) if "consultores_metas" in tables else pd.DataFrame()
            
            data_up = None
            if "config_sistema" in tables:
                res_up = conn.execute(text("SELECT valor FROM config_sistema WHERE chave='ultima_atualizacao_pedidos'")).fetchone()
                if res_up and res_up[0]:
                    val = res_up[0]
                    try:
                        dt_obj = datetime.fromisoformat(val)
                        data_up = dt_obj.strftime('%d/%m/%Y às %H:%M:%S')
                    except:
                        try:
                            dt_obj = pd.to_datetime(val)
                            data_up = dt_obj.strftime('%d/%m/%Y às %H:%M:%S')
                        except:
                            data_up = val
                            
            ciclo = None
            if "ciclos_comerciais" in tables:
                res_c = conn.execute(text("SELECT * FROM ciclos_comerciais WHERE data_inicio <= :d AND data_fim >= :d AND LOWER(status_ciclo) = 'ativo' ORDER BY data_inicio DESC LIMIT 1"), {"d": hoje_brasil()}).mappings().fetchone()
                if res_c:
                    ciclo = dict(res_c)
        
        df = preparar_dataframe_pedidos(df)
        df_metas = preparar_dataframe_metas(df_metas)
        df_base = preparar_dataframe_base_ativa(df_base)
        df_consultores = aplicar_pesos_consultores(preparar_dataframe_consultores(df_consultores_raw))
        
        if filtros.nucleos:
            df = aplicar_filtro_nucleo(df, filtros.nucleos)
            df_metas = aplicar_filtro_nucleo(df_metas, filtros.nucleos)
            df_base = aplicar_filtro_nucleo(df_base, filtros.nucleos)
            df_make = aplicar_filtro_nucleo(df_make, filtros.nucleos)
            df_cabelo = aplicar_filtro_nucleo(df_cabelo, filtros.nucleos)
            df_consultores = aplicar_filtro_nucleo(df_consultores, filtros.nucleos)
        
        df_sem_data = aplicar_filtros_pedidos_sem_data(df, filtros)
        df = aplicar_filtros_data_pedidos(df_sem_data, filtros)

        df_validos_base_ciclo = df_sem_data[df_sem_data["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy() if not df_sem_data.empty else pd.DataFrame()
        df_validos = df[df["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy()
        df_canc = df[df["situacao_normalizada"].str.startswith("cancel", na=False)].copy()
        
        valor_total = float(df_validos["valor_praticado"].sum())
        total_pedidos = int(len(df_validos))
        total_cancelados = int(len(df_canc))
        total_itens = int(df_validos["qtde_itens"].sum())
        
        primeiros = obter_primeiros_pedidos_revendedores(df_validos)
        ativados = int(len(primeiros))
        
        meta_v = calcular_meta_contextual_dashboard(filtros, df_metas, df_consultores, float(ciclo["meta_ciclo"]) if ciclo else 0)
        data_ref = obter_data_referencia_filtro(filtros)
        metr_ciclo = calcular_metricas_ciclo(df_validos_base_ciclo, {"ciclo": ciclo["ciclo"], "data_inicio": ciclo["data_inicio"], "data_fim": ciclo["data_fim"], "meta_ciclo": meta_v} if ciclo else None, data_ref)

        if not df_base.empty:
            df_base["unidade"] = df_base["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
            if filtros.unidades: df_base = df_base[df_base["unidade"].isin(filtros.unidades)]
            if filtros.estruturas: df_base = df_base[df_base["estrutura"].isin(filtros.estruturas)]
            base_ativa_total = int(df_base["base_ativa"].sum())
        else:
            base_ativa_total = 0
            
        p_make = calcular_primeiros_indicador_seguro(df_make, df_consultores, filtros, df_validos_base_ciclo, "MAKE")
        p_cabelo = calcular_primeiros_indicador_seguro(df_cabelo, df_consultores, filtros, df_validos_base_ciclo, "CABELO")

        rev_make = int(len(p_make))
        rev_cabelo = int(len(p_cabelo))
        
        mCap = df_validos.groupby("meio_captacao").size().reset_index(name="value").rename(columns={"meio_captacao": "MeioCaptacao"}).sort_values("value", ascending=False).to_dict(orient="records")
        rMar = df_validos.groupby("modelo_comercial")["valor_praticado"].sum().reset_index().rename(columns={"modelo_comercial": "name", "valor_praticado": "value"}).sort_values("value", ascending=False).to_dict(orient="records")
        rEst = df_validos.groupby("estrutura")["valor_praticado"].sum().reset_index().rename(columns={"estrutura": "Estrutura", "valor_praticado": "ValorPraticado"}).sort_values("ValorPraticado", ascending=False).to_dict(orient="records")

        rCons = []
        if not df_validos.empty:
            if not df_consultores.empty:
                c_prep = df_consultores.copy()
                c_prep["id_colaborador"] = c_prep["id_colaborador"].apply(normalizar_identificador)
                mapa_c = dict(zip(c_prep["id_colaborador"], c_prep["nome"]))
                df_v_cons = df_validos.copy()
                df_v_cons["nome_consultor"] = df_v_cons["cod_usuario_finalizacao"].map(mapa_c).fillna(df_v_cons["usuario_finalizacao"])
            else:
                df_v_cons = df_validos.copy()
                df_v_cons["nome_consultor"] = df_v_cons["usuario_finalizacao"]
                
            rCons = df_v_cons.groupby("nome_consultor")["valor_praticado"].sum().reset_index().rename(columns={"nome_consultor": "Consultor", "valor_praticado": "ValorPraticado"}).sort_values("ValorPraticado", ascending=True).to_dict(orient="records")

        m_canc = df_canc.groupby("detalhe_situacao_comercial").agg(quantidade=("codigo_pedido", "count"), valor_liquido=("valor_liquido", "sum")).reset_index()
        m_canc["percentual"] = m_canc["quantidade"].apply(lambda q: round((q / total_cancelados) * 100, 2) if total_cancelados > 0 else 0)
        motivos_cancelamento = m_canc.rename(columns={"detalhe_situacao_comercial": "motivo"}).sort_values("quantidade", ascending=False).to_dict(orient="records") if not m_canc.empty else []

        df_v_dia = df_validos[df_validos["data_captacao"].notnull()].groupby("data_captacao")["valor_praticado"].sum().reset_index().sort_values("data_captacao")
        if not df_v_dia.empty:
            df_v_dia["Data Captação"] = pd.to_datetime(df_v_dia["data_captacao"]).dt.strftime("%d/%m/%Y")
            vendas_por_dia = df_v_dia.rename(columns={"valor_praticado": "ValorPraticado"})[["Data Captação", "ValorPraticado"]].to_dict(orient="records")
        else:
            vendas_por_dia = []

        df_canais = df.copy()
        df_canais["canal_tabela"] = df_canais["meio_captacao"].apply(classificar_meio_captacao)
        estruturas = sorted([e for e in df_canais["estrutura"].dropna().unique() if str(e).strip()])
        vendas_por_canal = []
        for est in estruturas:
            df_e = df_canais[df_canais["estrutura"] == est]
            df_val = df_e[df_e["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)]
            df_c = df_e[df_e["situacao_normalizada"].str.startswith("cancel", na=False)]
            def soma_c(c): return float(df_val[df_val["canal_tabela"] == c]["valor_praticado"].sum())
            vendas_por_canal.append({
                "estrutura": est, "app_revendedor": soma_c("app_revendedor"), "omni": soma_c("omni"), "portal_revendedor": soma_c("portal_revendedor"),
                "vd_mais": soma_c("vd_mais"), "cancelado": float(df_c["valor_liquido"].sum()), "receita_total": float(df_val["valor_praticado"].sum())
            })
        vendas_por_canal = sorted(vendas_por_canal, key=lambda i: i["receita_total"], reverse=True)

        return {
            "valor_total": valor_total, "total_pedidos": total_pedidos, "total_cancelados": total_cancelados, "total_itens": total_itens,
            "revendedores_ativados": ativados, "percentual_make": calcular_percentual(rev_make, ativados), "percentual_cabelo": calcular_percentual(rev_cabelo, ativados),
            "percentual_atividade_geral": calcular_percentual(ativados, base_ativa_total), "revendedores_make": rev_make, "revendedores_cabelo": rev_cabelo,
            "ultima_atualizacao_pedidos": data_up, **metr_ciclo, "vendas_por_dia": vendas_por_dia, "meios_captacao": mCap, "realizado_por_marca": rMar,
            "realizado_por_estrutura": rEst, "realizado_por_consultor": rCons, "vendas_por_canal": vendas_por_canal, "motivos_cancelamento": motivos_cancelamento
        }
    except Exception as e:
        print("Erro /dashboard/dados:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metas/resumo")
def obter_resumo_metas(filtros: FiltrosRequest):
    try:
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "metas_estruturas" not in tables: return {"estruturas": []}
            
            df_metas = ler_tabela_cacheada("metas_estruturas", conn)
            df_pedidos = ler_tabela_cacheada("consulta_pedidos", conn) if "consulta_pedidos" in tables else pd.DataFrame()
            df_base = ler_tabela_cacheada("base_ativa_revendedores", conn) if "base_ativa_revendedores" in tables else pd.DataFrame()
            df_make = ler_tabela_cacheada("vendas_make", conn) if "vendas_make" in tables else pd.DataFrame()
            df_cabelo = ler_tabela_cacheada("vendas_cabelo", conn) if "vendas_cabelo" in tables else pd.DataFrame()
            df_consultores_raw = ler_tabela_cacheada("consultores_metas", conn) if "consultores_metas" in tables else pd.DataFrame()

        df_consultores = aplicar_pesos_consultores(preparar_dataframe_consultores(df_consultores_raw))
        df_metas = preparar_dataframe_metas(df_metas)
        df_pedidos = preparar_dataframe_pedidos(df_pedidos)
        df_base = preparar_dataframe_base_ativa(df_base)

        if filtros.nucleos:
            df_metas = aplicar_filtro_nucleo(df_metas, filtros.nucleos)
            df_pedidos = aplicar_filtro_nucleo(df_pedidos, filtros.nucleos)
            df_base = aplicar_filtro_nucleo(df_base, filtros.nucleos)
            df_make = aplicar_filtro_nucleo(df_make, filtros.nucleos)
            df_cabelo = aplicar_filtro_nucleo(df_cabelo, filtros.nucleos)
            df_consultores = aplicar_filtro_nucleo(df_consultores, filtros.nucleos)

        if filtros.unidades:
            df_metas["unidade"] = df_metas["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
            df_metas = df_metas[df_metas["unidade"].isin(filtros.unidades)]
        if filtros.estruturas: df_metas = df_metas[df_metas["estrutura"].isin(filtros.estruturas)]

        meta_atividade_geral = float(df_metas["atividade"].mean()) if not df_metas.empty and "atividade" in df_metas.columns else 0.0
        meta_make_geral = float(df_metas["pen_make"].mean()) if not df_metas.empty and "pen_make" in df_metas.columns else 0.0
        meta_cabelo_geral = float(df_metas["pen_cabelos"].mean()) if not df_metas.empty and "pen_cabelos" in df_metas.columns else 0.0
        meta_rpa_geral = float(df_metas["rpa"].mean()) if not df_metas.empty and "rpa" in df_metas.columns else 0.0
        meta_tkt_medio_geral = float(df_metas["tkt_medio"].mean()) if not df_metas.empty and "tkt_medio" in df_metas.columns else 0.0
        meta_upa_geral = float(df_metas["upa"].mean()) if not df_metas.empty and "upa" in df_metas.columns else 0.0

        if not df_pedidos.empty:
            df_pedidos_sem_data = aplicar_filtros_pedidos_sem_data(df_pedidos, filtros)
            df_pedidos = aplicar_filtros_data_pedidos(df_pedidos_sem_data, filtros)
            df_validos_base_ciclo = df_pedidos_sem_data[df_pedidos_sem_data["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy() if not df_pedidos_sem_data.empty else pd.DataFrame()
            df_validos = df_pedidos[df_pedidos["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy()
            primeiros_pedidos = obter_primeiros_pedidos_revendedores(df_validos)
        else:
            df_validos = pd.DataFrame(); df_validos_base_ciclo = pd.DataFrame(); primeiros_pedidos = pd.DataFrame()

        if not df_base.empty:
            if filtros.unidades:
                df_base["unidade"] = df_base["estrutura"].apply(lambda x: str(x).split("-")[0].strip() if "-" in str(x) else str(x).strip())
                df_base = df_base[df_base["unidade"].isin(filtros.unidades)]
            if filtros.estruturas: df_base = df_base[df_base["estrutura"].isin(filtros.estruturas)]

        p_make = calcular_primeiros_indicador_seguro(df_make, df_consultores, filtros, df_validos_base_ciclo, "MAKE")
        p_cabelo = calcular_primeiros_indicador_seguro(df_cabelo, df_consultores, filtros, df_validos_base_ciclo, "CABELO")

        res = []
        for _, m in df_metas.iterrows():
            est = m["estrutura"]; mb = float(m["receita"] or 0); bb = obter_base_ativa_estrutura(df_base, est)
            
            if filtros.consultores and not df_consultores.empty:
                c_est = df_consultores[df_consultores["estrutura"] == est]
                c_filt = c_est[c_est["nome"].isin(filtros.consultores) | c_est["id_colaborador"].isin(filtros.consultores)]
                mr = 0; ba = 0
                for _, c in c_filt.iterrows():
                    p = float(c.get("peso_meta_calculado") or 0)
                    mr += mb * (p / 100); ba += bb * (p / 100)
                ba = int(round(ba, 0))
            else:
                mr = mb; ba = bb

            if not df_validos.empty:
                df_e = df_validos[df_validos["estrutura"] == est]
                rlz = float(df_e["valor_praticado"].sum()); qtd = int(len(df_e)); t_itens = int(df_e["qtde_itens"].sum())
            else:
                rlz = 0.0; qtd = 0; t_itens = 0

            ativ = int(len(primeiros_pedidos[primeiros_pedidos["estrutura"] == est])) if not primeiros_pedidos.empty else 0
            mk = int(len(p_make[p_make["estrutura"] == est])) if not p_make.empty else 0
            cb = int(len(p_cabelo[p_cabelo["estrutura"] == est])) if not p_cabelo.empty else 0
            
            res.append({
                "estrutura": est, "receita": mr, "atividade_realizada": ativ, "base_ativa": ba, "percentual_atividade": calcular_percentual(ativ, ba), 
                "make_realizado": mk, "percentual_make": calcular_percentual(mk, ativ), "cabelo_realizado": cb, "percentual_cabelo": calcular_percentual(cb, ativ), 
                "realizado": rlz, "percentual": round((rlz / mr) * 100, 2) if mr > 0 else 0.0, "quantidade_pedidos": qtd, "total_itens": t_itens
            })

        ranking_consultores = []
        if not df_consultores.empty:
            c_filt_global = df_consultores.copy()
            if filtros.consultores:
                c_filt_global = c_filt_global[c_filt_global["nome"].isin(filtros.consultores) | c_filt_global["id_colaborador"].isin(filtros.consultores)]
            
            for _, c in c_filt_global.iterrows():
                idc = str(c["id_colaborador"])
                est_c = c["estrutura"]
                nome_c = c["nome"]
                peso = float(c.get("peso_meta_calculado") or 0)
                
                m_linha = df_metas[df_metas["estrutura"] == est_c]
                mb = float(m_linha.iloc[0]["receita"] or 0) if not m_linha.empty else 0.0
                bb = obter_base_ativa_estrutura(df_base, est_c)
                
                m_ind = mb * (peso / 100)
                b_ind = round(bb * (peso / 100), 2)
                
                if not df_validos.empty:
                    df_c_v = df_validos[df_validos["cod_usuario_finalizacao"] == idc]
                    rlz_c = float(df_c_v["valor_praticado"].sum())
                    qtd_c = int(len(df_c_v))
                    t_itens_c = int(df_c_v["qtde_itens"].sum())
                else:
                    rlz_c = 0.0; qtd_c = 0; t_itens_c = 0
                
                ativ_c = int(len(primeiros_pedidos[primeiros_pedidos["cod_usuario_finalizacao"] == idc])) if not primeiros_pedidos.empty else 0
                mk_c = int(len(p_make[p_make["cod_usuario_finalizacao"] == idc])) if not p_make.empty else 0
                cb_c = int(len(p_cabelo[p_cabelo["cod_usuario_finalizacao"] == idc])) if not p_cabelo.empty else 0
                
                ranking_consultores.append({
                    "id_colaborador": idc,
                    "nome": nome_c,
                    "estrutura": est_c,
                    "meta_individual": m_ind,
                    "realizado": rlz_c,
                    "percentual": round((rlz_c / m_ind) * 100, 2) if m_ind > 0 else 0.0,
                    "quantidade_pedidos": qtd_c,
                    "atividade_realizada": ativ_c,
                    "percentual_atividade": calcular_percentual(ativ_c, b_ind),
                    "make_realizado": mk_c,
                    "percentual_make": calcular_percentual(mk_c, ativ_c),
                    "cabelo_realizado": cb_c,
                    "percentual_cabelo": calcular_percentual(cb_c, ativ_c),
                    "rpa": rlz_c / ativ_c if ativ_c > 0 else 0.0,
                    "tkt_medio": rlz_c / qtd_c if qtd_c > 0 else 0.0,
                    "upa": t_itens_c / ativ_c if ativ_c > 0 else 0.0
                })

        return {
            "meta_total_geral": sum(i["receita"] for i in res), 
            "realizado_total_geral": sum(i["realizado"] for i in res),
            "atividade_total_geral": sum(i["atividade_realizada"] for i in res), 
            "base_ativa_total_geral": sum(i["base_ativa"] for i in res),
            "percentual_atividade_total_geral": calcular_percentual(sum(i["atividade_realizada"] for i in res), sum(i["base_ativa"] for i in res)),
            "make_total_geral": sum(i["make_realizado"] for i in res), 
            "percentual_make_total_geral": calcular_percentual(sum(i["make_realizado"] for i in res), sum(i["atividade_realizada"] for i in res)),
            "cabelo_total_geral": sum(i["cabelo_realizado"] for i in res), 
            "percentual_cabelo_total_geral": calcular_percentual(sum(i["cabelo_realizado"] for i in res), sum(i["atividade_realizada"] for i in res)),
            "percentual_total_geral": round((sum(i["realizado"] for i in res) / sum(i["receita"] for i in res)) * 100, 2) if sum(i["receita"] for i in res) > 0 else 0.0,
            "meta_atividade_geral": meta_atividade_geral,
            "meta_make_geral": meta_make_geral,
            "meta_cabelo_geral": meta_cabelo_geral,
            "meta_rpa_geral": meta_rpa_geral,
            "meta_tkt_medio_geral": meta_tkt_medio_geral,
            "meta_upa_geral": meta_upa_geral,
            "estruturas": sorted(res, key=lambda x: x["realizado"], reverse=True),
            "ranking_consultores": ranking_consultores
        }
    except Exception as e:
        print("Erro /metas/resumo:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metas/estrutura/{estrutura}")
def obter_detalhes_meta_estrutura(estrutura: str, filtros: FiltrosRequest):
    try:
        est = unquote(estrutura).strip()
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            if "metas_estruturas" not in tables: raise HTTPException(status_code=404, detail="Tabela não encontrada.")
            
            df_metas = ler_tabela_cacheada("metas_estruturas", conn)
            df_pedidos = ler_tabela_cacheada("consulta_pedidos", conn) if "consulta_pedidos" in tables else pd.DataFrame()
            df_base = ler_tabela_cacheada("base_ativa_revendedores", conn) if "base_ativa_revendedores" in tables else pd.DataFrame()
            df_make = ler_tabela_cacheada("vendas_make", conn) if "vendas_make" in tables else pd.DataFrame()
            df_cabelo = ler_tabela_cacheada("vendas_cabelo", conn) if "vendas_cabelo" in tables else pd.DataFrame()
            df_consultores_raw = ler_tabela_cacheada("consultores_metas", conn) if "consultores_metas" in tables else pd.DataFrame()
            
        df_consultores = aplicar_pesos_consultores(preparar_dataframe_consultores(df_consultores_raw))
        df_metas = preparar_dataframe_metas(df_metas)
        df_pedidos = preparar_dataframe_pedidos(df_pedidos)
        df_base = preparar_dataframe_base_ativa(df_base)

        if filtros.nucleos:
            df_metas = aplicar_filtro_nucleo(df_metas, filtros.nucleos)
            df_pedidos = aplicar_filtro_nucleo(df_pedidos, filtros.nucleos)
            df_base = aplicar_filtro_nucleo(df_base, filtros.nucleos)
            df_make = aplicar_filtro_nucleo(df_make, filtros.nucleos)
            df_cabelo = aplicar_filtro_nucleo(df_cabelo, filtros.nucleos)
            df_consultores = aplicar_filtro_nucleo(df_consultores, filtros.nucleos)

        if not df_pedidos.empty:
            df_pedidos_sem_data = aplicar_filtros_pedidos_sem_data(df_pedidos, filtros)
            df_pedidos = aplicar_filtros_data_pedidos(df_pedidos_sem_data, filtros)
            df_validos_base_ciclo = df_pedidos_sem_data[df_pedidos_sem_data["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy() if not df_pedidos_sem_data.empty else pd.DataFrame()
            df_validos = df_pedidos[df_pedidos["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy()
            df_e = df_validos[df_validos["estrutura"] == est].copy()
            primeiros = obter_primeiros_pedidos_revendedores(df_validos)
        else:
            df_validos = pd.DataFrame(); df_validos_base_ciclo = pd.DataFrame(); df_e = pd.DataFrame(); primeiros = pd.DataFrame()

        m_linha = df_metas[df_metas["estrutura"] == est]
        if m_linha.empty: raise HTTPException(status_code=404, detail="Meta não encontrada.")
        
        mb = float(m_linha.iloc[0]["receita"] or 0)
        bb = obter_base_ativa_estrutura(df_base, est)

        if filtros.consultores and not df_consultores.empty:
            c_est = df_consultores[df_consultores["estrutura"] == est]
            c_filt = c_est[c_est["nome"].isin(filtros.consultores) | c_est["id_colaborador"].isin(filtros.consultores)]
            mr = 0; ba = 0
            for _, c in c_filt.iterrows():
                p = float(c.get("peso_meta_calculado") or 0)
                mr += mb * (p / 100); ba += bb * (p / 100)
            ba = int(round(ba, 0))
        else:
            mr = mb; ba = bb

        p_make = calcular_primeiros_indicador_seguro(df_make, df_consultores, filtros, df_validos_base_ciclo, "MAKE")
        p_cabelo = calcular_primeiros_indicador_seguro(df_cabelo, df_consultores, filtros, df_validos_base_ciclo, "CABELO")

        rlz = float(df_e["valor_praticado"].sum()) if not df_e.empty else 0.0
        t_itens = int(df_e["qtde_itens"].sum()) if not df_e.empty else 0
        qtd = int(len(df_e)) if not df_e.empty else 0
        ativ = int(len(primeiros[primeiros["estrutura"] == est])) if not primeiros.empty else 0
        mk = int(len(p_make[p_make["estrutura"] == est])) if not p_make.empty else 0
        cb = int(len(p_cabelo[p_cabelo["estrutura"] == est])) if not p_cabelo.empty else 0
        
        c_est = df_consultores[df_consultores["estrutura"] == est].copy() if not df_consultores.empty else pd.DataFrame()
        if filtros.consultores: c_est = c_est[c_est["nome"].isin(filtros.consultores) | c_est["id_colaborador"].isin(filtros.consultores)]

        c_res = []; ids_c = []
        for _, c in c_est.iterrows():
            idc = str(c["id_colaborador"]); ids_c.append(idc)
            peso = float(c.get("peso_meta_calculado") or 0)
            m_ind = mb * (peso / 100); b_ind = round(bb * (peso / 100), 2)

            if not df_e.empty:
                df_c = df_e[df_e["cod_usuario_finalizacao"] == idc]
                rlz_c = float(df_c["valor_praticado"].sum()); qtd_c = int(len(df_c)); t_itens_c = int(df_c["qtde_itens"].sum())
            else:
                rlz_c = 0.0; qtd_c = 0; t_itens_c = 0
            
            ativ_c = int(len(primeiros[(primeiros["estrutura"] == est) & (primeiros["cod_usuario_finalizacao"] == idc)])) if not primeiros.empty else 0
            mk_c = int(len(p_make[(p_make["estrutura"] == est) & (p_make["cod_usuario_finalizacao"] == idc)])) if not p_make.empty else 0
            cb_c = int(len(p_cabelo[(p_cabelo["estrutura"] == est) & (p_cabelo["cod_usuario_finalizacao"] == idc)])) if not p_cabelo.empty else 0
            
            c_res.append({
                "id_colaborador": idc, "nome": c["nome"], "estrutura": c["estrutura"], "canal": c["canal"], "status_consultor": c["status_consultor"], 
                "peso_meta": peso, "meta_individual": m_ind, "base_ativa_individual": b_ind, "realizado": rlz_c, "percentual": round((rlz_c / m_ind) * 100, 2) if m_ind > 0 else 0.0, 
                "quantidade_pedidos": qtd_c, "atividade_realizada": ativ_c, "percentual_atividade": calcular_percentual(ativ_c, b_ind), 
                "make_realizado": mk_c, "percentual_make": calcular_percentual(mk_c, ativ_c), "cabelo_realizado": cb_c, "percentual_cabelo": calcular_percentual(cb_c, ativ_c),
                "total_itens": t_itens_c
            })
        
        v_fora = []
        if not df_validos.empty and ids_c:
            df_f = df_validos[(df_validos["cod_usuario_finalizacao"].isin(ids_c)) & (df_validos["estrutura"] != est)].copy()
            if not df_f.empty:
                mapa = {str(i["id_colaborador"]): i["nome"] for i in c_res}
                df_f["nome_consultor"] = df_f["cod_usuario_finalizacao"].map(mapa)
                v_fora = df_f.groupby(["cod_usuario_finalizacao", "nome_consultor", "estrutura", "cod_estrutura"]).agg(quantidade_pedidos=("codigo_pedido", "count"), valor_praticado=("valor_praticado", "sum")).reset_index().sort_values("valor_praticado", ascending=False).to_dict(orient="records")

        return {
            "estrutura": est, 
            "meta": {
                "receita": mr,
                "atividade": float(m_linha.iloc[0].get("atividade", 0) or 0),
                "rpa": float(m_linha.iloc[0].get("rpa", 0) or 0),
                "tkt_medio": float(m_linha.iloc[0].get("tkt_medio", 0) or 0),
                "upa": float(m_linha.iloc[0].get("upa", 0) or 0),
                "make": float(m_linha.iloc[0].get("pen_make", 0) or 0),
                "cabelo": float(m_linha.iloc[0].get("pen_cabelos", 0) or 0)
            },
            "realizado": rlz, "percentual": round((rlz / mr) * 100, 2) if mr > 0 else 0.0,
            "quantidade_pedidos": qtd, "atividade_realizada": ativ, "base_ativa": ba, "percentual_atividade": calcular_percentual(ativ, ba), 
            "make_realizado": mk, "percentual_make": calcular_percentual(mk, ativ), "cabelo_realizado": cb, "percentual_cabelo": calcular_percentual(cb, ativ), 
            "consultores": sorted(c_res, key=lambda x: x["realizado"], reverse=True), "vendas_fora_estrutura": v_fora, "total_itens": t_itens
        }
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))



def normalizar_nucleo_param(nucleo: str) -> str:
    n = str(nucleo or "").strip().upper().replace("Ú", "U")
    if n in ["N1", "NUCLEO 1", "NÚCLEO 1"]:
        return "NUCLEO 1"
    if n in ["N2", "NUCLEO 2", "NÚCLEO 2"]:
        return "NUCLEO 2"
    raise HTTPException(status_code=400, detail="Núcleo inválido. Use N1 ou N2.")

def obter_ciclo_ativo(conn):
    try:
        row = conn.execute(text("SELECT ciclo, data_inicio, data_fim, meta_ciclo FROM ciclos_comerciais WHERE status_ciclo='ativo' ORDER BY id DESC LIMIT 1")).mappings().fetchone()
        if row:
            return dict(row)
    except Exception:
        pass
    return {"ciclo": "08/2026", "data_inicio": None, "data_fim": None, "meta_ciclo": 0}

def preparar_pedidos_validos_para_gestao(df_pedidos: pd.DataFrame, ciclo: str) -> pd.DataFrame:
    if df_pedidos.empty:
        return df_pedidos
    df = df_pedidos.copy()
    garantir_colunas(df, ["valor_praticado", "situacao_comercial", "situacao_normalizada", "estrutura", "codigo_pedido", "pessoa", "cod_usuario_finalizacao", "data_captacao", "ciclo_captacao", "qtde_itens"])
    if "situacao_normalizada" not in df.columns or df["situacao_normalizada"].isna().all():
        df["situacao_normalizada"] = df["situacao_comercial"].apply(normalizar_texto)
    df["valor_praticado"] = pd.to_numeric(df["valor_praticado"], errors="coerce").fillna(0)
    df["qtde_itens"] = pd.to_numeric(df["qtde_itens"], errors="coerce").fillna(0)
    df["cod_usuario_finalizacao"] = df["cod_usuario_finalizacao"].astype(str).str.strip()
    df["estrutura"] = df["estrutura"].astype(str).str.strip()
    df = df[df["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)].copy()
    if ciclo and "ciclo_captacao" in df.columns:
        ciclo_norm = str(ciclo).strip()
        df_ciclo = df[df["ciclo_captacao"].astype(str).str.strip() == ciclo_norm].copy()
        if not df_ciclo.empty:
            df = df_ciclo
    return df

@app.get("/gestao-nucleos/{nucleo}/resumo")
def obter_gestao_nucleo(nucleo: str, ciclo: Optional[str] = None, estrutura: Optional[str] = None):
    try:
        nucleo_norm = normalizar_nucleo_param(nucleo)
        with database_engine.connect() as conn:
            tables = get_all_tables(conn)
            ciclo_info = obter_ciclo_ativo(conn)
            ciclo_usado = ciclo or ciclo_info.get("ciclo") or "08/2026"
            df_metas = ler_tabela_cacheada("metas_estruturas", conn) if "metas_estruturas" in tables else pd.DataFrame()
            df_pedidos = ler_tabela_cacheada("consulta_pedidos", conn) if "consulta_pedidos" in tables else pd.DataFrame()
            df_consultores = ler_tabela_cacheada("consultores_metas", conn) if "consultores_metas" in tables else pd.DataFrame()
            df_base = ler_tabela_cacheada("base_ativa_revendedores", conn) if "base_ativa_revendedores" in tables else pd.DataFrame()
            df_make = ler_tabela_cacheada("vendas_make", conn) if "vendas_make" in tables else pd.DataFrame()
            df_cabelo = ler_tabela_cacheada("vendas_cabelo", conn) if "vendas_cabelo" in tables else pd.DataFrame()

            if not df_metas.empty:
                df_metas = padronizar_colunas(df_metas, MAPA_COLUNAS_METAS)
                garantir_colunas(df_metas, ["estrutura", "receita", "atividade", "rpa", "tkt_medio", "upa", "pen_make", "pen_cabelos"])
                for c in ["receita", "atividade", "rpa", "tkt_medio", "upa", "pen_make", "pen_cabelos"]:
                    df_metas[c] = pd.to_numeric(df_metas[c], errors="coerce").fillna(0)
                df_metas = aplicar_filtro_nucleo(df_metas, [nucleo_norm])
            if not df_pedidos.empty:
                df_pedidos = preparar_pedidos_validos_para_gestao(df_pedidos, ciclo_usado)
                df_pedidos = aplicar_filtro_nucleo(df_pedidos, [nucleo_norm])
            if not df_consultores.empty:
                df_consultores = padronizar_colunas(df_consultores, MAPA_COLUNAS_CONSULTORES)
                garantir_colunas(df_consultores, ["id_colaborador", "nome", "estrutura", "peso_meta", "peso_meta_calculado"])
                df_consultores["id_colaborador"] = df_consultores["id_colaborador"].astype(str).str.strip()
                df_consultores["estrutura"] = df_consultores["estrutura"].astype(str).str.strip()
                df_consultores = aplicar_filtro_nucleo(df_consultores, [nucleo_norm])
            if not df_base.empty:
                df_base = padronizar_colunas(df_base, MAPA_COLUNAS_BASE_ATIVA)
                garantir_colunas(df_base, ["estrutura", "base_ativa"])
                df_base["base_ativa"] = pd.to_numeric(df_base["base_ativa"], errors="coerce").fillna(0)
                df_base = aplicar_filtro_nucleo(df_base, [nucleo_norm])

            # Bases preparadas de indicadores para complementar a visão por consultor.
            # Se a preparação falhar, a tela continua funcionando com zero nos indicadores, sem derrubar a aba N1/N2.
            df_make_preparado = pd.DataFrame()
            df_cabelo_preparado = pd.DataFrame()
            try:
                filtros_indicador_nucleo = FiltrosRequest(nucleos=[nucleo_norm])
                if df_make is not None and not df_make.empty:
                    df_make_preparado = preparar_vendas_indicador_para_calculo(df_make, df_consultores, filtros_indicador_nucleo, df_pedidos)
                if df_cabelo is not None and not df_cabelo.empty:
                    df_cabelo_preparado = preparar_vendas_indicador_para_calculo(df_cabelo, df_consultores, filtros_indicador_nucleo, df_pedidos)
            except Exception as erro_indicador_gestao:
                print(f"Aviso gestao nucleos indicadores: {erro_indicador_gestao}")
                df_make_preparado = pd.DataFrame()
                df_cabelo_preparado = pd.DataFrame()

            cfg_nucleo = conn.execute(text("SELECT * FROM metas_gerenciais_nucleos WHERE ciclo=:ciclo AND nucleo=:nucleo"), {"ciclo": ciclo_usado, "nucleo": nucleo_norm}).mappings().fetchone()
            cfg_estruturas = {r["estrutura"]: dict(r) for r in conn.execute(text("SELECT * FROM metas_gerenciais_estruturas WHERE ciclo=:ciclo AND nucleo=:nucleo"), {"ciclo": ciclo_usado, "nucleo": nucleo_norm}).mappings().all()}
            cfg_consultores = {(r["estrutura"], str(r["id_colaborador"])): dict(r) for r in conn.execute(text("SELECT * FROM metas_gerenciais_consultores WHERE ciclo=:ciclo AND nucleo=:nucleo"), {"ciclo": ciclo_usado, "nucleo": nucleo_norm}).mappings().all()}

            meta_oficial_nucleo = float(df_metas["receita"].sum()) if not df_metas.empty else 0.0
            # A meta gerencial do card deve refletir a soma das metas gerenciais das estruturas.
            # Se ainda não houver distribuição cadastrada, usa a meta do núcleo; se também não houver, usa a oficial.
            soma_meta_gerencial_estruturas_cfg = sum(float(v.get("meta_gerencial") or 0) for v in cfg_estruturas.values()) if cfg_estruturas else 0.0
            if soma_meta_gerencial_estruturas_cfg > 0:
                meta_gerencial_nucleo = soma_meta_gerencial_estruturas_cfg
            elif cfg_nucleo:
                meta_gerencial_nucleo = float(cfg_nucleo["meta_gerencial"] or 0)
            else:
                meta_gerencial_nucleo = meta_oficial_nucleo
            realizado_total = float(df_pedidos["valor_praticado"].sum()) if not df_pedidos.empty else 0.0
            total_pedidos = int(len(df_pedidos)) if not df_pedidos.empty else 0

            estruturas = []
            if not df_metas.empty:
                total_receita_base = float(df_metas["receita"].sum()) or 1.0
                for _, row in df_metas.iterrows():
                    est = str(row.get("estrutura") or "").strip()
                    if not est: continue
                    cfg = cfg_estruturas.get(est)
                    peso_auto = (float(row.get("receita", 0) or 0) / total_receita_base) * 100
                    peso = float(cfg["peso"]) if cfg else peso_auto
                    meta_g = float(cfg["meta_gerencial"]) if cfg else meta_gerencial_nucleo * (peso / 100)
                    pedidos_est = df_pedidos[df_pedidos["estrutura"] == est] if not df_pedidos.empty else pd.DataFrame()
                    base_est = float(df_base[df_base["estrutura"] == est]["base_ativa"].sum()) if not df_base.empty else 0
                    realizado = float(pedidos_est["valor_praticado"].sum()) if not pedidos_est.empty else 0.0
                    qtd = int(len(pedidos_est)) if not pedidos_est.empty else 0
                    ativ = int(pedidos_est["pessoa"].nunique()) if not pedidos_est.empty and "pessoa" in pedidos_est.columns else 0
                    estruturas.append({
                        "estrutura": est,
                        "peso": round(peso, 2),
                        "meta_oficial": float(row.get("receita", 0) or 0),
                        "meta_gerencial": round(meta_g, 2),
                        "realizado": round(realizado, 2),
                        "percentual_gerencial": calcular_percentual(realizado, meta_g),
                        "gap_gerencial": round(max(meta_g - realizado, 0), 2),
                        "quantidade_pedidos": qtd,
                        "pedidos": qtd,
                        "base_ativa": base_est,
                        "atividade_realizada": ativ,
                        "percentual_atividade": calcular_percentual(ativ, base_est),
                        "rpa": round(realizado / ativ, 2) if ativ > 0 else 0,
                        "tkt_medio": round(realizado / qtd, 2) if qtd > 0 else 0,
                        "upa": round(float(pedidos_est["qtde_itens"].sum()) / qtd, 2) if qtd > 0 and "qtde_itens" in pedidos_est.columns else 0,
                        "make_realizado": 0,
                        "percentual_make": 0,
                        "cabelo_realizado": 0,
                        "percentual_cabelo": 0
                    })
            estruturas = sorted(estruturas, key=lambda x: x["realizado"], reverse=True)

            def montar_consultores_estrutura(estrutura_base: str, meta_estrutura: float) -> list:
                consultores_local = []
                df_c_est = df_consultores[df_consultores["estrutura"] == estrutura_base].copy() if not df_consultores.empty else pd.DataFrame()
                if df_c_est.empty:
                    return consultores_local

                pesos_originais = []
                total_peso_consultor = 0.0
                for _, c in df_c_est.iterrows():
                    idc = str(c.get("id_colaborador") or "").strip()
                    cfg_c = cfg_consultores.get((estrutura_base, idc))
                    peso_base = float(cfg_c["peso"]) if cfg_c else float(c.get("peso_meta_calculado") or c.get("peso_meta") or 0)
                    pesos_originais.append(peso_base)
                    total_peso_consultor += peso_base

                if len(df_c_est) > 0 and total_peso_consultor <= 0:
                    total_peso_consultor = len(df_c_est)
                    pesos_originais = [1.0] * len(df_c_est)

                for idx, (_, c) in enumerate(df_c_est.iterrows()):
                    idc = str(c.get("id_colaborador") or "").strip()
                    nome = str(c.get("nome") or "").strip()
                    cfg_c = cfg_consultores.get((estrutura_base, idc))
                    peso = float(cfg_c["peso"]) if cfg_c else (pesos_originais[idx] / total_peso_consultor * 100 if total_peso_consultor else 0)
                    meta_c = float(cfg_c["meta_gerencial"]) if cfg_c else float(meta_estrutura or 0) * (peso / 100)
                    pedidos_c = df_pedidos[(df_pedidos["estrutura"] == estrutura_base) & (df_pedidos["cod_usuario_finalizacao"] == idc)] if not df_pedidos.empty else pd.DataFrame()
                    realizado_c = float(pedidos_c["valor_praticado"].sum()) if not pedidos_c.empty else 0.0
                    qtd_c = int(len(pedidos_c)) if not pedidos_c.empty else 0
                    ativ_c = int(pedidos_c["pessoa"].nunique()) if not pedidos_c.empty and "pessoa" in pedidos_c.columns else 0
                    make_c = 0
                    cabelo_c = 0
                    if df_make_preparado is not None and not df_make_preparado.empty:
                        make_base = df_make_preparado[
                            (df_make_preparado["estrutura"].astype(str).str.strip() == estrutura_base) &
                            (df_make_preparado["cod_usuario_finalizacao"].astype(str).str.strip() == idc)
                        ].copy()
                        if not make_base.empty:
                            make_c = int(make_base["pessoa"].nunique()) if "pessoa" in make_base.columns else int(len(make_base))
                    if df_cabelo_preparado is not None and not df_cabelo_preparado.empty:
                        cabelo_base = df_cabelo_preparado[
                            (df_cabelo_preparado["estrutura"].astype(str).str.strip() == estrutura_base) &
                            (df_cabelo_preparado["cod_usuario_finalizacao"].astype(str).str.strip() == idc)
                        ].copy()
                        if not cabelo_base.empty:
                            cabelo_c = int(cabelo_base["pessoa"].nunique()) if "pessoa" in cabelo_base.columns else int(len(cabelo_base))

                    consultores_local.append({
                        "id_colaborador": idc,
                        "nome": nome,
                        "estrutura": estrutura_base,
                        "peso": round(peso, 2),
                        "meta_gerencial": round(meta_c, 2),
                        "realizado": round(realizado_c, 2),
                        "percentual_gerencial": calcular_percentual(realizado_c, meta_c),
                        "gap_gerencial": round(max(meta_c - realizado_c, 0), 2),
                        "quantidade_pedidos": qtd_c,
                        "pedidos": qtd_c,
                        "atividade_realizada": ativ_c,
                        "percentual_atividade": calcular_percentual(ativ_c, base_est) if base_est else 0,
                        "rpa": round(realizado_c / ativ_c, 2) if ativ_c > 0 else 0,
                        "tkt_medio": round(realizado_c / qtd_c, 2) if qtd_c > 0 else 0,
                        "upa": round(float(pedidos_c["qtde_itens"].sum()) / qtd_c, 2) if qtd_c > 0 and "qtde_itens" in pedidos_c.columns else 0,
                        "make_realizado": make_c,
                        "percentual_make": calcular_percentual(make_c, ativ_c),
                        "cabelo_realizado": cabelo_c,
                        "percentual_cabelo": calcular_percentual(cabelo_c, ativ_c)
                    })
                return sorted(consultores_local, key=lambda x: x["realizado"], reverse=True)

            consultores_por_estrutura = []
            for est_info_base in estruturas:
                est_nome_base = est_info_base.get("estrutura")
                meta_est_base = float(est_info_base.get("meta_gerencial", 0) or 0)
                for consultor_item in montar_consultores_estrutura(est_nome_base, meta_est_base):
                    consultores_por_estrutura.append(consultor_item)

            estrutura_selecionada = estrutura or (estruturas[0]["estrutura"] if estruturas else "")
            detalhe = None
            if estrutura_selecionada:
                est_info = next((e for e in estruturas if e["estrutura"] == estrutura_selecionada), None)
                consultores = [c for c in consultores_por_estrutura if c.get("estrutura") == estrutura_selecionada]
                detalhe = {"estrutura": estrutura_selecionada, "resumo": est_info, "consultores": consultores}

            return {
                "status": "sucesso",
                "ciclo": ciclo_usado,
                "nucleo": nucleo_norm,
                "meta_oficial_nucleo": round(meta_oficial_nucleo, 2),
                "meta_gerencial_nucleo": round(meta_gerencial_nucleo, 2),
                "realizado_total": round(realizado_total, 2),
                "percentual_oficial": calcular_percentual(realizado_total, meta_oficial_nucleo),
                "percentual_gerencial": calcular_percentual(realizado_total, meta_gerencial_nucleo),
                "gap_oficial": round(max(meta_oficial_nucleo - realizado_total, 0), 2),
                "gap_gerencial": round(max(meta_gerencial_nucleo - realizado_total, 0), 2),
                "cards": {
                    "meta_oficial": round(meta_oficial_nucleo, 2),
                    "meta_gerencial": round(meta_gerencial_nucleo, 2),
                    "realizado": round(realizado_total, 2),
                    "percentual_oficial": calcular_percentual(realizado_total, meta_oficial_nucleo),
                    "percentual_gerencial": calcular_percentual(realizado_total, meta_gerencial_nucleo),
                    "gap_oficial": round(max(meta_oficial_nucleo - realizado_total, 0), 2),
                    "gap_gerencial": round(max(meta_gerencial_nucleo - realizado_total, 0), 2),
                    "total_pedidos": total_pedidos,
                },
                "total_pedidos": total_pedidos,
                "consultores_por_estrutura": consultores_por_estrutura,
                "estruturas": estruturas,
                "detalhe": detalhe
            }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gestao-nucleos/{nucleo}/salvar")
def salvar_gestao_nucleo(nucleo: str, dados: SalvarMetaGerencialRequest):
    try:
        nucleo_norm = normalizar_nucleo_param(nucleo)
        with database_engine.begin() as conn:
            ciclo_info = obter_ciclo_ativo(conn)
            ciclo_usado = dados.ciclo or ciclo_info.get("ciclo") or "08/2026"
            meta_oficial = 0.0
            try:
                tables = get_all_tables(conn)
                if "metas_estruturas" in tables:
                    df_metas = padronizar_colunas(pd.read_sql("SELECT * FROM metas_estruturas", conn), MAPA_COLUNAS_METAS)
                    garantir_colunas(df_metas, ["estrutura", "receita"])
                    df_metas["receita"] = pd.to_numeric(df_metas["receita"], errors="coerce").fillna(0)
                    df_metas = aplicar_filtro_nucleo(df_metas, [nucleo_norm])
                    meta_oficial = float(df_metas["receita"].sum())
            except Exception:
                meta_oficial = 0.0

            soma_meta_gerencial_estruturas = sum(float(e.meta_gerencial or 0) for e in dados.estruturas)
            meta_gerencial_para_salvar = soma_meta_gerencial_estruturas if soma_meta_gerencial_estruturas > 0 else float(dados.meta_gerencial_nucleo or 0)

            conn.execute(text("""
                INSERT INTO metas_gerenciais_nucleos (ciclo, nucleo, meta_oficial, meta_gerencial, observacao, atualizado_em)
                VALUES (:ciclo, :nucleo, :meta_oficial, :meta_gerencial, :obs, NOW())
                ON CONFLICT (ciclo, nucleo) DO UPDATE SET
                  meta_oficial=EXCLUDED.meta_oficial,
                  meta_gerencial=EXCLUDED.meta_gerencial,
                  observacao=EXCLUDED.observacao,
                  atualizado_em=NOW()
            """), {"ciclo": ciclo_usado, "nucleo": nucleo_norm, "meta_oficial": meta_oficial, "meta_gerencial": meta_gerencial_para_salvar, "obs": dados.observacao or ""})

            for e in dados.estruturas:
                conn.execute(text("""
                    INSERT INTO metas_gerenciais_estruturas (ciclo, nucleo, estrutura, peso, meta_oficial, meta_gerencial, atualizado_em)
                    VALUES (:ciclo, :nucleo, :estrutura, :peso, :meta_oficial, :meta_gerencial, NOW())
                    ON CONFLICT (ciclo, nucleo, estrutura) DO UPDATE SET
                      peso=EXCLUDED.peso,
                      meta_oficial=EXCLUDED.meta_oficial,
                      meta_gerencial=EXCLUDED.meta_gerencial,
                      atualizado_em=NOW()
                """), {"ciclo": ciclo_usado, "nucleo": nucleo_norm, "estrutura": e.estrutura, "peso": float(e.peso or 0), "meta_oficial": float(e.meta_oficial or 0), "meta_gerencial": float(e.meta_gerencial or 0)})

            for c in dados.consultores:
                conn.execute(text("""
                    INSERT INTO metas_gerenciais_consultores (ciclo, nucleo, estrutura, id_colaborador, consultor, peso, meta_gerencial, atualizado_em)
                    VALUES (:ciclo, :nucleo, :estrutura, :idc, :consultor, :peso, :meta_gerencial, NOW())
                    ON CONFLICT (ciclo, nucleo, estrutura, id_colaborador) DO UPDATE SET
                      consultor=EXCLUDED.consultor,
                      peso=EXCLUDED.peso,
                      meta_gerencial=EXCLUDED.meta_gerencial,
                      atualizado_em=NOW()
                """), {"ciclo": ciclo_usado, "nucleo": nucleo_norm, "estrutura": c.estrutura, "idc": str(c.id_colaborador), "consultor": c.consultor, "peso": float(c.peso or 0), "meta_gerencial": float(c.meta_gerencial or 0)})
        limpar_cache_tabelas()
        return {"status": "sucesso", "mensagem": "Meta gerencial salva com sucesso."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/consultores")
def criar_consultor(dados: CriarConsultorRequest):
    try:
        with database_engine.begin() as conn:
            conn.execute(text("INSERT INTO consultores_metas (id_colaborador, nome, estrutura, canal, status_consultor, peso_meta, peso_meta_calculado) VALUES (:id_col, :nome, :estrutura, :canal, :status_col, :peso, :peso)"), {"id_col": dados.id_colaborador.strip(), "nome": dados.nome.strip(), "estrutura": dados.estrutura.strip(), "canal": dados.canal.strip(), "status_col": dados.status_consultor.strip().lower(), "peso": float(dados.peso_meta or 0)})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/consultores/listar")
def listar_todos_consultores():
    try:
        with database_engine.connect() as conn: 
            if not "consultores_metas" in get_all_tables(conn): return {"status": "sucesso", "consultores": []}
            return {"status": "sucesso", "consultores": [dict(c) for c in conn.execute(text("SELECT * FROM consultores_metas ORDER BY nome ASC")).mappings().all()]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/consultores/{id_consultor}")
def editar_consultor(id_consultor: int, dados: AtualizarConsultorRequest):
    try:
        with database_engine.begin() as conn: conn.execute(text("UPDATE consultores_metas SET nome=:nome, estrutura=:estrutura, canal=:canal, status_consultor=:status_consultor, peso_meta=:peso_meta, peso_meta_calculado=:peso_meta WHERE id=:id"), {"id": id_consultor, "nome": dados.nome.strip(), "estrutura": dados.estrutura.strip(), "canal": dados.canal.strip(), "status_consultor": dados.status_consultor.strip().lower(), "peso_meta": float(dados.peso_meta or 0)})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.delete("/consultores/{id_consultor}")
def apagar_consultor(id_consultor: int):
    try:
        with database_engine.begin() as conn: conn.execute(text("DELETE FROM consultores_metas WHERE id = :id"), {"id": id_consultor})
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)