import type { InspectionCategory, InspectionItemStatus } from '../types/inspection';

export interface DefaultCategoryTemplate {
  nome: string;
  itens: string[];
}

/**
 * Categorias e itens oficiais de inspeção de Plataforma Elevatória Móvel de Trabalho (PEMT / MEWP)
 * em conformidade com as normas regulamentadoras NR-18, NR-35 e o modelo nativo Android do Checklist PEMT.
 */
export const DEFAULT_INSPECTION_CATEGORIES: DefaultCategoryTemplate[] = [
  {
    nome: 'ITENS PARA INSPEÇÃO',
    itens: [
      'Boletins de serviço. Verifique se não há boletins de serviço abertos',
      'Inspeção anual. Certifique-se de concluí-lo em 13 meses.',
      'Adesivos. No lugar, corretamente anexados e legíveis',
      'Limit Switches. Instalado corretamente e sem obstruções ou danos.'
    ]
  },
  {
    nome: 'CHASSI / MOTOR',
    itens: [
      'Motor e Componentes. Verifique motor e componentes se há itens soltos, ausentes, danificados ou com falha.',
      'Proteção contra buracos (Pothole). Ambos os lados não têm obstruções, sujeira ou danos',
      'Bateria/bandeja hidráulica. As bandejas estão bem travadas e nenhum componente faltando',
      'Baterias. Sem danos, conexões apertadas e níveis de fluido suficientes. Terminais limpos',
      'Carregador de bateria. Fixado corretamente e sem danos.',
      'Montagem da Direção. Fixado corretamente e sem vazamentos, danos ou componentes ausentes',
      'Conjunto Roda/Pneu. Verifique todos os pneus quanto a danos, peças em falta, desgaste e alinhamento',
      'Conjunto Roda/Pneu. Porcas da roda com o torque recomendado.',
      'Eixos. Fixado corretamente e sem componentes ausentes. Conexões apertadas, e mangueiras sem vazamentos',
      'Eixos. Faça uma verificação e substitua o óleo, se necessário.',
      'Tanque hidráulico, bomba, motor e linhas. Tampa de enchimento, mangueiras e componentes bem fechados e sem vazamentos.',
      'Óleo hidráulico. Nível na marca superior ou ligeiramente acima dela.',
      'Óleo hidráulico. Faça uma verificação e substitua o óleo e os filtros, se necessário',
      'Componentes elétricos. Faça uma verificação em todos os componentes elétricos (controlador do motor). Fios e fixadores apertados.',
      'Manifolds. Conexões e mangueiras apertadas e sem danos ou vazamentos. Válvulas funcionando corretamente',
      'Interruptor de desconexão da alimentação principal. Cabos apertados e em funcionamento, trava para cadeado',
      'Controles de solo. Opere os interruptores e certifique-se de que todos funcionem corretamente.',
      'Freios. Fixado corretamente e sem danos ou vazamentos',
      'Soldas da Base. Sem deformações ou rachaduras.',
      'Pontos de aplicação de graxa. Sem obstruções, sujeira ou danos. Adicione graxa se necessário',
      'Escada. Fixado corretamente e sem danos.',
      'Sensor de Inclinação (Tilt). Fixado corretamente e sem danos.'
    ]
  },
  {
    nome: 'MECANISMO DE ELEVAÇÃO - MASTRO/TESOURAS',
    itens: [
      'Suporte(s) de manutenção. Fixado corretamente e sem danos.',
      'Conjunto de tesouras e amortecedores. Fixado corretamente, sem deformações, cabos e fios íntegros',
      'Controles deslizantes e rolos. Fixado corretamente e sem obstruções, sujeira ou danos/desgaste',
      'Cilindro(s) de elevação. Sem danos ou vazamentos. Conexões apertadas e instaladas corretamente.',
      'Transdutor de Ângulo. Fixado corretamente e sem danos',
      'Pinos de tesoura. Fixado corretamente e sem danos.',
      'Correntes, roletes e cabos de controle. Sem danos ou falta de componentes.'
    ]
  },
  {
    nome: 'PLATAFORMA',
    itens: [
      'Grades e Portão. Fixado corretamente e sem danos ou faltando componentes',
      'Ancoragem de proteção contra quedas. Anéis de fixação conectados corretamente e sem danos',
      'Tomada extensão. Sem obstruções, sujeira ou danos.',
      'Console de controle da plataforma. Opere os interruptores e certifique-se de que todos operam corretamente.',
      'Caixa de armazenamento do manual. Manuais e documentos estão guardados na caixa, em bom estado',
      'Extintor. Verificar validade, lacre e pressurização',
      'Plataforma de Extensão. Fixado corretamente e sem danos ou componentes ausentes',
      'Testes de função. Consulte o manual de operação para o seu número de série para informações sobre como executar esses testes'
    ]
  }
];

export function createInitialInspectionCategories(): InspectionCategory[] {
  return DEFAULT_INSPECTION_CATEGORIES.map((cat) => ({
    nome: cat.nome,
    itens: cat.itens.map((itemText) => ({
      id: crypto.randomUUID(),
      nome: itemText,
      status: 'NONE' as InspectionItemStatus,
      observacao: '',
      fotoUrl: ''
    }))
  }));
}

export function analyzeInspectionApproval(categories: InspectionCategory[]): {
  status: 'APROVADA' | 'NÃO APROVADA';
  total: number;
  conformes: number;
  naoConformes: number;
  na: number;
  pendentes: number;
} {
  let total = 0;
  let conformes = 0;
  let naoConformes = 0;
  let na = 0;
  let pendentes = 0;

  for (const cat of categories) {
    for (const item of cat.itens) {
      total++;
      if (item.status === 'CONFORME') conformes++;
      else if (item.status === 'NAO_CONFORME') naoConformes++;
      else if (item.status === 'NA') na++;
      else pendentes++;
    }
  }

  const status = naoConformes > 0 ? 'NÃO APROVADA' : 'APROVADA';

  return {
    status,
    total,
    conformes,
    naoConformes,
    na,
    pendentes
  };
}
