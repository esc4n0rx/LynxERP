-- database/wms_deposit_schema.sql

-- ============================================
-- MÓDULO WMS E SUBMÓDULOS
-- ============================================

-- Inserir Módulo WMS se não existir
INSERT INTO lynx_modules (uuid, parent_uuid, nome, slug, descricao, icone, rota, level, ordem, ativo)
SELECT 'mod-wms-001', NULL, 'WMS', 'wms', 'Warehouse Management System', 'box', NULL, 0, 8, 1
WHERE NOT EXISTS (SELECT 1 FROM lynx_modules WHERE slug = 'wms');

-- Inserir Submódulo Depósitos se não existir
INSERT INTO lynx_modules (uuid, parent_uuid, nome, slug, descricao, icone, rota, level, ordem, ativo)
SELECT 'mod-wms-depositos-001', 'mod-wms-001', 'Depósitos', 'depositos', 'Gestão de Depósitos', 'home', '/wms/depositos', 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM lynx_modules WHERE slug = 'depositos' AND parent_uuid = 'mod-wms-001');


-- ============================================
-- TABELA: lynx_wms_depositos
-- ============================================

CREATE TABLE IF NOT EXISTS lynx_wms_depositos (
    uuid CHAR(36) PRIMARY KEY,
    
    -- Identificação e metadados básicos
    codigo_deposito VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    status ENUM('ATIVO', 'INATIVO', 'EM_MANUTENCAO', 'FECHADO') NOT NULL DEFAULT 'ATIVO',
    descricao TEXT,
    empresa_id CHAR(36) NOT NULL,
    
    -- Localização física / logística
    codigo_interno_erp VARCHAR(50),
    
    -- Tipos e classificações
    tipo_deposito ENUM('VIRTUAL', 'MAT_PRIMA', 'EMBALAGEM', 'GERAL', 'STAGING', 'QUARANTINE', 'RETURNS') NOT NULL,
    categoria ENUM('BLOCOS', 'PALLET', 'PADRAO', 'FIFO_BIN', 'AUTOCRANE'),
    zona_logistica JSON COMMENT 'Lista de zonas: RECEBIMENTO, EXPEDICAO, etc.',
    
    -- Unidade de Conservação (UC) / Paletização
    permite_estoque_negativo BOOLEAN NOT NULL DEFAULT FALSE,
    administrado_por_uc BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_uc ENUM('E1', 'E2', 'E3', 'PALLET', 'CAIXA', 'ROL'),
    uc_mista BOOLEAN,
    uc_capacidade_max_peso_kg DECIMAL(10,2),
    uc_dimensoes JSON COMMENT '{altura_mm, largura_mm, profundidade_mm}',
    
    -- Armazenamento e restrições espaciais
    area_total_m2 DECIMAL(10,2),
    altura_maxima_m DECIMAL(10,2),
    peso_maximo_por_posicao_kg DECIMAL(10,2),
    numero_max_posicoes INT,
    tipos_racks_suportados JSON COMMENT 'Lista: PALLET_RACK, CANTILEVER, etc.',
    
    -- Ambiente / condições especiais
    controle_temp BOOLEAN NOT NULL DEFAULT FALSE,
    temperatura_min_c DECIMAL(5,2),
    temperatura_max_c DECIMAL(5,2),
    controle_umidade BOOLEAN NOT NULL DEFAULT FALSE,
    floor_type ENUM('CONCRETE', 'GRASS', 'RAISED', 'ANTI_SLIP'),
    
    -- Produtos / movimentação
    aceita_produtos_perigosos BOOLEAN NOT NULL DEFAULT FALSE,
    classes_hazardous_allowed JSON COMMENT 'Lista de classes ADR',
    categoria_produtos_permitidos JSON COMMENT 'Lista: ALIMENTOS, QUIMICOS, etc.',
    serial_number_management ENUM('NONE', 'BY_LOT', 'BY_UNIT') NOT NULL DEFAULT 'NONE',
    batch_required BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Estratégias e regras operacionais
    politica_fifo_lifo_fefo ENUM('FIFO', 'FEFO', 'LIFO', 'CUSTOM') NOT NULL,
    estrategia_putaway_default ENUM('NEAREST', 'BY_SIZE', 'BY_PRODUCT_FAMILY', 'BY_TURNOVER'),
    estrategia_picking_default ENUM('LIFO_SLOT', 'FIFO_SLOT', 'WAVE', 'ZONE_PICK'),
    nivel_seguro_estoque_minimo_por_sku DECIMAL(10,2),
    replenishment_lead_time_days INT,
    cycle_count_frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'),
    cross_docking_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Segurança, acessos e operações
    nivel_seguranca ENUM('BAIXO', 'MEDIO', 'ALTO'),
    grupos_acesso JSON COMMENT '{recebimento_team_id, expedicao_team_id, admin_team_id}',
    
    -- QA / Controle de Qualidade
    require_qc_on_receipt BOOLEAN NOT NULL DEFAULT FALSE,
    qc_rules JSON,
    retention_time_days_for_failed_qc INT,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Constraints
    CONSTRAINT uk_codigo_empresa UNIQUE (codigo_deposito, empresa_id),
    FOREIGN KEY (empresa_id) REFERENCES lynx_empresas(uuid) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo_deposito)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
