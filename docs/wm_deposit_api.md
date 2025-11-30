# Documentação da API: wm-deposit

**Base URL**: `/wms/depositos`

## Enums (Domínios)

Utilize estes valores para preencher os campos de seleção (dropdowns) no frontend.

### StatusEnum
- `ATIVO`
- `INATIVO`
- `EM_MANUTENCAO`
- `FECHADO`

### TipoDepositoEnum
- `VIRTUAL`
- `MAT_PRIMA`
- `EMBALAGEM`
- `GERAL`
- `STAGING`
- `QUARANTINE`
- `RETURNS`

### CategoriaEnum
- `BLOCOS`
- `PALLET`
- `PADRAO`
- `FIFO_BIN`
- `AUTOCRANE`

### TipoUCEnum
- `E1`
- `E2`
- `E3`
- `PALLET`
- `CAIXA`
- `ROL`

### FloorTypeEnum
- `CONCRETE`
- `GRASS`
- `RAISED`
- `ANTI_SLIP`

### SerialNumberManagementEnum
- `NONE`
- `BY_LOT`
- `BY_UNIT`

### PoliticaFifoLifoFefoEnum
- `FIFO`
- `FEFO`
- `LIFO`
- `CUSTOM`

### EstrategiaPutawayEnum
- `NEAREST`
- `BY_SIZE`
- `BY_PRODUCT_FAMILY`
- `BY_TURNOVER`

### EstrategiaPickingEnum
- `LIFO_SLOT`
- `FIFO_SLOT`
- `WAVE`
- `ZONE_PICK`

### CycleCountFrequencyEnum
- `DAILY`
- `WEEKLY`
- `MONTHLY`
- `QUARTERLY`
- `ANNUAL`

### NivelSegurancaEnum
- `BAIXO`
- `MEDIO`
- `ALTO`

---

## Rotas

### 1. Criar Depósito
**POST** `/`

**Body (JSON):**
```json
{
  "codigo_deposito": "DEP-001",
  "nome": "Depósito Central",
  "status": "ATIVO",
  "descricao": "Depósito principal de matérias primas",
  "empresa_id": "uuid-da-empresa",
  "codigo_interno_erp": "WH001",
  "tipo_deposito": "MAT_PRIMA",
  "categoria": "PALLET",
  "zona_logistica": ["RECEBIMENTO", "ARMAZENAGEM", "EXPEDICAO"],
  "permite_estoque_negativo": false,
  "administrado_por_uc": true,
  "tipo_uc": "PALLET",
  "uc_mista": true,
  "uc_capacidade_max_peso_kg": 1000.00,
  "uc_dimensoes": {
    "altura_mm": 1500,
    "largura_mm": 1200,
    "profundidade_mm": 1000
  },
  "area_total_m2": 5000.00,
  "altura_maxima_m": 12.00,
  "peso_maximo_por_posicao_kg": 1500.00,
  "numero_max_posicoes": 5000,
  "tipos_racks_suportados": ["PALLET_RACK", "DRIVE_IN"],
  "controle_temp": true,
  "temperatura_min_c": 15.0,
  "temperatura_max_c": 25.0,
  "controle_umidade": false,
  "floor_type": "CONCRETE",
  "aceita_produtos_perigosos": false,
  "politica_fifo_lifo_fefo": "FIFO",
  "estrategia_putaway_default": "NEAREST",
  "estrategia_picking_default": "FIFO_SLOT",
  "nivel_seguranca": "MEDIO"
}
```

### 2. Listar Depósitos
**GET** `/`

**Query Params:**
- `empresa_id` (opcional): Filtrar por empresa.

**Response (Array):**
```json
[
  {
    "uuid": "uuid-gerado",
    "codigo_deposito": "DEP-001",
    "nome": "Depósito Central",
    "status": "ATIVO",
    ...
    "created_at": "2023-10-27T10:00:00",
    "updated_at": "2023-10-27T10:00:00"
  }
]
```

### 3. Obter Depósito
**GET** `/{uuid}`

**Response:**
Objeto completo do depósito (mesmo formato do item da lista).

### 4. Atualizar Depósito
**PUT** `/{uuid}`

**Body (JSON):**
Envie apenas os campos que deseja alterar.
```json
{
  "nome": "Depósito Central - Atualizado",
  "status": "EM_MANUTENCAO",
  "controle_temp": false
}
```

### 5. Deletar Depósito
**DELETE** `/{uuid}`

**Response:**
```json
{
  "message": "Depósito deletado com sucesso"
}
```
