# Instruções para GitHub Copilot - Ifoot Manager

## Visão Geral do Projeto
Ifoot é uma aplicação mobile/web de gerenciamento de futebol onde o usuário atua como presidente de um clube.
- **Front-end**: TypeScript 
- **Back-end**: JavaScript
- **Plataformas**: Mobile e Web
- **Base de dados**: MySQL

## Padrões de Código e Arquitetura

### Práticas Gerais
- Manter consistência com o estilo de código existente
- Priorizar a segurança em operações de banco de dados
- Utilizar tipagem estrita no TypeScript
- Implementar validação de dados em todas as entradas de usuário
- Seguir princípios SOLID
- Usar padrões de design apropriados (Repository, Service, etc.)

### TypeScript
- Usar interfaces para todos os modelos de domínio
- Preferir tipos explícitos a inferidos quando apropriado
- Evitar o uso de `any` sempre que possível
- Utilizar enums para valores constantes (status, posições, etc.)
- Implementar tratamento de erros consistente

### JavaScript (Back-end)
- Usar ES6+ features quando aplicável
- Implementar validação de parâmetros em todas as funções
- Estruturar APIs de forma RESTful
- Documentar endpoints com comentários JSDoc
- Utilizar async/await para operações assíncronas

### Segurança
- Sanitizar todas as entradas de usuário
- Implementar autenticação JWT ou similar
- Nunca expor informações sensíveis em logs ou respostas
- Usar prepared statements para consultas SQL
- Implementar rate limiting em APIs públicas

## Convenções de Nomenclatura
- **Componentes/Classes**: PascalCase (PlayerCard, MatchService)
- **Funções/métodos/variáveis**: camelCase (calculateRating, playerStats)
- **Constantes**: UPPER_SNAKE_CASE (MAX_PLAYER_LEVEL)
- **Arquivos de componentes**: PascalCase.tsx/.jsx
- **Arquivos de serviços/utilitários**: camelCase.ts/.js

## Padrões para APIs
```typescript
// Estrutura de resposta padrão
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

// Exemplo de uso
app.get('/api/players', async (req, res) => {
  try {
    const players = await playerService.getAll(req.query);
    res.json({
      success: true,
      data: players,
      meta: {
        pagination: {
          page: req.query.page || 1,
          // ... outros dados de paginação
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Falha ao buscar jogadores'
      }
    });
  }
});
```

## Domínio Específico do Futebol

### Conceitos Chave
- **Gestão de clube**: Finanças, Valor em Caixa, Valor do Elenco, Saldo
- **Gestão de elenco**: Contratações, vendas, Capitão, Cobrador de Penalti, Cobrador de Falta, Cobrador de escanteio
- **Simulação de partidas**: Baseada em estatísticas e probabilidade, força do time, desempenho no ultimo jogo, Time mandante
- **Desenvolvimento de jogadores**: 
- **Competições**: Ligas, copas, torneios internacionais

### Algoritmos Importantes
- Simulação de resultados de partidas
- Geração de transferências e negociações de mercado
- Finanças do clube (receitas, despesas, orçamentos, premiações)

## Princípios de Performance
- Otimizar consultas ao banco de dados
- Implementar cache onde apropriado
- Carregar dados sob demanda (lazy loading)
- Paginação para grandes conjuntos de dados
- Minimizar re-renderizações desnecessárias no front-end

## Práticas de Teste
- Escrever testes unitários para lógica de negócio
- Implementar testes de integração para APIs
- Usar mocks para serviços externos e banco de dados
- Testar casos de borda e cenários de erro
- Manter cobertura de código adequada

## Comandos e Sugestões

Quando estiver trabalhando em:

1. **Simulação de partidas**: Forneça algoritmos balanceados que considerem habilidades dos jogadores, táticas e fatores aleatórios para resultados realistas.

2. **Sistema financeiro**: Implemente lógicas de receitas e despesas variadas, incluindo venda de ingressos, patrocínios, direitos de TV e salários.

3. **Mercado de transferências**: Crie sistemas que considerem valor de mercado, potencial, idade e negociação entre clubes.

4. **UX/UI**: Priorize interfaces claras e intuitivas, especialmente para dados estatísticos e gestão do clube.

5. **Performance**: Otimize algoritmos de simulação e consultas de banco de dados para manter boa performance em dispositivos móveis.
```

