from fastapi import FastAPI, UploadFile, File, HTTPException, status
from sqlalchemy import create_engine, text, inspect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import uvicorn
import io
import unicodedata

DATABASE_URL = "postgresql://postgres.bbpztqcdbxxpmztjbpof:Senha!914199@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

app = FastAPI(title="Backend Gerenciador de Vendas")
database_engine = create_engine(DATABASE_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

MAPA_COLUNAS_PEDIDOS = {
    "CodigoPedido": "codigo_pedido",
    "Pessoa": "pessoa",
    "NomePessoa": "nome_pessoa",
    "Papel": "papel",
    "QtdeItens": "qtde_itens",
    "ValorPraticado": "valor_praticado",
    "ValorLiquido": "valor_liquido",
    "MeioCaptacao": "meio_captacao",
    "SituaçãoComercial": "situacao_comercial",
    "Data Captação": "data_captacao",
    "HoraPedido": "hora_pedido",
    "Ciclo Captação": "ciclo_captacao",
    "PlanoPagamento": "plano_pagamento",
    "Cidade": "cidade",
    "ModeloComercial": "modelo_comercial",
    "EstruturaPai": "estrutura_pai",
    "Cód Estrutura": "cod_estrutura",
    "Estrutura": "estrutura",
    "Cód Usuário Finalização": "cod_usuario_finalizacao",
    "Usuario de Finalização": "usuario_finalizacao"
}

STATUS_VALIDOS_REALIZADO = [
    "aprovado",
    "transporte",
    "separacao",
    "entregue",
    "pendente"
]


class FiltrosRequest(BaseModel):
    unidades: List[str] = []
    estruturas: List[str] = []
    consultores: List[str] = []
    situacoes: List[str] = []
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None


def normalizar_texto(valor):
    if pd.isna(valor):
        return ""

    texto = str(valor).strip().lower()

    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join([c for c in texto if not unicodedata.combining(c)])

    return texto


async def carregar_dataframe_do_arquivo(arquivo: UploadFile) -> pd.DataFrame:
    conteudo_arquivo = await arquivo.read()
    extensao = arquivo.filename.split(".")[-1].lower()

    if extensao == "csv":
        return pd.read_csv(io.BytesIO(conteudo_arquivo), dtype=str)

    if extensao in ["xls", "xlsx"]:
        return pd.read_excel(io.BytesIO(conteudo_arquivo), dtype=str)

    raise HTTPException(status_code=400, detail="Formato de arquivo não suportado.")


@app.post("/upload/pedidos", status_code=status.HTTP_200_OK)
async def atualizar_base_pedidos(arquivo: UploadFile = File(...)):
    try:
        df_bruto = await carregar_dataframe_do_arquivo(arquivo)

        if df_bruto.empty:
            raise HTTPException(status_code=400, detail="O arquivo está vazio.")

        df_bruto.columns = df_bruto.columns.str.strip()
        df_final = df_bruto.rename(columns=MAPA_COLUNAS_PEDIDOS)

        colunas_desejadas = [
            "codigo_pedido",
            "pessoa",
            "nome_pessoa",
            "papel",
            "qtde_itens",
            "valor_praticado",
            "valor_liquido",
            "meio_captacao",
            "situacao_comercial",
            "data_captacao",
            "hora_pedido",
            "ciclo_captacao",
            "plano_pagamento",
            "cidade",
            "modelo_comercial",
            "estrutura_pai",
            "cod_estrutura",
            "estrutura",
            "cod_usuario_finalizacao",
            "usuario_finalizacao"
        ]

        for coluna in colunas_desejadas:
            if coluna not in df_final.columns:
                df_final[coluna] = None

        df_final = df_final[colunas_desejadas].copy()

        df_final["valor_praticado"] = pd.to_numeric(
            df_final["valor_praticado"],
            errors="coerce"
        ).fillna(0.0)

        df_final["valor_liquido"] = pd.to_numeric(
            df_final["valor_liquido"],
            errors="coerce"
        ).fillna(0.0)

        df_final["qtde_itens"] = pd.to_numeric(
            df_final["qtde_itens"],
            errors="coerce"
        ).fillna(0)

        df_final["situacao_comercial"] = (
            df_final["situacao_comercial"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df_final["modelo_comercial"] = (
            df_final["modelo_comercial"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df_final["data_captacao"] = pd.to_datetime(
            df_final["data_captacao"],
            errors="coerce",
            dayfirst=True
        )

        df_final["data_captacao"] = df_final["data_captacao"].apply(
            lambda x: x.date() if pd.notnull(x) else None
        )

        df_final = df_final.where(pd.notnull(df_final), None)

        inspector = inspect(database_engine)

        if "consulta_pedidos" in inspector.get_table_names():
            with database_engine.begin() as conexao:
                conexao.execute(text("TRUNCATE TABLE consulta_pedidos;"))

            df_final.to_sql(
                name="consulta_pedidos",
                con=database_engine,
                if_exists="append",
                index=False
            )
        else:
            df_final.to_sql(
                name="consulta_pedidos",
                con=database_engine,
                if_exists="replace",
                index=False
            )

            try:
                with database_engine.begin() as conexao:
                    conexao.execute(
                        text("ALTER TABLE consulta_pedidos ADD COLUMN id SERIAL PRIMARY KEY;")
                    )
            except Exception:
                pass

        return {
            "status": "sucesso",
            "mensagem": "Base de pedidos atualizada com sucesso."
        }

    except HTTPException:
        raise

    except Exception as erro:
        raise HTTPException(status_code=500, detail=str(erro))


@app.get("/dashboard/opcoes-filtros", status_code=status.HTTP_200_OK)
def obter_opcoes_filtros():
    try:
        with database_engine.connect() as conn:
            df = pd.read_sql(
                """
                SELECT 
                    estrutura, 
                    usuario_finalizacao, 
                    situacao_comercial 
                FROM consulta_pedidos
                """,
                conn
            )

        if df.empty:
            return {
                "unidades": [],
                "estruturas": [],
                "consultores": [],
                "situacoes": []
            }

        df["estrutura"] = df["estrutura"].fillna("").astype(str).str.strip()
        df["usuario_finalizacao"] = df["usuario_finalizacao"].fillna("").astype(str).str.strip()
        df["situacao_comercial"] = df["situacao_comercial"].fillna("").astype(str).str.strip()

        df["unidade"] = df["estrutura"].apply(
            lambda x: x.split("-")[0].strip() if "-" in x else x.strip()
        )

        return {
            "unidades": sorted([x for x in df["unidade"].unique() if x]),
            "estruturas": sorted([x for x in df["estrutura"].unique() if x]),
            "consultores": sorted([x for x in df["usuario_finalizacao"].unique() if x]),
            "situacoes": sorted([x for x in df["situacao_comercial"].unique() if x])
        }

    except Exception as erro:
        raise HTTPException(status_code=500, detail=str(erro))


@app.post("/dashboard/dados", status_code=status.HTTP_200_OK)
def obter_dados(filtros: FiltrosRequest):
    try:
        with database_engine.connect() as conn:
            df = pd.read_sql("SELECT * FROM consulta_pedidos", conn)

        if df.empty:
            return {
                "valor_total": 0.0,
                "realizado_diario": 0.0,
                "total_pedidos": 0,
                "total_cancelados": 0,
                "valor_cancelados_liquido": 0.0,
                "vendas_por_dia": [],
                "meios_captacao": [],
                "realizado_por_marca": []
            }

        df["situacao_comercial"] = (
            df["situacao_comercial"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df["situacao_normalizada"] = df["situacao_comercial"].apply(normalizar_texto)

        df["estrutura"] = (
            df["estrutura"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df["usuario_finalizacao"] = (
            df["usuario_finalizacao"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df["meio_captacao"] = (
            df["meio_captacao"]
            .fillna("Não Informado")
            .astype(str)
            .str.strip()
        )

        df["modelo_comercial"] = (
            df["modelo_comercial"]
            .fillna("Não Informado")
            .astype(str)
            .str.strip()
        )

        df["valor_praticado"] = pd.to_numeric(
            df["valor_praticado"],
            errors="coerce"
        ).fillna(0.0)

        df["valor_liquido"] = pd.to_numeric(
            df["valor_liquido"],
            errors="coerce"
        ).fillna(0.0)

        df["data_captacao"] = pd.to_datetime(
            df["data_captacao"],
            errors="coerce"
        ).dt.date

        df["unidade"] = df["estrutura"].apply(
            lambda x: x.split("-")[0].strip() if "-" in x else x.strip()
        )

        if filtros.unidades:
            df = df[df["unidade"].isin(filtros.unidades)]

        if filtros.estruturas:
            df = df[df["estrutura"].isin(filtros.estruturas)]

        if filtros.consultores:
            df = df[df["usuario_finalizacao"].isin(filtros.consultores)]

        if filtros.situacoes:
            situacoes_normalizadas = [normalizar_texto(s) for s in filtros.situacoes]
            df = df[df["situacao_normalizada"].isin(situacoes_normalizadas)]

        if filtros.data_inicio:
            data_inicio = pd.to_datetime(filtros.data_inicio).date()
            df = df[df["data_captacao"] >= data_inicio]

        if filtros.data_fim:
            data_fim = pd.to_datetime(filtros.data_fim).date()
            df = df[df["data_captacao"] <= data_fim]

        df_validos = df[
            df["situacao_normalizada"].isin(STATUS_VALIDOS_REALIZADO)
        ].copy()

        df_cancelados = df[
            df["situacao_normalizada"].str.startswith("cancel", na=False)
        ].copy()

        valor_total = float(df_validos["valor_praticado"].sum())
        total_pedidos = int(len(df_validos))

        total_cancelados = int(len(df_cancelados))

        valor_cancelados_liquido = float(
            df_cancelados["valor_liquido"].sum()
        )

        df_validos_com_data = df_validos[
            df_validos["data_captacao"].notnull()
        ].copy()

        if not df_validos_com_data.empty:
            ultima_data_venda = df_validos_com_data["data_captacao"].max()

            realizado_diario = float(
                df_validos_com_data[
                    df_validos_com_data["data_captacao"] == ultima_data_venda
                ]["valor_praticado"].sum()
            )
        else:
            realizado_diario = 0.0

        df_vendas_dia = (
            df_validos_com_data
            .groupby("data_captacao")["valor_praticado"]
            .sum()
            .reset_index()
            .sort_values("data_captacao")
        )

        if not df_vendas_dia.empty:
            df_vendas_dia["Data Captação"] = pd.to_datetime(
                df_vendas_dia["data_captacao"]
            ).dt.strftime("%d/%m/%Y")

            df_vendas_dia = df_vendas_dia.rename(
                columns={"valor_praticado": "ValorPraticado"}
            )

            vendas_por_dia = df_vendas_dia[
                ["Data Captação", "ValorPraticado"]
            ].to_dict(orient="records")
        else:
            vendas_por_dia = []

        meios_captacao_df = (
            df_validos
            .groupby("meio_captacao")
            .size()
            .reset_index(name="value")
            .sort_values("value", ascending=False)
        )

        meios_captacao = meios_captacao_df.rename(
            columns={"meio_captacao": "MeioCaptacao"}
        ).to_dict(orient="records")

        realizado_por_marca_df = (
            df_validos
            .groupby("modelo_comercial")["valor_praticado"]
            .sum()
            .reset_index()
            .sort_values("valor_praticado", ascending=False)
        )

        realizado_por_marca = realizado_por_marca_df.rename(
            columns={
                "modelo_comercial": "name",
                "valor_praticado": "value"
            }
        ).to_dict(orient="records")

        return {
            "valor_total": valor_total,
            "realizado_diario": realizado_diario,
            "total_pedidos": total_pedidos,
            "total_cancelados": total_cancelados,
            "valor_cancelados_liquido": valor_cancelados_liquido,
            "vendas_por_dia": vendas_por_dia,
            "meios_captacao": meios_captacao,
            "realizado_por_marca": realizado_por_marca
        }

    except Exception as erro:
        print(erro)
        raise HTTPException(status_code=500, detail=str(erro))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)