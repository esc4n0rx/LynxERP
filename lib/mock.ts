export interface InventoryItem {
  code: string;
  description: string;
  warehouse: string;
  position: string;
  balance: number;
  unit: string;
}

export interface ReceivingDoc {
  id: string;
  supplier: string;
  reference: string;
  date: string;
  status: string;
  items: { code: string; description: string; qty: number }[];
}

export interface Order {
  id: string;
  customer: string;
  status: 'open' | 'picking' | 'shipped';
  value: number;
  date: string;
  items?: { code: string; description: string; qty: number; price: number }[];
}

export const mockInventory: InventoryItem[] = [
  { code: 'MAT-001', description: 'Parafuso M6x20', warehouse: 'CD01', position: 'A1-01-01', balance: 1500, unit: 'UN' },
  { code: 'MAT-002', description: 'Porca M6', warehouse: 'CD01', position: 'A1-01-02', balance: 2300, unit: 'UN' },
  { code: 'MAT-003', description: 'Arruela Lisa 6mm', warehouse: 'CD01', position: 'A1-01-03', balance: 3200, unit: 'UN' },
  { code: 'MAT-004', description: 'Parafuso M8x30', warehouse: 'CD02', position: 'B2-03-01', balance: 890, unit: 'UN' },
  { code: 'MAT-005', description: 'Chapa Aço 1mm', warehouse: 'CD02', position: 'C1-05-02', balance: 45, unit: 'M2' },
  { code: 'MAT-006', description: 'Tubo PVC 25mm', warehouse: 'CD01', position: 'D3-02-01', balance: 320, unit: 'M' },
  { code: 'MAT-007', description: 'Adesivo Industrial', warehouse: 'CD03', position: 'E1-01-05', balance: 78, unit: 'L' },
  { code: 'MAT-008', description: 'Tinta Epóxi Branca', warehouse: 'CD03', position: 'E1-02-03', balance: 145, unit: 'L' },
  { code: 'MAT-009', description: 'Correia Transmissão', warehouse: 'CD02', position: 'B1-04-02', balance: 67, unit: 'UN' },
  { code: 'MAT-010', description: 'Rolamento 6205', warehouse: 'CD02', position: 'B3-01-01', balance: 234, unit: 'UN' },
];

export const mockReceiving: ReceivingDoc[] = [
  {
    id: 'REC-001',
    supplier: 'Fornecedor Alpha',
    reference: 'NF-12345',
    date: '2025-11-03',
    status: 'pending',
    items: [
      { code: 'MAT-001', description: 'Parafuso M6x20', qty: 500 },
      { code: 'MAT-002', description: 'Porca M6', qty: 800 },
    ],
  },
  {
    id: 'REC-002',
    supplier: 'Fornecedor Beta',
    reference: 'NF-67890',
    date: '2025-11-03',
    status: 'pending',
    items: [
      { code: 'MAT-005', description: 'Chapa Aço 1mm', qty: 20 },
    ],
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-1001',
    customer: 'Cliente Premium Ltda',
    status: 'open',
    value: 15420.50,
    date: '2025-11-01',
    items: [
      { code: 'MAT-001', description: 'Parafuso M6x20', qty: 200, price: 0.50 },
      { code: 'MAT-006', description: 'Tubo PVC 25mm', qty: 150, price: 12.30 },
    ],
  },
  {
    id: 'ORD-1002',
    customer: 'Indústria XYZ S/A',
    status: 'picking',
    value: 8750.00,
    date: '2025-11-02',
    items: [
      { code: 'MAT-009', description: 'Correia Transmissão', qty: 25, price: 350.00 },
    ],
  },
  {
    id: 'ORD-1003',
    customer: 'Comércio ABC',
    status: 'shipped',
    value: 3240.80,
    date: '2025-10-30',
    items: [
      { code: 'MAT-008', description: 'Tinta Epóxi Branca', qty: 20, price: 162.04 },
    ],
  },
  {
    id: 'ORD-1004',
    customer: 'Distribuidora Norte',
    status: 'open',
    value: 12890.00,
    date: '2025-11-03',
  },
  {
    id: 'ORD-1005',
    customer: 'Empresa Sul Equipamentos',
    status: 'picking',
    value: 22140.00,
    date: '2025-11-02',
  },
];

export interface Insight {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  icon: string;
}

const baseInsights: Insight[] = [
  { label: 'OTIF', value: '96%', trend: 'up', icon: 'TrendingUp' },
  { label: 'Giro Médio', value: '21 dias', icon: 'Calendar' },
  { label: 'Capacidade', value: '73%', trend: 'up', icon: 'Warehouse' },
  { label: 'Backorders', value: '12', trend: 'down', icon: 'AlertCircle' },
  { label: 'Acuracidade', value: '98.5%', trend: 'up', icon: 'Target' },
  { label: 'Pedidos Hoje', value: '47', icon: 'Package' },
];

export const getInsights = (): Insight[] => {
  return baseInsights.map(insight => {
    const randomVariation = Math.random() * 2 - 1;
    let value = insight.value;

    if (insight.value.includes('%')) {
      const num = parseFloat(insight.value);
      value = `${(num + randomVariation * 0.5).toFixed(1)}%`;
    } else if (insight.value.includes('dias')) {
      const num = parseInt(insight.value);
      value = `${Math.max(1, num + Math.floor(randomVariation))} dias`;
    } else if (!isNaN(parseInt(insight.value))) {
      const num = parseInt(insight.value);
      value = `${Math.max(0, num + Math.floor(randomVariation * 2))}`;
    }

    return { ...insight, value };
  });
};
