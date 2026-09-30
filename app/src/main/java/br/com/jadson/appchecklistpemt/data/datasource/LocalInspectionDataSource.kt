package br.com.jadson.appchecklistpemt.data.datasource

import br.com.jadson.appchecklistpemt.domain.model.ChecklistCategory
import br.com.jadson.appchecklistpemt.domain.model.ChecklistItem
import java.util.UUID

class LocalInspectionDataSource {

    fun getInitialCategories(): List<ChecklistCategory> {
        return listOf(
            ChecklistCategory(
                nome = "ITENS PARA INSPEÇÃO",
                itens = listOf(
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Boletins de serviço. Verifique se não há boletins de serviço abertos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Inspeção anual. Certifique-se de concluí-lo em 13 meses."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Adesivos. No lugar, corretamente anexados e você pode lê-los"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Limit Switches. Instalado corretamente e sem obstruções ou danos.")
                )
            ),
            ChecklistCategory(
                nome = "CHASSI / MOTOR",
                itens = listOf(
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Motor e Componentes. Verifique motor e componentes se há itens soltos, ausentes, danificados ou com falha."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Proteção contra buracos. Ambos os lados não têm obstruções, sujeira ou danos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Bateria/bandeja hidráulica. As bandejas estão bem travadas e nenhum componente faltando"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Baterias. Sem danos, conexões apertadas e níveis de fluido suficientes. Terminais limpos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Carregador de bateria. Fixado corretamente e sem danos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Montagem da Direção. Fixado corretamente e sem vazamentos, danos ou componentes ausentes"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Conjunto Roda/Pneu. Verifique todos os pneus quanto a danos, peças em falta, desgaste e alinhamento"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Conjunto Roda/Pneu. Porcas da roda com o torque recomendado."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Eixos. Fixado corretamente e sem componentes ausentes. Conexões apertadas, e mangueiras sem vazamentos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Eixos. Faça uma verificação e substitua o óleo, se necessário."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Tanque hidráulico, bomba, motor e linhas. Tampa de enchimento, mangueiras e outros componentes hidráulicos estão bem fechados e sem danos ou vazamentos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Óleo hidráulico. Nível na marca superior ou ligeiramente acima dela."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Óleo hidráulico. Faça uma verificação e substitua o óleo e os filtros, se necessário"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Componentes elétricos. Faça uma verificação em todos os componentes elétricos, como o controlador do motor, se necessário. Fixado corretamente e sem danos. Conexões de fios e fixadores apertados."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Manifolds. Conexões e mangueiras apertadas e sem danos ou vazamentos. Fios apertados conexões íntegras, sem componentes ausentes e válvulas funcionando corretamente"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Interruptor de desconexão da alimentação principal. Cabos apertados e em funcionamento, trava para cadeado"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Controles de solo. Opere os interruptores e certifique-se de que todos funcionem corretamente, sem danos ou falta de componentes."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Freios. Fixado corretamente e sem danos ou vazamentos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Soldas da Base. Sem deformações ou rachaduras."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Pontos de aplicação de graxa. Sem obstruções, sujeira ou danos. Adicione graxa se necessário"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Escada. Fixado corretamente e sem danos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Sensor de Inclinação (Tilt). Fixado corretamente e sem danos.")
                )
            ),
            ChecklistCategory(
                nome = "MECANISMO DE ELEVAÇÃO - MASTRO/TESOURAS",
                itens = listOf(
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Suporte(s) de manutenção. Fixado corretamente e sem danos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Conjunto de tesouras e amortecedores. Fixado corretamente, sem deformações, cabos e fios instalados sem danos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Controles deslizantes e rolos. Fixado corretamente e sem obstruções, sujeira ou danos/desgaste"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Cilindro(s) de elevação. Sem danos ou falta de componentes. Conexões apertadas e mangueiras sem vazamentos e instalados corretamente."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Transdutor de Ângulo. Fixado corretamente e sem danos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Pinos de tesoura. Fixado corretamente e sem danos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Correntes, roletes e cabos de controle. Sem danos ou falta de componentes.")
                )
            ),
            ChecklistCategory(
                nome = "PLATAFORMA",
                itens = listOf(
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Grades e Portão. Fixado corretamente e sem danos ou faltando componentes"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Ancoragem de proteção contra quedas. Anéis de fixação conectados corretamente e sem danos"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Tomada extensão. Sem obstruções, sujeira ou danos."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Console de controle da plataforma. Opere os interruptores e certifique-se de que todos operaram corretamente. Sem danos ou falta de componentes."),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Caixa de armazenamento do manual. Manuais e documentos estão guardados na caixa, em bom estado"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Extintor. Verificar validade, lacre, pressurização"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Plataforma de Extensão. Fixado corretamente e sem danos ou componentes ausentes"),
                    ChecklistItem(id = UUID.randomUUID().toString(), nome = "Testes de função. Consulte o manual de operação para o seu número de série para informações sobre como executar esses testes")
                )
            )
        )
    }
}
